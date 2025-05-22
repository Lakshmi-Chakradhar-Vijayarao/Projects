// src/components/ai/IntegratedAssistantController.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Play, BotMessageSquare, Square, BrainCircuit } from 'lucide-react'; // Added Play icon
import { askAboutResume } from '@/ai/flows/resume-qa-flow';
import dynamic from 'next/dynamic';
import type { AvatarAction } from './Avatar3D';

// Dynamically import Avatar3D with ssr: false
const Avatar3D = dynamic(() => import('@/components/ai/Avatar3D'), {
  ssr: false,
  loading: () => <p className="fixed bottom-4 right-4 text-xs text-muted-foreground">Loading Avatar...</p>
});

export type TourStepKey =
  | 'idle'
  | 'greeting'
  | 'about'
  | 'skills-section'
  | 'experience'
  | 'projects_intro' // General intro by ContentReader
  | 'speaking_project_titles' // Controller is speaking titles
  | 'project_selection' // Chat interface is open for user to select a project
  | 'project_detail' // A specific project detail is being shown/spoken by controller
  | 'education-section'
  | 'certifications-section'
  | 'publication-section'
  | 'additional_info'
  | 'voice_tour_active' // Generic state when ContentReader is active after initial project title listing
  | 'tour_complete_prompt'
  | 'qa' // When user is in Q&A mode with chatbot
  | 'tour_declined_pending_scroll'
  | 'scrolled_to_end_greeting';


