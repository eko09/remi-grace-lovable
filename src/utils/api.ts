
// Main API file that exports all the necessary functions

// Re-export functions from other modules
export { 
  getChatCompletion,
} from './apiClient';

export {
  fetchPreviousConversation,
  saveConversation, 
  getSessionCount
} from './conversationService';

export {
  textToSpeech,
  initSpeechSynthesis
} from './speechSynthesis';

export {
  generateSessionSummary
} from './summaryGenerator';

export {
  selectSystemPrompt
} from './prompts';
