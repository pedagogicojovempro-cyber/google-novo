import { GoogleGenAI, Chat, Type } from "@google/genai";
import { CampaignStrategy } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// System instruction to act as the Traffic Manager Persona
const SYSTEM_INSTRUCTION = `
Atue como o 'Meu Gestor', um consultor de marketing digital amigável, paciente e muito didático.
Seu objetivo é criar uma campanha de anúncios incrível, mas fazendo isso parecer uma conversa leve num café, não uma entrevista técnica.

DIRETRIZES DE COMPORTAMENTO:
1.  **Sem Interrogatórios**: NUNCA peça todas as informações de uma vez. Faça uma pergunta (ou no máximo duas) por turno. Espere o usuário responder para avançar.
2.  **Linguagem Simples e Associativa**: Evite "tecniquês". Use analogias do dia a dia para explicar os conceitos.
3.  **Objetivo (Obrigatório)**: Descubra se ele quer **Leads (Cadastro)** ou **Mensagens no WhatsApp**. Explique a diferença de forma simples.

FASE 2 - O PLANO (GERAÇÃO):
- Quando tiver Produto, Objetivo, Público, Local e Orçamento, avise que vai gerar a estratégia.
- GERE UM BLOCO JSON OCULTO NO FINAL.
- **IMPORTANTE**: Todos os valores no JSON devem ser STRINGS. Não use objetos aninhados para os resultados.

FORMATO FINAL (JSON OBRIGATÓRIO):
\`\`\`json
{
  "headline": "Frase curta",
  "copy": "Texto longo",
  "creativePrompt": "Prompt para imagem",
  "audience": "Descrição do público",
  "segmentation": "Local e interesses",
  "objective": "WhatsApp ou Leads",
  "budget": "Valor diário",
  "estimatedResults": "Sua estimativa escrita por extenso",
  "abTestSuggestion": {
    "element": "O que testar",
    "variation": "A nova ideia",
    "rationale": "Por que testar"
  }
}
\`\`\`
`;

let chatSession: Chat | null = null;

export const initializeChat = () => {
  chatSession = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
  return chatSession;
};

// Defensive function to ensure all strategy fields are strings
const sanitizeStrategy = (raw: any): CampaignStrategy => {
  const safeString = (val: any) => (typeof val === 'string' ? val : JSON.stringify(val));
  
  return {
    headline: safeString(raw.headline || ''),
    copy: safeString(raw.copy || ''),
    creativePrompt: safeString(raw.creativePrompt || ''),
    audience: safeString(raw.audience || ''),
    segmentation: safeString(raw.segmentation || ''),
    objective: safeString(raw.objective || ''),
    budget: safeString(raw.budget || ''),
    estimatedResults: safeString(raw.estimatedResults || ''),
    abTestSuggestion: {
      element: safeString(raw.abTestSuggestion?.element || ''),
      variation: safeString(raw.abTestSuggestion?.variation || ''),
      rationale: safeString(raw.abTestSuggestion?.rationale || '')
    }
  };
};

export const sendMessageToGemini = async (message: string): Promise<{ text: string; strategy?: CampaignStrategy }> => {
  if (!chatSession) {
    initializeChat();
  }

  try {
    const result = await chatSession!.sendMessage({ message });
    const text = typeof result.text === 'string' ? result.text : '';

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    let strategy: CampaignStrategy | undefined;

    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        strategy = sanitizeStrategy(parsed);
      } catch (e) {
        console.error("Failed to parse campaign JSON", e);
      }
    }

    const cleanText = text.replace(/```json[\s\S]*?```/, '').trim();
    return { text: cleanText || text, strategy };
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
    if (errorMsg.includes('429') || errorMsg.includes('quota')) {
      throw new Error("⚠️ Cota da API excedida. Por favor, aguarde alguns instantes.");
    }
    throw new Error("Falha ao comunicar com o assistente.");
  }
};

export const generateCampaignImage = async (prompt: string): Promise<string> => {
  const extractImage = (response: any) => {
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
    });
    const img = extractImage(response);
    if (img) return img;
  } catch (error) {}

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });
    const img = extractImage(response);
    if (img) return img;
  } catch (error) {}

  throw new Error("Não foi possível gerar a imagem.");
};