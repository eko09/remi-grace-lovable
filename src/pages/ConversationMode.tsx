
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Mic } from 'lucide-react';

const ConversationMode: React.FC = () => {
  const navigate = useNavigate();
  const participantId = sessionStorage.getItem('participantId');

  // Redirect to home if no participant ID is found
  React.useEffect(() => {
    if (!participantId) {
      navigate('/');
    }
  }, [participantId, navigate]);

  const handleModeSelection = (mode: 'text' | 'voice') => {
    navigate(mode === 'text' ? '/chat' : '/voice-chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-therapy-beige-light p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <img 
              src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" 
              alt="Remi Logo" 
              className="h-16 w-16 rounded-full"
            />
          </div>
          <CardTitle className="text-2xl font-playfair">Select Conversation Mode</CardTitle>
          <p className="text-sm text-gray-500">Choose how you'd like to interact with Remi</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={() => handleModeSelection('text')}
            className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-[#3399FF] hover:bg-[#2277DD]"
          >
            <MessageSquare className="h-8 w-8" />
            <span className="text-lg">Text Chat</span>
          </Button>
          
          <Button 
            onClick={() => handleModeSelection('voice')}
            className="w-full h-24 flex flex-col items-center justify-center space-y-2 bg-[#3399FF] hover:bg-[#2277DD]"
          >
            <Mic className="h-8 w-8" />
            <span className="text-lg">Voice Chat</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationMode;
