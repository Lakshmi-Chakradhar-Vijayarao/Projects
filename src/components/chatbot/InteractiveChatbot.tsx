
"use client";

import React, { useState, useCallback, useEffect } from 'react';
import ChatbotBubble from './ChatbotBubble';
import ChatbotInterface, { type ChatMessage } from './ChatbotInterface';
import { askAboutResume } from '@/ai/flows/resume-qa-flow'; // We'll create this

const InteractiveChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggleChatbot = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const addMessage = useCallback((sender: 'user' | 'ai', text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender, text, timestamp: new Date() }]);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!currentInput.trim()) return;

    addMessage('user', currentInput);
    const userQuestion = currentInput;
    setCurrentInput('');
    setIsLoading(true);

    try {
      const response = await askAboutResume({ question: userQuestion });
      addMessage('ai', response.answer);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      addMessage('ai', "Sorry, I encountered an error trying to respond. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentInput, addMessage]);

  if (!isMounted) {
      return null; // Or a placeholder if preferred, but null avoids SSR issues with fixed positioning
  }

  return (
    <>
      <ChatbotBubble onClick={toggleChatbot} isVisible={!isOpen} />
      <ChatbotInterface
        isOpen={isOpen}
        onClose={toggleChatbot}
        messages={messages}
        currentInput={currentInput}
        onInputChange={setCurrentInput}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </>
  );
};

export default InteractiveChatbot;
