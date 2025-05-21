"use client";

import React, { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
import ChatbotInterface, { type ChatMessage as ChatbotInterfaceMessage, type QuickReplyButtonProps } from './ChatbotInterface';
import { askAboutResume, type ResumeQAInput, type ResumeQAOutput } from '@/ai/flows/resume-qa-flow';

// Re-exporting types for clarity when IntegratedAssistantController imports them
export interface ChatMessage extends ChatbotInterfaceMessage {}
export interface QuickReply extends QuickReplyButtonProps {}

interface InteractiveChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessages?: ChatMessage[];
  initialQuickReplies?: QuickReply[];
  onQuickReplyAction: (action: string) => void; 
  // onSendMessageToAI: (message: string) => void; // For direct Q&A in future
  isLoading: boolean;
  currentMode: string; // e.g., 'greeting', 'qa_active', 'projects_interactive'
}

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({
  isOpen,
  onClose,
  initialMessages,
  initialQuickReplies,
  onQuickReplyAction,
  isLoading: propIsLoading,
  currentMode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [currentInput, setCurrentInput] = useState('');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>(initialQuickReplies || []);
  const [isTyping, setIsTyping] = useState(false); // Internal loading for AI response

  const messageIdCounterRef = useRef(0);

  useEffect(() => {
    setMessages(initialMessages || []);
  }, [initialMessages]);

  useEffect(() => {
    setQuickReplies((initialQuickReplies || []).map(qr => ({ text: qr.text, action: qr.action, icon: qr.icon })));
  }, [initialQuickReplies]);

  const addMessage = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    messageIdCounterRef.current += 1;
    const newMessage: ChatMessage = { id: `${Date.now()}-${messageIdCounterRef.current}`, sender, text, speakableTextOverride };
    setMessages(prev => [...prev, newMessage]);
  }, [setMessages]);

  const handleSendMessage = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentInput.trim() || currentMode !== 'qa_active') return;

    const userMessage = currentInput;
    addMessage('user', userMessage, userMessage);
    setCurrentInput('');
    setIsTyping(true);
    setQuickReplies([]); // Clear quick replies when user types a message

    try {
      const aiResponse: ResumeQAOutput = await askAboutResume({ question: userMessage });
      addMessage('ai', aiResponse.answer, aiResponse.answer);
    } catch (error) {
      console.error("Error calling Genkit resume Q&A flow:", error);
      const errorText = "Sorry, I encountered an error trying to respond. Please try again.";
      addMessage('ai', errorText, errorText);
    } finally {
      setIsTyping(false);
    }
  }, [currentInput, addMessage, currentMode]);

  const handleQuickReplyClick = useCallback((action: string) => {
    console.log("InteractiveChatbot: Quick reply clicked with action:", action);
    if (onQuickReplyAction) {
      onQuickReplyAction(action);
    }
    // The controller will handle message additions for quick replies
    setQuickReplies([]); // Clear quick replies after one is clicked
  }, [onQuickReplyAction, setQuickReplies]);

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
