
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MessageSquare } from 'lucide-react';

const ConversationMode: React.FC = () => {
  const navigate = useNavigate();
  const participantId = sessionStorage.getItem('participantId');
  
  // Redirect to home if no participant ID
  React.useEffect(() => {
    if (!participantId) {
      navigate('/');
    }
  }, [participantId, navigate]);

  const handleSelectMode = (mode: 'chat' | 'voice') => {
    sessionStorage.setItem('conversationMode', mode);
    navigate(mode === 'chat' ? '/chat' : '/voice-chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-therapy-beige-light p-4">
      <Card className="w-full max-w-md glass-panel">
        <CardHeader className="text-center pb-2">
          <h1 className="text-2xl font-playfair text-therapy-text">Choose Conversation Mode</h1>
          <p className="text-sm text-gray-500">How would you like to talk with Remi today?</p>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <Button 
            onClick={() => handleSelectMode('chat')}
            className="w-full py-8 text-lg justify-start space-x-4 bg-white hover:bg-gray-50 text-therapy-text border border-gray-200"
            variant="outline"
          >
            <MessageSquare size={24} className="text-[#3399FF]" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Text Chat</span>
              <span className="text-sm text-gray-500">Type messages to communicate with Remi</span>
            </div>
          </Button>
          
          <Button 
            onClick={() => handleSelectMode('voice')}
            className="w-full py-8 text-lg justify-start space-x-4 bg-white hover:bg-gray-50 text-therapy-text border border-gray-200"
            variant="outline"
          >
            <Mic size={24} className="text-[#3399FF]" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Voice Chat</span>
              <span className="text-sm text-gray-500">Speak and listen to Remi through voice</span>
            </div>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversationMode;
