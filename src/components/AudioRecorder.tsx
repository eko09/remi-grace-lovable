
import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

interface AudioRecorderProps {
  onAudioComplete: (text: string) => void;
  isAssistantResponding: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioComplete, isAssistantResponding }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  // Request microphone access on component mount
  useEffect(() => {
    const requestMicrophoneAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };
        
        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setAudioBlob(audioBlob);
          audioChunksRef.current = [];
          
          // Mock transcription - in a real app, you'd send this to a speech-to-text API
          mockTranscription(audioBlob);
        };
      } catch (error) {
        console.error('Error accessing microphone:', error);
        toast({
          title: "Microphone Access Error",
          description: "Unable to access your microphone. Please check your browser permissions.",
          variant: "destructive"
        });
      }
    };
    
    requestMicrophoneAccess();
    
    // Cleanup function
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [toast]);

  // Start recording
  const startRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
      setTranscription('');
      setAudioBlob(null);
      setIsRecording(true);
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setIsRecording(false);
      mediaRecorderRef.current.stop();
    }
  };

  // Mock transcription - in a real app, you'd use a real speech-to-text API
  const mockTranscription = (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // This is where you would normally call a speech-to-text API
      // For demo purposes, we'll use a placeholder message
      const mockText = "This is where your spoken message would appear. In a real app, your voice would be converted to text.";
      setTranscription(mockText);
      setIsTranscribing(false);
    }, 1000);
  };

  // Send the transcribed text
  const sendTranscription = () => {
    if (transcription) {
      onAudioComplete(transcription);
      setTranscription('');
      setAudioBlob(null);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {transcription && (
        <div className="w-full p-3 mb-3 bg-therapy-gray rounded-lg text-therapy-text">
          <p className="text-sm">{transcription}</p>
          <div className="flex justify-end mt-2">
            <Button 
              onClick={sendTranscription}
              className="btn-transition"
              size="sm"
            >
              <Send className="h-4 w-4 mr-1" /> Send
            </Button>
          </div>
        </div>
      )}
      
      <Button
        type="button"
        size="lg"
        disabled={isAssistantResponding || isTranscribing}
        onClick={isRecording ? stopRecording : startRecording}
        variant={isRecording ? "destructive" : "default"}
        className={`rounded-full h-16 w-16 flex items-center justify-center ${
          isRecording ? 'animate-pulse' : 'btn-transition'
        }`}
      >
        {isRecording ? 
          <MicOff className="h-8 w-8" /> : 
          <Mic className="h-8 w-8" />
        }
      </Button>
      
      {isRecording && (
        <p className="text-sm text-therapy-text mt-2">
          Release to stop recording...
        </p>
      )}
      
      {isTranscribing && (
        <p className="text-sm text-therapy-text mt-2 animate-pulse">
          Transcribing your message...
        </p>
      )}
    </div>
  );
};

export default AudioRecorder;
