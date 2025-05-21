// src/components/chatbot/InteractiveChatbot.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import ChatbotInterface, { 
    type ChatMessage as ChatbotInterfaceMessage, 
    type QuickReplyButtonProps 
} from './ChatbotInterface';
import { askAboutResume, type ResumeQAInput, type ResumeQAOutput } from '@/ai/flows/resume-qa-flow';

export interface ChatMessage extends ChatbotInterfaceMessage {}
export interface QuickReply extends QuickReplyButtonProps {}

interface InteractiveChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessages?: ChatMessage[];
  initialQuickReplies?: QuickReply[];
  onQuickReplyAction: (action: string) => void; 
  isLoading: boolean;
  currentMode: string; 
}

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({
  isOpen,
  onClose,
  initialMessages = [],
  initialQuickReplies = [],
  onQuickReplyAction,
  isLoading: propIsLoading,
  currentMode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false); 
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(initialQuickReplies);

  const messageIdCounterRef = useRef(0);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isMountedRef.current) {
        setMessages(initialMessages || []);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (isMountedRef.current) {
        setQuickReplies((initialQuickReplies || []).map(qr => ({ 
            text: qr.text, 
            action: qr.action, 
            icon: qr.icon 
        })));
    }
  }, [initialQuickReplies]);

  const addMessage = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    if (!isMountedRef.current) return;
    messageIdCounterRef.current += 1;
    const newMessage: ChatMessage = { id: `${Date.now()}-${messageIdCounterRef.current}`, sender, text, speakableTextOverride };
    setMessages(prev => [...prev, newMessage]);
    // Note: Actual speech is now handled by IntegratedAssistantController's speakTextNow
  }, []);

  const handleSendMessage = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentInput.trim() || currentMode !== 'qa' || !isMountedRef.current) return;

    const userMessageText = currentInput;
    addMessage('user', userMessageText, userMessageText); 
    setCurrentInput('');
    setIsTyping(true);
    setQuickReplies([]); 
    
    try {
      const aiResponse: ResumeQAOutput = await askAboutResume({ question: userMessageText });
      if (isMountedRef.current) {
        addMessage('ai', aiResponse.answer, aiResponse.answer);
      }
    } catch (error) {
      console.error("Error calling Genkit resume Q&A flow:", error);
      if (isMountedRef.current) {
        const errorText = "Sorry, I encountered an error trying to respond. Please try again.";
        addMessage('ai', errorText, errorText);
      }
    } finally {
      if (isMountedRef.current) {
        setIsTyping(false);
        // Re-present Q&A options if needed, or let controller do it
      }
    }
  }, [currentInput, currentMode, addMessage]);

  if (!isOpen) {
    return null;
  }

  return (
    <ChatbotInterface
      isOpen={isOpen}
      onClose={onClose}
      messages={messages}
      currentInput={currentInput}
      onInputChange={(e) => setCurrentInput(e.target.value)}
      onSendMessage={handleSendMessage}
      isLoading={propIsLoading || isTyping}
      quickReplies={quickReplies}
      onQuickReplyAction={onQuickReplyAction} 
      showTextInput={currentMode === 'qa' || currentMode === 'post_voice_tour_qa' || currentMode === 'scrolled_to_end_greeting' || currentMode === 'end_tour_prompt'}
    />
  );
};

export default InteractiveChatbot;
