
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
  const [saving, setSaving] = useState(false);

  const getMoodLabel = (value: number): string => {
    if (value < 20) return "Very Low";
    if (value < 40) return "Low";
    if (value < 60) return "Neutral";
    if (value < 80) return "Good";
    return "Excellent";
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
      const { error } = await supabase
        .from('mood_assessments')
        .insert({
          participant_id: participantId,
          session_id: sessionId,
          mood_rating: moodRating,
          assessment_type: assessmentType,
          emoji: getMoodEmoji(moodRating),
          mood_label: getMoodLabel(moodRating)
        });
      
      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error saving mood assessment:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-playfair">{title}</CardTitle>
        <p className="text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="space-y-6">
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
              Your mood: {getMoodLabel(moodRating)} ({moodRating}/100)
            </p>
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
