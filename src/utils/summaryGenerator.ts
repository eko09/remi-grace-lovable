
import { Message } from './types';

// Define the summary generator prompt
const SUMMARY_PROMPT = `You are a helpful psychiatrist's assistant that generates concise summaries of therapy sessions. Create summary on:
- Session # recurring for the ID
- Key topics discussed
- Main emotions expressed
- Important insights or breakthroughs
- Any action items or goals set
- Conversation duration, number of turns
Format the summary with clear sections and bullet points for better readability.`;

/**
 * Generates a session summary from conversation messages
 * @param messages - Array of messages from the conversation
 * @returns Formatted HTML summary of the session
 */
export function generateSessionSummary(messages: Message[]): string {
  // Extract conversation content for analysis
  const userMessages = messages.filter(msg => msg.role === 'user');
  const assistantMessages = messages.filter(msg => msg.role === 'assistant');
  
  // Calculate session duration
  const firstMessageTime = messages[0]?.timestamp || new Date();
  const lastMessageTime = messages[messages.length - 1]?.timestamp || new Date();
  const sessionDurationMs = lastMessageTime.getTime() - firstMessageTime.getTime();
  const sessionDurationMinutes = Math.round(sessionDurationMs / (1000 * 60));
  
  // Filter out system messages and the initial greeting
  const conversationMessages = messages.filter(msg => 
    msg.role === 'user' || (msg.role === 'assistant' && msg.id !== '0')
  );
  
  if (conversationMessages.length === 0) {
    return "No conversation took place in this session.";
  }
  
  // Simple topic detection based on keywords
  const allContent = userMessages.map(msg => msg.content).join(' ').toLowerCase();
  
  // Simple topic detection based on keywords
  const topics = [];
  if (allContent.includes('family') || allContent.includes('parent') || allContent.includes('child') || 
      allContent.includes('daughter') || allContent.includes('son') || allContent.includes('mother') || 
      allContent.includes('father')) {
    topics.push('Family');
  }
  
  if (allContent.includes('work') || allContent.includes('job') || allContent.includes('career') || 
      allContent.includes('profession') || allContent.includes('employment')) {
    topics.push('Work & Career');
  }
  
  if (allContent.includes('travel') || allContent.includes('vacation') || allContent.includes('trip') || 
      allContent.includes('visit') || allContent.includes('abroad') || allContent.includes('journey')) {
    topics.push('Travel & Experiences');
  }
  
  if (allContent.includes('school') || allContent.includes('education') || allContent.includes('learn') || 
      allContent.includes('college') || allContent.includes('university') || allContent.includes('study')) {
    topics.push('Education & Learning');
  }
  
  if (allContent.includes('hobby') || allContent.includes('interest') || allContent.includes('activity') || 
      allContent.includes('garden') || allContent.includes('read') || allContent.includes('cook')) {
    topics.push('Hobbies & Interests');
  }
  
  // Create a structured summary based on the modified prompt
  let summary = `
    <div class="space-y-4 font-lora text-therapy-text">
      <h3 class="text-lg font-medium font-playfair">Session Summary</h3>
      
      <div class="space-y-3">
        <h4 class="font-medium">Key Topics Discussed</h4>
        <ul class="list-disc pl-5">
          ${topics.length > 0 ? topics.map(topic => `<li>${topic}</li>`).join('') : '<li>General reminiscence</li>'}
        </ul>
        
        <h4 class="font-medium">Session Details</h4>
        <p>Duration: ${sessionDurationMinutes} minutes</p>
        <p>Number of exchanges: ${conversationMessages.length}</p>
        
        <h4 class="font-medium">Notes</h4>
        <p>The participant engaged in a reminiscence therapy session focusing on past memories and experiences. 
        The conversation aimed to help establish connections between past experiences and present feelings.</p>
      </div>
      
      <div class="pt-2 text-sm italic">
        This summary was generated to help track your progress across sessions.
      </div>
    </div>
  `;
  
  return summary;
}
