
import React, { useEffect, useRef } from 'react';
import { Message, InputMode } from '@/utils/types';
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  isLatest: boolean;
  inputMode?: InputMode;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isLatest,
  inputMode = InputMode.TEXT
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === 'user';
  
  // Scroll into view when a new message appears
  useEffect(() => {
    if (isLatest && bubbleRef.current) {
      bubbleRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isLatest]);

  return (
    <div 
      ref={bubbleRef}
      className={cn(
        "px-4 py-3 rounded-2xl max-w-[85%] mb-4 message-appear senior-friendly font-lora",
        isUser 
          ? "ml-auto bg-therapy-blue text-therapy-text rounded-tr-none" 
          : "mr-auto bg-therapy-beige text-therapy-text rounded-tl-none"
      )}
    >
      {message.content}
      {isLatest && !isUser && inputMode === InputMode.VOICE && (
        <div className="text-xs text-gray-500 mt-2 italic">
          (Remi is speaking this message)
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
