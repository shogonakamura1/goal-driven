export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

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

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: string;
}
