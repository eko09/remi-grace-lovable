import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputMode } from '@/utils/types';
import AudioRecorder from '@/components/AudioRecorder';
import { useConversationManager } from '@/hooks/useConversationManager';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Volume2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MoodSlider from "@/components/MoodSlider";

const VoiceChat: React.FC = () => {
  const [previousConversation, setPreviousConversation] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const {
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
    currentSessionId,
    sendMessage,
    endConversation,
    fetchPreviousConversation,
    enableAudio,
    handlePostMoodComplete
  } = useConversationManager(InputMode.VOICE);
  
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (enableAudio) {
          await enableAudio();
          setAudioEnabled(true);
          console.log('Audio automatically enabled on component mount');
        }
      } catch (err) {
        console.error('Failed to auto-enable audio:', err);
      }
    };
    
    initAudio();
  }, [enableAudio]);
  
  useEffect(() => {
    const loadPreviousConversation = async () => {
      if (participantId) {
        const prevConversation = await fetchPreviousConversation(participantId);
        setPreviousConversation(prevConversation);
        console.log('Previous conversation loaded:', prevConversation ? 'Yes' : 'No');
      }
    };
    
    loadPreviousConversation();
  }, [participantId, fetchPreviousConversation]);
  
  const handleAudioRecorded = async (transcript: string) => {
    if (transcript && !isLoading) {
      console.log('Voice transcript:', transcript);
      setMessageCount(prev => prev + 1);
      
      if (!audioEnabled) {
        enableAudioPlayback();
      }
      
      await sendMessage(transcript, InputMode.VOICE, previousConversation);
    }
  };
  
  const enableAudioPlayback = async () => {
    try {
      if (enableAudio) {
        await enableAudio();
      }
      setAudioEnabled(true);
      console.log('Audio playback enabled');
    } catch (error) {
      console.error('Failed to enable audio:', error);
      toast({
        title: "Audio Playback Issue",
        description: "There was a problem enabling audio. Please tap the audio button again.",
        duration: 5000,
      });
    }
  };
  
  const closeSummary = () => {
    setShowSummary(false);
    navigate('/');
  };
  
  const footerContent = (
    <div className="flex flex-col items-center w-full space-y-4">
      <AudioRecorder 
        onAudioComplete={handleAudioRecorded} 
        isAssistantResponding={isLoading || isSpeaking}
      />
    </div>
  );
  
  const voiceChatContent = (
    <div className="flex flex-col items-center justify-center flex-1 py-10">
      <div className="mb-6 relative" onClick={enableAudioPlayback}>
        <Avatar className="h-28 w-28 sm:h-40 sm:w-40">
          <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi" />
          <AvatarFallback>R</AvatarFallback>
        </Avatar>
        
        {!audioEnabled && (
          <Button 
            size="sm" 
            className="absolute -bottom-2 -right-2 bg-[#3399FF] hover:bg-[#2277DD] rounded-full"
            onClick={enableAudioPlayback}
          >
            <Volume2 className="h-4 w-4 mr-1" />
            <span className="text-xs">Enable Audio</span>
          </Button>
        )}
      </div>
      <div className="text-center mb-6 text-therapy-text">
        {isLoading ? (
          <p className="animate-pulse">Listening...</p>
        ) : isSpeaking ? (
          <p className="animate-pulse">Speaking...</p>
        ) : (
          <p>
            {audioEnabled 
              ? "Press and hold to speak with Remi" 
              : "Tap to enable audio, then speak with Remi"}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-between h-screen bg-therapy-beige-light p-3 sm:p-6">
      <header className="w-full flex items-center justify-between py-3 px-4 sm:py-4 sm:px-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 mr-3 sm:mr-4">
            <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi" />
            <AvatarFallback>RM</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg sm:text-xl font-medium text-therapy-text font-playfair">Remi</h1>
            {participantId && (
              <p className="text-xs sm:text-sm text-gray-500">{participantId}</p>
            )}
          </div>
        </div>
        <Button
          onClick={endConversation}
          size="sm"
          variant="outline"
          className="text-sm px-2 sm:px-4 h-8 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded-md"
        >
          <span>End</span>
        </Button>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {voiceChatContent}
      </div>
      
      <div className="w-full max-w-md pb-4 sm:pb-6">
        {footerContent}
      </div>

      <Dialog open={showPostMood} onOpenChange={setShowPostMood}>
        <DialogContent className="w-[calc(100%-32px)] sm:max-w-md font-lora bg-therapy-beige-light">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair">Please let us know how you're feeling after the session</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {participantId && (
              <MoodSlider
                participantId={participantId}
                sessionId={currentSessionId || undefined}
                assessmentType="post"
                onComplete={handlePostMoodComplete}
                title=""
                subtitle=""
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="w-[calc(100%-32px)] sm:max-w-md font-lora bg-therapy-beige-light">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair">Session Complete</DialogTitle>
          </DialogHeader>
          <div className="py-4" dangerouslySetInnerHTML={{ __html: summaryContent }} />
          <div className="flex justify-center mt-4">
            <Button 
              onClick={closeSummary}
              className="w-full sm:w-auto bg-[#3399FF] hover:bg-[#2277DD]"
            >
              Return to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoiceChat;
