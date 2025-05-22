// src/components/chatbot/InteractiveChatbot.tsx
"use client";
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import ChatbotInterface, { 
    type ChatMessage as ChatbotInterfaceMessage, // Renamed to avoid conflict
    type QuickReplyButtonProps as ChatbotQuickReplyButtonProps 
} from './ChatbotInterface';
// Removed direct Genkit import, will be handled by controller
// import { askAboutResume, type ResumeQAInput, type ResumeQAOutput } from '@/ai/flows/resume-qa-flow';

export interface ChatMessage extends ChatbotInterfaceMessage {} // Use the renamed type
export interface QuickReply extends ChatbotQuickReplyButtonProps {}

type InteractiveChatbotMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'project_selection'
  | 'project_detail_spoken'
  | 'qa'
  | 'post_voice_tour_qa'
  | 'tour_declined_pending_scroll'
  | 'scrolled_to_end_greeting';

interface InteractiveChatbotProps {
  isOpen: boolean;
  mode: InteractiveChatbotMode;
  messages: ChatMessage[];
  quickReplies: QuickReply[];
  isLoading: boolean;
  currentInput: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (e: FormEvent<HTMLFormElement>) => void; // Controller handles AI call
  onClose: () => void;
  onQuickReplyClick: (action: string) => void; // Controller handles action
}

const InteractiveChatbot: React.FC<InteractiveChatbotProps> = ({
  isOpen,
  mode,
  messages,
  quickReplies: initialQuickReplies, // Renamed prop to avoid confusion
  isLoading,
  currentInput,
  onInputChange,
  onSendMessage,
  onClose,
  onQuickReplyClick,
}) => {
  // Internal state for quick replies to display, derived from props
  const [displayQuickReplies, setDisplayQuickReplies] = useState<QuickReply[]>([]);

  useEffect(() => {
    // Update displayed quick replies when the prop changes
    setDisplayQuickReplies((initialQuickReplies || []).map(qr => ({ 
        text: qr.text, 
        action: qr.action, 
        icon: qr.icon 
    })));
  }, [initialQuickReplies]);
  
  // Determine if text input should be shown based on current mode and quick replies
  const showTextInput = mode === 'qa' || mode === 'post_voice_tour_qa' || 
                       (mode === 'project_detail_spoken' && (!displayQuickReplies || displayQuickReplies.length === 0));


  return (
    <ChatbotInterface
      isOpen={isOpen}
      onClose={onClose}
      messages={messages}
      currentInput={currentInput}
      onInputChange={onInputChange}
      onSendMessage={onSendMessage} // Passed directly to interface
      isLoading={isLoading}
      quickReplies={displayQuickReplies} // Use the state variable for display
      onQuickReplyAction={onQuickReplyClick} // Passed directly to interface
      showTextInput={showTextInput}
    />
  );
};

export default InteractiveChatbot;
