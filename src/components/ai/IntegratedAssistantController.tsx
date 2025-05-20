
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { projectsData as pageProjectsData } from '@/components/sections/projects';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BrainCircuit, BotMessageSquare, Play, Volume2, VolumeX, ArrowRight, ArrowLeft } from 'lucide-react';

type TourStepId = 
  | 'greeting'
  | 'about' 
  | 'skills_intro' 
  | 'experience_intro' 
  | 'projects_intro' 
  | 'projects_list_intro' 
  | 'projects_detail' 
  | 'education_intro' 
  | 'certifications_intro' 
  | 'publication_intro' 
  | 'additional_info_intro' 
  | 'tour_declined'
  | 'scrolled_to_end_greeting'
  | 'post_voice_tour_qa'
  | 'qa' 
  | 'voice_tour_active' 
  | 'voice_tour_paused_by_user' 
  | 'speaking_project_titles'
  | 'ended';

type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'voice_tour_paused_by_user' 
  | 'qa' 
  | 'post_voice_tour_qa' 
  | 'scrolled_to_end_greeting' 
  | 'tour_declined_pending_scroll'
  | 'speaking_project_titles';

interface SectionDetail {
  id: string;
  speakableIntro: string;
  uiMessage?: () => React.ReactNode;
  autoAdvanceTo?: TourStepId;
  autoAdvanceDelay?: number;
  nextStepViaBubble?: TourStepId;
  interactiveQuickReplies?: (controller: IntegratedAssistantController) => ChatbotQuickReplyType[];
}

const sectionDetails: Record<Exclude<TourStepId, 'greeting' | 'projects_detail' | 'qa' | 'tour_declined' | 'scrolled_to_end_greeting' | 'post_voice_tour_qa' | 'voice_tour_paused_by_user' | 'speaking_project_titles' | 'ended'>, SectionDetail> = {
  about: { 
    id: "about", 
    speakableIntro: "About Chakradhar: He is a versatile Software Engineer and Machine Learning practitioner. He’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.",
    autoAdvanceTo: 'skills_intro',
    autoAdvanceDelay: 100, // Fast auto-advance
  },
  skills_intro: { 
    id: "skills-section", 
    speakableIntro: "Chakradhar's core technical skills include Python, PySpark, DevOps Concepts, and Machine Learning.",
    uiMessage: () => (
      <div className="space-y-1">
        <p>Chakradhar's core technical skills include:</p>
        <ul className="list-disc pl-5 text-sm">
          <li>Python</li>
          <li>PySpark</li>
          <li>DevOps Concepts</li>
          <li>Machine Learning</li>
        </ul>
      </div>
    ),
    autoAdvanceTo: 'experience_intro',
    autoAdvanceDelay: 100,
  },
  experience_intro: { 
    id: "experience", 
    speakableIntro: "Regarding his experience: At NSIC Technical Services Centre in Chennai, as an Intern from April to June 2023, Chakradhar built an e-commerce platform, secured login with OAuth2 and JWT, and conducted Android full-stack training. At Zoho Corporation, also in Chennai, as a Summer Internship Project Associate from March to April 2022, he refined backend APIs for a video app and integrated WebRTC for over a thousand real-time users.",
    autoAdvanceTo: 'projects_intro',
    autoAdvanceDelay: 100,
  },
  projects_intro: { // This is where ContentReader calls onProjectsStepReached
    id: "projects", 
    speakableIntro: "Chakradhar has led and contributed to impactful projects. I will now list their titles.",
    // No autoAdvanceTo here, controller takes over
  },
  projects_list_intro: { // Controller handles this step UI and further interactions
    id: "projects",
    speakableIntro: "Which project would you like to hear more about in detail, or shall we move to the Education section?",
    // Quick replies will be dynamically generated
  },
  education_intro: { 
    id: "education-section", 
    speakableIntro: "His education includes: A Master of Science in Computer Science from The University of Texas at Dallas, with a GPA of 3.607, and a Bachelor of Engineering in Electronics and Communication from R.M.K Engineering College, India, with a GPA of 9.04.",
    autoAdvanceTo: 'certifications_intro',
    autoAdvanceDelay: 100,
  },
  certifications_intro: { 
    id: "certifications-section", 
    speakableIntro: "Chakradhar holds certifications from leading organizations: IBM DevOps and Software Engineering, Microsoft Full-Stack Developer, Meta Back-End Developer, and AWS Certified Cloud Practitioner.",
    autoAdvanceTo: 'publication_intro',
    autoAdvanceDelay: 100,
  },
  publication_intro: { 
    id: "publication-section", 
    speakableIntro: "His publication is 'Text Detection Using Deep Learning', where he built a handwriting recognition model achieving 98.6% training accuracy, presented at an IEEE Conference.",
    autoAdvanceTo: 'additional_info_intro',
    autoAdvanceDelay: 100,
  },
  additional_info_intro: { 
    id: "contact", // Or a specific "Additional Info" section if it exists
    speakableIntro: "Additionally, Chakradhar is proficient with Git, Linux, REST APIs, has a strong OOP and multithreading background in Java, and is experienced in model evaluation and computer vision with Scikit-learn and YOLO. This concludes the guided tour.",
    // No autoAdvanceTo, calls onTourComplete
  },
};


