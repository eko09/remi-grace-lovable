import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Send, X } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MessageBubble from '@/components/MessageBubble';
import { useChatCompletion } from '@/hooks/useChatCompletion';
import { InputMode, Message } from '@/utils/types';
import { generateSessionSummary } from '@/utils/api';
import { supabase } from "@/integrations/supabase/client";

const Chat: React.FC = () => {
  const [messageInput, setMessageInput] = useState('');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string>('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [messageCount, setMessageCount] = useState<number>(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const storedId = sessionStorage.getItem('participantId');
    if (!storedId) {
      navigate('/');
    } else {
      setParticipantId(storedId);
      setStartTime(new Date());
    }
  }, [navigate]);
  
  const initialMessage: Message = {
    id: '0',
    content: `Hello! I'm Remi, your reminiscence therapy companion. I'm here to help you explore your memories and experiences. How are you feeling today?`,
    role: 'assistant',
    timestamp: new Date()
  };
  
  const { messages, isLoading, isSpeaking, sendMessage, cancelSpeech } = useChatCompletion([initialMessage]);
  
  useEffect(() => {
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

  const saveConversationToDatabase = async (summary: string, transcript: string, duration: number, turns: number) => {
    try {
      // First, ensure participant exists in the database
      const { error: participantError } = await supabase
        .from('participants')
        .upsert([{ participant_id: participantId }], { onConflict: 'participant_id' });
      
      if (participantError) throw participantError;
      
      // Then save the conversation
      const { error } = await supabase
        .from('conversations')
        .insert([{
          participant_id: participantId,
          summary,
          transcript,
          duration,
          turns,
          timestamp: new Date().toISOString()
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
  
  const closeSummary = () => {
    setShowSummary(false);
    navigate('/');
  };

  
  return (
    <div className="flex flex-col h-screen bg-therapy-beige-light page-transition">
      <header className="py-4 px-6 flex items-center justify-between border-b bg-white">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-4">
            <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi" />
            <AvatarFallback>RM</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-medium text-therapy-text font-playfair">Remi (Text Mode)</h1>
            {participantId && (
              <p className="text-sm text-gray-500">{participantId}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={endConversation}
            className="text-red-500 hover:bg-red-50 font-lora"
          >
            <X className="h-4 w-4 mr-2" />
            End Conversation
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden p-4">
        <Card className="flex flex-col h-full glass-panel">
          <CardHeader className="text-center py-3 border-b">
            <p className="text-sm text-gray-500 font-lora">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </CardHeader>
          
          <CardContent 
            ref={chatContainerRef} 
            className="flex-1 overflow-y-auto py-6 px-4 smooth-scroll"
          >
            <div className="flex flex-col space-y-1">
              {messages.map((message, index) => (
                <MessageBubble 
                  key={message.id} 
                  message={message} 
                  isLatest={index === messages.length - 1}
                  inputMode={InputMode.TEXT}
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
          </CardContent>
          
          <CardFooter className="p-4 border-t">
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
          </CardFooter>
        </Card>
      </main>

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

export default Chat;
