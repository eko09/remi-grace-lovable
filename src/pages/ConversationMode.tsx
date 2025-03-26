
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const ConversationMode: React.FC = () => {
  const navigate = useNavigate();
  
  const handleModeSelect = (mode: 'text' | 'voice') => {
    // Store the selected mode in session storage
    sessionStorage.setItem('conversationMode', mode);
    
    // Navigate to the pre-session mood assessment page
    navigate('/pre-session-mood');
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-therapy-beige-light p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Avatar className="h-16 w-16 mx-auto mb-3">
            <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi Logo" />
            <AvatarFallback>RM</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl sm:text-3xl font-playfair text-therapy-text">
            Choose a Conversation Mode
          </h1>
          <p className="text-gray-600 mt-2">
            Select how you'd like to interact with Remi
          </p>
        </div>
        
        <div className="space-y-4">
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-[#3399FF]"
            onClick={() => handleModeSelect('text')}
          >
            <CardContent className="flex items-center p-5">
              <div className="bg-[#3399FF]/10 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3399FF]">
                  <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/>
                  <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Text Chat</h3>
                <p className="text-gray-500 text-sm">Type messages to communicate with Remi</p>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-[#3399FF]"
            onClick={() => handleModeSelect('voice')}
          >
            <CardContent className="flex items-center p-5">
              <div className="bg-[#3399FF]/10 p-3 rounded-full mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3399FF]">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Voice Chat</h3>
                <p className="text-gray-500 text-sm">Speak and listen for a natural conversation</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConversationMode;
