
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

// Function to properly convert text to speech using browser's SpeechSynthesis
export async function textToSpeech(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for older adults
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Use a more natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Google') || 
      voice.name.includes('Samantha')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // Set up event handlers
    utterance.onend = () => {
      resolve();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      reject(new Error('Speech synthesis failed'));
    };
    
    // Speak the text
    speechSynthesis.speak(utterance);
  });
}

// Initialize voices as soon as possible
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
  
  // Try to load voices immediately as well
  window.speechSynthesis.getVoices();
}
