
import { useState, useCallback } from 'react';
import { Message, InputMode } from '../utils/types';
import { getChatCompletion, textToSpeech } from '../utils/api';
import { useToast } from "@/components/ui/use-toast";

export const useChatCompletion = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Send a message and get a response
  const sendMessage = useCallback(async (content: string, inputMode: InputMode = InputMode.TEXT) => {
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
      const responseContent = await getChatCompletion(updatedMessages);
      
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
          await textToSpeech(responseContent);
          console.log('Speech synthesis completed successfully');
        } catch (speechError) {
          console.error('Text-to-speech error:', speechError);
          toast({
            title: "Speech Synthesis Error",
            description: "Unable to play audio response. Check your audio settings.",
            variant: "destructive"
          });
        } finally {
          setIsSpeaking(false);
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
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      console.log('Speech synthesis canceled');
    }
  }, []);
  
  return {
    messages,
    isLoading,
    isSpeaking,
    error,
    sendMessage,
    clearMessages,
    cancelSpeech
  };
};
