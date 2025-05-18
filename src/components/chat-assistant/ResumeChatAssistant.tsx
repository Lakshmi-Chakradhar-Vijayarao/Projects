
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ChatBubble from './ChatBubble';
import ChatInterface, { type ChatMessage, type QuickReplyButton } from './ChatInterface';
import { projectsData as pageProjectsData } from '@/components/sections/projects';
import { CheckCircle, XCircle, ArrowRight, Briefcase, Code, GraduationCap, Award, Download, MessageCircleQuestion, LogOut } from 'lucide-react';

type TourStep =
  | 'greeting'
  | 'summary_intro'
  | 'skills_intro'
  | 'experience_intro'
  | 'projects_list_intro'
  | 'projects_detail'
  | 'education_intro'
  | 'certifications_intro'
  | 'end_tour_prompt'
  | 'ended';

const sectionDetails: Record<string, { id: string, name: string, nextStep?: TourStep, nextButtonText?: string }> = {
  summary: { id: 'summary-section', name: "Lakshmi's Professional Summary", nextStep: 'skills_intro', nextButtonText: "Next: Skills" },
  skills: { id: 'skills-section', name: "Technical Skills", nextStep: 'experience_intro', nextButtonText: "Next: Experience"},
  experience: { id: 'experience', name: "Work Experience", nextStep: 'projects_list_intro', nextButtonText: "Next: Projects" },
  projects: { id: 'projects', name: "Projects Showcase" },
  education: { id: 'education-section', name: "Education Background", nextStep: 'certifications_intro', nextButtonText: "Next: Certifications"},
  certifications: { id: 'certifications-section', name: "Certifications", nextStep: 'end_tour_prompt', nextButtonText: "Finish Tour" }
};

const projectItems = pageProjectsData.map(p => ({ title: p.title, description: p.description, imageHint: p.imageHint, projectUrl: p.projectUrl }));

