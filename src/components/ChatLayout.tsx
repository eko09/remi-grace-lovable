
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

interface ChatLayoutProps {
  participantId: string | null;
  showSummary: boolean;
  setShowSummary: (show: boolean) => void;
  summaryContent: string;
  endConversation: () => void;
  isLoading: boolean;
  isSpeaking: boolean;
  children: React.ReactNode;
  footerContent: React.ReactNode;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({
  participantId,
  showSummary,
  setShowSummary,
  summaryContent,
  endConversation,
  children,
  footerContent
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const closeSummary = () => {
    setShowSummary(false);
    navigate('/');
  };
  
  return (
    <div className="flex flex-col h-screen bg-therapy-beige-light page-transition">
      <header className="py-3 px-4 sm:py-4 sm:px-6 flex items-center justify-between border-b bg-white">
        <div className="flex items-center">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10 mr-3 sm:mr-4">
            <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi" />
            <AvatarFallback>RM</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg sm:text-xl font-medium text-therapy-text font-playfair">Remi</h1>
            {participantId && (
              <p className="text-xs sm:text-sm text-gray-500">{participantId}</p>
            )}
          </div>
        </div>
        <div>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={endConversation}
            className="text-red-500 hover:bg-red-50 font-lora"
          >
            {isMobile ? <X className="h-4 w-4" /> : (
              <>
                <X className="h-4 w-4 mr-2" />
                End
              </>
            )}
          </Button>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden p-2 sm:p-4">
        <Card className="flex flex-col h-full glass-panel">
          <CardHeader className="text-center py-2 sm:py-3 border-b">
            <p className="text-xs sm:text-sm text-gray-500 font-lora">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto py-4 sm:py-6 px-3 sm:px-4 smooth-scroll">
            {children}
          </CardContent>
          
          <CardFooter className="p-3 sm:p-4 border-t">
            {footerContent}
          </CardFooter>
        </Card>
      </main>

      {/* Session Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="w-[calc(100%-32px)] sm:max-w-md font-lora bg-therapy-beige-light">
          <DialogHeader>
            <DialogTitle className="text-xl font-playfair">Session Complete</DialogTitle>
            <DialogDescription className="text-therapy-text">
              Thank you for your session with Remi today.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4" dangerouslySetInnerHTML={{ __html: summaryContent }} />
          <div className="flex justify-center mt-4">
            <Button 
              onClick={closeSummary}
              className="w-full sm:w-auto bg-[#3399FF] hover:bg-[#2277DD]"
            >
              Return to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatLayout;
