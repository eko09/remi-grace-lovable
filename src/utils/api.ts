
import { Message } from './types';

// API configuration for OpenAI
const API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = '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';
const MODEL = 'gpt-4o';

// Prompt for Remi's persona
const SYSTEM_PROMPT = `### Role: Remi ###
*Persona:* 
You are Remi. You are a therapist trained on reminiscence therapy, facilitating therapy sessions through conversation for older adults 65+.`;

// Function to get a response from the API
export async function getChatCompletion(messages: Message[]): Promise<string> {
  try {
    // Format the messages for the API
    const formattedMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.map(msg => ({ 
        role: msg.role, 
        content: msg.content
      }))
    ];

    // Make the API request
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    // Parse the response
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API error:', data);
      throw new Error(data.error?.message || 'Failed to get response from AI');
    }

    return data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('Error getting chat completion:', error);
    return 'I apologize, but there was an error processing your request. Please try again later.';
  }
}

// Improved text-to-speech function with better voice handling and error management
export async function textToSpeech(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      reject(new Error('Speech synthesis not supported'));
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create utterance with improved settings
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower rate for clarity
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Split text into smaller chunks if it's too long
    // This helps prevent the speech synthesis from cutting off
    const maxLength = 150;
    if (text.length > maxLength) {
      const chunks = splitTextIntoChunks(text, maxLength);
      speakInChunks(chunks, 0, resolve, reject);
      return;
    }
    
    // Get available voices
    let voices = speechSynthesis.getVoices();
    
    // If no voices available yet, wait for them to load
    if (voices.length === 0) {
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        setPreferredVoice();
      };
    } else {
      setPreferredVoice();
    }
    
    function setPreferredVoice() {
      // Try to find a female voice for Remi
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') ||
        voice.name.includes('Victoria') ||
        (voice.name.includes('Google') && voice.name.includes('female'))
      );
      
      if (preferredVoice) {
        console.log('Using voice:', preferredVoice.name);
        utterance.voice = preferredVoice;
      } else if (voices.length > 0) {
        // Fallback to first available voice
        utterance.voice = voices[0];
        console.log('Falling back to voice:', voices[0].name);
      }
    }
    
    // Set up event handlers
    utterance.onend = () => {
      console.log('Speech synthesis finished successfully');
      resolve();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      reject(new Error('Speech synthesis failed'));
    };
    
    // Speak the text
    try {
      console.log('Starting speech synthesis...');
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Error starting speech synthesis:', err);
      reject(err);
    }
  });
}

// Helper function to split text into smaller chunks at sentence boundaries
function splitTextIntoChunks(text: string, maxLength: number): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Helper function to speak text in chunks sequentially
function speakInChunks(chunks: string[], index: number, resolve: () => void, reject: (error: Error) => void) {
  if (index >= chunks.length) {
    resolve();
    return;
  }
  
  const utterance = new SpeechSynthesisUtterance(chunks[index]);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  
  // Set available voice if possible
  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(voice => 
    voice.name.includes('Female') || 
    voice.name.includes('Samantha') ||
    voice.name.includes('Victoria')
  );
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  utterance.onend = () => {
    speakInChunks(chunks, index + 1, resolve, reject);
  };
  
  utterance.onerror = (event) => {
    console.error('Speech synthesis error in chunk:', event);
    reject(new Error('Speech synthesis failed'));
  };
  
  speechSynthesis.speak(utterance);
}

// Initialize voices as soon as possible
if ('speechSynthesis' in window) {
  // Force voices to load
  speechSynthesis.getVoices();
  
  // Set up the onvoiceschanged event
  speechSynthesis.onvoiceschanged = () => {
    const voices = speechSynthesis.getVoices();
    console.log('Voices loaded:', voices.length);
    // Log available voices for debugging
    voices.forEach((voice, index) => {
      console.log(`Voice ${index}: ${voice.name} (${voice.lang})`);
    });
  };
}

// Function to generate a session summary from messages
export function generateSessionSummary(messages: Message[]): string {
  // Filter out system messages and the initial greeting
  const conversationMessages = messages.filter(msg => 
    msg.role === 'user' || (msg.role === 'assistant' && msg.id !== '0')
  );
  
  if (conversationMessages.length === 0) {
    return "No conversation took place in this session.";
  }
  
  // Count messages
  const userMessageCount = conversationMessages.filter(msg => msg.role === 'user').length;
  const assistantMessageCount = conversationMessages.filter(msg => msg.role === 'assistant').length;
  
  // Calculate session duration
  const firstMessageTime = conversationMessages[0]?.timestamp || new Date();
  const lastMessageTime = conversationMessages[conversationMessages.length - 1]?.timestamp || new Date();
  const sessionDurationMs = lastMessageTime.getTime() - firstMessageTime.getTime();
  const sessionDurationMinutes = Math.round(sessionDurationMs / (1000 * 60));
  
  return `
    <div class="space-y-4">
      <h3 class="text-lg font-medium">Session Summary</h3>
      
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>Total Messages:</div>
        <div>${conversationMessages.length}</div>
        
        <div>Your Messages:</div>
        <div>${userMessageCount}</div>
        
        <div>Remi's Responses:</div>
        <div>${assistantMessageCount}</div>
        
        <div>Session Duration:</div>
        <div>${sessionDurationMinutes} minutes</div>
      </div>
      
      <p class="text-sm pt-2">Thank you for participating in this reminiscence therapy session with Remi.</p>
    </div>
  `;
}