const IntegratedAssistantController: React.FC = () => {
  // State for Chat Interface (InteractiveChatbot)
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [currentChatInput, setCurrentChatInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0); // To force re-mount of chat

  // State for overall Assistant behavior
  const [assistantMode, setAssistantMode] = useState<TourStepKey>('idle');
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const [contactSectionReachedAfterDecline, setContactSectionReachedAfterDecline] = useState(false);

  // State for ContentReader (Voice Tour)
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [currentVoiceTourSectionId, setCurrentVoiceTourSectionId] = useState<string | null>(null);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);

  // State for 3D Avatar
  const [avatarAction, setAvatarAction] = useState<AvatarAction>('idle');
  const [isAvatarVisible, setIsAvatarVisible] = useState(true); // For now, always true if 3D model is used

  // State for project title iteration
  const [isSpeakingProjectTitles, setIsSpeakingProjectTitles] = useState(false);
  const [currentProjectTitleIndex, setCurrentProjectTitleIndex] = useState(0);

  // Refs
  const initialGreetingDoneRef = useRef(false); // Corrected: useRef returns a ref object
  const isMountedRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const messageIdCounterRef = useRef(0);
  const projectTitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  const [isSynthReady, setIsSynthReady] = useState(false);
  const [showChatBubble, setShowBubble] = useState(true); // Bubble initially visible

  // For observing the contact section
  const { ref: contactSectionRefCallback, inView: contactSectionInView } = useInView({ threshold: 0.1, triggerOnce: false });

  useEffect(() => {
    isMountedRef.current = true;
    console.log("IntegratedAssistantController: Component mounted.");

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const checkVoices = () => {
        const voices = synthRef.current?.getVoices();
        if (voices && voices.length > 0) {
          setIsSynthReady(true);
          console.log("IntegratedAssistantController: Speech synthesis initialized with voices.");
          if (synthRef.current) synthRef.current.onvoiceschanged = null;
        } else if (synthRef.current) {
          synthRef.current.onvoiceschanged = null; // Clear previous if any
          synthRef.current.onvoiceschanged = checkVoices;
        }
      };
      // Check immediately and also set listener
      if (synthRef.current.getVoices().length > 0) {
        checkVoices();
      } else {
        synthRef.current.onvoiceschanged = checkVoices;
        // Fallback timeout if onvoiceschanged doesn't fire robustly
        setTimeout(() => {
          if (!isSynthReady && synthRef.current && synthRef.current.getVoices().length > 0) {
            checkVoices();
          }
        }, 500);
      }
    } else {
      console.warn("IntegratedAssistantController: Speech synthesis not supported.");
    }

    return () => {
      isMountedRef.current = false;
      if (synthRef.current) synthRef.current.cancel();
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.onended = null;
        audioPlayerRef.current.onerror = null;
      }
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
      console.log("IntegratedAssistantController: Component unmounted, speech cancelled.");
    };
  }, [isSynthReady]); // Added isSynthReady to re-check if it somehow becomes false

  const speakTextNow = useCallback((text: string, onEnd?: () => void, isChainedCall = false) => {
    if (!isMountedRef.current || !synthRef.current || !isSynthReady) {
      console.warn("IntegratedAssistantController: SpeakTextNow - synth not ready, not mounted, or no text.");
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: speakTextNow called. Text: "${text.substring(0,30)}..." Chained: ${isChainedCall}`);

    setAvatarAction('talking');

    // Clear handlers from any *controller's* previous utterance
    if (controllerUtteranceRef.current) {
      console.log("IntegratedAssistantController: Clearing previous controller utterance handlers.");
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }

    // Only cancel globally if it's NOT a chained call within the controller's own sequence
    if (!isChainedCall && synthRef.current && synthRef.current.speaking) {
        console.log("IntegratedAssistantController: Cancelling active global speech for new primary utterance.");
        synthRef.current.cancel();
    }
    controllerUtteranceRef.current = null; // Clear ref before assigning new utterance

    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance; // Track the current utterance

    let spokenThisCall = false;
    const trySpeak = () => {
        if (!isMountedRef.current || spokenThisCall || !synthRef.current || !controllerUtteranceRef.current || controllerUtteranceRef.current !== utterance ) return; 
        
        spokenThisCall = true;
        console.log(`IntegratedAssistantController: Attempting to speak: "${text.substring(0,30)}..."`);
        synthRef.current.speak(utterance);
    };
    
    utterance.onend = () => {
      console.log(`IntegratedAssistantController: speakTextNow ONEND for: "${text.substring(0,30)}..."`);
      if (controllerUtteranceRef.current === utterance) { // Only act if this is the current utterance
        setAvatarAction('idle');
        if (controllerUtteranceRef.current) {
          controllerUtteranceRef.current.onend = null; 
          controllerUtteranceRef.current.onerror = null;
        }
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
          if (controllerUtteranceRef.current) {
            controllerUtteranceRef.current.onend = null; 
            controllerUtteranceRef.current.onerror = null;
          }
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd(); 
    };
    
    // Voice selection logic (simplified for now)
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      // utterance.voice = voices.find(v => v.name === "Google US English") || voices[0]; // Example voice selection
      trySpeak();
    } else {
      const voiceChangeHandlerForSpeakNow = () => {
          if(synthRef.current) synthRef.current.onvoiceschanged = null; // Detach after use
          trySpeak();
      };
      if(synthRef.current) {
        synthRef.current.onvoiceschanged = null; // Clear previous if any
        synthRef.current.onvoiceschanged = voiceChangeHandlerForSpeakNow;
      }
      
      // Re-check immediately
      const currentVoices = synthRef.current?.getVoices();
      if(currentVoices && currentVoices.length > 0 && !spokenThisCall){
          if(synthRef.current) synthRef.current.onvoiceschanged = null;
          trySpeak();
      } else {
          // Fallback timeout
          setTimeout(() => {
            if (!spokenThisCall && synthRef.current) {
              if(synthRef.current) synthRef.current.onvoiceschanged = null;
              trySpeak();
            }
          }, 300);
      }
    }
  }, [isSynthReady, synthRef, setAvatarAction, isMountedRef]);


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
  }, [setChatMessages, isMountedRef]);

  const initiateGreeting = useCallback(() => {
    if (!isMountedRef.current || !isSynthReady) {
      console.log("IntegratedAssistantController: Greeting skipped - not mounted or synth not ready.");
      return;
    }
    console.log("IntegratedAssistantController: Initiating greeting NOW.");

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
        console.log("IntegratedAssistantController: Speaking initial greeting (deferred).");
        speakTextNow(greetingText);
      }
    });
  }, [addMessageToChat, speakTextNow, isSynthReady, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey, isMountedRef]);
  
  const handleQuickReplyAction = useCallback((action: string) => {
    if (!isMountedRef.current) return;
    setChatQuickReplies([]);
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
    setIsSpeakingProjectTitles(false);

    if (action === 'start_voice_tour_yes') {
      setUserRespondedToGreeting(true);
      const confirmationText = "Excellent! Starting the guided audio tour now.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText);
      speakTextNow(confirmationText, () => {
        if (isMountedRef.current) {
          setTimeout(() => { // Added delay
            if (isMountedRef.current) {
              setIsChatInterfaceOpen(false);
              setShowBubble(false);
              setAssistantMode('voice_tour_active');
              setCurrentVoiceTourSectionId('about'); // Start tour from 'about'
              setStartVoiceTourSignal(prev => !prev);
              setStopVoiceTourSignal(false);
            }
          }, 300);
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
        // @ts-ignore // Using the exposed static data from ContentReader
        const projectDetails = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(s => s.id === 'projects')?.projectDetails;
        const project = projectDetails?.find(pd => pd.title === projectName);

        if (project && project.fullDescription) {
            addMessageToChat('user', `Tell me about: ${projectName}`);
            speakTextNow(project.fullDescription, () => {
                if (isMountedRef.current) {
                    const reprompt = "Anything else on projects, or shall we move to Education?";
                    addMessageToChat('ai', <p>{reprompt}</p>, reprompt);
                    // @ts-ignore
                    const projectButtons = (ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(s => s.id === 'projects')?.projectDetails || [])
                        .map(p => ({ text: p.title, action: `project_detail_${p.title.replace(/\s+/g, '_')}`}));
                    projectButtons.push({ text: "Next Section (Education)", action: 'next_section_education', icon: <Play /> });
                    setChatQuickReplies(projectButtons);
                    speakTextNow(reprompt, undefined, true);
                }
            }, true);
             addMessageToChat('ai', <p>{project.fullDescription}</p>, project.fullDescription); // Display after initiating speech
        }
    } else if (action === 'next_section_education') {
        addMessageToChat('ai', "Alright, moving to the Education section.", "Alright, moving to the Education section.");
        speakTextNow("Alright, moving to the Education section.", () => {
          if (isMountedRef.current) {
            setIsChatInterfaceOpen(false);
            setShowBubble(false);
            setAssistantMode('voice_tour_active');
            setCurrentVoiceTourSectionId('education-section');
            setStartVoiceTourSignal(prev => !prev);
            setStopVoiceTourSignal(false);
          }
        });
    } else if (action === 'ask_anything_now') {
        setAssistantMode('qa');
        const qaPrompt = "Great! What would you like to ask about Chakradhar?";
        addMessageToChat('ai', <p>{qaPrompt}</p>, qaPrompt);
        speakTextNow(qaPrompt);
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
                setVoiceTourCompleted(false);
                setUserRespondedToGreeting(true); // They ended, so consider greeting responded
                initialGreetingDoneRef.current = false; // Allow greeting if they re-open
            }
        });
    }
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setCurrentVoiceTourSectionId, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages, setChatQuickReplies, isMountedRef]);

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
      const errorText = "Sorry, I couldn't fetch a response right now.";
      if (isMountedRef.current) {
        addMessageToChat('ai', <p>{errorText}</p>, errorText);
        speakTextNow(errorText);
      }
    } finally {
      if (isMountedRef.current) {
        setIsAiResponding(false);
        setAvatarAction('idle');
      }
    }
  }, [addMessageToChat, speakTextNow, setAvatarAction, setIsAiResponding, isMountedRef]);

  const handleVoiceTourComplete = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
    setStartVoiceTourSignal(false); // Ensure signal is off
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_tour_qa'); // Transition to post-tour Q&A
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
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setVoiceTourCompleted, setChatQuickReplies, isMountedRef]);

  const handleProjectsStepInController = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log("IntegratedAssistantController: Projects intro spoken by ContentReader. Controller taking over for project titles.");
    setStopVoiceTourSignal(prev => !prev); // Signal ContentReader to stop/pause

    setTimeout(() => { // Ensure ContentReader stops before controller speaks
        if (!isMountedRef.current) return;
        const genericProjectIntro = "Chakradhar has led and contributed to impactful projects. I will now list their titles.";
        addMessageToChat('ai', <p>{genericProjectIntro}</p>, genericProjectIntro);
        setIsChatInterfaceOpen(true);
        setShowBubble(false);
        setAssistantMode('speaking_project_titles');
        speakTextNow(genericProjectIntro, () => {
            if (isMountedRef.current) {
                console.log("IntegratedAssistantController: Finished generic project intro. Starting to speak individual titles.");
                setCurrentProjectTitleIndex(0);
                setIsSpeakingProjectTitles(true); // This triggers the useEffect for titles
            }
        }, false);
    }, 300);
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStopVoiceTourSignal, setIsSpeakingProjectTitles, setCurrentProjectTitleIndex, isMountedRef]);

  const handleSectionSpokenByContentReader = useCallback((sectionId: string, text: string) => {
    if (isMountedRef.current && (assistantMode === 'voice_tour_active' || assistantMode === 'speaking_project_titles')) {
        // @ts-ignore
        const sectionData = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY;
        const sectionDetail = sectionData.find(s => s.id === sectionId);
        const displayName = sectionDetail?.displayName || sectionId.replace(/-/g, ' ').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      addMessageToChat('ai', <div><h4 className="font-semibold mb-1 text-sm text-primary">{displayName}</h4><p className="text-xs">{text}</p></div>, text);
    }
  }, [assistantMode, addMessageToChat, isMountedRef]);


  const mainBubbleClickHandler = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log("IntegratedAssistantController: Bubble/Close clicked. Mode:", assistantMode, "ChatOpen:", isChatInterfaceOpen);

    if (controllerUtteranceRef.current) { controllerUtteranceRef.current.onend = null; controllerUtteranceRef.current.onerror = null; }
    if(synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) synthRef.current.cancel();
    controllerUtteranceRef.current = null;
    if (projectTitleTimeoutRef.current) { clearTimeout(projectTitleTimeoutRef.current); projectTitleTimeoutRef.current = null; }
    
    setStopVoiceTourSignal(prev => !prev); // Signal ContentReader to stop if it was running
    setIsSpeakingProjectTitles(false);
    setAvatarAction('idle');

    if (isChatInterfaceOpen) {
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      setChatQuickReplies([]);
      if (assistantMode === 'voice_tour_active' || assistantMode === 'speaking_project_titles') {
        setAssistantMode('tour_paused'); // A new state to indicate tour was paused by user
      }
    } else { // Bubble was clicked to open chat
      if (assistantMode === 'idle' || assistantMode === 'tour_paused' || voiceTourCompleted || assistantMode === 'tour_declined_pending_scroll' || assistantMode === 'scrolled_to_end_greeting') {
        initialGreetingDoneRef.current = false; // Allow re-greeting
        initiateGreeting();
      } else {
        // This case should ideally not be hit if states are managed well, but as a fallback:
        setIsChatInterfaceOpen(true);
        setShowBubble(false);
        setAssistantMode('qa');
        const helpMsg = "How can I help you regarding Chakradhar's portfolio?";
        addMessageToChat('ai', <p>{helpMsg}</p>, helpMsg);
        speakTextNow(helpMsg);
      }
    }
  }, [isMountedRef, assistantMode, isChatInterfaceOpen, voiceTourCompleted, initiateGreeting, addMessageToChat, speakTextNow, setStopVoiceTourSignal, setIsSpeakingProjectTitles, setAvatarAction, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies, setAssistantMode]);

  // Effect for initial greeting
  useEffect(() => {
    if (isMountedRef.current && isSynthReady && !initialGreetingDoneRef.current) {
      console.log("IntegratedAssistantController: Initial greeting effect triggered.");
      initiateGreeting();
    }
  }, [initiateGreeting, isSynthReady, isMountedRef]);


  // Effect for "No thanks" and scroll to end
  useEffect(() => {
    if (isMountedRef.current && assistantMode === 'tour_declined_pending_scroll' && contactSectionInView && !contactSectionReachedAfterDecline ) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined.");
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
  }, [contactSectionInView, assistantMode, contactSectionReachedAfterDecline, addMessageToChat, speakTextNow, setStopVoiceTourSignal, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey, isMountedRef]);
  
  // Effect for speaking project titles sequentially
  useEffect(() => {
    if (isSpeakingProjectTitles && currentProjectTitleIndex >= 0 && isMountedRef.current) {
      // @ts-ignore
      const projects = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(s => s.id === 'projects')?.projectDetails || [];
      if (currentProjectTitleIndex < projects.length) {
        const project = projects[currentProjectTitleIndex];
        const titleText = `Project: ${project.title}.`;
        addMessageToChat('ai', <p>{titleText}</p>, titleText); // Add to chat
        speakTextNow(titleText, () => { // Speak it
          if (isMountedRef.current && isSpeakingProjectTitles) {
            projectTitleTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current && isSpeakingProjectTitles) {
                setCurrentProjectTitleIndex(prev => prev + 1);
              }
            }, 300); // Small delay between titles
          }
        }, true); // Chained call
      } else { // All project titles spoken
        setIsSpeakingProjectTitles(false);
        const promptText = "Which project would you like to hear more about in detail, or shall we move to the Education section?";
        addMessageToChat('ai', <p>{promptText}</p>, promptText);
        speakTextNow(promptText, () => {
            if (isMountedRef.current) {
                // @ts-ignore
                const projectButtons = (ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(s => s.id === 'projects')?.projectDetails || [])
                  .map(p => ({ text: p.title, action: `project_detail_${p.title.replace(/\s+/g, '_')}`}));
                projectButtons.push({ text: "Next Section (Education)", action: 'next_section_education', icon: <Play /> });
                setChatQuickReplies(projectButtons);
                setAssistantMode('project_selection');
            }
        }, true); // Chained call
      }
    }
    return () => {
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    };
  }, [isSpeakingProjectTitles, currentProjectTitleIndex, addMessageToChat, speakTextNow, setChatQuickReplies, setAssistantMode, setIsSpeakingProjectTitles, setCurrentProjectTitleIndex, isMountedRef]);


  const effectiveShowBubble = showChatBubble && !isChatInterfaceOpen && !(assistantMode === 'voice_tour_active' && startVoiceTourSignal && !voiceTourCompleted) && !isSpeakingProjectTitles;
  const [isClientReadyFor3D, setIsClientReadyFor3D] = useState(false);
  useEffect(() => setIsClientReadyFor3D(true), []);


  return (
    <Fragment>
      <div ref={contactSectionRefCallback} style={{ position: 'absolute', bottom: '0px', height: '1px', width: '1px', pointerEvents: 'none', opacity: 0 }} aria-hidden="true" />
      
      {isClientReadyFor3D && <Avatar3D 
        action={avatarAction} 
        isVisible={isAvatarVisible} 
      />}

      <ChatbotBubble 
        onClick={mainBubbleClickHandler} 
        isVisible={effectiveShowBubble} 
      />
      <InteractiveChatbot
        key={chatInterfaceRenderKey} // Force re-mount on key change
        isOpen={isChatInterfaceOpen}
        mode={assistantMode}
        messages={chatMessages}
        quickReplies={chatQuickReplies}
        isLoading={isAiResponding}
        currentInput={currentChatInput}
        onInputChange={(e) => setCurrentChatInput(e.target.value)}
        onSendMessage={(e) => {
          e.preventDefault();
          if(isMountedRef.current) {
            handleUserQueryForChatbot(currentChatInput);
            setCurrentChatInput('');
          }
        }}
        onClose={mainBubbleClickHandler} // Use the same handler for bubble click and interface close
        onQuickReplyClick={handleQuickReplyAction}
      />
      {isMountedRef.current && <ContentReader
        startSignal={startVoiceTourSignal}
        stopSignal={stopVoiceTourSignal}
        currentGlobalStepId={currentVoiceTourSectionId}
        onSectionSpoken={handleSectionSpokenByContentReader}
        onProjectsIntroSpoken={handleProjectsStepInController}
        onTourComplete={handleVoiceTourComplete}
        speakTextProp={speakTextNow} // Pass centralized speech function
        setAvatarActionProp={setAvatarAction} // Pass avatar action setter
        addMessageToChatProp={addMessageToChat} // Allow ContentReader to add messages
      />}
    </Fragment>
  );
};

export default IntegratedAssistantController;
