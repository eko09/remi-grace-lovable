
import React, { useEffect } from 'react';
import { InputMode } from '@/utils/types';
import AudioRecorder from '@/components/AudioRecorder';
import { useConversationManager } from '@/hooks/useConversationManager';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useIsMobile } from '@/hooks/use-mobile';

const VoiceChat: React.FC = () => {
  const isMobile = useIsMobile();
  
  const {
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
  } = useConversationManager(InputMode.VOICE);
  
  // Fetch previous conversation for context when component mounts
  useEffect(() => {
    const loadPreviousConversation = async () => {
      if (participantId) {
        const previousConversation = await fetchPreviousConversation(participantId);
        console.log('Previous conversation loaded:', previousConversation ? 'Yes' : 'No');
      }
    };
    
    loadPreviousConversation();
  }, [participantId, fetchPreviousConversation]);
  
  const handleSpeechInput = async (transcription: string) => {
    if (transcription.trim()) {
      setMessageCount(prev => prev + 1);
      // Fetch previous conversation context
      const previousConversation = participantId 
        ? await fetchPreviousConversation(participantId)
        : null;
      
      await sendMessage(transcription, InputMode.VOICE, previousConversation);
    }
  };
  
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
          variant="outline"
          size={isMobile ? "sm" : "default"}
          onClick={endConversation}
          className="text-red-500 hover:bg-red-50 font-lora"
        >
          {isMobile ? <X className="h-4 w-4" /> : (
            <>
              <X className="h-4 w-4 mr-2" />
              End
            </>
          )}
        </Button>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 mb-6 sm:mb-8">
          <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi" className="object-cover" />
          <AvatarFallback className="text-4xl">RM</AvatarFallback>
        </Avatar>
        
        <div className={`text-center mb-6 sm:mb-8 ${isSpeaking ? 'animate-pulse' : ''}`}>
          <p className="text-lg font-medium text-therapy-text font-lora">
            {isSpeaking ? "Remi is speaking..." : isLoading ? "Remi is thinking..." : "Press the button and speak to Remi"}
          </p>
        </div>
      </div>
      
      <div className="w-full max-w-md pb-4 sm:pb-6">
        <AudioRecorder 
          onAudioComplete={handleSpeechInput} 
          isAssistantResponding={isLoading || isSpeaking} 
        />
      </div>

      {/* Session Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="w-[calc(100%-32px)] sm:max-w-md font-lora bg-therapy-beige-light">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair">Session Complete</DialogTitle>
            <DialogDescription className="text-therapy-text">
              Thank you for your session with Remi today.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4" dangerouslySetInnerHTML={{ __html: summaryContent }} />
          <div className="flex justify-center mt-4">
            <Button 
              onClick={() => {
                setShowSummary(false);
                window.location.href = '/';
              }}
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
