
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
          name: voice || 'en-US-Wavenet-F', // Default to a female WaveNet voice
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0.0,          // Normal pitch
          speakingRate: 0.95   // Slightly slower than normal for better clarity
        }
      }),
    });

    if (!response.ok) {
      console.error('Google API error:', await response.text());
      throw new Error('Error generating speech');
    }

    const data = await response.json();
    
    return new Response(
      JSON.stringify({ 
        audioContent: data.audioContent 
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