export default function ResumeChatAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuickReplies, setCurrentQuickReplies] = useState<QuickReplyButton[]>([]);
  const [currentTourStep, setCurrentTourStep] = useState<TourStep>('greeting');
  const [hasBeenGreeted, setHasBeenGreeted] = useState(false);
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);

  const addMessage = useCallback((sender: 'user' | 'assistant', text: React.ReactNode) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), sender, text }]);
  }, []);

  const smoothScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTourStep = useCallback((step: TourStep, payload?: any) => {
    setCurrentTourStep(step);
    setCurrentQuickReplies([]); 

    switch (step) {
      case 'greeting':
        if (!hasBeenGreeted) {
          if (!isChatOpen) { 
            setChatInterfaceRenderKey(prevKey => prevKey + 1);
            setIsChatOpen(true);
            setShowBubble(false);
          }
          addMessage('assistant', "Hi there! 👋 Would you like me to walk you through Lakshmi’s resume?");
          setCurrentQuickReplies([
            { text: "Yes, please!", onClick: () => { addMessage('user', "Yes, please!"); handleTourStep('summary_intro'); }, icon: <CheckCircle className="h-4 w-4"/> },
            { text: "No thanks", onClick: () => { addMessage('user', "No thanks"); handleTourStep('ended'); }, icon: <XCircle className="h-4 w-4"/> },
          ]);
          setHasBeenGreeted(true);
        }
        break;

      case 'summary_intro':
      case 'skills_intro':
      case 'experience_intro':
      case 'education_intro':
      case 'certifications_intro': {
        const sectionKey = step.split('_')[0] as keyof typeof sectionDetails;
        const detail = sectionDetails[sectionKey];
        if (detail) {
          addMessage('assistant', `Let's take a look at ${detail.name}. I'll scroll you there now.`);
          smoothScrollTo(detail.id);
          if (detail.nextStep && detail.nextButtonText) {
            setTimeout(() => { 
                setCurrentQuickReplies([
                    { text: detail.nextButtonText!, onClick: () => { addMessage('user', `Show me ${detail.nextButtonText!}`); handleTourStep(detail.nextStep!); }, icon: <ArrowRight className="h-4 w-4"/> }
                ]);
            }, 1500);
          }
        }
        break;
      }

      case 'projects_list_intro': {
        const detail = sectionDetails.projects;
        addMessage('assistant', `Great! Now for the ${detail.name}. Lakshmi has worked on several interesting projects. I'll scroll you to that section.`);
        smoothScrollTo(detail.id);
        let projectListText = "Here are the projects:\n";
        projectItems.forEach(p => projectListText += `\n- ${p.title}`);
        addMessage('assistant', projectListText);

        const projectButtons: QuickReplyButton[] = projectItems.map(proj => ({
          text: proj.title,
          onClick: () => {
            addMessage('user', `Tell me about ${proj.title}`);
            handleTourStep('projects_detail', proj);
          },
          icon: <Code className="h-4 w-4" />
        }));
        projectButtons.push({
            text: "Next Section: Education",
            onClick: () => { addMessage('user', "Let's move to Education."); handleTourStep('education_intro'); },
            icon: <GraduationCap className="h-4 w-4" />
        });
        setCurrentQuickReplies(projectButtons);
        break;
      }

      case 'projects_detail':
        if (payload && payload.title && payload.description) {
          addMessage('assistant', `Sure! Here's a bit about "${payload.title}":\n\n${payload.description}`);
          const projectButtons: QuickReplyButton[] = projectItems.map(proj => ({
            text: proj.title,
            onClick: () => {
              addMessage('user', `Tell me about ${proj.title}`);
              handleTourStep('projects_detail', proj);
            },
            icon: <Code className="h-4 w-4"/>
          }));
          projectButtons.push({
            text: "Next Section: Education",
            onClick: () => { addMessage('user', "Let's move to Education."); handleTourStep('education_intro'); },
            icon: <GraduationCap className="h-4 w-4" />
          });
          setCurrentQuickReplies(projectButtons);
        }
        break;

      case 'end_tour_prompt':
        addMessage('assistant', "That's a complete tour of Lakshmi’s resume. Would you like to know more about anything else?");
        setCurrentQuickReplies([
          { text: "Ask a question", onClick: () => { addMessage('user', "I have a question."); addMessage('assistant', "Great! This feature will be fully AI-powered soon. For now, please use the contact form!"); setCurrentQuickReplies([{text: "End Chat", onClick: () => handleTourStep('ended'), icon: <LogOut className="h-4 w-4"/>}]) }, icon: <MessageCircleQuestion className="h-4 w-4"/> },
          { text: "Download resume", onClick: () => {
            addMessage('user', "I'd like to download the resume.");
            addMessage('assistant', "You got it! The download should start automatically.");
            const link = document.createElement('a');
            link.href = '/lakshmi_resume.pdf'; 
            link.setAttribute('download', 'Lakshmi_Vijayarao_Resume.pdf');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setCurrentQuickReplies([{text: "End Chat", onClick: () => handleTourStep('ended'), icon: <LogOut className="h-4 w-4"/>}])
          }, icon: <Download className="h-4 w-4"/> },
          { text: "End chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/> },
        ]);
        break;

      case 'ended':
        addMessage('assistant', "Thanks for stopping by! Have a great day.");
        setCurrentQuickReplies([]);
        setTimeout(() => {
          setIsChatOpen(false);
          setShowBubble(true);
        }, 2000);
        break;
    }
  }, [addMessage, hasBeenGreeted, isChatOpen]); // Removed projectItems from dependencies


  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      if (currentTourStep === 'greeting' && !isChatOpen && !hasBeenGreeted) {
        handleTourStep('greeting');
      }
    }, 1500); 

    return () => clearTimeout(greetingTimer);
  }, [currentTourStep, isChatOpen, hasBeenGreeted, handleTourStep]);

  const toggleChat = useCallback(() => {
    const newChatOpenState = !isChatOpen;
    if (newChatOpenState) { 
        setChatInterfaceRenderKey(prevKey => prevKey + 1); 
        if (!hasBeenGreeted) { 
            handleTourStep('greeting'); 
        } else if (currentTourStep === 'ended') { 
            setMessages([]); 
            addMessage('assistant', "Welcome back! How can I help you today?");
            setCurrentQuickReplies([ 
                { text: "Resume Walkthrough", onClick: () => { addMessage('user', "Let's do the walkthrough."); handleTourStep('summary_intro'); }, icon: <Briefcase className="h-4 w-4"/> },
                { text: "Just Browsing", onClick: () => { addMessage('user', "Just browsing."); handleTourStep('ended'); }, icon: <XCircle className="h-4 w-4"/> },
            ]);
            setIsChatOpen(true); 
            setShowBubble(false);
        } else {
             setIsChatOpen(true); 
             setShowBubble(false);
        }
    } else { 
        setIsChatOpen(false);
        setShowBubble(true); 
    }
  }, [isChatOpen, hasBeenGreeted, currentTourStep, handleTourStep, addMessage]);

  return (
    <>
      <ChatBubble onClick={toggleChat} isVisible={showBubble && currentTourStep !== 'greeting'} />
      <ChatInterface
        key={chatInterfaceRenderKey} 
        isOpen={isChatOpen}
        onClose={toggleChat}
        messages={messages}
        quickReplies={currentQuickReplies}
      />
    </>
  );
}
