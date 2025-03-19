import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Send, Mic, Keyboard, ArrowLeft } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import MessageBubble from '@/components/MessageBubble';
import AudioRecorder from '@/components/AudioRecorder';
import { useChatCompletion } from '@/hooks/useChatCompletion';
import { InputMode, Message } from '@/utils/types';

const Chat: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>(InputMode.TEXT);
  const [messageInput, setMessageInput] = useState('');
  const [participantId, setParticipantId] = useState<string | null>(null);
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
    if (messageInput.trim() && !isLoading) {
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
    if (transcription.trim()) {
      await sendMessage(transcription, InputMode.VOICE);
    }
  };
  
  const exitSession = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen bg-therapy-light page-transition">
      <header className="py-4 px-6 flex items-center border-b bg-white">
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
                  placeholder="Type your message here..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 input-focus-ring h-12 text-base"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!messageInput.trim() || isLoading}
                  className="h-12 w-12 btn-transition rounded-full"
                >
                  <Send className="h-5 w-5" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={toggleInputMode}
                  className="h-12 w-12 btn-transition rounded-full"
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </form>
            ) : (
              <div className="flex flex-col w-full items-center">
                <AudioRecorder 
                  onAudioComplete={handleSpeechInput} 
                  isAssistantResponding={isLoading} 
                />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleInputMode}
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
