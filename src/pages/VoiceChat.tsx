
import React from 'react';
import { InputMode } from '@/utils/types';
import AudioRecorder from '@/components/AudioRecorder';
import { useConversationManager } from '@/hooks/useConversationManager';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const VoiceChat: React.FC = () => {
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
  } = useConversationManager();
  
  const handleSpeechInput = async (transcription: string) => {
    if (transcription.trim()) {
      setMessageCount(prev => prev + 1);
      await sendMessage(transcription, InputMode.VOICE);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-between h-screen bg-therapy-beige-light p-6">
      <header className="w-full flex items-center justify-between py-4 px-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center">
          <h1 className="text-xl font-medium text-therapy-text font-playfair">Remi (Voice Mode)</h1>
          {participantId && (
            <p className="text-sm text-gray-500 ml-2">ID: {participantId}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={endConversation}
          className="text-red-500 hover:bg-red-50 font-lora"
        >
          <X className="h-4 w-4 mr-2" />
          End Conversation
        </Button>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <Avatar className="h-32 w-32 mb-8">
          <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi" className="object-cover" />
          <AvatarFallback className="text-4xl">RM</AvatarFallback>
        </Avatar>
        
        <div className={`text-center mb-8 ${isSpeaking ? 'animate-pulse' : ''}`}>
          <p className="text-lg font-medium text-therapy-text font-lora">
            {isSpeaking ? "Remi is speaking..." : isLoading ? "Remi is thinking..." : "Press the button and speak to Remi"}
          </p>
        </div>
      </div>
      
      <div className="w-full max-w-md pb-6">
        <AudioRecorder 
          onAudioComplete={handleSpeechInput} 
          isAssistantResponding={isLoading || isSpeaking} 
        />
      </div>

      {/* Session Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="sm:max-w-md font-lora bg-therapy-beige-light">
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
