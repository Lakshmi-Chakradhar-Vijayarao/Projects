"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ChatbotBubble from './ChatbotBubble';
import ChatbotInterface, { type ChatbotInterfaceMessage } from './ChatbotInterface';
import { askAboutResume, type ResumeQAInput, type ResumeQAOutput } from '@/ai/flows/resume-qa-flow';

const InteractiveChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatbotInterfaceMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messageIdCounterRef = useRef(0);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const addMessage = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode) => {
    messageIdCounterRef.current += 1;
    setMessages(prev => [...prev, { id: `${Date.now()}-${messageIdCounterRef.current}`, sender, text }]);
  }, []);

  const handleSendMessage = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const userMessage = currentInput;
    addMessage('user', userMessage);
    setCurrentInput('');
    setIsLoading(true);

    try {
      const aiResponse: ResumeQAOutput = await askAboutResume({ question: userMessage });
      addMessage('ai', aiResponse.answer);
    } catch (error) {
      console.error("Error calling Genkit flow:", error);
      addMessage('ai', "Sorry, I encountered an error trying to respond. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentInput, addMessage]);

  return (
    <>
      <ChatbotBubble onClick={toggleChat} isVisible={!isOpen} />
      <ChatbotInterface
        isOpen={isOpen}
        onClose={toggleChat}
        messages={messages}
        currentInput={currentInput}
        onInputChange={(e) => setCurrentInput(e.target.value)}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </>
  );
};

export default InteractiveChatbot;
