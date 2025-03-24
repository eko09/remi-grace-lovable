
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, InputMode } from '../utils/types';
import { getChatCompletion } from '../utils/api';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useChatCompletion = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const audioRef = useRef(new Audio());
  
  // Setup audio element
  useEffect(() => {
    // Set up event handlers for audio playback
    const audio = audioRef.current;
    
    const handleAudioEnded = () => {
      console.log('Audio playback completed');
      setIsSpeaking(false);
    };
    
    const handleAudioError = (e: any) => {
      console.error('Audio playback error:', e);
      setIsSpeaking(false);
      toast({
        title: "Audio Error",
        description: "There was an error playing the audio response.",
        variant: "destructive"
      });
    };
    
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('error', handleAudioError);
    
    // Cleanup
    return () => {
      audio.removeEventListener('ended', handleAudioEnded);
      audio.removeEventListener('error', handleAudioError);
      audio.pause();
      audio.src = '';
    };
  }, [toast]);

  // Function to use Google Cloud TTS
  const textToSpeechGoogle = async (text: string): Promise<void> => {
    try {
      console.log('Converting to speech using Google Cloud TTS:', text);
      
      const { data, error } = await supabase.functions.invoke('google-tts', {
        body: { 
          text,
          voice: 'en-US-Wavenet-F' // A natural sounding female voice
        }
      });
      
      if (error) {
        console.error('Error calling TTS function:', error);
        throw new Error('Failed to generate speech');
      }
      
      if (!data.audioContent) {
        throw new Error('No audio content returned');
      }
      
      // Create audio from base64
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      
      // Play the audio
      const audio = audioRef.current;
      audio.src = audioSrc;
      
      // Make sure to load and play the audio, especially important on mobile
      try {
        await audio.load();
        audio.volume = 1.0; // Ensure volume is at maximum
        
        console.log('Attempting to play audio...');
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Play error (likely user interaction needed):', error);
            // We'll set isSpeaking to false since we couldn't play
            setIsSpeaking(false);
            
            // On mobile, especially iOS, autoplay is often blocked
            toast({
              title: "Tap to hear Remi",
              description: "Please tap the screen to enable audio playback",
              duration: 5000,
            });
          });
        }
      } catch (e) {
        console.error('Audio play error:', e);
        setIsSpeaking(false);
        throw e;
      }
      
      console.log('Speech synthesis initiated successfully');
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
      throw error;
    }
  };

  // Fallback to browser's speech synthesis if Google TTS fails
  const fallbackBrowserTTS = (text: string): void => {
    console.log('Falling back to browser TTS');
    
    if (!('speechSynthesis' in window)) {
      console.error('Speech synthesis not supported');
      setIsSpeaking(false);
      return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    console.log(`Available voices: ${voices.length}`);
    
    // Try to find a female voice
    const preferredVoiceNames = [
      'Samantha', 'Google US English Female', 'Microsoft Zira',
      'Google UK English Female', 'Karen', 'Microsoft Susan', 'Female'
    ];
    
    let selectedVoice = null;
    
    for (const voiceName of preferredVoiceNames) {
      const voice = voices.find(v => v.name.includes(voiceName));
      if (voice) {
        selectedVoice = voice;
        console.log(`Selected voice: ${voice.name}`);
        break;
      }
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Set voice properties
    utterance.rate = 0.95;  // Slightly slower
    utterance.pitch = 1.05; // Slightly higher pitch for female voice
    utterance.volume = 1;   // Full volume
    
    // Set events
    utterance.onend = () => {
      console.log('Speech synthesis completed');
      setIsSpeaking(false);
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
  };

  // Send a message and get a response
  const sendMessage = useCallback(async (content: string, inputMode: InputMode = InputMode.TEXT, previousConversation?: string | null) => {
    if (!content.trim()) return;
    
    setError(null);
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Get response from AI
      const updatedMessages = [...messages, userMessage];
      
      // Include previous conversation context if available (for RAG functionality)
      const contextPrompt = previousConversation 
        ? `Here's a summary of our previous conversation to help inform your response: ${previousConversation}\n\nNow, please respond to my message: ${content}`
        : content;
      
      // Use the contextPrompt if we have previous conversation
      const messageToSend = previousConversation 
        ? { ...userMessage, content: contextPrompt } 
        : userMessage;
      
      const finalMessages = previousConversation 
        ? [...messages.slice(0, -1), messageToSend] 
        : updatedMessages;
      
      const responseContent = await getChatCompletion(finalMessages);
      
      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Convert response to speech for voice input mode
      if (inputMode === InputMode.VOICE) {
        console.log('Converting to speech:', responseContent);
        setIsSpeaking(true);
        
        try {
          // Use Google Cloud TTS with fallback to browser TTS
          await textToSpeechGoogle(responseContent).catch(err => {
            console.error('Google TTS failed, falling back to browser TTS:', err);
            fallbackBrowserTTS(responseContent);
          });
        } catch (speechError) {
          console.error('All text-to-speech methods failed:', speechError);
          setIsSpeaking(false);
          toast({
            title: "Speech Synthesis Error",
            description: "Unable to play audio response. Tap the screen to try again.",
            variant: "destructive",
            duration: 5000
          });
        }
      }
      
      return assistantMessage;
    } catch (error) {
      console.error('Error in chat completion:', error);
      setError('There was an error processing your message. Please try again.');
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, toast]);
  
  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);
  
  // Cancel any ongoing speech
  const cancelSpeech = useCallback(() => {
    // Stop Google TTS audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    // Also stop browser TTS if it's running
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    setIsSpeaking(false);
    console.log('Speech synthesis canceled');
  }, []);
  
  // Add function to enable audio playback on user interaction
  // This is especially important for mobile browsers
  const enableAudio = useCallback(() => {
    console.log('Attempting to enable audio playback...');
    const audio = audioRef.current;
    
    // Create a short silent audio context and play it to enable audio on iOS
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        oscillator.frequency.value = 0; // Silent
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.001);
        console.log('Created silent audio context to unlock audio');
      }
    } catch (e) {
      console.warn('Failed to create audio context:', e);
    }
    
    // Also try with the HTML audio element
    audio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV';
    audio.load();
    audio.loop = false;
    audio.volume = 0;
    
    audio.play().then(() => {
      console.log('Silent audio played successfully - audio should now be enabled');
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1.0;
    }).catch(e => {
      console.error('Failed to enable audio with silent play:', e);
      
      // Try one more approach - create a user gesture listener
      toast({
        title: "Enable Audio",
        description: "Please tap or click anywhere on the screen to enable audio playback",
        duration: 5000,
      });
    });
  }, [toast]);
  
  return {
    messages,
    isLoading,
    isSpeaking,
    error,
    sendMessage,
    clearMessages,
    cancelSpeech,
    enableAudio
  };
};
