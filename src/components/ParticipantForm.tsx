
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ParticipantFormProps {
  onSubmit?: (id: string) => void;
}

const ParticipantForm: React.FC<ParticipantFormProps> = ({ onSubmit }) => {
  const [participantId, setParticipantId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!participantId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a participant ID",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Check if participant exists in Supabase, if not create a new record
      const { error } = await supabase
        .from('participants')
        .upsert([{ participant_id: participantId.trim() }], { onConflict: 'participant_id' });
      
      if (error) throw error;
      
      // Store the ID in session storage
      sessionStorage.setItem('participantId', participantId.trim());
      
      // Call the onSubmit callback if provided
      if (onSubmit) {
        onSubmit(participantId.trim());
      } else {
        // Navigate to conversation mode selection page
        navigate('/conversation-mode');
      }
    } catch (error) {
      console.error('Error saving participant:', error);
      toast({
        title: "Error",
        description: "Failed to save participant information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <CardTitle className="text-2xl font-playfair">Welcome to Remi</CardTitle>
          <p className="text-sm text-gray-500">Your reminiscence therapy companion</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="participantId">Participant ID</Label>
              <Input
                id="participantId"
                placeholder="Enter your participant ID"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                className="input-focus-ring"
              />
              <p className="text-xs text-gray-500 mt-1">
                Example: JD56 (Your initials + last two digits of birth year)
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-[#3399FF] hover:bg-[#2277DD]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Starting..." : "Start Session"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ParticipantForm;
