import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. AI features will be disabled.");
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const model = genAI?.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1024,
  },
});

// AIレスポンスの型定義
export interface AICoachResponse {
  questions: Array<{ id: string; text: string }>;
  examples: Array<{ field: string; text: string }>;
  critic: {
    level: "info" | "warning" | "error";
    messages: Array<{ code: string; text: string }>;
  } | null;
}

export interface AIDecomposeResponse {
  projects: Array<{ title: string; description: string }>;
  tasks: Array<{ title: string; projectIndex?: number }>;
  weeklyPlan: Array<{ task: string; priority: number }>;
}

export interface AIValidateResponse {
  isValid: boolean;
  errors: Array<{
    code: string;
    field: string;
    message: string;
    suggestion: string;
  }>;
}
