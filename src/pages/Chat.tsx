
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from 'lucide-react';
import { InputMode } from '@/utils/types';
import ChatLayout from '@/components/ChatLayout';
import MessageList from '@/components/MessageList';
import { useConversationManager } from '@/hooks/useConversationManager';

const Chat: React.FC = () => {
  const [messageInput, setMessageInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
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
  
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && !isLoading) {
      setMessageCount(prev => prev + 1);
      await sendMessage(messageInput, InputMode.TEXT);
      setMessageInput('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
  };
  
  const footerContent = (
    <form onSubmit={handleSubmit} className="flex w-full space-x-2">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Type your message here..."
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 input-focus-ring h-12 text-base font-lora"
        disabled={isLoading || isSpeaking}
      />
      <Button 
        type="submit" 
        size="icon" 
        disabled={!messageInput.trim() || isLoading || isSpeaking}
        className="h-12 w-12 btn-transition rounded-full bg-[#3399FF] hover:bg-[#2277DD]"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );

  return (
    <ChatLayout
      participantId={participantId}
      headerTitle="Remi (Text Mode)"
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
        inputMode={InputMode.TEXT}
      />
    </ChatLayout>
  );
};

export default Chat;
