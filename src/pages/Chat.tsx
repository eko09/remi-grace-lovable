
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Send, Mic, Keyboard, ArrowLeft, X, Pause } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import MessageBubble from '@/components/MessageBubble';
import AudioRecorder from '@/components/AudioRecorder';
import { useChatCompletion } from '@/hooks/useChatCompletion';
import { InputMode, Message } from '@/utils/types';

const Chat: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.TEXT);
  const [messageInput, setMessageInput] = useState('');
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
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
    }
  }, [navigate, toast]);
  
  const initialMessage: Message = {
    id: '0',
    content: `Hello! I'm Remi, your reminiscence therapy companion. I'm here to help you explore your memories and experiences. How are you feeling today?`,
    role: 'assistant',
    timestamp: new Date()
  };
  
  const { messages, isLoading, sendMessage } = useChatCompletion([initialMessage]);
  
  useEffect(() => {
    if (inputMode === InputMode.TEXT && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputMode]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && !isLoading && !isPaused) {
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
  
  const toggleInputMode = () => {
    setInputMode(prevMode => 
      prevMode === InputMode.TEXT ? InputMode.VOICE : InputMode.TEXT
    );
  };
  
  const handleSpeechInput = async (transcription: string) => {
    if (transcription.trim() && !isPaused) {
      await sendMessage(transcription, InputMode.VOICE);
    }
  };
  
  const exitSession = () => {
    navigate('/');
  };

  const endConversation = () => {
    toast({
      title: "Conversation Ended",
      description: "Your therapy session has been completed.",
    });
    navigate('/');
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
    toast({
      title: isPaused ? "Conversation Resumed" : "Conversation Paused",
      description: isPaused ? "You can continue your therapy session." : "Your therapy session is temporarily paused.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-therapy-light page-transition">
      <header className="py-4 px-6 flex items-center justify-between border-b bg-white">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={exitSession}
            className="mr-3"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-medium text-therapy-text">Therapy Session with Remi</h1>
            {participantId && (
              <p className="text-sm text-gray-500">Participant: {participantId}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            className={isPaused ? "bg-amber-100" : ""}
          >
            <Pause className="h-4 w-4 mr-2" />
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={endConversation}
            className="text-red-500 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            End
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden p-4">
        <Card className="flex flex-col h-full glass-panel">
          <CardHeader className="text-center py-3 border-b">
            <p className="text-sm text-gray-500">
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
                  inputMode={inputMode}
                />
              ))}
              
              {isLoading && (
                <div className="flex space-x-1 ml-4 mb-4">
                  <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="p-4 border-t">
            {inputMode === InputMode.TEXT ? (
              <form onSubmit={handleSubmit} className="flex w-full space-x-2">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={isPaused ? "Conversation is paused..." : "Type your message here..."}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 input-focus-ring h-12 text-base"
                  disabled={isLoading || isPaused}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!messageInput.trim() || isLoading || isPaused}
                  className="h-12 w-12 btn-transition rounded-full"
                >
                  <Send className="h-5 w-5" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleInputMode}
                  disabled={isPaused}
                  className="h-12 w-12 btn-transition rounded-full"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </form>
            ) : (
              <div className="flex flex-col w-full items-center">
                {isPaused ? (
                  <p className="text-amber-600 mb-4">Conversation is paused. Resume to continue.</p>
                ) : (
                  <AudioRecorder 
                    onAudioComplete={handleSpeechInput} 
                    isAssistantResponding={isLoading} 
                  />
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleInputMode}
                  disabled={isPaused}
                  className="mt-4 btn-transition"
                >
                  <Keyboard className="h-4 w-4 mr-2" /> Switch to Text
                </Button>
              </div>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
};

export default Chat;
