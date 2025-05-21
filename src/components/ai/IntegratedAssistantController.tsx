// src/components/ai/IntegratedAssistantController.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { 
  type ChatMessage as ChatbotMessageType, 
  type QuickReply as ChatbotQuickReplyType 
} from '@/components/chatbot/InteractiveChatbot';
import ContentReader, { ContentReaderSectionsDataForDetails } from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, BotMessageSquare, Play, Square } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

type TourStepId = 
  | 'greeting' 
  | 'summary_intro' // Corresponds to "About Me" section
  | 'skills_intro' 
  | 'experience_intro' 
  | 'projects_list_intro' // Controller speaks intro, then project titles
  | 'projects_detail' 
  | 'education_intro' 
  | 'certifications_intro' 
  | 'publication_intro' 
  | 'additional_info_intro' 
  | 'end_tour_prompt' 
  | 'qa' 
  | 'tour_declined_pending_scroll'
  | 'scrolled_to_end_greeting'
  | 'tour_paused'
  | 'ended';

type AssistantMode = TourStepId; // Use TourStepId as AssistantMode for simplicity

interface ChatMessage extends ChatbotMessageType {}
interface ChatQuickReply extends ChatbotQuickReplyType {}

const IntegratedAssistantController: React.FC = () => {
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [showChatBubble, setShowBubble] = useState(true);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [currentTourStep, setCurrentTourStep] = useState<TourStepId>('greeting');
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatQuickReplyType[]>([]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);

  const [isSynthReady, setIsSynthReady] = useState(false);
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0); // To force re-render ChatInterface

  const initialGreetingDoneRef = useRef(false);
  const isMountedRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messageIdCounterRef = useRef(0);
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [hasDeclinedTour, setHasDeclinedTour] = useState(false);
  const [endOfPageReachedAfterDecline, setEndOfPageReachedAfterDecline] = useState(false);
  
  const [isSpeakingProjectTitles, setIsSpeakingProjectTitles] = useState(false);
  const [currentProjectTitleIndex, setCurrentProjectTitleIndex] = useState(0);
  const projectTitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        setIsSynthReady(true);
        console.log("IntegratedAssistantController: Speech synthesis initialized with voices.");
      } else {
        synthRef.current.onvoiceschanged = () => {
          if (isMountedRef.current && synthRef.current && synthRef.current.onvoiceschanged) {
            setIsSynthReady(true);
            console.log("IntegratedAssistantController: Speech synthesis voices loaded via onvoiceschanged.");
            synthRef.current.onvoiceschanged = null; 
          }
        };
      }
    }
    return () => {
      isMountedRef.current = false;
      if (synthRef.current) synthRef.current.cancel();
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
      }
      if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    };
  }, []);

  const speakTextNow = useCallback((text: string, onEnd?: () => void, isChainedCall = false) => {
    if (!isMountedRef.current || !text || !synthRef.current || !isSynthReady) {
      console.warn("IntegratedAssistantController: SpeakTextNow conditions not met. Synth ready?", isSynthReady, "Text:", text);
      if (onEnd) onEnd();
      return;
    }

    if (controllerUtteranceRef.current) {
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    
    if (synthRef.current.speaking && !isChainedCall) {
      console.log("IntegratedAssistantController: Cancelling previous speech for new controller message.");
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance;

    console.log("IntegratedAssistantController: Attempting to speak:", `"${text.substring(0,50)}..."`);

    utterance.onend = () => {
      if (controllerUtteranceRef.current === utterance) {
        controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd();
    };
    utterance.onerror = (event) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) {
        errorDetails = event.error;
      }
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Event object:", event);
      if (controllerUtteranceRef.current === utterance) {
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd(); 
    };
    
    let spokenThisCall = false;
    const tryToSpeak = () => {
        if (spokenThisCall || !synthRef.current) return;
        spokenThisCall = true;
        synthRef.current.speak(utterance);
        console.log("IntegratedAssistantController: Speech initiated for:", `"${text.substring(0,30)}..."`);
    };

    if (synthRef.current.getVoices().length > 0) {
        tryToSpeak();
    } else {
        synthRef.current.onvoiceschanged = () => {
            console.log("IntegratedAssistantController: Voices loaded, trying to speak in onvoiceschanged for:", `"${text.substring(0,30)}..."`);
            tryToSpeak();
            if (synthRef.current) synthRef.current.onvoiceschanged = null; // Clean up listener
        };
        // Fallback timeout if onvoiceschanged doesn't fire quickly
        setTimeout(() => {
            if (!spokenThisCall) {
                console.warn("IntegratedAssistantController: Voices didn't load via event, attempting to speak via timeout for:", `"${text.substring(0,30)}..."`);
                tryToSpeak();
            }
        }, 500);
    }
  }, [isSynthReady]);

  const addMessageToChat = useCallback((sender: 'user' | 'ai', textNode: React.ReactNode, speakableText?: string) => {
    if (!isMountedRef.current) return;
    messageIdCounterRef.current += 1;
    const newMessage: ChatMessage = { 
        id: `${Date.now()}-${messageIdCounterRef.current}`, 
        sender, 
        text: textNode, 
        speakableTextOverride: speakableText 
    };
    setChatMessages(prev => [...prev, newMessage]);
  }, []);
  
  const initiateGreeting = useCallback(() => {
    if (initialGreetingDoneRef.current || !isMountedRef.current) return;
    console.log("IntegratedAssistantController: Initiating greeting.");
    
    setChatMessages([]); 
    setChatInterfaceRenderKey(prev => prev + 1); 
    setCurrentTourStep('greeting');
    
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    addMessageToChat('ai', <p>{greetingText}</p>, greetingText);
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <Play className="h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="h-4 w-4" /> },
    ]);
    
    setIsChatInterfaceOpen(true);
    setShowBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); 

    if (isSynthReady) {
      console.log("IntegratedAssistantController: Speaking initial greeting.");
      speakTextNow(greetingText);
    } else {
      console.warn("IntegratedAssistantController: Synth not ready for initial greeting speech.");
    }
    initialGreetingDoneRef.current = true;
  }, [addMessageToChat, speakTextNow, isSynthReady, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey]);

  useEffect(() => {
    if (!initialGreetingDoneRef.current && isMountedRef.current && isSynthReady) {
        console.log("IntegratedAssistantController: Initial greeting effect triggered.");
        initiateGreeting();
    }
  }, [initiateGreeting, isSynthReady, isMountedRef]);

  const handleProjectsStepInController = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log("IntegratedAssistantController: Reached projects step, pausing ContentReader and preparing project buttons.");
    setStopVoiceTourSignal(true); // Signal ContentReader to stop its automated flow

    setTimeout(() => { // Small delay to ensure ContentReader stops its speech
        if (!isMountedRef.current) return;
        const genericProjectIntro = "Chakradhar has led and contributed to impactful projects. I will now list their titles.";
        addMessageToChat('ai', <p>{genericProjectIntro}</p>, genericProjectIntro);
        
        speakTextNow(genericProjectIntro, () => {
            if (isMountedRef.current) {
                setCurrentProjectTitleIndex(0);
                setIsSpeakingProjectTitles(true); // This triggers the useEffect to speak titles
                setAssistantMode('speaking_project_titles');
                setIsChatInterfaceOpen(true);
                setShowBubble(false); 
            }
        }, false); 
    }, 300);

  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setCurrentProjectTitleIndex, setIsSpeakingProjectTitles, setStopVoiceTourSignal]);

  useEffect(() => {
    if (!isSpeakingProjectTitles || !isMountedRef.current || currentProjectTitleIndex >= ContentReaderSectionsDataForDetails.find(s => s.id === 'projects')?.projectDetails.length) {
      if (isSpeakingProjectTitles) { // This means all titles were spoken
        setIsSpeakingProjectTitles(false);
        const promptText = "Which project would you like to hear more about in detail, or shall we move to the Education section?";
        addMessageToChat('ai', <p>{promptText}</p>, promptText);
        speakTextNow(promptText);
        const projectButtons = ContentReaderSectionsDataForDetails.find(s => s.id === 'projects')?.projectDetails?.map(p => ({ text: p.title, action: `project_detail_${p.title.replace(/\s+/g, '_')}`, icon: <BotMessageSquare className="h-4 w-4" /> })) || [];
        setChatQuickReplies([
          ...projectButtons,
          { text: "Next Section (Education)", action: 'next_section_education', icon: <Play className="h-4 w-4" /> }
        ]);
        setAssistantMode('projects_detail'); // Mode to show project detail buttons
      }
      return;
    }

    const project = ContentReaderSectionsDataForDetails.find(s => s.id === 'projects')?.projectDetails[currentProjectTitleIndex];
    if (project) {
      const titleToSpeak = `Project: ${project.title}.`;
      addMessageToChat('ai', <p>{titleToSpeak}</p>, titleToSpeak);
      speakTextNow(titleToSpeak, () => {
        if (isMountedRef.current) {
          if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
          projectTitleTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setCurrentProjectTitleIndex(prev => prev + 1);
          }, 200); // Short delay between titles
        }
      }, true); // isChainedCall = true
    }
  }, [isSpeakingProjectTitles, currentProjectTitleIndex, addMessageToChat, speakTextNow, setChatQuickReplies, setAssistantMode, setIsSpeakingProjectTitles]);


  const handleQuickReplyAction = useCallback((action: string) => {
    if (!isMountedRef.current) return;
    setChatQuickReplies([]);
    
    if (action === 'start_voice_tour_yes') {
      setUserRespondedToGreeting(true);
      const confirmationText = "Excellent! Let's begin the guided audio tour.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText);
      speakTextNow(confirmationText, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(true); // Keep chat box open
          setShowBubble(false);
          setCurrentTourStep('summary_intro'); // Start from summary
          setStartVoiceTourSignal(true);
          setStopVoiceTourSignal(false);
          setAssistantMode('voice_tour_active');
        }
      });
    } else if (action === 'decline_tour') {
      setUserRespondedToGreeting(true);
      setHasDeclinedTour(true);
      const declineMessage = "Alright. Feel free to explore at your own pace. You can click my icon if you have questions later!";
      addMessageToChat('ai', <p>{declineMessage}</p>, declineMessage);
      speakTextNow(declineMessage, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false); setShowBubble(true); setAssistantMode('tour_declined_pending_scroll');
        }
      });
    } else if (action.startsWith('project_detail_')) {
      const projectTitle = action.substring('project_detail_'.length).replace(/_/g, ' ');
      const project = ContentReaderSectionsDataForDetails.find(s => s.id === 'projects')?.projectDetails?.find(pd => pd.title === projectTitle);
      if (project && project.description) {
        const detailText = `${project.title}. ${project.description}`;
        addMessageToChat('ai', <div><p className="font-semibold">{project.title}</p><p>{project.description}</p></div>, detailText);
        speakTextNow(detailText, () => {
           if (isMountedRef.current) {
             const followUpPrompt = "Which other project would you like to hear about, or shall we continue to Education?";
             addMessageToChat('ai', <p>{followUpPrompt}</p>, followUpPrompt);
             speakTextNow(followUpPrompt);
             const projectButtons = ContentReaderSectionsDataForDetails.find(s => s.id === 'projects')?.projectDetails?.map(p => ({ text: p.title, action: `project_detail_${p.title.replace(/\s+/g, '_')}`, icon: <BotMessageSquare className="h-4 w-4"/> })) || [];
             setChatQuickReplies([
                ...projectButtons,
                { text: "Next Section (Education)", action: 'next_section_education', icon: <Play className="h-4 w-4" /> }
             ]);
           }
        });
      }
    } else if (action === 'next_section_education') {
      setStopVoiceTourSignal(false); // Ensure any previous stop signal is cleared
      setCurrentTourStep('education_intro');
      setStartVoiceTourSignal(true); // Resume ContentReader for education
      setIsChatInterfaceOpen(true); // Keep chat open
      setShowBubble(false);
      setAssistantMode('voice_tour_active');
      setChatQuickReplies([]); // Clear project buttons
    } else if (action === 'ask_question_init') {
      setAssistantMode('qa');
      const qaPrompt = "Sure, what would you like to know about Chakradhar?";
      addMessageToChat('ai', <p>{qaPrompt}</p>, qaPrompt);
      speakTextNow(qaPrompt);
      setChatQuickReplies([]);
    } else if (action === 'download_resume_action') {
      const downloadMessage = "Downloading Chakradhar's resume...";
      addMessageToChat('ai', <p>{downloadMessage}</p>, downloadMessage);
      speakTextNow(downloadMessage);
      window.open('/Lakshmi_resume.pdf', '_blank'); // Ensure the resume name is correct
      setChatQuickReplies([
        { text: "Ask another question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
      ]);
    } else if (action === 'end_chat_action') {
      const endMessage = "Thanks for visiting! Have a great day.";
      addMessageToChat('ai', <p>{endMessage}</p>, endMessage);
      speakTextNow(endMessage, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false); setShowBubble(true); setAssistantMode('ended');
        }
      });
    }
  }, [
    addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, 
    setAssistantMode, setUserRespondedToGreeting, setChatQuickReplies, 
    setCurrentTourStep, setStartVoiceTourSignal, setStopVoiceTourSignal, 
    setHasDeclinedTour
  ]);

  const handleVoiceTourComplete = useCallback(() => {
    if (isMountedRef.current) {
      setStartVoiceTourSignal(false);
      setVoiceTourCompleted(true);
      const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to know more about anything else?";
      addMessageToChat('ai', <p>{endMessage}</p>, endMessage);
      speakTextNow(endMessage);
      setChatQuickReplies([
        { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
        { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true); // Keep chat open
      setShowBubble(false);
      setAssistantMode('end_tour_prompt');
    }
  }, [addMessageToChat, speakTextNow, setChatQuickReplies, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStartVoiceTourSignal, setVoiceTourCompleted]);
  
  useEffect(() => {
    if (hasDeclinedTour && !endOfPageReachedAfterDecline && contactSectionInView && assistantMode !== 'scrolled_to_end_greeting') {
      if (isMountedRef.current) {
        console.log("IntegratedAssistantController: Contact section in view after tour declined.");
        setIsChatInterfaceOpen(true);
        setShowBubble(false);
        setAssistantMode('scrolled_to_end_greeting');
        setChatInterfaceRenderKey(prev => prev + 1);
        setChatMessages([]);
        const endScrollMessage = "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions or want to connect?";
        addMessageToChat('ai', <p>{endScrollMessage}</p>, endScrollMessage);
        speakTextNow(endScrollMessage);
        setChatQuickReplies([
          { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" />  },
          { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
          { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
        ]);
        setEndOfPageReachedAfterDecline(true); 
      }
    }
  }, [contactSectionInView, hasDeclinedTour, endOfPageReachedAfterDecline, assistantMode, addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey]);
  
  const mainBubbleClickHandler = useCallback(() => {
    if (!isMountedRef.current) return;

    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current);
    if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    
    setStopVoiceTourSignal(true); // Signal ContentReader to stop if it was running

    if (isChatInterfaceOpen) {
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      if (assistantMode === 'voice_tour_active' || assistantMode === 'speaking_project_titles') {
        setAssistantMode('tour_paused');
      } else if (assistantMode !== 'tour_declined_pending_scroll' && assistantMode !== 'scrolled_to_end_greeting' && assistantMode !== 'greeting') {
         setAssistantMode(voiceTourCompleted ? 'post_voice_tour_qa' : 'ended');
      }
    } else { 
      setChatInterfaceRenderKey(prev => prev + 1);
      setChatMessages([]); 
      let openMode: AssistantMode = 'greeting';
      let greetingMessageText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
      let replies: ChatQuickReply[] = [
        { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <Play className="h-4 w-4" /> },
        { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="h-4 w-4" /> },
      ];

      if (userRespondedToGreeting) { // User has been greeted before
        if (assistantMode === 'tour_paused') {
          openMode = 'tour_paused';
          greetingMessageText = "The guided tour is paused. You can ask a question, resume, or end the chat.";
          replies = [
              { text: "Resume Tour", action: 'start_voice_tour_yes', icon: <Play className="h-4 w-4" />},
              { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
              { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
              { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
          ];
        } else if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa' || assistantMode === 'scrolled_to_end_greeting' || assistantMode === 'ended') {
            openMode = 'post_voice_tour_qa';
            greetingMessageText = voiceTourCompleted ? "The tour is complete. How else can I help you regarding Chakradhar?" : "Welcome back! Feel free to ask any questions about Chakradhar.";
            replies = [
              { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
              { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
              { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
            ];
        }
      } else { // First time interaction, reset for full greeting
        initialGreetingDoneRef.current = false; 
      }
      
      if (!initialGreetingDoneRef.current || openMode === 'greeting') {
        initiateGreeting(); // This will set the correct messages and replies
      } else {
        addMessageToChat('ai', <p>{greetingMessageText}</p>, greetingMessageText);
        speakTextNow(greetingMessageText);
        setChatQuickReplies(replies);
        setAssistantMode(openMode);
        setIsChatInterfaceOpen(true);
        setShowBubble(false);
      }
    }
  }, [
    isChatInterfaceOpen, assistantMode, voiceTourCompleted, userRespondedToGreeting, 
    initiateGreeting, addMessageToChat, speakTextNow, 
    setIsChatInterfaceOpen, setShowBubble, setAssistantMode, 
    setStopVoiceTourSignal, setChatQuickReplies, setChatMessages, setChatInterfaceRenderKey
  ]);

  const effectiveShowBubble = showChatBubble && !isChatInterfaceOpen && assistantMode !== 'voice_tour_active' && assistantMode !== 'speaking_project_titles';

  return (
    <>
      <div ref={contactSectionRef} style={{ position: 'absolute', bottom: '0px', height: '1px', width: '1px', opacity: 0 }} />
      <ChatbotBubble 
        onClick={mainBubbleClickHandler} 
        isVisible={effectiveShowBubble} 
      />
      {isMountedRef.current && (
        <InteractiveChatbot
          key={`chat-interface-${chatInterfaceRenderKey}`}
          isOpen={isChatInterfaceOpen}
          onClose={mainBubbleClickHandler} 
          initialMessages={chatMessages}
          initialQuickReplies={chatQuickReplies}
          onQuickReplyAction={handleQuickReplyAction}
          isLoading={isChatbotLoading}
          currentMode={assistantMode} 
        />
      )}
      {isMountedRef.current && (
        <ContentReader
          startTourSignal={startVoiceTourSignal}
          stopTourSignal={stopVoiceTourSignal}
          currentGlobalStepId={currentTourStep} // For ContentReader to know where to start/resume
          onTourComplete={handleVoiceTourComplete}
          onProjectsStepReached={handleProjectsStepInController}
          addMessageToChat={addMessageToChat} // Pass this so ContentReader can add its spoken text to chat
          speakTextProp={speakTextNow} // Pass the controller's speech function
        />
      )}
    </>
  );
};

export default IntegratedAssistantController;