const IntegratedAssistantController: React.FC = () => {
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [showChatBubble, setShowChatBubble] = useState(true);
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState<TourStepId>('greeting');
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0); // To force re-render ChatInterface
  
  const [isSynthReady, setIsSynthReady] = useState(false);
  const [isSpeakingProjectTitles, setIsSpeakingProjectTitles] = useState(false);
  const [currentProjectTitleIndex, setCurrentProjectTitleIndex] = useState(0);
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const initialGreetingDoneRef = useRef(false);
  const messageIdCounterRef = useRef(0);
  const projectTitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);


  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1,
    triggerOnce: false, 
  });

  const addMessageToChat = useCallback((sender: 'user' | 'ai', text: string | React.ReactNode, speakableTextOverride?: string) => {
    messageIdCounterRef.current += 1;
    const newMessage: ChatbotMessageType = {
      id: `${Date.now()}-${messageIdCounterRef.current}`,
      sender,
      text,
      timestamp: new Date(),
      speakableTextOverride,
    };
    setChatMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, [setChatMessages]);

  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !text || !isSynthReady) {
      console.warn("IntegratedAssistantController: SpeakTextNow conditions not met or text empty.", { isMounted: isMountedRef.current, synth: !!synthRef.current, textProvided: !!text, isSynthReady });
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: Attempting to speak: "${text.substring(0, 50)}..."`);
    
    if (controllerUtteranceRef.current) {
      console.log("IntegratedAssistantController: Clearing handlers from previous controller utterance.");
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }

    if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
        console.log("IntegratedAssistantController: Global synth.cancel() called for controller's own speech.");
        synthRef.current.cancel(); 
    }
    controllerUtteranceRef.current = null;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (controllerUtteranceRef.current === utterance) { 
        console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0, 50)}..."`);
        controllerUtteranceRef.current = null; 
        if (onEnd) onEnd();
      }
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) errorDetails = event.error; 
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Event object:", event);
      if (controllerUtteranceRef.current === utterance) controllerUtteranceRef.current = null;
      if (onEnd) onEnd(); 
    };
    controllerUtteranceRef.current = utterance; 
    synthRef.current.speak(utterance);
  }, [isSynthReady]);

  const speakNextProjectTitle = useCallback(() => {
    if (currentProjectTitleIndex < pageProjectsData.length) {
      const project = pageProjectsData[currentProjectTitleIndex];
      const introText = `Project: ${project.title}.`;
      addMessageToChat('ai', <p>{introText}</p>, introText); 
      speakTextNow(introText, () => {
        setCurrentProjectTitleIndex(prev => prev + 1);
      }, true); // isChainedCall = true
    } else {
      setIsSpeakingProjectTitles(false);
      const promptMsg = "Which project would you like to hear more about in detail, or shall we move to the Education section?";
      addMessageToChat('ai', <p>{promptMsg}</p>, promptMsg);
      speakTextNow(promptMsg);

      const projectButtons: ChatbotQuickReplyType[] = pageProjectsData.map(p => ({
        text: p.title,
        action: `project_detail_${p.title.replace(/\s+/g, '_')}`,
        icon: <BrainCircuit className="mr-2 h-4 w-4" />
      }));
      projectButtons.push({ text: "Next Section (Education)", action: "next_section_education", icon: <ArrowRight className="mr-2 h-4 w-4" /> });
      setChatQuickReplies(projectButtons);
      setIsChatInterfaceOpen(true); 
      setShowChatBubble(false);
      setAssistantMode('qa'); 
      setCurrentTourStep('projects_list_intro'); 
    }
  }, [currentProjectTitleIndex, addMessageToChat, speakTextNow, setCurrentProjectTitleIndex, setIsSpeakingProjectTitles, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep, setChatQuickReplies]);


  useEffect(() => {
    if (isSpeakingProjectTitles && currentProjectTitleIndex < pageProjectsData.length) {
      if(projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
      projectTitleTimeoutRef.current = setTimeout(speakNextProjectTitle, 200);
    } else if (isSpeakingProjectTitles && currentProjectTitleIndex >= pageProjectsData.length) {
      // This condition is now handled by the end of speakNextProjectTitle's iteration
    }
    return () => {
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    }
  }, [isSpeakingProjectTitles, currentProjectTitleIndex, speakNextProjectTitle]);


  const handleProjectsStepInController = useCallback(() => {
    console.log("IntegratedAssistantController: ContentReader reached projects_intro. Controller will now speak project titles.");
    setStopVoiceTourSignal(true); 
    
    setTimeout(() => {
        setAssistantMode('speaking_project_titles');
        setIsChatInterfaceOpen(true); 
        setShowChatBubble(false);
        setChatMessages([]); 
        setChatInterfaceRenderKey(prev => prev + 1);
        setCurrentTourStep('projects_intro'); // Keep the step related to the general intro
        setStartVoiceTourSignal(false); 
        setCurrentProjectTitleIndex(0); 
        
        const genericProjectIntro = sectionDetails.projects_intro.speakableIntro;
        addMessageToChat('ai', <p>{genericProjectIntro}</p>, genericProjectIntro);
        speakTextNow(genericProjectIntro, () => {
            setIsSpeakingProjectTitles(true); // Start speaking individual titles *after* generic intro is done
        });

    }, 500); 

  }, [addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep, setStartVoiceTourSignal, setCurrentProjectTitleIndex, setIsSpeakingProjectTitles, setStopVoiceTourSignal]);

  const initiateGreeting = useCallback(() => {
    if (initialGreetingDoneRef.current) return;
    console.log("IntegratedAssistantController: Initiating greeting.");
    
    setChatMessages([]);
    setChatInterfaceRenderKey(prev => prev + 1);
    
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    addMessageToChat('ai', greetingText, greetingText); 
    
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false); 
    setAssistantMode('greeting');
    setCurrentTourStep('greeting');
    setUserRespondedToGreeting(false); 
    
    speakTextNow(greetingText); 
    
    initialGreetingDoneRef.current = true;
  }, [addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep, setUserRespondedToGreeting, setChatInterfaceRenderKey]);


  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); 
    if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    setIsSpeakingProjectTitles(false);

    if (action === 'start_voice_tour_yes') {
      addMessageToChat('user', "Yes, Guide Me");
      setUserRespondedToGreeting(true);
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', startMessage, startMessage);
      speakTextNow(startMessage, () => {
        setTimeout(() => {
            setIsChatInterfaceOpen(false); 
            setShowChatBubble(false);    
            setCurrentTourStep('about'); 
            setStartVoiceTourSignal(true);
            setStopVoiceTourSignal(false);
            setAssistantMode('voice_tour_active');
        }, 300); 
      });
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      setUserRespondedToGreeting(true);
      const declineMessage = "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!";
      addMessageToChat('ai', declineMessage, declineMessage);
      speakTextNow(declineMessage, () => {
        setIsChatInterfaceOpen(false);
        setShowChatBubble(true); 
      });
      setAssistantMode('tour_declined_pending_scroll');
    } else if (action.startsWith('project_detail_')) {
        const projectTitleFromAction = action.replace('project_detail_', '').replace(/_/g, ' ');
        const project = pageProjectsData.find(p => p.title === projectTitleFromAction);
        const userClickedMsg = `Tell me more about: ${projectTitleFromAction}`;
        addMessageToChat('user', userClickedMsg);
        
        if (project) {
            const projectSpeakableText = project.description; 
            addMessageToChat('ai', <p>{projectSpeakableText}</p>, projectSpeakableText);
            speakTextNow(projectSpeakableText, () => {
                const promptMsg = "Which other project would you like to hear more about, or shall we move to Education?";
                addMessageToChat('ai', <p>{promptMsg}</p>, promptMsg);
                speakTextNow(promptMsg);
                const projectButtons: ChatbotQuickReplyType[] = pageProjectsData.map(p => ({
                    text: p.title,
                    action: `project_detail_${p.title.replace(/\s+/g, '_')}`,
                    icon: <BrainCircuit className="mr-2 h-4 w-4" />
                }));
                projectButtons.push({ text: "Next Section (Education)", action: "next_section_education", icon: <ArrowRight className="mr-2 h-4 w-4" /> });
                setChatQuickReplies(projectButtons);
            });
        } else {
            addMessageToChat('ai', "Sorry, I couldn't find details for that project.");
        }
    } else if (action === 'next_section_education') {
      addMessageToChat('user', "Next Section (from Projects)");
      const nextMessage = "Okay, moving to Education.";
      addMessageToChat('ai', nextMessage, nextMessage);
      speakTextNow(nextMessage, () => {
        setTimeout(() => {
            setIsChatInterfaceOpen(false); 
            setShowChatBubble(false);    
            setCurrentTourStep('education_intro'); 
            setStartVoiceTourSignal(true); 
            setStopVoiceTourSignal(false);
            setAssistantMode('voice_tour_active');
        }, 300); 
      });
    } else if (action === 'open_qa') {
      setChatMessages([]); 
      setChatInterfaceRenderKey(prev => prev + 1);
      setAssistantMode('qa');
      const qaMessage = "Great! What would you like to know about Chakradhar?";
      addMessageToChat('ai', qaMessage, qaMessage);
      speakTextNow(qaMessage);
      setChatQuickReplies([]);
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank');
      const downloadMessage = "The resume is being downloaded. Anything else I can help with?";
      addMessageToChat('ai', downloadMessage, downloadMessage);
      speakTextNow(downloadMessage);
      setChatQuickReplies([
        { text: "Ask another Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
    } else if (action === 'end_chat_interaction' || action === 'not_right_now_scrolled_end') {
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true);
      setAssistantMode('idle'); 
      setStopVoiceTourSignal(true); 
      setStartVoiceTourSignal(false);
      if(synthRef.current?.speaking) synthRef.current.cancel();
      setUserRespondedToGreeting(true); 
      initialGreetingDoneRef.current = true; 
    } else if (action === 'resume_voice_tour') {
        const resumeMsg = "Resuming the voice tour...";
        addMessageToChat('user', "Resume Tour"); // User action
        addMessageToChat('ai', resumeMsg, resumeMsg);
        speakTextNow(resumeMsg, () => {
            setTimeout(() => {
                setIsChatInterfaceOpen(false);
                setShowChatBubble(false); 
                setStartVoiceTourSignal(true); 
                setStopVoiceTourSignal(false);
                setAssistantMode('voice_tour_active');
            }, 200);
        });
    }
  }, [
    addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, 
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setCurrentTourStep, 
    setChatQuickReplies, setUserRespondedToGreeting, setChatMessages,
    setChatInterfaceRenderKey, setIsSpeakingProjectTitles
  ]);

  const handleVoiceTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    setCurrentTourStep('ended'); // Mark tour as ended
    
    setChatMessages([]);
    setChatInterfaceRenderKey(prev => prev + 1);

    const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to explore anything else?";
    addMessageToChat('ai', endMessage, endMessage);
    speakTextNow(endMessage);
    setChatQuickReplies([
      { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
      { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false);
  }, [
    addMessageToChat, speakTextNow, setStartVoiceTourSignal, setStopVoiceTourSignal, 
    setVoiceTourCompleted, setAssistantMode, setChatMessages, setChatQuickReplies, 
    setIsChatInterfaceOpen, setShowChatBubble, setChatInterfaceRenderKey, setCurrentTourStep
  ]);
  
  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Mode:", assistantMode, "Chat open:", isChatInterfaceOpen, "Greeting Done:", initialGreetingDoneRef.current, "User Responded:", userRespondedToGreeting);
    
    if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
    setIsSpeakingProjectTitles(false);

    if (isChatInterfaceOpen) { 
        setIsChatInterfaceOpen(false);
        setShowChatBubble(true);
        setChatQuickReplies([]); 
        if (assistantMode === 'voice_tour_active' || startVoiceTourSignal) {
            setAssistantMode('voice_tour_paused_by_user');
            setStopVoiceTourSignal(true); 
            setStartVoiceTourSignal(false); 
            console.log("IntegratedAssistantController: Voice tour paused by user closing chat.");
        } else if (assistantMode === 'greeting' && !userRespondedToGreeting) {
             setAssistantMode('tour_declined_pending_scroll'); 
             setUserRespondedToGreeting(true); 
             initialGreetingDoneRef.current = true; 
             console.log("IntegratedAssistantController: Greeting declined by closing chat.");
        } else {
          setAssistantMode('idle'); 
          console.log("IntegratedAssistantController: Chat closed, mode set to idle.");
        }
        if(synthRef.current?.speaking) synthRef.current.cancel();
    } else { 
        setShowChatBubble(false); 
        setChatMessages([]); 
        setChatInterfaceRenderKey(prev => prev + 1); 
        setStopVoiceTourSignal(true); 
        setStartVoiceTourSignal(false);
        if(synthRef.current?.speaking) synthRef.current.cancel(); // Stop any ongoing speech

        if (assistantMode === 'voice_tour_paused_by_user') {
             const resumeMsg = "The voice tour is paused. Would you like to resume, ask a question, or download the resume?";
             addMessageToChat('ai', resumeMsg, resumeMsg);
             speakTextNow(resumeMsg);
             setChatQuickReplies([
                { text: "Resume Tour", action: 'resume_voice_tour', icon: <Play className="mr-2 h-4 w-4" /> },
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
                { text: "End Interaction", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
             ]);
        } else if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa' || currentTourStep === 'ended') {
            const postTourMsg = "Welcome back! The guided tour is complete. You can ask questions or download the resume.";
            addMessageToChat('ai', postTourMsg, postTourMsg);
            speakTextNow(postTourMsg);
            setChatQuickReplies([
              { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
              { text: "Download Resume", action: 'download_resume', icon: <Download className="mr-2 h-4 w-4" /> },
              { text: "End Chat", action: 'end_chat_interaction', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
            setAssistantMode('qa'); 
        } else if (assistantMode === 'scrolled_to_end_greeting' || (assistantMode === 'tour_declined_pending_scroll' && contactSectionInView && !hasShownScrolledToEndGreeting) ) {
             const scrolledEndMsg = "Thanks for exploring! Have any questions about Chakradhar's work or experience?";
             addMessageToChat('ai', scrolledEndMsg, scrolledEndMsg);
             if(isSynthReady && scrolledEndMsg) speakTextNow(scrolledEndMsg);
             setChatQuickReplies([
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
             setAssistantMode('scrolled_to_end_greeting'); 
             setHasShownScrolledToEndGreeting(true);
        } else { 
            initiateGreeting();
        }
        setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen, assistantMode, voiceTourCompleted, userRespondedToGreeting, contactSectionInView, startVoiceTourSignal,
    addMessageToChat, initiateGreeting, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, setChatQuickReplies,
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages, setUserRespondedToGreeting,
    setChatInterfaceRenderKey, hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting, isSynthReady,
    setIsSpeakingProjectTitles, currentTourStep // Added currentTourStep
  ]);
  
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const checkVoices = () => {
        if (synthRef.current && synthRef.current.getVoices().length > 0) {
          setIsSynthReady(true);
          console.log("IntegratedAssistantController: Speech synth voices loaded and ready.");
          if (synthRef.current.onvoiceschanged !== undefined) synthRef.current.onvoiceschanged = null;
        } else {
          console.log("IntegratedAssistantController: Still waiting for speech synth voices...");
        }
      };
      if (synthRef.current.getVoices().length > 0) checkVoices();
      else if (synthRef.current.onvoiceschanged !== undefined) synthRef.current.onvoiceschanged = checkVoices;
      else setTimeout(() => { 
        if (synthRef.current && synthRef.current.getVoices().length > 0) {
          setIsSynthReady(true); 
          console.log("IntegratedAssistantController: Speech synth voices loaded (via timeout) and ready.");
        } else {
          setIsSynthReady(false);
          console.warn("IntegratedAssistantController: Speech synth voices did not load after timeout.");
        }
      }, 500); // Fallback timeout
    } else {
      setIsSynthReady(false);
      console.warn("IntegratedAssistantController: Speech synthesis not supported by this browser.");
    }

    const contactElement = document.getElementById('contact');
    if (contactElement) contactSectionRef(contactElement);

    return () => {
      isMountedRef.current = false;
      if (projectTitleTimeoutRef.current) clearTimeout(projectTitleTimeoutRef.current);
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
      }
      if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
        console.log("IntegratedAssistantController: Unmounting, cancelling any speech.");
        synthRef.current.cancel();
      }
    };
  }, [contactSectionRef]); 

  useEffect(() => {
    // This effect now handles the initial greeting based on synth readiness
    if (isMountedRef.current && isSynthReady && !initialGreetingDoneRef.current && assistantMode === 'idle' && !isChatInterfaceOpen) {
        console.log("IntegratedAssistantController: Synth ready, attempting initial greeting.");
        initiateGreeting();
    }
  }, [isMountedRef, isSynthReady, initialGreetingDoneRef, assistantMode, isChatInterfaceOpen, initiateGreeting]);

  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen && userRespondedToGreeting) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined, showing greeting.");
      setChatMessages([]);
      setChatInterfaceRenderKey(prev => prev + 1);
      const scrolledMsg = "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions about his work or experience?";
      addMessageToChat('ai', scrolledMsg, scrolledMsg);
      if(isSynthReady) speakTextNow(scrolledMsg);
      setChatQuickReplies([
        { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
        { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setShowChatBubble(false);
      setAssistantMode('scrolled_to_end_greeting');
      setHasShownScrolledToEndGreeting(true);
    }
  }, [
      contactSectionInView, assistantMode, hasShownScrolledToEndGreeting, isChatInterfaceOpen, userRespondedToGreeting,
      addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen,
      setShowChatBubble, setAssistantMode, setHasShownScrolledToEndGreeting, isSynthReady, setChatInterfaceRenderKey
  ]);
  

  const effectiveShowBubble = showChatBubble && 
                              !isChatInterfaceOpen && 
                              !(assistantMode === 'voice_tour_active' && startVoiceTourSignal) &&
                              !isSpeakingProjectTitles;

  return (
    <>
      <ChatbotBubble
        onClick={mainBubbleClickHandler}
        isVisible={effectiveShowBubble} 
      />
      <InteractiveChatbot
        key={chatInterfaceRenderKey} 
        isOpen={isChatInterfaceOpen}
        mode={assistantMode} 
        initialMessages={chatMessages}
        initialQuickReplies={chatQuickReplies}
        onClose={mainBubbleClickHandler} 
        onQuickReplyAction={handleQuickReplyAction}
      />
      <ContentReader
        startTourSignal={startVoiceTourSignal}
        stopTourSignal={stopVoiceTourSignal}
        onTourComplete={handleVoiceTourComplete}
        onProjectsStepReached={handleProjectsStepInController}
        currentGlobalStepId={currentTourStep} 
      />
    </>
  );
};

export default IntegratedAssistantController;
