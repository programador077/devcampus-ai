export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  groundingMetadata?: any;
  isThinking?: boolean;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash', // Basic, Search, Maps
  PRO = 'gemini-3-pro-preview', // Complex, Thinking
  LITE = 'gemini-2.5-flash-lite-latest', // Fast
}

export enum CreativeMode {
  GEN_IMAGE = 'GEN_IMAGE',
  EDIT_IMAGE = 'EDIT_IMAGE',
  GEN_VIDEO = 'GEN_VIDEO',
  ANIMATE_IMAGE = 'ANIMATE_IMAGE',
  TTS = 'TTS'
}

export interface VeoConfig {
  resolution: '720p' | '1080p';
  aspectRatio: '16:9' | '9:16';
}

export interface ImageConfig {
  aspectRatio: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
  size: "1K" | "2K" | "4K";
}
