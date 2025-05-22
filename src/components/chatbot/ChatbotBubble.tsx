
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { BotMessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatbotBubbleProps {
  onClick: () => void;
}

const ChatbotBubble: React.FC<ChatbotBubbleProps> = ({ onClick }) => {
  return (
    <Button
      onClick={onClick}
      variant="outline" 
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9998]", 
        "rounded-full w-14 h-14 sm:w-16 sm:h-16",
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl",
        "animate-subtle-pulse" 
      )}
      aria-label="Toggle AI Assistant"
    >
      <BotMessageSquare className="h-6 w-6 sm:h-7 sm:w-7" />
    </Button>
  );
};

export default ChatbotBubble;
