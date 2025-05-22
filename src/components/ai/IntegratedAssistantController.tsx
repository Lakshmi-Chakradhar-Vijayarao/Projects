
"use client";
import React, { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader, { sectionsToReadData as tourSectionsData } from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BotMessageSquare, Play, Send, Loader2, ArrowRight, Newspaper, Award, GraduationCap, Brain, Briefcase, User, HomeIcon, Phone, FileText, Github, Linkedin, Mail, Info } from 'lucide-react';

console.log("IntegratedAssistantController.tsx: Module loading");

// Helper function to scroll to a section
const smoothScrollTo = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    console.log(`IntegratedAssistantController: Scrolling to ${elementId}`);
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    console.warn(`IntegratedAssistantController: Element with ID ${elementId} not found for scrolling.`);
  }
};

type TourStepKey =
  | 'idle'
  | 'greeting'
  | 'summary_intro' // Corresponds to 'about' section
  | 'skills_intro'
  | 'experience_intro'
  | 'projects_intro' // Generic intro by ContentReader
  | 'speaking_project_titles' // Controller speaks titles
  | 'project_selection' // Interactive part handled by controller
  | 'project_detail_specific' // When a specific project is being explained
  | 'education_intro'
  | 'certifications_intro'
  | 'publication_intro'
  | 'additional_info_intro'
  | 'voice_tour_active' // General state when ContentReader is active
  | 'post_voice_tour_qa'
  | 'tour_declined_pending_scroll'
  | 'scrolled_to_end_greeting'
  | 'tour_paused'
  | 'qa';

// Assuming pageProjectsData is defined somewhere or imported if needed for project details
// For now, the detailed descriptions for projects are in `tourSectionsData` within ContentReader
const pageProjectsData = tourSectionsData.find(s => s.id === 'projects_intro')?.projectDetails || [];


