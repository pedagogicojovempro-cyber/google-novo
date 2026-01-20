export interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface AbTest {
  element: string; // Ex: Headline, Copy, Creative
  variation: string;
  rationale: string;
}

export interface CampaignStrategy {
  headline: string;
  copy: string;
  creativePrompt: string;
  audience: string;
  segmentation: string;
  objective: string;
  budget: string;
  estimatedResults: string; // Novo campo para estimativa
  abTestSuggestion: AbTest;
}

export interface ImageGenerationResult {
  imageUrl: string;
  mimeType: string;
}