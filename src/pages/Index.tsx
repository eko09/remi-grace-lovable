
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticipantForm from '@/components/ParticipantForm';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Index: React.FC = () => {
  const [participantId, setParticipantId] = useState<string>('');
  const navigate = useNavigate();
  
  // Check if participant ID is already stored
  useEffect(() => {
    const storedId = sessionStorage.getItem('participantId');
    if (storedId) {
      setParticipantId(storedId);
    }
  }, []);
  
  const handleSubmit = (id: string) => {
    // Store the ID in session storage
    sessionStorage.setItem('participantId', id);
    setParticipantId(id);
  };
  
  const handleStartChat = () => {
    navigate('/conversation-mode');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-therapy-beige-light p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi Logo" />
              <AvatarFallback>RM</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl sm:text-3xl text-center font-playfair text-therapy-text">
              Welcome to Remi
            </h1>
            <p className="text-gray-600 text-center mt-2">
              Your reminiscence therapy companion
            </p>
          </div>
          
          {!participantId ? (
            <>
              <div className="mb-8">
                <div className="text-sm text-gray-600 mb-2">
                  <p>Please enter your participant ID to get started.</p>
                  <p className="mt-2 italic">
                    Your participant ID consists of your initials followed by the last two digits of your birth year.
                  </p>
                  <p className="text-gray-500 text-xs mt-2">
                    Example: For Jane Smith born in 1945, the ID would be "JS45"
                  </p>
                </div>
                <ParticipantForm onSubmit={handleSubmit} />
              </div>
            </>
          ) : (
            <div className="text-center mb-8">
              <p className="text-lg text-therapy-text mb-4">
                Welcome back, <span className="font-semibold">{participantId}</span>!
              </p>
              <p className="text-gray-600 mb-6">
                Click the button below to start your conversation with Remi.
              </p>
              <Button 
                onClick={handleStartChat}
                className="w-full bg-[#3399FF] hover:bg-[#2277DD] text-white"
              >
                Start Conversation
              </Button>
            </div>
          )}
          
          {/* Note about the app */}
          <div className="mt-6 text-sm text-gray-500 border-t border-gray-200 pt-4">
            <p>
              Remi helps older adults explore meaningful memories through guided conversation. 
              All information is kept confidential and used only for research purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
