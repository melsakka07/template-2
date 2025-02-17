import OpenAI from 'openai';

export type LLMProvider = 'gpt4' | 'deepseek';

// OpenAI client
export const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Deepseek client
export const deepseekClient = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export const getLLMClient = (provider: LLMProvider): OpenAI => {
  switch (provider) {
    case 'gpt4':
      return openaiClient;
    case 'deepseek':
      return deepseekClient;
    default:
      return openaiClient;
  }
};

export const getLLMModel = (provider: LLMProvider): string => {
  switch (provider) {
    case 'gpt4':
      return 'gpt-4';
    case 'deepseek':
      return 'deepseek-chat';
    default:
      return 'gpt-4';
  }
}; 