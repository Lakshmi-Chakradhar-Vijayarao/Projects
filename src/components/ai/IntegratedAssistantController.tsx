// src/components/ai/IntegratedAssistantController.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
// Dynamically import Avatar3D with ssr: false
import dynamic from 'next/dynamic';
const Avatar3D = dynamic(() => import('@/components/ai/Avatar3D'), { ssr: false });
import type { AvatarAction } from '@/components/ai/Avatar3D';

import { CheckCircle, XCircle, MessageCircleQuestion, Download, Play, BotMessageSquare, Square } from 'lucide-react';
import { askAboutResume } from '@/ai/flows/resume-qa-flow';
// import { generateSpeechWithElevenLabs } from '@/app/actions/elevenlabs-tts'; // Placeholder

type TourStepKey =
  | 'about'
  | 'skills-section'
  | 'experience'
  | 'projects_intro' // For ContentReader to speak the intro to projects section
  | 'education-section'
  | 'certifications-section'
  | 'publication-section'
  | 'additional_info';

type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'speaking_project_titles' // Controller is speaking individual titles
  | 'project_selection'       // Chat open for user to click project buttons
  | 'project_detail_spoken'
  | 'qa'
  | 'post_voice_tour_qa'
  | 'tour_declined_pending_scroll'
  | 'scrolled_to_end_greeting';

