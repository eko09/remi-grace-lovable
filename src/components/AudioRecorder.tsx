
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface AudioRecorderProps {
  onAudioComplete: (transcript: string) => void;
  isAssistantResponding: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onAudioComplete, 
  isAssistantResponding 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // Clean up recording if component unmounts while recording
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    // Reset previous recordings
    audioChunksRef.current = [];
    setTranscript('');
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up recording events
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Combine chunks into a single blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size > 0) {
          try {
            // Send audio to backend for transcription
            const audioBase64 = await blobToBase64(audioBlob);
            const response = await sendAudioForTranscription(audioBase64);
            
            if (response && response.text) {
              setTranscript(response.text);
              onAudioComplete(response.text);
            } else {
              toast({
                title: "Transcription Error",
                description: "Could not convert your speech to text. Please try again.",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('Error processing audio:', error);
            toast({
              title: "Processing Error",
              description: "There was a problem processing your audio. Please try again.",
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "No Audio Detected",
            description: "No audio was recorded. Please try again and speak clearly.",
            variant: "default"
          });
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Access Error",
        description: "Please allow microphone access to use voice chat.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Send audio to backend for transcription
  const sendAudioForTranscription = async (audioBase64: string): Promise<{ text: string } | null> => {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audio: audioBase64,
          model: 'whisper-1',
          language: 'en'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return null;
    }
  };

  return (
    <div className="w-full flex justify-center">
      <div className="relative inline-block">
        <Button
          type="button"
          size="icon"
          disabled={isAssistantResponding}
          className={`h-16 w-16 rounded-full transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-[#3399FF] hover:bg-[#2277DD]'
          }`}
          onTouchStart={startRecording}
          onMouseDown={startRecording}
          onTouchEnd={stopRecording}
          onMouseUp={stopRecording}
          onMouseLeave={isRecording ? stopRecording : undefined}
        >
          {isRecording ? (
            <Square className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
        <span className="text-xs text-gray-500 pt-2 block text-center">
          {isRecording ? 'Release to stop' : 'Hold to speak'}
        </span>
      </div>
    </div>
  );
};

export default AudioRecorder;
