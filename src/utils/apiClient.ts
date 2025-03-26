
import { Message } from './types';
import { supabase } from "@/integrations/supabase/client";
import { selectSystemPrompt } from './prompts';

// API configuration for OpenAI
const API_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-4o';

/**
 * Get the OpenAI API key from Supabase
 * @returns The API key or null if there was an error
 */
async function getOpenAIKey(): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-openai-key');
    if (error) throw error;
    return data.key;
  } catch (error) {
    console.error('Error getting OpenAI key:', error);
    return null;
  }
}

/**
 * Get a chat completion from OpenAI
 * @param messages - The messages to send to the API
 * @returns The response content as a string
 */
export async function getChatCompletion(messages: Message[]): Promise<string> {
  try {
    // Get API key from Supabase
    const API_KEY = await getOpenAIKey();
    
    if (!API_KEY) {
      throw new Error('Failed to retrieve OpenAI API key');
    }

    // Extract participant ID from messages if available
    const participantIdMessage = messages.find(msg => 
      msg.role === 'user' && 
      msg.content.match(/[A-Z]{2}\d{2}/i)
    );
    
    let participantId = '';
    if (participantIdMessage) {
      const match = participantIdMessage.content.match(/[A-Z]{2}\d{2}/i);
      if (match) {
        participantId = match[0];
      }
    }
    
    // Get session count for the participant if we have an ID
    let sessionCount = 0;
    if (participantId) {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('id')
          .eq('participant_id', participantId);
        
        if (error) throw error;
        sessionCount = data?.length || 0;
        console.log(`Session count for ${participantId}: ${sessionCount}`);
      } catch (error) {
        console.error('Error getting session count:', error);
      }
    }
    
    // Select appropriate system prompt
    const systemPrompt = selectSystemPrompt(participantId, sessionCount);

    // Format the messages for the API
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({ 
        role: msg.role, 
        content: msg.content
      }))
    ];

    // Make the API request
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    // Parse the response
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API error:', data);
      throw new Error(data.error?.message || 'Failed to get response from AI');
    }

    return data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
  } catch (error) {
    console.error('Error getting chat completion:', error);
    return 'I apologize, but there was an error processing your request. Please try again later.';
  }
}
