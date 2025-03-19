
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

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
    <div className="flex items-center justify-center min-h-screen p-4 bg-therapy-light page-transition">
      <Card className="w-full max-w-md glass-panel animate-slideUp">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-medium text-center text-therapy-text">Welcome to Remi</CardTitle>
          <CardDescription className="text-center text-base text-gray-600">
            Your personal reminiscence therapy companion
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="participantId" className="text-sm font-medium text-gray-700 senior-friendly">
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
                  className={`h-12 text-lg input-focus-ring ${!isValid ? 'border-red-500' : ''}`}
                  autoComplete="off"
                />
              </div>
              {!isValid && (
                <p className="text-sm text-red-500 mt-1">
                  Please enter your initials followed by the last two digits of your birth year (e.g., JD 55)
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Your ID should be your initials followed by the last two digits of your birth year
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 text-lg font-medium btn-transition"
            >
              Begin Your Session
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500 text-center max-w-xs">
            Remi is here to listen and help you explore your memories in a supportive environment
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ParticipantForm;
