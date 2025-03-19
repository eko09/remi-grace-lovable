
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
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  // Initialize speech recognition on component mount
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join(' ');
        
        setTranscription(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: "Speech Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive"
        });
        stopRecording();
      };
    } else {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Please try a different browser.",
        variant: "destructive"
      });
    }

    // Request microphone access
    const requestMicrophoneAccess = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
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
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      stopRecording();
    };
  }, [toast]);

  // Start recording
  const startRecording = () => {
    if (recognitionRef.current) {
      setTranscription('');
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(true);
      
      // Short delay to ensure final transcription is captured
      setTimeout(() => {
        setIsTranscribing(false);
      }, 500);
    }
  };

  // Send the transcribed text
  const sendTranscription = () => {
    if (transcription && transcription.trim()) {
      onAudioComplete(transcription.trim());
      setTranscription('');
    } else {
      toast({
        title: "No Speech Detected",
        description: "Please speak clearly and try again.",
      });
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
              disabled={isAssistantResponding}
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
          Processing your message...
        </p>
      )}
    </div>
  );
};

export default AudioRecorder;
