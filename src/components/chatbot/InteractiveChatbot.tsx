// src/components/chatbot/InteractiveChatbot.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import ChatbotInterface, { 
    type ChatMessage as ChatbotInterfaceMessage, // Renamed to avoid conflict
    type QuickReplyButtonProps 
} from './ChatbotInterface';
import { askAboutResume, type ResumeQAInput, type ResumeQAOutput } from '@/ai/flows/resume-qa-flow';
import type { AvatarAction } from '../ai/AnimatedVideoAvatar'; // Import AvatarAction

// Re-exporting types for clarity when IntegratedAssistantController imports them
export interface ChatMessage extends ChatbotInterfaceMessage {} // This is for the messages array
export interface QuickReply extends QuickReplyButtonProps {}

interface InteractiveChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessages?: ChatMessage[];
  initialQuickReplies?: QuickReply[];
  onQuickReplyAction: (action: string) => void; 
  isLoading: boolean;
  currentMode: string; 
  speakTextProp?: (text: string, onEnd?: () => void, isChainedCall?: boolean) => void; // Optional speak function
  setAvatarActionProp?: (action: AvatarAction) => void; // Optional avatar action setter
}

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({
  isOpen,
  onClose,
  initialMessages,
  initialQuickReplies,
  onQuickReplyAction,
  isLoading: propIsLoading,
  currentMode,
  speakTextProp,
  setAvatarActionProp,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [currentInput, setCurrentInput] = useState('');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [isTyping, setIsTyping] = useState(false); 

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
        // Ensure initialQuickReplies is an array before mapping
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
  }, []);

  const handleSendMessage = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentInput.trim() || currentMode !== 'qa_active' || !isMountedRef.current) return;

    const userMessageText = currentInput;
    addMessage('user', userMessageText, userMessageText);
    setCurrentInput('');
    setIsTyping(true);
    setQuickReplies([]); 
    if(setAvatarActionProp) setAvatarActionProp('thinking');


    try {
      const aiResponse: ResumeQAOutput = await askAboutResume({ question: userMessageText });
      if (isMountedRef.current) {
        addMessage('ai', aiResponse.answer, aiResponse.answer);
        if (speakTextProp) {
          speakTextProp(aiResponse.answer, () => {
            if(setAvatarActionProp) setAvatarActionProp('idle');
          });
        } else {
          if(setAvatarActionProp) setAvatarActionProp('idle');
        }
      }
    } catch (error) {
      console.error("Error calling Genkit resume Q&A flow:", error);
      if (isMountedRef.current) {
        const errorText = "Sorry, I encountered an error trying to respond. Please try again.";
        addMessage('ai', errorText, errorText);
        if (speakTextProp) {
          speakTextProp(errorText, () => {
            if(setAvatarActionProp) setAvatarActionProp('idle');
          });
        } else {
          if(setAvatarActionProp) setAvatarActionProp('idle');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsTyping(false);
      }
    }
  }, [currentInput, addMessage, currentMode, speakTextProp, setAvatarActionProp]);

  const handleQuickReplyClick = useCallback((action: string) => {
    if (!isMountedRef.current) return;
    console.log("InteractiveChatbot: Quick reply clicked with action:", action);
    if (onQuickReplyAction) {
      onQuickReplyAction(action);
    }
    setQuickReplies([]); 
  }, [onQuickReplyAction]);
  
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
      onQuickReplyClick={handleQuickReplyClick}
      showTextInput={currentMode === 'qa_active'}
    />
  );
};

export default InteractiveChatbot;
