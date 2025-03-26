
// File containing speech synthesis functions

/**
 * Initialize speech synthesis by loading voices
 */
export function initSpeechSynthesis(): void {
  if ('speechSynthesis' in window) {
    // Force voices to load
    const voices = window.speechSynthesis.getVoices();
    
    if (voices.length > 0) {
      console.log('Voices loaded initially:', voices.length);
      // Log available voices for debugging
      voices.forEach((voice, index) => {
        console.log(`Voice ${index}: ${voice.name} (${voice.lang})`);
      });
    }
    
    // Set up the onvoiceschanged event
    window.speechSynthesis.onvoiceschanged = () => {
      const updatedVoices = window.speechSynthesis.getVoices();
      console.log('Voices loaded after change:', updatedVoices.length);
      // Log available voices for debugging
      updatedVoices.forEach((voice, index) => {
        console.log(`Voice ${index}: ${voice.name} (${voice.lang})`);
      });
    };
  }
}

/**
 * Convert text to speech using the Web Speech API
 * @param text - The text to convert to speech
 * @returns A promise that resolves when speech is complete or rejects on error
 */
export function textToSpeech(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      reject(new Error('Speech synthesis not supported'));
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create the utterance with the full text
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice properties for a soothing female voice
    utterance.rate = 0.95; // Slightly slower than default
    utterance.pitch = 1.05; // Slightly higher pitch for a more upbeat tone
    utterance.volume = 1;
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    console.log(`Available voices: ${voices.length}`);
    
    // Preferred voices in order (common female voices across platforms)
    const preferredVoiceNames = [
      'Samantha', // iOS/macOS
      'Google US English Female', // Chrome
      'Microsoft Zira', // Windows
      'Google UK English Female',
      'Karen', // macOS/iOS
      'Microsoft Susan', // Windows
      'Female' // Generic fallback
    ];
    
    let selectedVoice = null;
    
    // Try to find a preferred voice
    for (const voiceName of preferredVoiceNames) {
      const voice = voices.find(v => v.name.includes(voiceName));
      if (voice) {
        selectedVoice = voice;
        console.log(`Selected voice: ${voice.name}`);
        break;
      }
    }
    
    // If no preferred voice found, try to find any female voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.includes('Karen') ||
        v.name.includes('Samantha') ||
        v.name.includes('Alex')
      );
    }
    
    // If still no voice, use the first available
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
      console.log(`No preferred voice found, using default: ${selectedVoice.name}`);
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Handle events
    utterance.onend = () => {
      console.log('Speech synthesis completed');
      resolve();
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      reject(new Error('Speech synthesis failed'));
    };
    
    // Start speaking
    try {
      window.speechSynthesis.speak(utterance);
      console.log('Started speaking with voice:', utterance.voice?.name);
    } catch (error) {
      console.error('Error starting speech:', error);
      reject(error);
    }
  });
}

// Initialize speech synthesis on module load
initSpeechSynthesis();
