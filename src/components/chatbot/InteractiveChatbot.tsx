
"use client";
import React, { useState, useCallback, FormEvent, ChangeEvent, useEffect } from 'react';
import ChatbotBubble from './ChatbotBubble';
import ChatbotInterface, { type ChatMessage } from './ChatbotInterface';
import { askAboutResume, type ResumeQAInput, type ResumeQAOutput } from '@/ai/flows/resume-qa-flow';
import { useToast } from "@/hooks/use-toast";

const InteractiveChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messageIdCounterRef = React.useRef(0);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const addMessage = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode) => {
    messageIdCounterRef.current += 1;
    const newMessage: ChatMessage = {
      id: `${Date.now()}-${messageIdCounterRef.current}`,
      sender,
      text,
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(e.target.value);
  }, []);

  const handleSendMessage = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    addMessage('user', currentInput);
    const userQuestion = currentInput;
    setCurrentInput('');
    setIsLoading(true);

    try {
      const aiResponse: ResumeQAOutput = await askAboutResume({ question: userQuestion });
      addMessage('ai', aiResponse.answer);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      addMessage('ai', "Sorry, I couldn't get a response right now. Please try again later.");
      toast({
        title: "Error",
        description: "Could not connect to the AI assistant.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentInput, addMessage, toast]);
  
  // Initial greeting message when chat opens for the first time in a session
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('ai', "Hi there! I'm Chakradhar's AI Resume Assistant. Ask me anything about his experience or skills!");
    }
  }, [isOpen, messages.length, addMessage]);

  return (
    <>
      {!isOpen && <ChatbotBubble onClick={toggleChat} />}
      <ChatbotInterface
        isOpen={isOpen}
        onClose={toggleChat}
        messages={messages}
        currentInput={currentInput}
        onInputChange={handleInputChange}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </>
  );
};

export default InteractiveChatbot;
