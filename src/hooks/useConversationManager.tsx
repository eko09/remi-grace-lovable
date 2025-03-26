import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { InputMode, Message } from '@/utils/types';
import { generateSessionSummary, getSessionCount, saveConversation, fetchPreviousConversation } from '@/utils/api';
import { useChatCompletion } from '@/hooks/useChatCompletion';
import { supabase } from "@/integrations/supabase/client";

export const useConversationManager = (mode: InputMode = InputMode.TEXT) => {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showPostMood, setShowPostMood] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [messageCount, setMessageCount] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const initialMessage: Message = {
    id: '0',
    content: `Hello! I'm Remi, a therapist trained on reminiscence therapy, facilitating therapy sessions through conversation for older adults 65+. I'd like to start by confirming your participant ID, which consists of your initials followed by your age. What is your participant ID?`,
    role: 'assistant',
    timestamp: new Date()
  };
  
  const { 
    messages, 
    isLoading, 
    isSpeaking, 
    sendMessage, 
    cancelSpeech,
    enableAudio
  } = useChatCompletion([initialMessage], mode === InputMode.VOICE);
  
  useEffect(() => {
    const storedId = sessionStorage.getItem('participantId');
    if (!storedId) {
      navigate('/');
    } else {
      setParticipantId(storedId);
      setStartTime(new Date());
      
      const getSessionInfo = async () => {
        if (storedId) {
          try {
            const { data, error } = await supabase
              .from('participants')
              .select('participant_id')
              .eq('participant_id', storedId)
              .single();
            
            if (error || !data) {
              const { error: insertError } = await supabase
                .from('participants')
                .insert({ participant_id: storedId });
              
              if (insertError) {
                console.error('Error creating participant:', insertError);
              }
            }
          } catch (err) {
            console.error('Error checking participant:', err);
          }
          
          const count = await getSessionCount(storedId);
          setSessionCount(count);
          console.log(`Session count for ${storedId}: ${count}`);
        }
      };
      
      getSessionInfo();
    }
  }, [navigate]);

  const endConversation = async () => {
    if (mode === InputMode.VOICE) {
      cancelSpeech();
    }
    
    const summary = generateSessionSummary(messages);
    setSummaryContent(summary);
    
    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const transcript = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
    
    try {
      if (participantId) {
        const { data: participantData, error: participantError } = await supabase
          .from('participants')
          .select('participant_id')
          .eq('participant_id', participantId)
          .single();
        
        if (participantError || !participantData) {
          await supabase
            .from('participants')
            .insert({ participant_id: participantId });
        }
      }
      
      const { data, error } = await saveConversation(
        participantId,
        summary.replace(/<[^>]*>?/gm, ''),
        transcript,
        duration,
        messageCount,
        mode
      );
      
      if (error) throw error;
      
      if (data && data.id) {
        setCurrentSessionId(data.id);
      }
      
      setShowPostMood(true);
    } catch (error) {
      console.error('Error saving conversation:', error);
      toast({
        title: "Error saving conversation",
        description: "There was a problem saving your conversation. Please try again.",
        variant: "destructive"
      });
      
      setShowSummary(true);
    }
  };
  
  const handlePostMoodComplete = () => {
    setShowPostMood(false);
    setShowSummary(true);
  };

  return {
    participantId,
    messages,
    isLoading,
    isSpeaking,
    showSummary,
    setShowSummary,
    showPostMood,
    setShowPostMood,
    summaryContent,
    messageCount,
    setMessageCount,
    sessionCount,
    currentSessionId,
    sendMessage,
    endConversation,
    fetchPreviousConversation,
    enableAudio,
    handlePostMoodComplete
  };
};
