
import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch the previous conversation for a participant
 * @param participantId - The ID of the participant
 * @returns The transcript of the previous conversation or null if none exists
 */
export async function fetchPreviousConversation(participantId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('transcript')
      .eq('participant_id', participantId)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    return data.length > 0 ? data[0].transcript : null;
  } catch (error) {
    console.error('Error fetching previous conversation:', error);
    return null;
  }
}

/**
 * Save a conversation to the database
 * @param participantId - The ID of the participant
 * @param summary - A summary of the conversation
 * @param transcript - The full transcript of the conversation
 * @param duration - The duration of the conversation in seconds
 * @param turns - The number of message exchanges in the conversation
 * @param mode - The mode of the conversation (text/voice)
 * @returns An object containing the data (including the session ID) and any error
 */
export async function saveConversation(
  participantId: string | null, 
  summary: string, 
  transcript: string, 
  duration: number, 
  turns: number,
  mode: string
) {
  if (!participantId) {
    console.error('Cannot save conversation: Missing participant ID');
    return { data: null, error: new Error('Missing participant ID') };
  }

  try {
    // First, ensure participant exists in the database
    const { error: participantError } = await supabase
      .from('participants')
      .upsert([{ participant_id: participantId }], { onConflict: 'participant_id' });
    
    if (participantError) throw participantError;
    
    // Then save the conversation with the mode
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        participant_id: participantId,
        summary: summary.replace(/<[^>]*>?/gm, ''), // Strip HTML tags for database storage
        transcript,
        duration,
        turns,
        timestamp: new Date().toISOString(),
        mode
      }])
      .select('id')
      .single();
    
    if (error) throw error;
    console.log('Conversation saved successfully with ID:', data?.id);
    return { data, error: null };
  } catch (error) {
    console.error('Error saving conversation:', error);
    return { data: null, error };
  }
}

/**
 * Get the number of sessions for a participant
 * @param participantId - The ID of the participant
 * @returns The number of sessions for the participant
 */
export async function getSessionCount(participantId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_id', participantId);
    
    if (error) throw error;
    
    return data?.length || 0;
  } catch (error) {
    console.error('Error getting session count:', error);
    return 0;
  }
}
