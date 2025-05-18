
"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface ChatbotInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentInput: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
}

const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({
  isOpen,
  onClose,
  messages,
  currentInput,
  onInputChange,
  onSendMessage,
  isLoading,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, isOpen]);

  if (!isOpen || !isMounted) {
    return null;
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      onSendMessage();
    }
  };

  return (
    <div className="fixed bottom-20 right-6 sm:bottom-24 sm:right-8 z-[1002] w-[calc(100vw-3rem)] max-w-md h-[70vh] max-h-[500px] bg-card shadow-2xl rounded-lg border border-border flex flex-col overflow-hidden animate-scale-up">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="text-lg font-semibold text-primary flex items-center">
          <Bot className="mr-2 h-5 w-5" /> AI Assistant
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat">
          <X className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-grow p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg max-w-[85%]",
              msg.sender === 'user' ? 'ml-auto bg-primary/10' : 'mr-auto bg-muted/50'
            )}
          >
            {msg.sender === 'ai' && <Bot className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
            <div className="flex-1">
              <p className="text-sm leading-relaxed text-foreground/90">{msg.text}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.sender === 'user' && <User className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ask about Chakradhar's resume..."
            value={currentInput}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-grow bg-input/50 border-border/70 focus:bg-input"
          />
          <Button onClick={onSendMessage} disabled={isLoading || !currentInput.trim()} aria-label="Send message">
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface;
