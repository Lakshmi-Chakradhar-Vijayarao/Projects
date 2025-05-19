
"use client";

import React, { useState, useCallback, useEffect } from 'react';
// ChatbotBubble is now rendered by IntegratedAssistantController
import ChatbotInterface, { type ChatMessage as ChatbotInterfaceMessage, type QuickReplyButtonProps } from './ChatbotInterface'; // Renamed imported ChatMessage to avoid conflict
import { askAboutResume, type ResumeQAInput, type ResumeQAOutput } from '@/ai/flows/resume-qa-flow';

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
  mode: 'greeting' | 'qa' | 'post_voice_tour_qa' | 'scrolled_to_end_greeting' | 'voice_tour_active' | 'idle' | 'post_tour_qa' | 'tour_paused_by_user';
  initialMessages: ChatMessage[];
  initialQuickReplies: QuickReply[];
  onClose: () => void;
  onQuickReplyAction: (action: string) => void;
  // onSendMessageToAI is handled internally now for QA mode
}

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({
  isOpen,
  mode, // mode now comes from props
  initialMessages,
  initialQuickReplies,
  onClose,
  onQuickReplyAction,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReplyButtonProps[]>([]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    // Guard against initialQuickReplies being undefined
    setQuickReplies((initialQuickReplies || []).map(qr => ({ text: qr.text, action: qr.action, icon: qr.icon })));
  }, [initialQuickReplies]);

  const addMessage = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    const newMessage: ChatMessage = { 
      id: Date.now().toString(), 
      sender, 
      text, 
      timestamp: new Date(),
      speakableTextOverride
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!currentInput.trim() || (mode !== 'qa' && mode !== 'post_voice_tour_qa' && mode !== 'post_tour_qa')) return;

    addMessage('user', currentInput);
    const userQuestion = currentInput;
    setCurrentInput('');
    setIsLoading(true);
    setQuickReplies([]); // Clear quick replies when user sends a message

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
  
  // Effect to handle quick replies based on mode, if not directly set by initialQuickReplies
  useEffect(() => {
    if (mode === 'greeting' || mode === 'post_voice_tour_qa' || mode === 'post_tour_qa' || mode === 'scrolled_to_end_greeting') {
      // Quick replies are set by initialQuickReplies for these modes via IntegratedAssistantController
      // The useEffect for initialQuickReplies already handles this.
    } else if (mode === 'qa') {
       setQuickReplies([]); // Expect text input for QA
    } else {
      setQuickReplies([]); // Default to no quick replies
    }
  }, [mode]);


  return (
    <>
      {/* ChatbotBubble is now rendered by IntegratedAssistantController */}
      <ChatbotInterface
        isOpen={isOpen}
        onClose={onClose}
        messages={messages}
        quickReplies={quickReplies}
        currentInput={currentInput}
        onInputChange={setCurrentInput}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        // Pass onQuickReplyAction directly to ChatbotInterface
        // @ts-ignore // TODO: Fix this type issue if ChatbotInterface's onQuickReplyAction is differently typed
        onQuickReplyAction={onQuickReplyAction} 
      />
    </>
  );
};

export default InteractiveChatbot;
