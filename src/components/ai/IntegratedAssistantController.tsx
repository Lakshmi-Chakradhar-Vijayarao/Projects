
"use client";
import React, { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader'; // Assuming ContentReader is still needed for the tour
import { projectsData as pageProjectsData } from '@/components/sections/projects'; // For project interactions

import { 
    CheckCircle, XCircle, MessageCircleQuestion, Download, Square, 
    BotMessageSquare, Play, Send, Loader2, ArrowRight, BrainCircuit,
    Newspaper, Award, GraduationCap, Briefcase, User, HomeIcon, Phone, 
    FileText, Github, Linkedin, Mail, Info
} from 'lucide-react';

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
  | 'about_me_intro' // Corresponds to 'about' section
  | 'skills_intro'
  | 'experience_intro'
  | 'projects_intro_generic' // Generic intro by ContentReader for its own script
  | 'projects_list_intro'    // Controller lists titles, then interactive
  | 'speaking_project_titles'// Controller speaks titles
  | 'project_detail_specific'// When a specific project is being explained by controller
  | 'education_intro'
  | 'certifications_intro'
  | 'publication_intro'
  | 'additional_info_intro'
  | 'voice_tour_active' // General state when ContentReader is narrating
  | 'post_voice_tour_qa'
  | 'tour_declined_pending_scroll'
  | 'scrolled_to_end_greeting'
  | 'tour_paused'
  | 'qa';

const sectionDetails: Record<string, { id: string; speakableText: string; autoAdvanceTo?: TourStepKey; autoAdvanceDelay?: number; nextStepViaBubble?: TourStepKey; onAction?: 'triggerProjectsInteractive' | 'triggerEndOfTour' }> = {
    about_me_intro: { id: 'about', speakableText: "About Chakradhar: He is a versatile Software Engineer and Machine Learning practitioner. He’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.", autoAdvanceTo: 'skills_intro', autoAdvanceDelay: 100 },
    skills_intro: { id: 'skills-section', speakableText: "His key technical skills include Python, PySpark, DevOps concepts, and Machine Learning techniques like Object Detection and NLP.", autoAdvanceTo: 'experience_intro', autoAdvanceDelay: 100 },
    experience_intro: { id: 'experience', speakableText: "Regarding experience, Chakradhar interned at NSIC, developing an e-commerce platform, and at Zoho, optimizing a video conferencing app.", autoAdvanceTo: 'projects_intro_generic', autoAdvanceDelay: 100 },
    projects_intro_generic: { id: 'projects', speakableText: "Chakradhar has led and contributed to impactful projects such as AI-Powered Crop Detection, a Movie Summary Search Engine, and a Facial Recognition Attendance System.", onAction: 'triggerProjectsInteractive' }, // This triggers the controller to list projects
    education_intro: { id: 'education-section', speakableText: "For education, Chakradhar is pursuing an M.S. in Computer Science at The University of Texas at Dallas and holds a B.E. in Electronics and Communication from R.M.K Engineering College.", autoAdvanceTo: 'certifications_intro', autoAdvanceDelay: 100 },
    certifications_intro: { id: 'certifications-section', speakableText: "He holds certifications from IBM, Microsoft, Meta, and AWS.", autoAdvanceTo: 'publication_intro', autoAdvanceDelay: 100 },
    publication_intro: { id: 'publication-section', speakableText: "Chakradhar presented 'Text Detection Using Deep Learning' at an IEEE Conference.", autoAdvanceTo: 'additional_info_intro', autoAdvanceDelay: 100 },
    additional_info_intro: { id: 'contact', speakableText: "Additional strengths include Git, Linux, REST APIs, and Java OOP. This concludes the main resume sections.", onAction: 'triggerEndOfTour' },
};


const IntegratedAssistantController: React.FC = () => {
  console.log("IntegratedAssistantController: Component rendering or re-rendering START");

  // UI State
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [showChatBubble, setShowChatBubble] = useState(true);

  // Chat Content State
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false); // For Q&A
  const [chatInput, setChatInput] = useState('');
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0); // To force re-render ChatInterface

  // Overall Assistant State
  const [assistantMode, setAssistantMode] = useState<TourStepKey>('idle');
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const initialGreetingDoneRef = useRef(false);
  const isMountedRef = useRef(false);

  // Speech Synthesis State
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [isSynthReady, setIsSynthReady] = useState(false);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null); // For speech by this controller
  const [isSpeakingForAvatar, setIsSpeakingForAvatar] = useState(false); // To cue simple avatar

  // Voice Tour (ContentReader) Control
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [currentVoiceTourSectionId, setCurrentVoiceTourSectionId] = useState<string | null>('about_me_intro');
  
  // Project Titles Speaking State (within controller)
  const [isSpeakingProjectTitles, setIsSpeakingProjectTitles] = useState(false);
  const [currentProjectTitleIndex, setCurrentProjectTitleIndex] = useState(0);
  const projectTitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll-to-end state for declined tour
  const [hasDeclinedTour, setHasDeclinedTour] = useState(false);
  const [endOfPageReachedAfterDecline, setEndOfPageReachedAfterDecline] = useState(false);
  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({ threshold: 0.3 });
  const messageIdCounterRef = useRef(0);


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
    setIsSpeakingForAvatar(true);

    let spokenOrQueuedThisCall = false;
    const tryToSpeak = () => {
        if (spokenOrQueuedThisCall || !synthRef.current) return;
        console.log(`IntegratedAssistantController: trySpeak called for: "${text.substring(0,30)}..."`);
        spokenOrQueuedThisCall = true;
        synthRef.current.speak(utterance);
    };
    
    utterance.onend = () => {
      console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0,50)}..."`);
      setIsSpeakingForAvatar(false);
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
      setIsSpeakingForAvatar(false);
      if (controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current.onend = null; 
          controllerUtteranceRef.current.onerror = null;
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd(); 
    };
    
    // Voice loading can be tricky. Try to speak, fallback to onvoiceschanged.
    const voices = synthRef.current.getVoices();
    if (voices && voices.length > 0) {
        console.log("IntegratedAssistantController: Voices available, trying to speak directly.");
        tryToSpeak();
    } else {
        console.log("IntegratedAssistantController: Voices not immediately available, setting onvoiceschanged listener.");
        const voiceChangeHandler = () => {
            console.log("IntegratedAssistantController: onvoiceschanged fired, attempting to speak from handler.");
            tryToSpeak();
            if (synthRef.current) synthRef.current.onvoiceschanged = null; // Clean up listener
        };
        synthRef.current.onvoiceschanged = voiceChangeHandler;
        // Fallback timeout if onvoiceschanged is unreliable
        setTimeout(() => {
            if (!spokenOrQueuedThisCall) {
                console.log("IntegratedAssistantController: Voice loading timeout fallback, trying to speak.");
                tryToSpeak();
                if (synthRef.current) synthRef.current.onvoiceschanged = null; // Clean up listener
            }
        }, 500); 
    }
  }, [isSynthReady, setIsSpeakingForAvatar]);


  const addMessageToChat = useCallback((sender: 'ai' | 'user', content: ReactNode, speakableTextOverride?: string) => {
    console.log(`IntegratedAssistantController: Adding message from ${sender}. UI: ${typeof content === 'string' ? content.substring(0,30) : '[JSX]'} Speakable: ${!!speakableTextOverride}`);
    messageIdCounterRef.current += 1;
    const newMessageId = `${Date.now()}-${messageIdCounterRef.current}`;
    setChatMessages(prev => [...prev, { id: newMessageId, sender, text: content, speakableText: speakableTextOverride || (typeof content === 'string' ? content : undefined) }]);
    
    // Speak AI messages that have a speakable override (controller's own speech)
    // ContentReader will use its own speakTextProp
    if (sender === 'ai' && speakableTextOverride && assistantMode !== 'voice_tour_active') { // Don't speak if ContentReader is active
        speakTextNow(speakableTextOverride);
    }
  }, [setChatMessages, speakTextNow, assistantMode]);

  const initiateGreeting = useCallback(() => {
    if (initialGreetingDoneRef.current) {
        console.log("IntegratedAssistantController: Greeting already done, skipping initiateGreeting.");
        return;
    }
    console.log("IntegratedAssistantController: Initiating greeting NOW.");
    
    setChatMessages([]); 
    setChatInterfaceRenderKey(prev => prev + 1); 
    
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    
    addMessageToChat('ai', <p>{greetingText}</p>, greetingText); // This will also speak the greeting
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <Play className="h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="h-4 w-4" /> },
    ]);
    
    setIsChatInterfaceOpen(true);
    setShowBubble(false); 
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); 
    
    // Mark as done AFTER setting states and attempting to speak via addMessageToChat
    initialGreetingDoneRef.current = true; 

  }, [addMessageToChat, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey]);


  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); 
    setUserRespondedToGreeting(true);

    if (action === 'start_voice_tour_yes') {
      const confirmationText = "Excellent! Let's begin the guided audio tour now. I'll narrate each section, and the relevant part of the page will be highlighted.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText); // This will speak
      speakTextNow(confirmationText, () => { // Explicit speak for timing control
        if (isMountedRef.current) {
          console.log("IntegratedAssistantController: User chose 'Yes, Guide Me'. Starting voice tour signal.");
          setIsChatInterfaceOpen(true); // Keep chat open for ContentReader's narration
          setShowBubble(false); 
          setChatQuickReplies([]); // Clear yes/no buttons
          setAssistantMode('voice_tour_active');
          setCurrentVoiceTourSectionId('about_me_intro'); // Start with 'about' section
          // Use a timeout to ensure state updates complete before signaling ContentReader
          setTimeout(() => setStartVoiceTourSignal(prev => !prev), 200); 
        }
      });
    } else if (action === 'decline_tour') {
      const declineText = "Alright. Feel free to explore at your own pace. You can click my icon if you have questions later!";
      addMessageToChat('ai', <p>{declineText}</p>, declineText); // This will speak
      speakTextNow(declineText, () => {
         if (isMountedRef.current) {
            setIsChatInterfaceOpen(false);
            setShowBubble(true);
            setAssistantMode('tour_declined_pending_scroll');
            setHasDeclinedTour(true); 
         }
      });
    } else if (action.startsWith('project_detail_')) {
      const projectTitle = action.replace('project_detail_', '').replace(/_/g, ' ');
      const project = pageProjectsData.find(p => p.title === projectTitle);
      if (project) {
        const detailText = project.description; 
        addMessageToChat('ai', <div className="prose prose-sm"><p><strong>{project.title}:</strong></p><p>{detailText}</p></div>, `${project.title}: ${detailText}`);
        speakTextNow(`${project.title}: ${detailText}`, () => {
            if(isMountedRef.current) {
                const followUp = "Which other project would you like to explore, or shall we move on to Education?";
                addMessageToChat('ai', followUp, followUp);
                const projectButtons = pageProjectsData.map(p => ({
                    text: p.title,
                    action: `project_detail_${p.title.replace(/\s+/g, '_').replace(/[^\w-]+/g, '')}`,
                    icon: <BrainCircuit className="h-4 w-4" />
                }));
                setChatQuickReplies([
                    ...projectButtons,
                    { text: "Next Section (Education)", action: 'next_section_education', icon: <ArrowRight className="h-4 w-4" /> }
                ]);
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
                setCurrentVoiceTourSectionId('education_intro'); 
                setTimeout(() => setStartVoiceTourSignal(prev => !prev), 200); // Resume ContentReader
            }
        });
    } else if (action === 'ask_another_question' || action === 'restart_qa') {
        const qaPrompt = "Sure, what else would you like to know about Chakradhar?";
        addMessageToChat('ai', <p>{qaPrompt}</p>, qaPrompt);
        setAssistantMode('qa'); 
        setChatQuickReplies([]);
    } else if (action === 'download_resume') {
        window.open('/Lakshmi_resume.pdf', '_blank'); // Assuming the PDF is named this and in public
        const downloadMsg = "Your download should start shortly.";
        addMessageToChat('ai', downloadMsg, downloadMsg);
        // Re-show end tour options
        setChatQuickReplies([
            { text: "Ask a Question", action: 'restart_qa', icon: <MessageCircleQuestion className="h-4 w-4" /> },
            { text: "Download Resume", action: 'download_resume', icon: <Download className="h-4 w-4" /> },
            { text: "End Chat", action: 'end_chat_final', icon: <XCircle className="h-4 w-4" /> },
        ]);
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
  }, [addMessageToChat, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setHasDeclinedTour, setChatQuickReplies, setCurrentVoiceTourSectionId, setStartVoiceTourSignal, speakTextNow]);


  const handleUserQueryForChatbot = useCallback(async (userInput: string) => {
    if (!isMountedRef.current) return;
    addMessageToChat('user', userInput);
    setIsChatbotLoading(true);
    setAvatarAction('thinking');

    try {
      // const aiResponse = await askAboutResume({ question: userInput }); // This needs to be uncommented and Genkit flow set up
      // Placeholder while Genkit might not be fully active or for testing UI
      const aiResponse = { answer: `Regarding your question about "${userInput}", Chakradhar's detailed resume contains extensive information. (This is a placeholder response as the Genkit Q&A flow needs to be active)` };
      addMessageToChat('ai', <p>{aiResponse.answer}</p>, aiResponse.answer); // This will speak
    } catch (error) {
      console.error("Error fetching AI Q&A response:", error);
      const errorText = "Sorry, I couldn't get a response for that right now.";
      addMessageToChat('ai', <p>{errorText}</p>, errorText); // This will speak
    } finally {
      if(isMountedRef.current) {
          setIsChatbotLoading(false);
          setAvatarAction('idle'); // Revert to idle after attempting to speak
      }
    }
  }, [addMessageToChat, setIsChatbotLoading, setAvatarAction]);

  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    
    if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    setStopVoiceTourSignal(prev => !prev); // Signal stop to ContentReader if it was active
    setAvatarAction('idle'); // Set avatar to idle when bubble is clicked or chat is closed

    if (isChatInterfaceOpen) { // Closing the chat
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      if (assistantMode === 'voice_tour_active' || assistantMode === 'project_selection' || assistantMode === 'speaking_project_titles') {
        setAssistantMode('tour_paused'); 
      }
    } else { // Opening the chat via bubble
      setEndOfPageReachedAfterDecline(false); 
      initialGreetingDoneRef.current = false; // Allow greeting to re-trigger if bubble is clicked
      initiateGreeting();
    }
  }, [isChatInterfaceOpen, assistantMode, initiateGreeting, setAvatarAction, setStopVoiceTourSignal]);
  
  const handleContentReaderSectionSpoken = useCallback((sectionId: string, text: string) => {
    if (isMountedRef.current && isChatInterfaceOpen) { 
        console.log(`IntegratedAssistantController: ContentReader spoke section: ${sectionId}. Displaying in chat.`);
        // The controller's speakTextNow will handle avatar state. We just add text.
        addMessageToChat('ai', <div><p className="font-semibold italic mb-1">Narrating: {sectionDetails[sectionId]?.id.replace(/-/g, ' ').replace(/ section| intro| generic/gi, '') || sectionId}</p><p>{text}</p></div>, text);
    }
  }, [addMessageToChat, isChatInterfaceOpen]);

  const handleProjectsStepInController = useCallback(() => { // Called by ContentReader
    if(isMountedRef.current) {
        console.log("IntegratedAssistantController: ContentReader reached projects intro. Controller taking over for project selection.");
        setStopVoiceTourSignal(prev => !prev); // Pause ContentReader
        setAssistantMode('project_selection');
        setIsChatInterfaceOpen(true); 
        setShowBubble(false);
        
        const projectSelectionPrompt = "Which project would you like to hear more about in detail, or shall we move to the Education section?";
        addMessageToChat('ai', <p>{projectSelectionPrompt}</p>, projectSelectionPrompt); // This will speak

        const projectButtons = pageProjectsData.map(p => ({
            text: p.title,
            action: `project_detail_${p.title.replace(/\s+/g, '_').replace(/[^\w-]+/g, '')}`,
            icon: <BrainCircuit className="h-4 w-4" />
        }));
        setChatQuickReplies([
            ...projectButtons,
            { text: "Next Section (Education)", action: 'next_section_education', icon: <ArrowRight className="h-4 w-4" /> }
        ]);
    }
  }, [addMessageToChat, setAssistantMode, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies, setStopVoiceTourSignal]);

  const handleVoiceTourComplete = useCallback(() => { // Called by ContentReader
    if (isMountedRef.current) {
      console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
      setStartVoiceTourSignal(false); 
      setStopVoiceTourSignal(prev => !prev); // Ensure it's stopped
      setAssistantMode('post_voice_tour_qa');
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
      const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to know more about anything else?";
      addMessageToChat('ai', <p>{endMessage}</p>, endMessage); // This will speak
      setChatQuickReplies([
        { text: "Ask a Question", action: 'restart_qa', icon: <MessageCircleQuestion className="h-4 w-4" /> },
        { text: "Download Resume", action: 'download_resume', icon: <Download className="h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_final', icon: <XCircle className="h-4 w-4" /> },
      ]);
    }
  }, [addMessageToChat, setAssistantMode, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies, setStartVoiceTourSignal, setStopVoiceTourSignal]);

  // Effect for scroll-to-end greeting if tour was declined
  useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement && contactSectionRef) {
        (contactSectionRef as (node?: Element | null | undefined) => void)(contactElement);
    }
    if (hasDeclinedTour && !endOfPageReachedAfterDecline && contactSectionInView && !isChatInterfaceOpen && assistantMode === 'tour_declined_pending_scroll') {
      console.log("IntegratedAssistantController: Scrolled to contact after declining tour. Popping up Q&A prompt.");
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
      setChatMessages([]); 
      setChatInterfaceRenderKey(prev => prev + 1);
      setAssistantMode('scrolled_to_end_greeting');
      const endScrollMessage = "Thanks for taking the time to look through Chakradhar's portfolio! Do you have any questions about his work or experience before you go?";
      addMessageToChat('ai', <p>{endScrollMessage}</p>, endScrollMessage); // This will speak
      setChatQuickReplies([
        { text: "Ask a Question", action: 'restart_qa', icon: <MessageCircleQuestion className="h-4 w-4" /> },
        { text: "No, I'm Good", action: 'end_chat_final', icon: <XCircle className="h-4 w-4" /> },
      ]);
      setEndOfPageReachedAfterDecline(true); // Mark that this specific greeting has been shown
    }
  }, [
    contactSectionInView, hasDeclinedTour, endOfPageReachedAfterDecline, 
    isChatInterfaceOpen, assistantMode, addMessageToChat, contactSectionRef,
    setChatMessages, setChatInterfaceRenderKey, setAssistantMode, setChatQuickReplies, setEndOfPageReachedAfterDecline, setShowBubble
  ]);
  
  // Initialize Speech Synthesis & component mount status
  useEffect(() => {
    console.log("IntegratedAssistantController: Component did mount. Setting up synth.");
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const voices = synthRef.current.getVoices(); // Attempt to load voices
      if (voices && voices.length > 0) {
        setIsSynthReady(true);
        console.log("IntegratedAssistantController: Speech synthesis initialized with voices.");
      } else {
        synthRef.current.onvoiceschanged = () => {
          setIsSynthReady(true);
          console.log("IntegratedAssistantController: Speech synthesis initialized via onvoiceschanged.");
          if(synthRef.current) synthRef.current.onvoiceschanged = null; 
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

  // Effect to trigger initial greeting
  useEffect(() => {
    console.log("IntegratedAssistantController: Initial Greeting Effect Check...", { isMounted: isMountedRef.current, isSynthReady, greetingDone: initialGreetingDoneRef.current, chatOpen: isChatInterfaceOpen, mode: assistantMode });
    if (isMountedRef.current && isSynthReady && !initialGreetingDoneRef.current) {
       console.log("IntegratedAssistantController: Conditions MET for initial greeting. Calling initiateGreeting.");
       // Using a minimal timeout to ensure DOM is ready for popup and synth isn't called too early in lifecycle
       const greetTimeoutId = setTimeout(() => {
            if (isMountedRef.current && !initialGreetingDoneRef.current) { // Re-check condition
                initiateGreeting();
            }
       }, 50); // Small delay
       return () => clearTimeout(greetTimeoutId);
    }
  }, [isSynthReady, initiateGreeting]); // Depends on isSynthReady and stable initiateGreeting
  

  console.log("IntegratedAssistantController: Final render state - isChatOpen:", isChatInterfaceOpen, "showBubble:", showChatBubble, "mode:", assistantMode, "isSpeakingAvatar:", isSpeakingForAvatar);

  return (
    <>
      {/* Avatar display can be added here later, controlled by avatarAction and avatarVisible */}
      {/* For now, focusing on chat and voice tour logic */}
      <SimpleAvatarDisplay isSpeaking={isSpeakingForAvatar} isVisible={true} /> {/* Always visible for now */}


      <ChatbotBubble 
        onClick={mainBubbleClickHandler} 
        isVisible={showChatBubble} 
      />

      <InteractiveChatbot
        key={chatInterfaceRenderKey} // To force re-render and clear old messages when greeting
        isOpen={isChatInterfaceOpen}
        messages={chatMessages}
        quickReplies={chatQuickReplies}
        isLoading={isChatbotLoading || (assistantMode === 'voice_tour_active' && !isSpeakingProjectTitles)} // Show loading during tour narration
        currentInput={chatInput}
        onInputChange={(e) => setChatInput(e.target.value)}
        onSendMessage={(e) => {
          e.preventDefault();
          if (chatInput.trim() && assistantMode === 'qa') { // Only allow send in QA mode
            handleUserQueryForChatbot(chatInput);
            setChatInput('');
          }
        }}
        onClose={mainBubbleClickHandler} 
        onQuickReplyClick={handleQuickReplyAction}
        showInputArea={assistantMode === 'qa'} // Only show input for general Q&A
      />

      <ContentReader
        startTourSignal={startVoiceTourSignal}
        stopTourSignal={stopVoiceTourSignal}
        currentSectionIdToSpeak={currentVoiceTourSectionId}
        onSectionSpoken={handleContentReaderSectionSpoken}
        onProjectsIntroSpoken={handleProjectsStepInController}
        onTourComplete={handleVoiceTourComplete}
        // Pass the controller's speakTextNow for ContentReader to use
        speakTextProp={(text, onEnd) => speakTextNow(text, onEnd, true)} 
      />
    </>
  );
};

export default IntegratedAssistantController;

    