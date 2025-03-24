
import React, { useEffect, useState } from 'react';
import { InputMode } from '@/utils/types';
import AudioRecorder from '@/components/AudioRecorder';
import { useConversationManager } from '@/hooks/useConversationManager';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const VoiceChat: React.FC = () => {
  const [previousConversation, setPreviousConversation] = useState<string | null>(null);
  
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
  
  // Fetch previous conversation for RAG
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
  
  // Handler for when audio is recorded
  const handleAudioRecorded = async (transcript: string) => {
    if (transcript && !isLoading) {
      console.log('Voice transcript:', transcript);
      setMessageCount(prev => prev + 1);
      await sendMessage(transcript, InputMode.VOICE, previousConversation);
    }
  };
  
  // The voice chat UI is simpler - just show Remi's avatar and the audio recorder
  const footerContent = (
    <div className="flex flex-col items-center w-full space-y-4">
      <AudioRecorder 
        onAudioComplete={handleAudioRecorded} 
        isAssistantResponding={isLoading || isSpeaking}
      />
    </div>
  );
  
  // For voice chat, we'll render a simplified UI with Remi's avatar in the center
  const voiceChatContent = (
    <div className="flex flex-col items-center justify-center flex-1 py-10">
      <div className="mb-6">
        <Avatar className="h-28 w-28 sm:h-40 sm:w-40">
          <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi" />
          <AvatarFallback>R</AvatarFallback>
        </Avatar>
      </div>
      <div className="text-center mb-6 text-therapy-text">
        {isLoading ? (
          <p className="animate-pulse">Listening...</p>
        ) : isSpeaking ? (
          <p className="animate-pulse">Speaking...</p>
        ) : (
          <p>Press and hold to speak with Remi</p>
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
        <button
          onClick={endConversation}
          className="text-xs sm:text-sm px-2 sm:px-4 h-8 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded-md"
        >
          <span className="hidden sm:inline">End Conversation</span>
          <span className="sm:hidden">End</span>
        </button>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        {voiceChatContent}
      </div>
      
      <div className="w-full max-w-md pb-4 sm:pb-6">
        {footerContent}
      </div>

      {/* Session Summary Dialog */}
      {showSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-medium font-playfair">Conversation Summary</h2>
              <button 
                onClick={() => {
                  setShowSummary(false);
                  window.location.href = '/conversation-mode';
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: summaryContent }} />
            <div className="flex justify-center mt-6">
              <button 
                onClick={() => {
                  setShowSummary(false);
                  window.location.href = '/conversation-mode';
                }}
                className="px-4 py-2 bg-[#3399FF] hover:bg-[#2277DD] text-white rounded-md"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
