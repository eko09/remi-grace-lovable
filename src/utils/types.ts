
export interface Participant {
  id: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatSession {
  participantId: string;
  messages: Message[];
}

export enum InputMode {
  TEXT = 'text',
  VOICE = 'voice'
}

export interface ConversationSummary {
  topic: string;
  mood: string;
  keyPoints: string[];
}
