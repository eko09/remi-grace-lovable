
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Google Cloud authentication
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
    
    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key is not configured');
    }

    console.log('Google TTS request received:', { textLength: text.length, voice });

    // Select a high-quality voice if not specified
    const selectedVoice = voice || 'en-US-Wavenet-F';
    
    // Define available voices for fallback
    const wavenetVoices = [
      'en-US-Wavenet-F', // Default female voice
      'en-US-Wavenet-C', // Another female voice
      'en-US-Wavenet-E', // Another female voice
      'en-US-Wavenet-D', // Male voice (fallback)
      'en-US-Wavenet-A', // Male voice (last resort)
    ];
    
    // Prepare request to Google Cloud TTS API
    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          text: text
        },
        voice: {
          languageCode: 'en-US',
          name: selectedVoice,
          ssmlGender: selectedVoice.endsWith('F') || selectedVoice.endsWith('C') || selectedVoice.endsWith('E') ? 'FEMALE' : 'MALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0.0,          // Normal pitch
          speakingRate: 0.92,  // Slightly slower than normal for better clarity
          volumeGainDb: 1.0,   // Slightly louder
          effectsProfileId: ['small-bluetooth-speaker-class-device'] // Optimize for mobile speakers
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', errorText);
      
      // Try fallback voices if the primary voice fails
      for (const fallbackVoice of wavenetVoices) {
        if (fallbackVoice === selectedVoice) continue; // Skip the one that just failed
        
        console.log(`Trying fallback voice: ${fallbackVoice}`);
        
        const fallbackResponse = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: {
              text: text
            },
            voice: {
              languageCode: 'en-US',
              name: fallbackVoice,
              ssmlGender: fallbackVoice.endsWith('F') || fallbackVoice.endsWith('C') || fallbackVoice.endsWith('E') ? 'FEMALE' : 'MALE'
            },
            audioConfig: {
              audioEncoding: 'MP3',
              pitch: 0.0,          
              speakingRate: 0.92,  
              volumeGainDb: 1.0,   
              effectsProfileId: ['small-bluetooth-speaker-class-device']
            }
          }),
        });
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          console.log('Fallback voice succeeded');
          
          return new Response(
            JSON.stringify({ 
              audioContent: fallbackData.audioContent,
              voice: fallbackVoice
            }),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json' 
              }
            }
          );
        }
      }
      
      throw new Error('All TTS voice options failed');
    }

    const data = await response.json();
    console.log('Google TTS response received successfully');
    
    return new Response(
      JSON.stringify({ 
        audioContent: data.audioContent,
        voice: selectedVoice
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );

  } catch (error) {
    console.error('Error in Google TTS function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});
