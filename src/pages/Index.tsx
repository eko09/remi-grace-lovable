
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Index: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-therapy-beige-light p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-5 sm:p-7">
          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarImage src="/lovable-uploads/2bc5914a-ea60-45b1-9efe-858d1d316cfe.png" alt="Remi Logo" />
              <AvatarFallback>RM</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl sm:text-3xl text-center font-playfair text-therapy-text">
              Welcome to Remi
            </h1>
            <p className="text-gray-600 text-center mt-2">
              Your reminiscence therapy companion
            </p>
          </div>
          
          <div className="mb-8">
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const input = form.querySelector('input') as HTMLInputElement;
              const participantId = input.value;
              
              if (participantId) {
                // Store the ID in session storage
                sessionStorage.setItem('participantId', participantId);
                
                // Navigate to conversation mode selection page
                window.location.href = '/conversation-mode';
              }
            }} className="mt-4">
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter your participant ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Your participant ID consists of your initials followed by the last two digits of your birth year.
                  <br /><br />
                  Example: For Jane Smith born in 1945, the ID would be "JS45"
                </p>
              </div>
              <button 
                type="submit"
                className="w-full mt-4 bg-[#3399FF] hover:bg-[#2277DD] text-white py-2 rounded-md transition-colors"
              >
                Start Session
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