const IntegratedAssistantController: React.FC = () => {
  console.log("IntegratedAssistantController: Component rendering or re-rendering START");

  // UI State
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [showChatBubble, setShowChatBubble] = useState(true); // Start with bubble visible unless greeting overrides

  // Chat Content State
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);

  // Overall Assistant State
  const [assistantMode, setAssistantMode] = useState<TourStepKey>('idle');
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const initialGreetingDoneRef = useRef(false);
  const isMountedRef = useRef(false);

  // Speech Synthesis State
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [isSynthReady, setIsSynthReady] = useState(false);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Voice Tour (ContentReader) Control
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [currentVoiceTourSectionId, setCurrentVoiceTourSectionId] = useState<string | null>('about'); // Start with 'about'
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  
  // Project Titles Speaking State
  const [isSpeakingProjectTitles, setIsSpeakingProjectTitles] = useState(false);
  const [currentProjectTitleIndex, setCurrentProjectTitleIndex] = useState(0);
  const projectTitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Scroll-to-end state for declined tour
  const [hasDeclinedTour, setHasDeclinedTour] = useState(false);
  const [endOfPageReachedAfterDecline, setEndOfPageReachedAfterDecline] = useState(false);
  const { ref: contactSectionRefForDeclinedTour, inView: contactSectionIsVisibleForDeclinedTour } = useInView({ threshold: 0.3 });
  const messageIdCounterRef = useRef(0);

  useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement && contactSectionRefForDeclinedTour) {
      (contactSectionRefForDeclinedTour as (node?: Element | null | undefined) => void)(contactElement);
    }
  }, [contactSectionRefForDeclinedTour]);


  const addMessageToChat = useCallback((sender: 'ai' | 'user', content: ReactNode, speakableTextOverride?: string) => {
    console.log(`IntegratedAssistantController: Adding message from ${sender}. Speakable: ${!!speakableTextOverride}`);
    messageIdCounterRef.current += 1;
    const newMessageId = `${Date.now()}-${messageIdCounterRef.current}`;
    setChatMessages(prev => [...prev, { id: newMessageId, sender, text: content, speakableText: speakableTextOverride || (typeof content === 'string' ? content : undefined) }]);
  }, []);

  const speakTextNow = useCallback((text: string, onEnd?: () => void, isChainedCall = false) => {
    if (!isMountedRef.current || !synthRef.current || !isSynthReady) {
      console.warn(`IntegratedAssistantController: speakTextNow called but synth not ready or component not mounted. Text: "${text.substring(0,50)}..." SynthReady: ${isSynthReady}, Mounted: ${isMountedRef.current}`);
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: speakTextNow attempting to speak: "${text.substring(0,50)}..." (Chained: ${isChainedCall})`);

    if (controllerUtteranceRef.current) {
        console.log("IntegratedAssistantController: Clearing previous controller utterance handlers.");
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
    }
    
    if (!isChainedCall && synthRef.current.speaking) {
        console.log("IntegratedAssistantController: Cancelling existing global speech for non-chained call.");
        synthRef.current.cancel(); 
    }
    controllerUtteranceRef.current = null;

    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance;

    let spokenOrQueuedThisCall = false;
    const tryToSpeak = () => {
        if (spokenOrQueuedThisCall || !synthRef.current) return;
        console.log(`IntegratedAssistantController: tryToSpeak called for: "${text.substring(0,30)}..."`);
        spokenOrQueuedThisCall = true;
        synthRef.current.speak(utterance);
    };
    
    utterance.onend = () => {
      console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0,50)}..."`);
      if (controllerUtteranceRef.current === utterance) {
          controllerUtteranceRef.current.onend = null; 
          controllerUtteranceRef.current.onerror = null;
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd();
    };

    utterance.onerror = (event) => {
      let errorDetails = "Unknown speech error";
      if (event && (event as SpeechSynthesisErrorEvent).error) {
        errorDetails = (event as SpeechSynthesisErrorEvent).error; 
      }
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Event object:", event);
      
      if (controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current.onend = null; 
          controllerUtteranceRef.current.onerror = null;
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd(); 
    };

    const voices = synthRef.current.getVoices();
    if (voices && voices.length > 0) {
        console.log("IntegratedAssistantController: Voices available, trying to speak directly.");
        tryToSpeak();
    } else {
        console.log("IntegratedAssistantController: Voices not immediately available, setting onvoiceschanged listener.");
        const voiceChangeHandler = () => {
            console.log("IntegratedAssistantController: onvoiceschanged fired, attempting to speak from handler.");
            tryToSpeak();
            if (synthRef.current) synthRef.current.onvoiceschanged = null;
        };
        synthRef.current.onvoiceschanged = voiceChangeHandler;
        setTimeout(() => { // Fallback if onvoiceschanged is unreliable
            if (!spokenOrQueuedThisCall) {
                console.log("IntegratedAssistantController: Voice loading timeout fallback, trying to speak.");
                tryToSpeak();
                if (synthRef.current) synthRef.current.onvoiceschanged = null;
            }
        }, 500);
    }
  }, [isSynthReady]); // Dependencies: isSynthReady (refs synthRef, controllerUtteranceRef, isMountedRef are stable)

  const initiateGreeting = useCallback(() => {
    if (!isMountedRef.current) {
      console.log("IntegratedAssistantController: initiateGreeting called but component not mounted.");
      return;
    }
    if (initialGreetingDoneRef.current) {
      console.log("IntegratedAssistantController: Greeting already initiated, skipping.");
      return;
    }
    console.log("IntegratedAssistantController: Initiating greeting NOW.");
    
    setIsChatInterfaceOpen(true);
    setShowBubble(false);
    console.log("IntegratedAssistantController: Chat interface set to OPEN for greeting.");

    setChatMessages([]); 
    setChatInterfaceRenderKey(prev => prev + 1); 
    
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    
    addMessageToChat('ai', <p>{greetingText}</p>, greetingText);
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <Play className="h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="h-4 w-4" /> },
    ]);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); 
    
    requestAnimationFrame(() => {
        if (isMountedRef.current && synthRef.current && isSynthReady) {
            console.log("IntegratedAssistantController: Attempting to speak (initial greeting) via requestAnimationFrame.");
            speakTextNow(greetingText);
        } else {
            console.warn("IntegratedAssistantController: Synth not ready for initial greeting speech even after rAF, UI should appear if states updated.");
        }
    });
    initialGreetingDoneRef.current = true;
  }, [addMessageToChat, speakTextNow, isSynthReady]); // Relies on stable addMessageToChat, speakTextNow, and isSynthReady


  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); 
    setUserRespondedToGreeting(true);

    if (action === 'start_voice_tour_yes') {
      const confirmationText = "Excellent! Let's begin the guided audio tour now. I'll narrate each section, and the relevant part of the page will be highlighted as we go.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText);
      speakTextNow(confirmationText, () => { // onEnd callback for this speech
        if (isMountedRef.current) {
          console.log("IntegratedAssistantController: User chose 'Yes, Guide Me'. Starting voice tour signal.");
          // Chat box stays open for narration as per user's latest request
          setIsChatInterfaceOpen(true); 
          setShowBubble(false); 
          setChatQuickReplies([]); // Clear yes/no buttons
          setAssistantMode('voice_tour_active');
          setCurrentVoiceTourSectionId('about'); // Start with 'about' section
          setStartVoiceTourSignal(prev => !prev); 
        }
      });
    } else if (action === 'decline_tour') {
      const declineText = "Alright. Feel free to explore at your own pace. You can click my icon if you have questions later!";
      addMessageToChat('ai', <p>{declineText}</p>, declineText);
      speakTextNow(declineText, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false);
          setShowBubble(true);
          setAssistantMode('tour_declined_pending_scroll');
          setHasDeclinedTour(true); 
        }
      });
    } else if (action.startsWith('project_detail_')) {
      const project = pageProjectsData.find(p => p.title.replace(/\s+/g, '_').replace(/[^\w-]+/g, '') === action.replace('project_detail_', ''));
      if (project) {
        const detailText = project.description; // Using full description for detail
        addMessageToChat('ai', <p>{detailText}</p>, detailText);
        speakTextNow(detailText, () => {
            if(isMountedRef.current) {
                const followUp = "Which other project would you like to explore, or shall we move on to Education?";
                addMessageToChat('ai', followUp, followUp);
                const projectButtons = pageProjectsData.map(p => ({
                    text: p.title,
                    action: `project_detail_${p.title.replace(/\s+/g, '_').replace(/[^\w-]+/g, '')}`,
                    icon: <Brain className="h-4 w-4" />
                }));
                setChatQuickReplies([
                    ...projectButtons,
                    { text: "Next Section (Education)", action: 'next_section_education', icon: <ArrowRight className="h-4 w-4" /> }
                ]);
                speakTextNow(followUp);
            }
        }, true); // isChainedCall = true
      }
    } else if (action === 'next_section_education') {
        const movingText = "Alright, moving on to Education.";
        addMessageToChat('ai', movingText, movingText);
        speakTextNow(movingText, () => {
            if(isMountedRef.current) {
                setIsChatInterfaceOpen(true); 
                setShowBubble(false);
                setChatQuickReplies([]);
                setAssistantMode('voice_tour_active');
                setCurrentVoiceTourSectionId('education-section'); 
                setStartVoiceTourSignal(prev => !prev); 
            }
        });
    } else if (action === 'ask_another_question' || action === 'restart_qa') {
        const qaPrompt = "Sure, what else would you like to know about Chakradhar?";
        addMessageToChat('ai', <p>{qaPrompt}</p>, qaPrompt);
        speakTextNow(qaPrompt);
        setAssistantMode('qa'); 
        setChatQuickReplies([]);
    } else if (action === 'download_resume') {
        window.open('/Lakshmi_resume.pdf', '_blank');
        const downloadMsg = "Your download should start shortly.";
        addMessageToChat('ai', downloadMsg, downloadMsg);
        speakTextNow(downloadMsg, () => {
            if (isMountedRef.current) {
                 setChatQuickReplies([ // Re-show end tour options
                    { text: "Ask a Question", action: 'restart_qa', icon: <MessageCircleQuestion className="h-4 w-4" /> },
                    { text: "Download Resume", action: 'download_resume', icon: <Download className="h-4 w-4" /> },
                    { text: "End Chat", action: 'end_chat_final', icon: <XCircle className="h-4 w-4" /> },
                ]);
            }
        });
    } else if (action === 'end_chat_final') {
        const endText = "Thanks for visiting! Have a great day.";
        addMessageToChat('ai', <p>{endText}</p>, endText);
        speakTextNow(endText, () => {
            if (isMountedRef.current) {
                setIsChatInterfaceOpen(false);
                setShowBubble(true);
                setAssistantMode('idle');
            }
        });
    }
  }, [addMessageToChat, speakTextNow]);


  const handleUserQueryForChatbot = useCallback(async (userInput: string) => {
    if (!isMountedRef.current) return;
    addMessageToChat('user', userInput);
    setIsChatbotLoading(true);

    try {
      // const aiResponse = await askAboutResume({ question: userInput }); // This needs to be uncommented and set up
      const aiResponse = { answer: `Regarding "${userInput}", Chakradhar's resume has extensive details. (AI Q&A Placeholder)` };
      addMessageToChat('ai', <p>{aiResponse.answer}</p>, aiResponse.answer);
      speakTextNow(aiResponse.answer);
    } catch (error) {
      console.error("Error fetching AI Q&A response:", error);
      const errorText = "Sorry, I couldn't get a response for that right now.";
      addMessageToChat('ai', <p>{errorText}</p>, errorText);
      speakTextNow(errorText);
    } finally {
      if(isMountedRef.current) setIsChatbotLoading(false);
    }
  }, [addMessageToChat, speakTextNow]);

  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    
    if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    setStopVoiceTourSignal(prev => !prev); // Always signal stop to ContentReader if it was active

    if (isChatInterfaceOpen) { // Closing the chat
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      if (assistantMode === 'voice_tour_active' || assistantMode === 'project_selection' || assistantMode === 'speaking_project_titles') {
        setAssistantMode('tour_paused'); 
      } else if (assistantMode === 'greeting' && !userRespondedToGreeting) {
        setAssistantMode('idle'); 
        initialGreetingDoneRef.current = false; // Allow re-greeting if closed early
      }
    } else { // Opening the chat via bubble
      setEndOfPageReachedAfterDecline(false); 
      setVoiceTourCompleted(false);
      // If tour was declined and then bubble is clicked, or if idle, offer greeting again.
      if (assistantMode === 'tour_declined_pending_scroll' || assistantMode === 'idle' || assistantMode === 'tour_paused') {
        initialGreetingDoneRef.current = false; // Allow greeting to re-trigger
        initiateGreeting();
      } else {
        // If in another state (e.g., QA) and chat was closed, just reopen it.
        setIsChatInterfaceOpen(true);
        setShowBubble(false);
      }
    }
  }, [isChatInterfaceOpen, assistantMode, initiateGreeting, userRespondedToGreeting]);
  
  const handleContentReaderSectionSpoken = useCallback((sectionId: string, text: string) => {
    if (isMountedRef.current && isChatInterfaceOpen) { // Only add if chat interface is meant to be open
        console.log(`IntegratedAssistantController: ContentReader spoke section: ${sectionId}. Displaying in chat.`);
        addMessageToChat('ai', <div><p className="font-semibold italic mb-1">Narrating: {sectionId.replace(/-/g, ' ').replace(/ section| intro/gi, '')}</p><p>{text}</p></div>, text);
    }
  }, [addMessageToChat, isChatInterfaceOpen]);

  const handleProjectsStepInController = useCallback(() => {
    if(isMountedRef.current) {
        console.log("IntegratedAssistantController: ContentReader reached projects intro. Controller taking over for project selection.");
        setStopVoiceTourSignal(prev => !prev); 
        setAssistantMode('project_selection');
        setIsChatInterfaceOpen(true); 
        setShowBubble(false);
        
        const genericProjectIntro = "Chakradhar has led and contributed to impactful projects. I will list their titles. Select one to learn more, or we can move to the next section.";
        addMessageToChat('ai', <p>{genericProjectIntro}</p>, genericProjectIntro);

        speakTextNow(genericProjectIntro, () => {
            if(isMountedRef.current) {
                setCurrentProjectTitleIndex(0);
                setIsSpeakingProjectTitles(true); // This triggers the useEffect to speak titles
            }
        }, false); // Not a chained call
    }
  }, [addMessageToChat, speakTextNow]);

  const handleVoiceTourComplete = useCallback(() => {
    if (isMountedRef.current) {
      console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
      setStartVoiceTourSignal(false); 
      setStopVoiceTourSignal(prev => !prev);
      setVoiceTourCompleted(true);
      setAssistantMode('post_voice_tour_qa');
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
      const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to explore anything else?";
      addMessageToChat('ai', <p>{endMessage}</p>, endMessage);
      setChatQuickReplies([
        { text: "Ask a Question", action: 'restart_qa', icon: <MessageCircleQuestion className="h-4 w-4" /> },
        { text: "Download Resume", action: 'download_resume', icon: <Download className="h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_final', icon: <XCircle className="h-4 w-4" /> },
      ]);
      speakTextNow(endMessage);
    }
  }, [addMessageToChat, speakTextNow]);

  // Effect for scroll-to-end greeting if tour was declined
  useEffect(() => {
    if (hasDeclinedTour && !endOfPageReachedAfterDecline && contactSectionIsVisibleForDeclinedTour && !isChatInterfaceOpen && assistantMode === 'tour_declined_pending_scroll') {
      console.log("IntegratedAssistantController: Scrolled to contact after declining tour. Popping up Q&A prompt.");
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
      setChatMessages([]); 
      setChatInterfaceRenderKey(prev => prev + 1);
      setAssistantMode('scrolled_to_end_greeting');
      const endScrollMessage = "Thanks for taking the time to look through Chakradhar's portfolio! Do you have any questions about his work or experience before you go?";
      addMessageToChat('ai', <p>{endScrollMessage}</p>, endScrollMessage);
      setChatQuickReplies([
        { text: "Ask a Question", action: 'restart_qa', icon: <MessageCircleQuestion className="h-4 w-4" /> },
        { text: "No, I'm Good", action: 'end_chat_final', icon: <XCircle className="h-4 w-4" /> },
      ]);
      speakTextNow(endScrollMessage);
      setEndOfPageReachedAfterDecline(true);
    }
  }, [
    contactSectionIsVisibleForDeclinedTour, hasDeclinedTour, endOfPageReachedAfterDecline, 
    isChatInterfaceOpen, assistantMode, addMessageToChat, speakTextNow
  ]);
  
  // Initialize Speech Synthesis
  useEffect(() => {
    console.log("IntegratedAssistantController: Component did mount. Setting up synth.");
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const voices = synthRef.current.getVoices();
      if (voices && voices.length > 0) {
        setIsSynthReady(true);
        console.log("IntegratedAssistantController: Speech synthesis initialized with voices.");
      } else {
        synthRef.current.onvoiceschanged = () => {
          setIsSynthReady(true);
          console.log("IntegratedAssistantController: Speech synthesis initialized via onvoiceschanged.");
          if(synthRef.current) synthRef.current.onvoiceschanged = null; // Clean up
        };
      }
    } else {
      console.warn("IntegratedAssistantController: Speech synthesis not supported.");
    }
    return () => {
      console.log("IntegratedAssistantController: Component unmounting.");
      isMountedRef.current = false;
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
        synthRef.current.cancel();
      }
      if(projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    };
  }, []);

  // Effect to trigger initial greeting when component mounts & synth is ready
  useEffect(() => {
    console.log("IntegratedAssistantController: Initial Greeting Effect Check...", { isMounted: isMountedRef.current, isSynthReady, greetingDone: initialGreetingDoneRef.current, chatOpen: isChatInterfaceOpen, mode: assistantMode });
    if (isMountedRef.current && isSynthReady && !initialGreetingDoneRef.current && !isChatInterfaceOpen && assistantMode === 'idle') {
      console.log("IntegratedAssistantController: Conditions MET for initial greeting. Calling initiateGreeting.");
       // Small delay to ensure DOM is ready for popup
      const greetTimeout = setTimeout(() => {
        if (isMountedRef.current && !initialGreetingDoneRef.current && !isChatInterfaceOpen && assistantMode === 'idle') {
            initiateGreeting();
        }
      }, 50); // Reduced delay for faster pop-up
      return () => clearTimeout(greetTimeout);
    }
  }, [isSynthReady, assistantMode, isChatInterfaceOpen, initiateGreeting]); 
  
  // Effect for speaking project titles sequentially
  useEffect(() => {
    if (isSpeakingProjectTitles && currentProjectTitleIndex < pageProjectsData.length) {
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
      
      const project = pageProjectsData[currentProjectTitleIndex];
      const titleText = `Project: ${project.title}.`;
      addMessageToChat('ai', <p className="italic">{titleText}</p>, titleText);
      speakTextNow(titleText, () => {
        if (isMountedRef.current && isSpeakingProjectTitles) {
            projectTitleTimeoutRef.current = setTimeout(() => {
             if (isMountedRef.current && isSpeakingProjectTitles) setCurrentProjectTitleIndex(prev => prev + 1);
          }, 300); 
        }
      }, true); 
    } else if (isSpeakingProjectTitles && currentProjectTitleIndex >= pageProjectsData.length) {
      setIsSpeakingProjectTitles(false);
      const promptText = "Which project would you like to hear more about in detail, or shall we move to the Education section?";
      addMessageToChat('ai', <p>{promptText}</p>, promptText);
      speakTextNow(promptText);

      const projectButtons = pageProjectsData.map(p => ({
        text: p.title,
        action: `project_detail_${p.title.replace(/\s+/g, '_').replace(/[^\w-]+/g, '')}`,
        icon: <Brain className="h-4 w-4" />
      }));
      setChatQuickReplies([
        ...projectButtons,
        { text: "Next Section (Education)", action: 'next_section_education', icon: <ArrowRight className="h-4 w-4" /> }
      ]);
    }
    return () => {
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    };
  }, [isSpeakingProjectTitles, currentProjectTitleIndex, addMessageToChat, speakTextNow]);


  console.log("IntegratedAssistantController: Final render state - isChatOpen:", isChatInterfaceOpen, "showBubble:", showChatBubble, "mode:", assistantMode);

  return (
    <>
      <ChatbotBubble 
        onClick={mainBubbleClickHandler} 
        isVisible={showChatBubble} 
      />

      <InteractiveChatbot
        key={chatInterfaceRenderKey}
        isOpen={isChatInterfaceOpen}
        messages={chatMessages}
        quickReplies={chatQuickReplies}
        isLoading={isChatbotLoading}
        currentInput={chatInput}
        onInputChange={(e) => setChatInput(e.target.value)}
        onSendMessage={(e) => {
          e.preventDefault();
          if (chatInput.trim()) {
            handleUserQueryForChatbot(chatInput);
            setChatInput('');
          }
        }}
        onClose={mainBubbleClickHandler} 
        onQuickReplyClick={handleQuickReplyAction}
        mode={
          (assistantMode === 'greeting' || 
           assistantMode === 'project_selection' || 
           assistantMode === 'post_voice_tour_qa' ||
           assistantMode === 'scrolled_to_end_greeting') && chatQuickReplies.length > 0
            ? 'quick-reply' 
            : 'qa'
        }
      />

      <ContentReader
        startSignal={startVoiceTourSignal}
        stopSignal={stopVoiceTourSignal}
        resumeFromSectionId={currentVoiceTourSectionId}
        onSectionSpoken={handleContentReaderSectionSpoken}
        onProjectsIntroSpoken={handleProjectsStepInController}
        onTourComplete={handleVoiceTourComplete}
        speakTextProp={(text, onEnd) => speakTextNow(text, onEnd, true)}
      />
    </>
  );
};

export default IntegratedAssistantController;
    
    