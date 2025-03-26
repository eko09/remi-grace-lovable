
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MoodSlider from '@/components/MoodSlider';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const PreSessionMood: React.FC = () => {
  const [participantId, setParticipantId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedId = sessionStorage.getItem('participantId');
    if (!storedId) {
      navigate('/');
      return;
    }
    setParticipantId(storedId);
  }, [navigate]);

  const handleComplete = () => {
    // Navigate to the selected conversation mode
    const mode = sessionStorage.getItem('conversationMode');
    if (mode === 'voice') {
      navigate('/voice-chat');
    } else {
      navigate('/chat');
    }
  };

  if (!participantId) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-therapy-beige-light p-4 sm:p-6">
      <div className="mb-6">
        <Avatar className="h-16 w-16 mx-auto mb-2">
          <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi Logo" />
          <AvatarFallback>RM</AvatarFallback>
        </Avatar>
        <h1 className="text-2xl text-center font-playfair text-therapy-text">
          Pre-Session Check
        </h1>
      </div>
      
      <MoodSlider 
        participantId={participantId}
        assessmentType="pre"
        onComplete={handleComplete}
        title="Before we begin..."
        subtitle="How are you feeling right now?"
      />
    </div>
  );
};

export default PreSessionMood;
