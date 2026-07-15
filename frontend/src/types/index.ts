export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: User;
  members: string[];
  members_detail: User[];
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  project: string;
  project_name: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null;
  assignee_detail: User | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface AISuggestedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
}

export interface AICopilotResponse {
  message: string;
  suggestions: AISuggestedTask[];
  tokens_used: number;
  model: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestions?: AISuggestedTask[];
  timestamp: string;
}
