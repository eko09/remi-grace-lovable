
import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, InputMode } from '../utils/types';
import { getChatCompletion, textToSpeech, initSpeechSynthesis } from '../utils/api';
import { useToast } from "@/components/ui/use-toast";

export const useChatCompletion = (initialMessages: Message[] = []) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize speech synthesis
  useEffect(() => {
    initSpeechSynthesis();
    
    // Configure voice settings
    if ('speechSynthesis' in window) {
      speechRef.current = new SpeechSynthesisUtterance();
      
      // Use a female voice with pleasant tone
      const voices = window.speechSynthesis.getVoices();
      // Try to find a female English voice
      const preferredVoices = [
        // Different systems have different voice names, try common ones
        "Google US English Female", 
        "Microsoft Zira Desktop",
        "Female English Voice", 
        "Samantha",
        "Victoria"
      ];
      
      // Function to set a voice when voices are available
      const setVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log("Available voices:", voices.map(v => v.name));
        
        // Find a preferred female voice
        let selectedVoice = null;
        for (const preferredVoice of preferredVoices) {
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes(preferredVoice.toLowerCase())
          );
          if (selectedVoice) break;
        }
        
        // If no preferred voice found, try to find any female voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') || 
            voice.name.toLowerCase().includes('woman')
          );
        }
        
        // If still no voice, use the first English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => voice.lang.includes('en'));
        }
        
        // Fall back to first voice if nothing else works
        if (!selectedVoice && voices.length > 0) {
          selectedVoice = voices[0];
        }
        
        if (selectedVoice && speechRef.current) {
          console.log("Selected voice:", selectedVoice.name);
          speechRef.current.voice = selectedVoice;
          speechRef.current.rate = 1.0; // Normal speaking rate
          speechRef.current.pitch = 1.1; // Slightly higher pitch for a pleasant tone
          speechRef.current.volume = 1.0;
        }
      };
      
      // Handle voice availability
      if (voices.length > 0) {
        setVoice();
      } else {
        window.speechSynthesis.onvoiceschanged = setVoice;
      }
    }
    
    // Cleanup speech on unmount
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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
          // Use our enhanced speech synthesis instead of the API call
          if (speechRef.current && 'speechSynthesis' in window) {
            speechRef.current.text = responseContent;
            
            // Set up event handlers
            speechRef.current.onend = () => {
              console.log('Speech synthesis completed naturally');
              setIsSpeaking(false);
            };
            
            speechRef.current.onerror = (event) => {
              console.error('Speech synthesis error:', event);
              setIsSpeaking(false);
              toast({
                title: "Speech Error",
                description: "There was an error with the speech synthesis.",
                variant: "destructive"
              });
            };
            
            // Start speaking
            window.speechSynthesis.speak(speechRef.current);
          } else {
            // Fall back to the API-based method if speechSynthesis is not available
            await textToSpeech(responseContent);
            setIsSpeaking(false);
          }
          console.log('Speech synthesis initiated successfully');
        } catch (speechError) {
          console.error('Text-to-speech error:', speechError);
          setIsSpeaking(false);
          toast({
            title: "Speech Synthesis Error",
            description: "Unable to play audio response. Check your audio settings.",
            variant: "destructive"
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
