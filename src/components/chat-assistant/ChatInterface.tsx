
"use client";

import React from 'react';
import type { ReactNode } from 'react'; // Ensured ReactNode is typed
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

export type ChatMessage = {
  id: string;
  sender: 'user' | 'assistant';
  text: ReactNode; // Use ReactNode for versatile content
};

export type QuickReplyButton = {
  text: string;
  onClick: () => void;
  icon?: ReactNode; // Use ReactNode for icons
};

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  quickReplies: QuickReplyButton[];
  title?: string;
}

export default function ChatInterface({
  isOpen,
  onClose,
  messages,
  quickReplies,
  title = "Lakshmi's Resume Assistant"
}: ChatInterfaceProps) {
  if (!isOpen) return null;

  const messageEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-[calc(100%-3rem)] max-w-md h-[70vh] max-h-[500px] bg-card border border-border shadow-2xl rounded-lg flex flex-col z-[9999] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-card">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-grow p-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] p-2.5 rounded-lg text-sm ${
                msg.sender === 'assistant'
                  ? 'bg-muted text-muted-foreground rounded-br-none'
                  : 'bg-primary text-primary-foreground rounded-bl-none'
              }`}
            >
              {typeof msg.text === 'string' ? <p>{msg.text}</p> : msg.text}
            </div>
          </div>
        ))}
        <div ref={messageEndRef} />
      </ScrollArea>

      {/* Quick Replies Area */}
      {quickReplies.length > 0 && (
        <div className="p-3 border-t border-border/50 bg-card">
          <p className="text-xs text-muted-foreground mb-2 text-center">Select an option:</p>
          <ScrollArea className="max-h-32"> {/* Limit height for many buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              {quickReplies.map((reply) => (
                <Button
                  key={reply.text} // Changed key from index to reply.text
                  variant="outline"
                  size="sm"
                  onClick={reply.onClick}
                  className="text-xs sm:text-sm flex-grow sm:flex-grow-0"
                >
                  {reply.icon && <span className="mr-1.5">{reply.icon}</span>}
                  {reply.text}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