const IntegratedAssistantController: React.FC = () => {
  // State declarations first
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [showChatBubble, setShowBubble] = useState(true); // Start with bubble visible
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [currentChatInput, setCurrentChatInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);
  
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);

  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [currentVoiceTourSectionId, setCurrentVoiceTourSectionId] = useState<TourStepKey | string | null>(null);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  
  const [isSpeakingProjectTitles, setIsSpeakingProjectTitles] = useState(false);
  const [currentProjectTitleIndex, setCurrentProjectTitleIndex] = useState(0);

  const [avatarAction, setAvatarAction] = useState<AvatarAction>('idle');
  const [isAvatarVisible, setIsAvatarVisible] = useState(true); 

  const [isSynthReady, setIsSynthReady] = useState(false);
  const [contactSectionReachedAfterDecline, setContactSectionReachedAfterDecline] = useState(false);

  // Refs
  const initialGreetingDoneRef = useRef(false);
  const isMountedRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  // const audioPlayerRef = useRef<HTMLAudioElement | null>(null); // For ElevenLabs if used
  const messageIdCounterRef = useRef(0);
  const projectTitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({ threshold: 0.1, triggerOnce: false });


  const speakTextNow = useCallback((text: string, onEnd?: () => void, isChainedCall = false) => {
    console.log(`CTRL: speakTextNow. Text: "${text.substring(0,30)}..." Chained: ${isChainedCall}`);
    if (!isMountedRef.current || !synthRef.current || !isSynthReady) {
      console.warn("CTRL: SpeakTextNow - synth not ready or not mounted.");
      if (onEnd) onEnd();
      return;
    }

    setAvatarAction('talking');

    // Clear previous CONTROLLER utterance and its handlers
    if (controllerUtteranceRef.current) {
      console.log("CTRL: Clearing previous controller utterance handlers.");
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    
    // Cancel only if it's not a chained call AND something is already speaking/pending
    if (!isChainedCall && (synthRef.current.speaking || synthRef.current.pending)) {
        console.log("CTRL: Cancelling active/pending global speech for new primary utterance.");
        synthRef.current.cancel(); 
    }
    controllerUtteranceRef.current = null; 

    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance;

    let spokenThisCall = false;
    const tryToSpeak = () => {
      if (spokenThisCall || !synthRef.current) return;
      spokenThisCall = true;
      console.log(`CTRL: Attempting to speak: "${text.substring(0,30)}..."`);
      synthRef.current.speak(utterance);
    };
    
    utterance.onend = () => {
      console.log(`CTRL: speakTextNow ONEND for: "${text.substring(0,30)}..."`);
      if (controllerUtteranceRef.current === utterance) {
        setAvatarAction('idle');
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
          setAvatarAction('idle');
          controllerUtteranceRef.current.onend = null; 
          controllerUtteranceRef.current.onerror = null; 
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd(); 
    };
    
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      tryToSpeak();
    } else {
      const voiceChangeHandler = () => {
        if(synthRef.current) synthRef.current.onvoiceschanged = null;
        tryToSpeak();
      };
      synthRef.current.onvoiceschanged = voiceChangeHandler;
       setTimeout(() => { // Fallback
        if (!spokenThisCall && synthRef.current) {
          if(synthRef.current) synthRef.current.onvoiceschanged = null;
          tryToSpeak();
        }
      }, 300);
    }
  }, [isSynthReady, setAvatarAction]);


  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    if (!isMountedRef.current) return;
    messageIdCounterRef.current += 1;
    const newMessage: ChatbotMessageType = { 
      id: `${Date.now()}-${messageIdCounterRef.current}`, 
      sender, 
      text,
      speakableTextOverride 
    };
    setChatMessages(prev => [...prev, newMessage]);
  }, [setChatMessages]);


  const initiateGreeting = useCallback(() => {
    console.log("CTRL: initiateGreeting called.");
    if (initialGreetingDoneRef.current && assistantMode !== 'idle') {
        console.log("CTRL: Greeting already done or assistant not idle, skipping new greeting.");
        return;
    }
    
    setChatMessages([]);
    setChatInterfaceRenderKey(prev => prev + 1);
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

    requestAnimationFrame(() => {
      if (isMountedRef.current && synthRef.current && isSynthReady) {
        console.log("CTRL: Speaking initial greeting (deferred).");
        speakTextNow(greetingText);
      }
    });
    initialGreetingDoneRef.current = true; 
  }, [addMessageToChat, speakTextNow, isSynthReady, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey, assistantMode]);


  const handleProjectsStepInController = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log("CTRL: Projects intro spoken by ContentReader. Controller taking over.");
    setStopVoiceTourSignal(prev => !prev); // Signal ContentReader to fully stop & clear its queue
    
    // Give a moment for ContentReader's speech to fully clear
    setTimeout(() => {
      if (!isMountedRef.current) return;
      console.log("CTRL: Delay finished, now setting up for project title listing.");
      setIsChatInterfaceOpen(true); 
      setShowBubble(false);
      setAssistantMode('speaking_project_titles');
      
      const genericProjectIntro = "Chakradhar has led and contributed to impactful projects. I will now list their titles.";
      addMessageToChat('ai', <p>{genericProjectIntro}</p>, genericProjectIntro);
      speakTextNow(genericProjectIntro, () => {
        if (isMountedRef.current) {
            console.log("CTRL: Finished generic project intro speech. Starting to speak individual titles.");
            setCurrentProjectTitleIndex(0); // Reset index
            setIsSpeakingProjectTitles(true); 
        }
      }, false); // This is a new speech segment from controller
    }, 300); // Delay to avoid interruption

  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStopVoiceTourSignal, setIsSpeakingProjectTitles, setCurrentProjectTitleIndex]);


  const handleQuickReplyAction = useCallback((action: string) => {
    // ... (previous logic for clearing controllerUtteranceRef and projectTitleTimeoutRef)
    if (!isMountedRef.current) return;
    setChatQuickReplies([]); 
    console.log("CTRL: Quick reply action:", action);

    if (controllerUtteranceRef.current) {
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    if(synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) synthRef.current.cancel();
    controllerUtteranceRef.current = null;
    
    if (projectTitleTimeoutRef.current) {
      clearTimeout(projectTitleTimeoutRef.current);
      projectTitleTimeoutRef.current = null;
    }
    setIsSpeakingProjectTitles(false); // Stop title sequence if a QR is clicked

    if (action === 'start_voice_tour_yes') {
      setUserRespondedToGreeting(true);
      const confirmationText = "Excellent! Let's begin the guided audio tour of Chakradhar's portfolio.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText);
      speakTextNow(confirmationText, () => {
        if (isMountedRef.current) {
          console.log("CTRL: Starting voice tour after confirmation.");
          setIsChatInterfaceOpen(true); 
          setShowBubble(false);
          setChatQuickReplies([]);
          setAssistantMode('voice_tour_active');
          setCurrentVoiceTourSectionId('about'); 
          setStopVoiceTourSignal(false); // Ensure it's not trying to stop immediately
          setStartVoiceTourSignal(prev => !prev);
        }
      });
    } else if (action === 'decline_tour') {
      setUserRespondedToGreeting(true);
      const declineMessage = "Alright. Feel free to explore at your own pace! You can click my icon if you have questions later.";
      addMessageToChat('ai', <p>{declineMessage}</p>, declineMessage);
      speakTextNow(declineMessage, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false);
          setShowBubble(true);
          setAssistantMode('tour_declined_pending_scroll');
        }
      });
    } else if (action.startsWith('project_detail_')) {
        const projectName = action.substring('project_detail_'.length).replace(/_/g, ' ');
        // @ts-ignore 
        const projectDetails = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY.find(s => s.id === 'projects')?.projectDetails;
        const project = projectDetails?.find(pd => pd.title === projectName);

        if (project && project.fullDescription) {
            addMessageToChat('user', `Tell me about: ${projectName}`);
            addMessageToChat('ai', <p>{project.fullDescription}</p>, project.fullDescription);
            speakTextNow(project.fullDescription, () => {
                if (isMountedRef.current) {
                    const reprompt = "Anything else on projects, or shall we move to Education?";
                    addMessageToChat('ai', <p>{reprompt}</p>, reprompt);
                    const projectButtons = (projectDetails || [])
                        .map(p => ({ text: p.title, action: `project_detail_${p.title.replace(/\s+/g, '_')}`}));
                    projectButtons.push({ text: "Next Section (Education)", action: 'next_section_education', icon: <Play /> });
                    setChatQuickReplies(projectButtons);
                    speakTextNow(reprompt, undefined, true); // isChainedCall = true
                }
            }, true); // isChainedCall = true
        }
    } else if (action === 'next_section_education') {
        const educationTransitionMsg = "Alright, moving to the Education section.";
        addMessageToChat('ai', <p>{educationTransitionMsg}</p>, educationTransitionMsg);
        speakTextNow(educationTransitionMsg, () => {
            if (isMountedRef.current) {
                setAssistantMode('voice_tour_active');
                setCurrentVoiceTourSectionId('education-section'); 
                setIsChatInterfaceOpen(true); 
                setShowBubble(false);
                setChatQuickReplies([]);
                setStopVoiceTourSignal(false); 
                setStartVoiceTourSignal(prev => !prev); 
            }
        });
    } else if (action === 'ask_anything_now') {
        setAssistantMode('qa');
        const qaPrompt = "Great! What would you like to ask about Chakradhar?";
        addMessageToChat('ai', <p>{qaPrompt}</p>, qaPrompt);
        speakTextNow(qaPrompt);
        // No quick replies here, user types in input
    } else if (action === 'download_resume') {
        window.open('/Lakshmi_resume.pdf', '_blank'); 
        const downloadMsg = "Your download should start shortly. Anything else?";
        addMessageToChat('ai', <p>{downloadMsg}</p>, downloadMsg);
        speakTextNow(downloadMsg, () => {
            if (isMountedRef.current) {
                 setChatQuickReplies([
                    { text: "Ask another question", action: 'ask_anything_now', icon: <MessageCircleQuestion /> },
                    { text: "End Chat", action: 'end_chat_final', icon: <XCircle /> }
                ]);
            }
        });
    } else if (action === 'end_chat_final') {
         const endMsg = "Thanks for stopping by! Have a great day.";
        addMessageToChat('ai', <p>{endMsg}</p>, endMsg);
        speakTextNow(endMsg, () => {
            if(isMountedRef.current) {
                setIsChatInterfaceOpen(false);
                setShowBubble(true);
                setAssistantMode('idle');
                setVoiceTourCompleted(false); // Reset for potential new session
                setUserRespondedToGreeting(false);
                initialGreetingDoneRef.current = false; // Allow greeting again if bubble clicked
            }
        });
    }
  }, [ addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setCurrentVoiceTourSectionId, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages, setChatQuickReplies, setIsSpeakingProjectTitles]);


  const handleUserQueryForChatbot = useCallback(async (userInput: string) => {
    if (!userInput.trim() || !isMountedRef.current) return;
    addMessageToChat('user', userInput);
    setIsAiResponding(true);
    setAvatarAction('thinking');
    try {
      const aiResponse = await askAboutResume({ question: userInput });
      if (isMountedRef.current) {
        addMessageToChat('ai', <p>{aiResponse.answer}</p>, aiResponse.answer);
        speakTextNow(aiResponse.answer);
      }
    } catch (error) {
      console.error("CTRL: Error getting AI response:", error);
      const errorText = "Sorry, I couldn't fetch a response right now.";
      if (isMountedRef.current) {
        addMessageToChat('ai', <p>{errorText}</p>, errorText);
        speakTextNow(errorText);
      }
    } finally {
      if (isMountedRef.current) setIsAiResponding(false);
    }
  }, [addMessageToChat, speakTextNow, setAvatarAction, setIsAiResponding]);

  const handleSectionSpokenByContentReader = useCallback((sectionId: string, text: string) => {
    if (isMountedRef.current && (assistantMode === 'voice_tour_active')) {
      // @ts-ignore
      const sectionDisplayName = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY.find(s => s.id === sectionId)?.displayName || sectionId.replace(/-/g, ' ').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      addMessageToChat('ai', <div><h4 className="font-semibold mb-1 text-sm text-primary">{sectionDisplayName}</h4><p className="text-xs">{text}</p></div>, text);
    }
  }, [addMessageToChat, assistantMode]);

  const handleVoiceTourComplete = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log("CTRL: Voice tour completed by ContentReader.");
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    setIsChatInterfaceOpen(true);
    setShowBubble(false);
    const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to know more about anything else?";
    addMessageToChat('ai', <p>{endMessage}</p>, endMessage);
    setChatQuickReplies([
      { text: "Ask a question", action: 'ask_anything_now', icon: <MessageCircleQuestion /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download /> },
      { text: "End Chat", action: 'end_chat_final', icon: <XCircle /> }
    ]);
    speakTextNow(endMessage);
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setVoiceTourCompleted, setChatQuickReplies]);

  const mainBubbleClickHandler = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log("CTRL: Bubble/Close clicked. Mode:", assistantMode, "ChatOpen:", isChatInterfaceOpen);

    if (controllerUtteranceRef.current) { controllerUtteranceRef.current.onend = null; controllerUtteranceRef.current.onerror = null; }
    if(synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) synthRef.current.cancel();
    controllerUtteranceRef.current = null;
    if (projectTitleTimeoutRef.current) { clearTimeout(projectTitleTimeoutRef.current); projectTitleTimeoutRef.current = null; }
    
    setStopVoiceTourSignal(prev => !prev); // Signal content reader to stop
    setIsSpeakingProjectTitles(false);
    setAvatarAction('idle');

    if (isChatInterfaceOpen) {
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      setChatQuickReplies([]);
      if (assistantMode === 'voice_tour_active' || assistantMode === 'speaking_project_titles') {
        setAssistantMode('idle'); // Reset mode if tour interrupted by closing
      }
    } else { // Bubble was clicked to open chat
      if (!initialGreetingDoneRef.current || assistantMode === 'idle' || voiceTourCompleted || assistantMode === 'tour_declined_pending_scroll' || assistantMode === 'scrolled_to_end_greeting') {
        initiateGreeting(); // Offer greeting or re-engagement Q&A
      } else { // This case should ideally not be hit if other states are managed well
        setIsChatInterfaceOpen(true);
        setShowBubble(false);
        setAssistantMode('qa'); 
        const helpMsg = "How can I help you regarding Chakradhar's portfolio?";
        addMessageToChat('ai', <p>{helpMsg}</p>, helpMsg);
        speakTextNow(helpMsg);
      }
    }
  }, [isChatInterfaceOpen, assistantMode, voiceTourCompleted, initiateGreeting, addMessageToChat, speakTextNow, setAvatarAction, setStopVoiceTourSignal, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies, setIsSpeakingProjectTitles, setAssistantMode]);
  

  // Effects
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const voiceCheckHandler = () => {
        if (synthRef.current?.getVoices().length) {
          setIsSynthReady(true);
          console.log("CTRL: Speech synthesis initialized with voices.");
          if(synthRef.current) synthRef.current.onvoiceschanged = null;
        }
      };
      if (synthRef.current.getVoices().length) {
        voiceCheckHandler();
      } else {
        synthRef.current.onvoiceschanged = voiceCheckHandler;
      }
    } else {
      console.warn("CTRL: Speech synthesis not supported.");
    }
    return () => {
      isMountedRef.current = false;
      if (synthRef.current) synthRef.current.cancel();
      if (controllerUtteranceRef.current) { controllerUtteranceRef.current.onend = null; controllerUtteranceRef.current.onerror = null; }
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    console.log("CTRL: Initial greeting effect. Mounted:", isMountedRef.current, "SynthReady:", isSynthReady, "GreetingDone:", initialGreetingDoneRef.current);
    if (isMountedRef.current && isSynthReady && !initialGreetingDoneRef.current) {
      console.log("CTRL: Conditions met for initial greeting. Calling initiateGreeting.");
      initiateGreeting();
    }
  }, [isMountedRef, isSynthReady, initiateGreeting]);

  useEffect(() => {
    if (assistantMode === 'tour_declined_pending_scroll' && contactSectionInView && !contactSectionReachedAfterDecline && isMountedRef.current) {
      console.log("CTRL: Contact section in view after tour declined.");
      setStopVoiceTourSignal(prev => !prev); 
      setChatMessages([]); 
      setChatInterfaceRenderKey(prev => prev + 1);
      const scrolledToEndMessage = "Thanks for taking the time to look through Chakradhar's portfolio! Do you have any questions now?";
      addMessageToChat('ai', <p>{scrolledToEndMessage}</p>, scrolledToEndMessage);
      setChatQuickReplies([
        { text: "Ask a question", action: 'ask_anything_now', icon: <MessageCircleQuestion /> },
        { text: "No, I'm good", action: 'end_chat_final', icon: <XCircle /> }
      ]);
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
      setAssistantMode('scrolled_to_end_greeting');
      setContactSectionReachedAfterDecline(true); 
      speakTextNow(scrolledToEndMessage);
    }
  }, [contactSectionInView, assistantMode, contactSectionReachedAfterDecline, addMessageToChat, speakTextNow, setStopVoiceTourSignal, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey]);
  
  useEffect(() => {
    if (isSpeakingProjectTitles && currentProjectTitleIndex >= 0 && isMountedRef.current) {
      // @ts-ignore
      const projects = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY.find(s => s.id === 'projects')?.projectDetails || [];
      if (currentProjectTitleIndex < projects.length) {
        console.log(`CTRL: useEffect speaking project title index: ${currentProjectTitleIndex}`);
        const project = projects[currentProjectTitleIndex];
        const titleText = `Project: ${project.title}.`;
        // Do not add to chat messages here, ContentReader does for its main text
        speakTextNow(titleText, () => {
          if (isMountedRef.current && isSpeakingProjectTitles) {
            projectTitleTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current && isSpeakingProjectTitles) {
                setCurrentProjectTitleIndex(prev => prev + 1);
              }
            }, 300); 
          }
        }, true); 
      } else {
        console.log("CTRL: All project titles spoken by useEffect.");
        setIsSpeakingProjectTitles(false);
        const promptText = "Which project would you like to hear more about in detail, or shall we move to the Education section?";
        addMessageToChat('ai', <p>{promptText}</p>, promptText);
        speakTextNow(promptText, undefined, true);
        // @ts-ignore
        const projectButtons = (ContentReader.sectionsToReadData_FOR_DETAILS_ONLY.find(s => s.id === 'projects')?.projectDetails || [])
          .map(p => ({ text: p.title, action: `project_detail_${p.title.replace(/\s+/g, '_')}`}));
        projectButtons.push({ text: "Next Section (Education)", action: 'next_section_education', icon: <Play /> });
        setChatQuickReplies(projectButtons);
        setAssistantMode('project_selection');
      }
    }
     return () => {
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    };
  }, [isSpeakingProjectTitles, currentProjectTitleIndex, addMessageToChat, speakTextNow, setChatQuickReplies, setAssistantMode, setIsSpeakingProjectTitles, setCurrentProjectTitleIndex]);

  const effectiveShowBubble = !isChatInterfaceOpen && !(assistantMode === 'voice_tour_active' && startVoiceTourSignal && !voiceTourCompleted) && !isSpeakingProjectTitles;

  return (
    <>
      <div ref={contactSectionRef} style={{ position: 'absolute', bottom: '0px', height: '1px', width: '1px', pointerEvents: 'none', opacity: 0 }} />
      
      <Avatar3D 
        action={avatarAction} 
        isVisible={isAvatarVisible} 
      />

      <ChatbotBubble 
        onClick={mainBubbleClickHandler} 
        isVisible={effectiveShowBubble} 
      />
      <InteractiveChatbot
        key={chatInterfaceRenderKey}
        isOpen={isChatInterfaceOpen}
        mode={assistantMode} 
        messages={chatMessages}
        quickReplies={chatQuickReplies}
        isLoading={isAiResponding}
        currentInput={currentChatInput}
        onInputChange={(e) => setCurrentChatInput(e.target.value)}
        onSendMessage={(e) => {
          e.preventDefault();
          handleUserQueryForChatbot(currentChatInput);
          setCurrentChatInput('');
        }}
        onClose={mainBubbleClickHandler}
        onQuickReplyClick={handleQuickReplyAction}
      />
      <ContentReader
        startTourSignal={startVoiceTourSignal}
        stopTourSignal={stopVoiceTourSignal}
        currentSectionIdToSpeak={currentVoiceTourSectionId}
        onSectionSpoken={handleSectionSpokenByContentReader}
        onProjectsIntroSpoken={handleProjectsStepInController} 
        onTourComplete={handleVoiceTourComplete}
        // Pass the controller's speakTextNow and setAvatarAction
        speakTextProp={speakTextNow} 
        setAvatarActionProp={setAvatarAction} 
      />
    </>
  );
};

export default IntegratedAssistantController;

    