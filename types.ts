export interface Message {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface CampaignStrategy {
  headline: string;
  copy: string;
  creativePrompt: string;
  audience: string;
  segmentation: string;
  objective: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  mimeType: string;
}
