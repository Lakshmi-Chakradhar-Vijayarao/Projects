// src/components/chatbot/InteractiveChatbot.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import ChatbotInterface, { 
    type ChatMessage as ChatbotInterfaceMessage, 
    type QuickReplyButtonProps 
} from './ChatbotInterface';
import { askAboutResume, type ResumeQAInput, type ResumeQAOutput } from '@/ai/flows/resume-qa-flow';
import type { AvatarAction } from '../ai/AnimatedVideoAvatar';

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
  speakTextProp?: (text: string, onEnd?: () => void, isChainedCall?: boolean) => void;
  setAvatarActionProp?: (action: AvatarAction) => void;
}

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({
  isOpen,
  onClose,
  initialMessages = [], // Default to empty array
  initialQuickReplies = [], // Default to empty array
  onQuickReplyAction,
  isLoading: propIsLoading,
  currentMode,
  speakTextProp,
  setAvatarActionProp,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [currentInput, setCurrentInput] = useState('');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(initialQuickReplies);
  const [isTyping, setIsTyping] = useState(false); 

  const messageIdCounterRef = useRef(0); // For unique message IDs
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

    // If AI is sending the message and speakTextProp is available, speak it
    if (sender === 'ai' && speakTextProp && typeof speakableTextOverride === 'string') {
      speakTextProp(speakableTextOverride, () => {
        if(setAvatarActionProp) setAvatarActionProp('idle');
      });
    } else if (sender === 'ai' && speakTextProp && typeof text === 'string') {
       speakTextProp(text, () => {
        if(setAvatarActionProp) setAvatarActionProp('idle');
      });
    }
  }, [speakTextProp, setAvatarActionProp]);

  const handleSendMessage = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentInput.trim() || currentMode !== 'qa_active' || !isMountedRef.current) return;

    const userMessageText = currentInput;
    // Add user message to chat locally (will be re-added by controller if it's the source of truth)
    // This provides immediate feedback to the user.
    // The controller's addMessageToChat will be the canonical one for state.
    // For now, let the controller handle adding user message.
    // addMessage('user', userMessageText, userMessageText); 
    
    // Instead of directly adding, we let the controller handle user message display
    // and call the AI flow, then the controller adds both user and AI message.
    // This specific component might not need its own addMessage if controller handles all.
    // For now, assume parent (IntegratedAssistantController) will call its own addMessage.
    // We just need to pass the user's query up.
    
    // Call a prop function to handle the AI query (to be implemented in IntegratedAssistantController)
    // For now, directly call the Genkit flow here if no prop is provided.
    // This is a slight deviation if controller is meant to handle all.
    // Let's assume the controller's `speakTextNow` is for speaking any text,
    // and this component needs to initiate the Q&A flow.

    if (setAvatarActionProp) setAvatarActionProp('thinking');
    setIsTyping(true);
    setQuickReplies([]); 
    
    // Display user message immediately (controller should also do this to sync states)
    setMessages(prev => [...prev, {id: `user-${Date.now()}`, sender: 'user', text: userMessageText}]);
    setCurrentInput('');

    try {
      const aiResponse: ResumeQAOutput = await askAboutResume({ question: userMessageText });
      if (isMountedRef.current) {
        // Instead of addMessage, let the controller's speakTextNow handle adding AI message and speaking
        if (speakTextProp) {
          speakTextProp(aiResponse.answer, () => {
            if(setAvatarActionProp) setAvatarActionProp('idle');
          });
        } else { // Fallback if no speakTextProp, just add visually
           setMessages(prev => [...prev, {id: `ai-${Date.now()}`, sender: 'ai', text: aiResponse.answer}]);
           if(setAvatarActionProp) setAvatarActionProp('idle');
        }
         // Add AI message to chat (this will be spoken by speakTextProp if defined)
        setMessages(prev => [...prev, { id: `ai-${Date.now()}-${messageIdCounterRef.current++}`, sender: 'ai', text: aiResponse.answer, speakableTextOverride: aiResponse.answer }]);

      }
    } catch (error) {
      console.error("Error calling Genkit resume Q&A flow:", error);
      if (isMountedRef.current) {
        const errorText = "Sorry, I encountered an error trying to respond. Please try again.";
        if (speakTextProp) {
          speakTextProp(errorText, () => {
            if(setAvatarActionProp) setAvatarActionProp('idle');
          });
        } else {
           setMessages(prev => [...prev, {id: `ai-err-${Date.now()}`, sender: 'ai', text: errorText}]);
           if(setAvatarActionProp) setAvatarActionProp('idle');
        }
        setMessages(prev => [...prev, { id: `ai-err-${Date.now()}-${messageIdCounterRef.current++}`, sender: 'ai', text: errorText, speakableTextOverride: errorText }]);
      }
    } finally {
      if (isMountedRef.current) {
        setIsTyping(false);
      }
    }
  }, [currentInput, currentMode, speakTextProp, setAvatarActionProp]);

  const handleQuickReplyClick = useCallback((action: string) => {
    if (!isMountedRef.current) return;
    if (onQuickReplyAction) {
      onQuickReplyAction(action);
    }
    // Quick replies are cleared by the controller after an action
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
      showTextInput={currentMode === 'qa_active' || currentMode === 'post_voice_tour_qa' || currentMode === 'scrolled_to_end_greeting'}
    />
  );
};

export default InteractiveChatbot;
