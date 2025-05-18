"use client";

import { MessageSquarePlus } from 'lucide-react';

interface ChatBubbleProps {
  onClick: () => void;
  isVisible: boolean;
}

export default function ChatBubble({ onClick, isVisible }: ChatBubbleProps) {
  if (!isVisible) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-primary text-primary-foreground p-4 rounded-full shadow-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 animate-subtle-pulse z-[9998]"
      aria-label="Open resume chat assistant"
    >
      <MessageSquarePlus className="h-8 w-8" />
    </button>
  );
}
