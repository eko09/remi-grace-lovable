
import React from 'react';
import { InputMode } from '@/utils/types';
import AudioRecorder from '@/components/AudioRecorder';
import ChatLayout from '@/components/ChatLayout';
import MessageList from '@/components/MessageList';
import { useConversationManager } from '@/hooks/useConversationManager';

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
  
  const footerContent = (
    <div className="flex flex-col w-full items-center">
      <AudioRecorder 
        onAudioComplete={handleSpeechInput} 
        isAssistantResponding={isLoading || isSpeaking} 
      />
      <p className="mt-4 text-sm text-gray-500">
        Speak to Remi and she will respond with voice
      </p>
    </div>
  );

  return (
    <ChatLayout
      participantId={participantId}
      headerTitle="Remi (Voice Mode)"
      showSummary={showSummary}
      setShowSummary={setShowSummary}
      summaryContent={summaryContent}
      endConversation={endConversation}
      isLoading={isLoading}
      isSpeaking={isSpeaking}
      footerContent={footerContent}
    >
      <MessageList
        messages={messages}
        isLoading={isLoading}
        inputMode={InputMode.VOICE}
      />
    </ChatLayout>
  );
};

export default VoiceChat;
