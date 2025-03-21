
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ParticipantForm: React.FC = () => {
  const [participantId, setParticipantId] = useState('');
  const [isValid, setIsValid] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Validate participant ID format (initials + last two digits of birth year)
  const validateParticipantId = (id: string) => {
    // Basic validation: at least 2 letters followed by 2 digits
    const regex = /^[A-Za-z]{2,}\s?[0-9]{2}$/;
    return regex.test(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateParticipantId(participantId)) {
      // Store participant ID in session storage
      sessionStorage.setItem('participantId', participantId);
      
      // Navigate to chat page with smooth transition
      navigate('/chat');
      
      toast({
        title: "Welcome to Remi",
        description: "Your therapy session is ready to begin.",
      });
    } else {
      setIsValid(false);
      toast({
        title: "Invalid ID Format",
        description: "Please enter your initials followed by the last two digits of your birth year (e.g., JD 55)",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-therapy-beige page-transition">
      <Card className="w-full max-w-md glass-panel animate-slideUp">
        <CardHeader className="space-y-4">
          <div className="flex justify-center mb-2">
            <Avatar className="h-32 w-32">
              <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi" />
              <AvatarFallback>RM</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl font-medium text-center text-therapy-text font-playfair">Welcome to Remi</CardTitle>
          <CardDescription className="text-center text-base text-gray-600">
            Your reminiscence therapy companion
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="participantId" className="text-sm font-medium text-gray-700 senior-friendly font-lora">
                Enter Your Participant ID
              </label>
              <div className="relative">
                <Input
                  id="participantId"
                  type="text"
                  value={participantId}
                  onChange={(e) => {
                    setParticipantId(e.target.value);
                    setIsValid(true);
                  }}
                  placeholder="Example: JD 55"
                  className={`h-12 text-lg input-focus-ring ${!isValid ? 'border-red-500' : ''} font-lora`}
                  autoComplete="off"
                />
              </div>
              {!isValid && (
                <p className="text-sm text-red-500 mt-1 font-lora">
                  Please enter your initials followed by the last two digits of your birth year (e.g., JD 55)
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1 font-lora">
                Your ID should be your initials followed by the last two digits of your birth year
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium btn-transition bg-therapy-blue hover:bg-therapy-blue-dark text-white font-lora"
            >
              Begin Your Session
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParticipantForm;
