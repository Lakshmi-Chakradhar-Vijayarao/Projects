// src/components/chatbot/InteractiveChatbot.tsx
"use client";
import React, { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import ChatbotInterface, { 
    type ChatMessage as ChatbotInterfaceMessage, 
    type QuickReplyButtonProps 
} from './ChatbotInterface';
import { askAboutResume, type ResumeQAInput, type ResumeQAOutput } from '@/ai/flows/resume-qa-flow';
import ChatbotBubble from './ChatbotBubble'; // Import the bubble

export interface ChatMessage extends ChatbotInterfaceMessage {}
export interface QuickReply extends QuickReplyButtonProps {}

// No longer needs props from a controller if it's self-contained
const InteractiveChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // Manages its own open/close state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // For AI response loading
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  
  const messageIdCounterRef = useRef(0);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
    if (!isOpen && messages.length === 0) { // If opening for the first time or after clearing
      messageIdCounterRef.current += 1;
      setMessages([{
        id: `${Date.now()}-${messageIdCounterRef.current}`,
        sender: 'ai',
        text: "Hi! I'm Chakradhar's AI assistant. Ask me anything about his resume!"
      }]);
      setQuickReplies([]); // Or offer initial quick replies
    }
  }, [isOpen, messages.length]);

  const addMessage = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode) => {
    if (!isMountedRef.current) return;
    messageIdCounterRef.current += 1;
    const newMessage: ChatMessage = { id: `${Date.now()}-${messageIdCounterRef.current}`, sender, text };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const handleSendMessage = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentInput.trim() || !isMountedRef.current) return;

    const userMessageText = currentInput;
    addMessage('user', userMessageText);
    setCurrentInput('');
    setIsLoading(true);
    setQuickReplies([]); 
    
    try {
      const aiResponse: ResumeQAOutput = await askAboutResume({ question: userMessageText });
      if (isMountedRef.current) {
        addMessage('ai', aiResponse.answer);
      }
    } catch (error) {
      console.error("Error calling Genkit resume Q&A flow:", error);
      if (isMountedRef.current) {
        const errorText = "Sorry, I encountered an error trying to respond. Please try again.";
        addMessage('ai', errorText);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        // Optionally re-add generic quick replies like "Ask another question?"
      }
    }
  }, [currentInput, addMessage]);

  const handleQuickReplyAction = useCallback((action: string) => {
    // Placeholder for now - can be expanded if Chatbot needs its own quick reply logic
    console.log("Quick reply action from Chatbot itself:", action);
    addMessage('user', `Selected: ${action}`); // Example: add user's choice to chat
    setQuickReplies([]); 
    // Here you could trigger different AI queries or actions based on the 'action' string
  }, [addMessage]);

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
        quickReplies={quickReplies}
        onQuickReplyAction={handleQuickReplyAction}
        showTextInput={true} // Always show text input for Q&A bot
      />
    </>
  );
};

export default InteractiveChatbot;
