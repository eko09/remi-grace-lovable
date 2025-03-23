
import React, { useRef, useEffect } from 'react';
import { Message, InputMode } from '@/utils/types';
import MessageBubble from '@/components/MessageBubble';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  inputMode: InputMode;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, inputMode }) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div ref={chatContainerRef} className="flex flex-col space-y-1">
      {messages.map((message, index) => (
        <MessageBubble 
          key={message.id} 
          message={message} 
          isLatest={index === messages.length - 1}
          inputMode={inputMode}
        />
      ))}
      
      {isLoading && (
        <div className="flex space-x-1 ml-4 mb-4">
          <div className="w-3 h-3 rounded-full bg-[#3399FF] animate-pulse"></div>
          <div className="w-3 h-3 rounded-full bg-[#3399FF] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 rounded-full bg-[#3399FF] animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
