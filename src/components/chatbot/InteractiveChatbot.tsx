
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import ChatbotInterface, { type ChatMessage as ChatbotInterfaceMessage, type QuickReplyButtonProps } from './ChatbotInterface';
import { askAboutResume, type ResumeQAInput } from '@/ai/flows/resume-qa-flow';

// This type is for internal state and props from IntegratedAssistantController
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string | React.ReactNode; // Allow JSX for richer messages
  timestamp: Date;
  speakableTextOverride?: string; // For TTS if text is JSX
}

export interface QuickReply {
  text: string;
  action: string; // Action identifier
  icon?: React.ReactNode;
}

interface InteractiveChatbotProps {
  isOpen: boolean;
  mode: string; 
  initialMessages: ChatbotInterfaceMessage[]; // This uses the renamed ChatbotInterfaceMessage
  initialQuickReplies: QuickReply[];
  onClose: () => void;
  onQuickReplyAction: (action: string) => void;
}

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({
  isOpen,
  mode,
  initialMessages,
  initialQuickReplies,
  onClose,
  onQuickReplyAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages); // Uses its own ChatMessage type
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReplyButtonProps[]>([]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    // Guard against initialQuickReplies being undefined or null before mapping
    setQuickReplies(
      (initialQuickReplies || []).map(qr => ({ text: qr.text, action: qr.action, icon: qr.icon }))
    );
  }, [initialQuickReplies]);

  const addMessage = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    const newMessage: ChatMessage = { // Uses its own ChatMessage type
      id: Date.now().toString(),
      sender,
      text,
      timestamp: new Date(),
      speakableTextOverride
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!currentInput.trim() || (mode !== 'qa' && mode !== 'post_voice_tour_qa' && mode !== 'scrolled_to_end_greeting' && mode !== 'post_tour_qa')) return;

    addMessage('user', currentInput);
    const userQuestion = currentInput;
    setCurrentInput('');
    setIsLoading(true);
    setQuickReplies([]);

    try {
      const response = await askAboutResume({ question: userQuestion });
      addMessage('ai', response.answer);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      addMessage('ai', "Sorry, I encountered an error trying to respond. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentInput, addMessage, mode]);

  useEffect(() => {
    if (mode === 'greeting' || mode === 'post_voice_tour_qa' || mode === 'post_tour_qa' || mode === 'scrolled_to_end_greeting' || mode === 'voice_tour_paused_by_user') {
      // Quick replies are set by initialQuickReplies via the useEffect above
    } else if (mode === 'qa') {
       setQuickReplies([]);
    } else {
      setQuickReplies([]);
    }
  }, [mode]);


  return (
    <>
      <ChatbotInterface
        isOpen={isOpen}
        onClose={onClose}
        messages={messages} // This is ChatMessage[] from InteractiveChatbot's state
        quickReplies={quickReplies}
        currentInput={currentInput}
        onInputChange={setCurrentInput}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        onQuickReplyAction={onQuickReplyAction}
      />
    </>
  );
};

export default InteractiveChatbot;
