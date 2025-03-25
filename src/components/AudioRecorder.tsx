
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  
  // Audio visualization
  const visualizerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      // Clean up recording if component unmounts while recording
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
      
      // Clean up audio visualization
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
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
      
      // Initialize audio visualization
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (audioContextRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        
        // Start visualization
        visualizeAudio();
      }
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up recording events
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Stop visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        // Combine chunks into a single blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        if (audioBlob.size > 0) {
          try {
            setIsProcessing(true);
            // Send audio to backend for transcription
            const audioBase64 = await blobToBase64(audioBlob);
            
            console.log('Sending audio for transcription, size:', audioBase64.length);
            
            // Use Supabase edge function to transcribe
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: audioBase64 }
            });
            
            if (error) {
              console.error('Error calling transcription function:', error);
              toast({
                title: "Transcription Error",
                description: "Could not convert your speech to text. Please try again.",
                variant: "default"
              });
              setIsProcessing(false);
              return;
            }
            
            if (data && data.text) {
              console.log('Received transcription:', data.text);
              setTranscript(data.text);
              onAudioComplete(data.text);
            } else {
              console.error('Transcription failed, response:', data);
              toast({
                title: "Transcription Error",
                description: "Could not convert your speech to text. Please try again and speak clearly.",
                variant: "default"
              });
            }
          } catch (error) {
            console.error('Error processing audio:', error);
            toast({
              title: "Processing Error",
              description: "There was a problem processing your audio. Please try again.",
              variant: "default"
            });
          } finally {
            setIsProcessing(false);
          }
        } else {
          toast({
            title: "No Audio Detected",
            description: "No audio was recorded. Please try again and speak clearly.",
            variant: "default"
          });
          setIsProcessing(false);
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
        variant: "default"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // Audio visualization function
  const visualizeAudio = () => {
    if (!analyserRef.current || !visualizerRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      if (!analyserRef.current || !visualizerRef.current) return;
      
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      
      // Update visualizer size based on volume
      const scale = 1 + (average / 255) * 0.5; // Scale between 1 and 1.5x
      visualizerRef.current.style.transform = `scale(${scale})`;
      
      // Update color intensity based on volume
      const intensity = Math.min(255, average * 2);
      visualizerRef.current.style.backgroundColor = `rgba(255, ${255 - intensity}, ${255 - intensity}, 1)`;
    };
    
    draw();
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

  return (
    <div className="w-full flex justify-center flex-col items-center">
      <div className="relative inline-block">
        <div 
          ref={visualizerRef}
          className={`absolute inset-0 rounded-full bg-red-100 transition-transform ${isRecording ? 'opacity-100' : 'opacity-0'}`}
          style={{ transform: 'scale(1)', zIndex: -1 }}
        />
        <Button
          type="button"
          size="icon"
          disabled={isAssistantResponding || isProcessing}
          className={`h-16 w-16 rounded-full transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : isProcessing
                ? 'bg-gray-400'
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
          ) : isProcessing ? (
            <span className="loading">...</span>
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
        <span className="text-xs text-gray-500 pt-2 block text-center">
          {isRecording ? 'Release to stop' : isProcessing ? 'Processing...' : 'Hold to speak'}
        </span>
      </div>
      
      {transcript && (
        <div className="mt-4 px-4 py-2 bg-gray-100 rounded-lg w-full max-w-sm">
          <p className="text-sm">{transcript}</p>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
