
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface MoodSliderProps {
  participantId: string;
  sessionId?: string;
  assessmentType: 'pre' | 'post';
  onComplete: () => void;
  title?: string;
  subtitle?: string;
}

const MoodSlider: React.FC<MoodSliderProps> = ({
  participantId,
  sessionId,
  assessmentType,
  onComplete,
  title = "How are you feeling today?",
  subtitle = "Slide the bar to indicate your current mood"
}) => {
  const [moodRating, setMoodRating] = useState<number>(50);
  const [trustRating, setTrustRating] = useState<number>(50);
  const [attitudeRating, setAttitudeRating] = useState<number>(50);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const getMoodLabel = (value: number): string => {
    if (value < 20) return "Very Low";
    if (value < 40) return "Low";
    if (value < 60) return "Neutral";
    if (value < 80) return "Good";
    return "Excellent";
  };

  const getTrustLabel = (value: number): string => {
    if (value < 20) return "Strongly Disagree";
    if (value < 40) return "Disagree";
    if (value < 60) return "Neutral";
    if (value < 80) return "Agree";
    return "Strongly Agree";
  };

  const getAttitudeLabel = (value: number): string => {
    if (value < 20) return "Harmful";
    if (value < 40) return "Somewhat Harmful";
    if (value < 60) return "Neutral";
    if (value < 80) return "Somewhat Beneficial";
    return "Beneficial";
  };

  const getMoodEmoji = (value: number): string => {
    if (value < 20) return "😢";
    if (value < 40) return "😕";
    if (value < 60) return "😐";
    if (value < 80) return "🙂";
    return "😄";
  };

  const handleSaveMood = async () => {
    if (!participantId) return;
    
    setSaving(true);
    try {
      // Create a base record with required fields
      const moodData = {
        participant_id: participantId,
        session_id: sessionId,
        mood_rating: moodRating,
        assessment_type: assessmentType,
        emoji: getMoodEmoji(moodRating),
        mood_label: getMoodLabel(moodRating)
      };
      
      // Only attempt to save the trust and attitude ratings if the columns exist
      try {
        await supabase.from('mood_assessments').select('trust_rating').limit(1);
        // If we got here, the column exists
        Object.assign(moodData, {
          trust_rating: trustRating,
          trust_label: getTrustLabel(trustRating)
        });
      } catch (err) {
        console.log('Trust rating columns may not exist yet:', err);
      }
      
      try {
        await supabase.from('mood_assessments').select('attitude_rating').limit(1);
        // If we got here, the column exists
        Object.assign(moodData, {
          attitude_rating: attitudeRating,
          attitude_label: getAttitudeLabel(attitudeRating)
        });
      } catch (err) {
        console.log('Attitude rating columns may not exist yet:', err);
      }
      
      const { error } = await supabase
        .from('mood_assessments')
        .insert(moodData);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Your mood assessment has been recorded.",
        variant: "default"
      });
      
      onComplete();
    } catch (error) {
      console.error('Error saving mood assessment:', error);
      toast({
        title: "Error",
        description: "Failed to save mood. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-playfair">{title}</CardTitle>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mood Slider */}
        <div>
          <div className="text-center text-6xl mb-4">
            {getMoodEmoji(moodRating)}
          </div>
          <div className="space-y-4">
            <Slider
              value={[moodRating]}
              min={0}
              max={100}
              step={1}
              onValueChange={(values) => setMoodRating(values[0])}
              className="my-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Very Low</span>
              <span>Neutral</span>
              <span>Excellent</span>
            </div>
            <div className="text-center mt-4">
              <p className="text-lg font-medium">
                {getMoodLabel(moodRating)} ({moodRating}%)
              </p>
            </div>
          </div>
        </div>

        {/* Trust Slider */}
        <div>
          <div className="text-center mb-4">
            <p className="text-lg font-medium">I am confident in AI Therapy. I feel that it will work well.</p>
          </div>
          <div className="space-y-4">
            <Slider
              value={[trustRating]}
              min={0}
              max={100}
              step={1}
              onValueChange={(values) => setTrustRating(values[0])}
              className="my-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Strongly Disagree</span>
              <span>Neutral</span>
              <span>Strongly Agree</span>
            </div>
          </div>
        </div>

        {/* Attitude Slider */}
        <div>
          <div className="text-center mb-4">
            <p className="text-lg font-medium">All things considered, I think using AI Therapy for emotional well-being is:</p>
          </div>
          <div className="space-y-4">
            <Slider
              value={[attitudeRating]}
              min={0}
              max={100}
              step={1}
              onValueChange={(values) => setAttitudeRating(values[0])}
              className="my-4"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Harmful</span>
              <span>Neutral</span>
              <span>Beneficial</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveMood} 
          className="w-full bg-[#3399FF] hover:bg-[#2277DD]"
          disabled={saving}
        >
          {saving ? "Saving..." : "Continue"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MoodSlider;
