
import { useState, useCallback, useRef } from 'react';
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
      
      // For voice chat mode only - this won't execute in text chat mode
      if (inputMode === InputMode.VOICE) {
        console.log('Voice mode: Converting to speech:', responseContent);
        setIsSpeaking(true);
        
        try {
          // Only try text-to-speech in voice mode
          await textToSpeechGoogle(responseContent);
        } catch (speechError) {
          console.error('Text-to-speech methods failed:', speechError);
          setIsSpeaking(false);
          
          // Only show error in voice mode
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
  
  // Function to use Google Cloud TTS - only used in voice mode
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
            setIsSpeaking(false);
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
