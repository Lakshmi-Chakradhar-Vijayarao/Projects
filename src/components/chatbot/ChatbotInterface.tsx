"use client";

import React, { useEffect, useRef, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, X, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string | React.ReactNode;
  speakableTextOverride?: string; // For TTS, if different from display text
}

export interface QuickReplyButtonProps {
  text: string;
  action: string; // An identifier for the action this button triggers
  icon?: React.ReactElement; // Optional icon for the button
}

interface ChatbotInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentInput: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  quickReplies?: QuickReplyButtonProps[];
  onQuickReplyClick: (action: string) => void; // Changed from onQuickReplyAction
  showTextInput?: boolean; // To conditionally show the text input field
}

const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({
  isOpen,
  onClose,
  messages,
  currentInput,
  onInputChange,
  onSendMessage,
  isLoading,
  quickReplies,
  onQuickReplyClick, // Changed from onQuickReplyAction
  showTextInput = true, // Default to true if not provided
}) => {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const quickRepliesRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
    if (quickRepliesRef.current) {
        quickRepliesRef.current.scrollTop = quickRepliesRef.current.scrollHeight;
    }
  }, [quickReplies]);

  useEffect(() => {
    if (isOpen && showTextInput && !quickReplies?.length) { // Only focus if input is shown and no quick replies
      inputRef.current?.focus();
    }
  }, [isOpen, showTextInput, quickReplies]);


  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9999] w-[calc(100%-3rem)] max-w-sm sm:w-96">
      <div className="bg-card border border-border shadow-xl rounded-lg flex flex-col h-[70vh] max-h-[500px] sm:max-h-[600px]">
        <header className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h3 className="text-sm sm:text-base font-semibold text-foreground">AI Resume Assistant</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 sm:h-8 sm:w-8">
            <X className="h-4 w-4 sm:h-5 sm:h-5" />
            <span className="sr-only">Close chat</span>
          </Button>
        </header>

        <ScrollArea className="flex-grow p-3 sm:p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start gap-2.5 p-2.5 rounded-lg max-w-[85%]",
                msg.sender === 'user' ? "ml-auto bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {msg.sender === 'ai' && <Bot className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              <div className="text-xs sm:text-sm break-words">{typeof msg.text === 'string' ? <p>{msg.text}</p> : msg.text}</div>
              {msg.sender === 'user' && <User className="h-5 w-5 flex-shrink-0 mt-0.5" />}
            </div>
          ))}
          <div ref={messageEndRef} />
        </ScrollArea>

        {quickReplies && quickReplies.length > 0 && (
          <ScrollArea ref={quickRepliesRef} className="max-h-32 p-2 sm:p-3 border-t border-border">
            <div className="flex flex-col space-y-2">
              {quickReplies.map((reply) => (
                <Button
                  key={reply.action} // Use action as key if text isn't guaranteed unique
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2.5 px-3 sm:px-4 text-xs sm:text-sm"
                  onClick={() => onQuickReplyClick(reply.action)}
                >
                  {reply.icon && React.isValidElement(reply.icon) && React.cloneElement(reply.icon, { className: cn(reply.icon.props.className, "mr-2 h-4 w-4 flex-shrink-0") })}
                  {reply.text}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}

        {showTextInput && (
          <form onSubmit={onSendMessage} className="p-3 sm:p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ask about Chakradhar..."
                value={currentInput}
                onChange={onInputChange}
                className="flex-grow text-xs sm:text-sm"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !currentInput.trim()} className="h-9 w-9 sm:h-10 sm:w-10">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send message</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatbotInterface;
