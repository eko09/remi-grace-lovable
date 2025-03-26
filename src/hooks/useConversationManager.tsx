
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { InputMode, Message } from '@/utils/types';
import { generateSessionSummary, getSessionCount, saveConversation, fetchPreviousConversation } from '@/utils/api';
import { useChatCompletion } from '@/hooks/useChatCompletion';

export const useConversationManager = (mode: InputMode = InputMode.TEXT) => {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [messageCount, setMessageCount] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Setup initial message for Remi with new prompt
  const initialMessage: Message = {
    id: '0',
    content: `Hello! I'm Remi, a therapist trained on reminiscence therapy, facilitating therapy sessions through conversation for older adults 65+. I'd like to start by confirming your participant ID, which consists of your initials followed by your age. What is your participant ID?`,
    role: 'assistant',
    timestamp: new Date()
  };
  
  // Get chat completion hook - only pass audio options for voice mode
  const { 
    messages, 
    isLoading, 
    isSpeaking, 
    sendMessage, 
    cancelSpeech,
    enableAudio
  } = useChatCompletion([initialMessage], mode === InputMode.VOICE);
  
  // Check for participant ID
  useEffect(() => {
    const storedId = sessionStorage.getItem('participantId');
    if (!storedId) {
      navigate('/');
    } else {
      setParticipantId(storedId);
      setStartTime(new Date());
      
      // Get session count for this participant
      const getSessionInfo = async () => {
        if (storedId) {
          const count = await getSessionCount(storedId);
          setSessionCount(count);
          console.log(`Session count for ${storedId}: ${count}`);
        }
      };
      
      getSessionInfo();
    }
  }, [navigate]);

  const endConversation = () => {
    // Cancel any ongoing speech
    if (mode === InputMode.VOICE) {
      cancelSpeech();
    }
    
    // Generate summary from messages
    const summary = generateSessionSummary(messages);
    setSummaryContent(summary);
    
    // Calculate duration and prepare transcript
    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    // Save to database
    saveConversation(
      participantId,
      summary.replace(/<[^>]*>?/gm, ''), // Strip HTML tags for database storage
      transcript,
      duration,
      messageCount,
      mode
    ).catch(error => {
      toast({
        title: "Error saving conversation",
        description: "There was a problem saving your conversation. Please try again.",
        variant: "destructive"
      });
    });
    
    setShowSummary(true);
    
    // After showing summary, redirect should be to home page
    // This will take effect when the summary is closed
  };

  return {
    participantId,
    messages,
    isLoading,
    isSpeaking,
    showSummary,
    setShowSummary,
    summaryContent,
    messageCount,
    setMessageCount,
    sessionCount,
    sendMessage,
    endConversation,
    fetchPreviousConversation,
    enableAudio,
  };
};
