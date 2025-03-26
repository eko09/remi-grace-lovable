
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Index from '@/pages/Index';
import Chat from '@/pages/Chat';
import VoiceChat from '@/pages/VoiceChat';
import ConversationMode from '@/pages/ConversationMode';
import PreSessionMood from '@/pages/PreSessionMood';
import NotFound from '@/pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/conversation-mode" element={<ConversationMode />} />
        <Route path="/pre-session-mood" element={<PreSessionMood />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/voice-chat" element={<VoiceChat />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
