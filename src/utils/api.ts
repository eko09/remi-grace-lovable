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

// Fixed text-to-speech function to prevent app freezing
export async function textToSpeech(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      reject(new Error('Speech synthesis not supported'));
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Break text into smaller chunks (sentences) to prevent freezing
    const sentences = text.split(/(?<=[.!?])\s+/);
    const maxChunkLength = 100; // Shorter chunks to prevent freezing
    const chunks: string[] = [];
    
    // Create smaller chunks based on sentences
    let currentChunk = '';
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxChunkLength) {
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
    
    // Speak each chunk with a slight delay between them
    let chunkIndex = 0;
    
    function speakNextChunk() {
      if (chunkIndex >= chunks.length) {
        resolve();
        return;
      }
      
      const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      
      // Set voice properties for better performance
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      
      // Try to find a voice that won't freeze the app
      const voices = window.speechSynthesis.getVoices();
      // Prefer standard voices that are less resource-intensive
      const preferredVoice = voices.find(voice => 
        !voice.localService && (
          voice.name.includes('Google') || 
          voice.name.includes('English') ||
          voice.name.includes('Microsoft')
        )
      ) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      // Handle events
      utterance.onend = () => {
        chunkIndex++;
        // Use a small timeout to prevent freezing
        setTimeout(speakNextChunk, 50);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        chunkIndex++;
        // Continue with next chunk even after an error
        setTimeout(speakNextChunk, 50);
      };
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error('Error speaking chunk:', error);
        chunkIndex++;
        setTimeout(speakNextChunk, 50);
      }
    }
    
    // Start speaking
    speakNextChunk();
  });
}

// Remove the unused functions that might be causing performance issues
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
  
  // Extract conversation content for analysis
  const userMessages = conversationMessages.filter(msg => msg.role === 'user');
  const assistantMessages = conversationMessages.filter(msg => msg.role === 'assistant');
  
  // Calculate session duration
  const firstMessageTime = conversationMessages[0]?.timestamp || new Date();
  const lastMessageTime = conversationMessages[conversationMessages.length - 1]?.timestamp || new Date();
  const sessionDurationMs = lastMessageTime.getTime() - firstMessageTime.getTime();
  const sessionDurationMinutes = Math.round(sessionDurationMs / (1000 * 60));
  
  // Analyze content of messages to identify patterns and topics
  const allContent = userMessages.map(msg => msg.content).join(' ').toLowerCase();
  
  // Simple topic detection based on keywords
  const topics = [];
  if (allContent.includes('family') || allContent.includes('parent') || allContent.includes('child') || 
      allContent.includes('daughter') || allContent.includes('son') || allContent.includes('mother') || 
      allContent.includes('father')) {
    topics.push('Family');
  }
  
  if (allContent.includes('work') || allContent.includes('job') || allContent.includes('career') || 
      allContent.includes('profession') || allContent.includes('employment')) {
    topics.push('Work & Career');
  }
  
  if (allContent.includes('travel') || allContent.includes('vacation') || allContent.includes('trip') || 
      allContent.includes('visit') || allContent.includes('abroad') || allContent.includes('journey')) {
    topics.push('Travel & Experiences');
  }
  
  if (allContent.includes('school') || allContent.includes('education') || allContent.includes('learn') || 
      allContent.includes('college') || allContent.includes('university') || allContent.includes('study')) {
    topics.push('Education & Learning');
  }
  
  if (allContent.includes('hobby') || allContent.includes('interest') || allContent.includes('activity') || 
      allContent.includes('garden') || allContent.includes('read') || allContent.includes('cook')) {
    topics.push('Hobbies & Interests');
  }
  
  // Simple mood detection based on keywords
  let mood = 'Neutral';
  const positiveWords = ['happy', 'joy', 'glad', 'good', 'wonderful', 'positive', 'excited', 'love', 'grateful'];
  const negativeWords = ['sad', 'upset', 'angry', 'frustrated', 'unhappy', 'miss', 'loss', 'difficult', 'hard'];
  const nostalgicWords = ['remember', 'reminisce', 'past', 'used to', 'when I was', 'back then', 'younger', 'childhood'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  let nostalgicCount = 0;
  
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = allContent.match(regex);
    if (matches) positiveCount += matches.length;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = allContent.match(regex);
    if (matches) negativeCount += matches.length;
  });
  
  nostalgicWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = allContent.match(regex);
    if (matches) nostalgicCount += matches.length;
  });
  
  if (positiveCount > negativeCount && positiveCount > nostalgicCount) {
    mood = 'Positive';
  } else if (negativeCount > positiveCount && negativeCount > nostalgicCount) {
    mood = 'Reflective';
  } else if (nostalgicCount > positiveCount && nostalgicCount > negativeCount) {
    mood = 'Nostalgic';
  } else {
    mood = 'Mixed';
  }
  
  // Calculate how engaged the conversation was based on message count and length
  let engagement = 'Moderate';
  const avgUserMessageLength = userMessages.reduce((sum, msg) => sum + msg.content.length, 0) / Math.max(userMessages.length, 1);
  
  if (userMessages.length > 10 && avgUserMessageLength > 50) {
    engagement = 'High';
  } else if (userMessages.length < 5 || avgUserMessageLength < 20) {
    engagement = 'Low';
  }
  
  // Generate a reflective summary
  let reflections = '';
  if (topics.length > 0) {
    reflections += `<p>During this conversation, you shared memories and thoughts about ${topics.join(', ')}. `;
  } else {
    reflections += `<p>You had a thoughtful conversation with Remi today. `;
  }
  
  switch (mood) {
    case 'Positive':
      reflections += `The conversation had a positive tone, with expressions of happiness and gratitude throughout.</p>`;
      break;
    case 'Reflective':
      reflections += `You seemed to be in a reflective mood, considering past experiences with thoughtfulness.</p>`;
      break;
    case 'Nostalgic':
      reflections += `You shared several nostalgic memories, connecting with your past experiences with fondness.</p>`;
      break;
    default:
      reflections += `Your conversation displayed a mix of emotions as you explored various memories.</p>`;
  }
  
  reflections += `<p>Your level of engagement was ${engagement.toLowerCase()} during this ${sessionDurationMinutes}-minute session.</p>`;
  
  reflections += `<p>Reminiscence therapy helps strengthen connections to your past and can provide comfort and perspective. We look forward to continuing these meaningful conversations.</p>`;
  
  return `
    <div class="space-y-4 font-lora text-therapy-text">
      <h3 class="text-lg font-medium font-playfair">Session Insights</h3>
      
      <div class="space-y-3">
        ${reflections}
      </div>
      
      <div class="pt-2 text-sm italic">
        This summary was automatically generated based on your conversation patterns.
      </div>
    </div>
  `;
}
