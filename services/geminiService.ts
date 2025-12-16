import { GoogleGenAI, Chat, Type } from "@google/genai";
import { CampaignStrategy } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// System instruction to act as the Traffic Manager Persona
const SYSTEM_INSTRUCTION = `
Atue como 'Criador de campanhas', um gestor de tráfego pago sênior especializado em Facebook e Instagram Ads.

Fase 1: Investigação
- Inicie perguntando sobre o produto/serviço, objetivo da campanha e orçamento.
- Em seguida, pergunte sobre a Persona (idade, gênero, dores, desejos).
- Mantenha um tom profissional, consultivo e técnico.
- Faça no máximo 3 frases por resposta.
- NÃO gere a campanha completa ainda, apenas colete os dados.

Fase 2: Geração (Final)
- Quando você tiver informações suficientes (Produto, Objetivo, Persona, Região), avise o usuário que irá gerar a estratégia.
- IMPORTANTE: Na sua ÚLTIMA resposta, além do texto de confirmação, você deve gerar um bloco JSON oculto (eu irei extrair via regex, mas mantenha o formato).
- O formato final para quando você decidir entregar a campanha deve ser EXATAMENTE um bloco de código JSON assim:

\`\`\`json
{
  "headline": "A frase de impacto",
  "copy": "O texto persuasivo do anúncio",
  "creativePrompt": "Descrição visual detalhada para IA gerar a imagem",
  "audience": "Detalhamento do público alvo",
  "segmentation": "Segmentação geográfica e interesses",
  "objective": "Objetivo da campanha identificado"
}
\`\`\`

Seja confiante. Use termos técnicos de marketing digital.
`;

let chatSession: Chat | null = null;

export const initializeChat = () => {
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
  return chatSession;
};

export const sendMessageToGemini = async (message: string): Promise<{ text: string; strategy?: CampaignStrategy }> => {
  if (!chatSession) {
    initializeChat();
  }

  try {
    const result = await chatSession!.sendMessage({ message });
    const text = result.text;

    // Check if the response contains the JSON block for the final strategy
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    let strategy: CampaignStrategy | undefined;

    if (jsonMatch && jsonMatch[1]) {
      try {
        strategy = JSON.parse(jsonMatch[1]);
      } catch (e) {
        console.error("Failed to parse campaign JSON", e);
      }
    }

    // Clean the JSON out of the text for the chat bubble so it looks clean
    const cleanText = text.replace(/```json[\s\S]*?```/, '').trim();

    return { text: cleanText || text, strategy };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Falha ao comunicar com o assistente.");
  }
};

export const generateCampaignImage = async (prompt: string): Promise<string> => {
  // Helper function to extract image from response
  const extractImage = (response: any) => {
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  };

  // 1. Try High Quality Model (Gemini 3 Pro Image)
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1", 
          imageSize: "1K"
        }
      }
    });

    const imageUrl = extractImage(response);
    if (imageUrl) return imageUrl;
    
  } catch (error) {
    console.warn("Gemini 3 Pro Image failed, attempting fallback to Flash Image...", error);
  }

  // 2. Fallback to Standard Model (Gemini 2.5 Flash Image)
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
          // imageSize is NOT supported in flash-image
        }
      }
    });

    const imageUrl = extractImage(response);
    if (imageUrl) return imageUrl;

  } catch (error) {
    console.error("Gemini 2.5 Flash Image failed:", error);
  }

  throw new Error("Não foi possível gerar a imagem. Verifique se sua chave API tem permissão ou tente um prompt diferente.");
};
