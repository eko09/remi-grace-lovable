
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { InputMode, Message } from '@/utils/types';
import { generateSessionSummary } from '@/utils/api';
import { useChatCompletion } from '@/hooks/useChatCompletion';
import { supabase } from "@/integrations/supabase/client";

export const useConversationManager = (mode: InputMode = InputMode.TEXT) => {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [messageCount, setMessageCount] = useState<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Setup initial message for Remi
  const initialMessage: Message = {
    id: '0',
    content: `Hello! I'm Remi, your reminiscence therapy companion. I'm here to help you explore your memories and experiences. How are you feeling today?`,
    role: 'assistant',
    timestamp: new Date()
  };
  
  // Get chat completion hook
  const { 
    messages, 
    isLoading, 
    isSpeaking, 
    sendMessage, 
    cancelSpeech,
    enableAudio
  } = useChatCompletion([initialMessage]);
  
  // Check for participant ID
  useEffect(() => {
    const storedId = sessionStorage.getItem('participantId');
    if (!storedId) {
      navigate('/');
    } else {
      setParticipantId(storedId);
      setStartTime(new Date());
    }
  }, [navigate]);

  // Function to fetch previous conversation
  const fetchPreviousConversation = async (participantId: string) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('transcript')
        .eq('participant_id', participantId)
        .order('timestamp', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      return data.length > 0 ? data[0].transcript : null;
    } catch (error) {
      console.error('Error fetching previous conversation:', error);
      return null;
    }
  };

  const saveConversationToDatabase = async (summary: string, transcript: string, duration: number, turns: number) => {
    try {
      // First, ensure participant exists in the database
      const { error: participantError } = await supabase
        .from('participants')
        .upsert([{ participant_id: participantId }], { onConflict: 'participant_id' });
      
      if (participantError) throw participantError;
      
      // Then save the conversation with the mode
      const { error } = await supabase
        .from('conversations')
        .insert([{
          participant_id: participantId,
          summary,
          transcript,
          duration,
          turns,
          timestamp: new Date().toISOString(),
          mode: mode // Store the conversation mode
        }]);
      
      if (error) throw error;
      console.log('Conversation saved successfully');
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: "Error saving conversation",
        description: "There was a problem saving your conversation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const endConversation = () => {
    // Cancel any ongoing speech
    cancelSpeech();
    
    // Generate summary from messages
    const summary = generateSessionSummary(messages);
    setSummaryContent(summary);
    
    // Calculate duration and prepare transcript
    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    // Save to database
    saveConversationToDatabase(
      summary.replace(/<[^>]*>?/gm, ''), // Strip HTML tags for database storage
      transcript,
      duration,
      messageCount
    );
    
    setShowSummary(true);
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
    sendMessage,
    endConversation,
    fetchPreviousConversation,
    enableAudio,
  };
};
