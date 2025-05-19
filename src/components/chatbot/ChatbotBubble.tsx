"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { BotMessageSquare } from 'lucide-react'; // Changed from BrainCircuit to BotMessageSquare

interface ChatbotBubbleProps {
  onClick: () => void;
  isVisible: boolean;
}

const ChatbotBubble: React.FC<ChatbotBubbleProps> = ({ onClick, isVisible }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[1001] rounded-full w-16 h-16 shadow-xl bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:scale-110 animate-subtle-pulse"
      aria-label="Open AI Chatbot Assistant" // Slightly more descriptive aria-label
    >
      <BotMessageSquare className="h-7 w-7" />
    </Button>
  );
};

export default ChatbotBubble;