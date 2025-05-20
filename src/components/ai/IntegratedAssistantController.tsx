
"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader'; // Ensure ContentReader is imported
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Square, BrainCircuit, BotMessageSquare, Play, Volume2, VolumeX } from 'lucide-react';

type TourStepId = 
  | 'greeting'
  | 'about' 
  | 'skills' 
  | 'experience' 
  | 'projects_intro' 
  | 'projects_detail' // This might be dynamic based on project ID
  | 'education' 
  | 'certifications' 
  | 'publication' 
  | 'additional_info' 
  | 'tour_declined'
  | 'scrolled_to_end_greeting'
  | 'post_voice_tour_qa'
  | 'qa' 
  | 'voice_tour_active' 
  | 'voice_tour_paused_by_user' 
  | 'ended';


type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'voice_tour_paused_by_user' 
  | 'qa' 
  | 'post_voice_tour_qa' 
  | 'scrolled_to_end_greeting' 
  | 'tour_declined_pending_scroll'; 

const IntegratedAssistantController: React.FC = () => {
  // State declarations MUST be at the top
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [showChatBubble, setShowChatBubble] = useState(true); // Start with bubble visible
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false); // Tracks if initial Yes/No was clicked
  const [hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState<TourStepId>('greeting'); // Or a dedicated initial step like 'idle'
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0); // To force re-render of ChatInterface
  const [isSynthReady, setIsSynthReady] = useState(false);


  // Ref declarations after state
  const initialGreetingDoneRef = useRef(false);
  const messageIdCounterRef = useRef(0);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isMountedRef = useRef(false); // Tracks if the component is mounted

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({
    threshold: 0.1,
    triggerOnce: false, 
  });

  // useCallback and useEffect declarations after state and refs
  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !text || !isSynthReady) {
      console.warn("IntegratedAssistantController: SpeakTextNow conditions not met or text empty.", { isMounted: isMountedRef.current, synth: !!synthRef.current, text, isSynthReady });
      if (onEnd) onEnd();
      return;
    }
    console.log(`IntegratedAssistantController: Attempting to speak: "${text.substring(0, 50)}..."`);

    // Clear handlers from any PREVIOUS controller utterance and cancel it
    if (controllerUtteranceRef.current) {
      console.log("IntegratedAssistantController: Clearing handlers from previous controller utterance.");
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
        console.log("IntegratedAssistantController: synth.speaking or .pending is true. Global synth.cancel() called for controller's own speech.");
        synthRef.current.cancel(); 
    }
    controllerUtteranceRef.current = null; // Clear the ref after ensuring it's stopped and handlers are cleared

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (controllerUtteranceRef.current === utterance) { 
        console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0, 50)}..."`);
        controllerUtteranceRef.current = null; 
        if (onEnd) onEnd();
      } else {
        console.log("IntegratedAssistantController: onEnd called for a stale/mismatched controller utterance.");
      }
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) { 
        errorDetails = event.error; 
      }
      const utteranceTextForLog = utterance ? `"${utterance.text.substring(0,50)}..."` : "N/A";
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Utterance text:", utteranceTextForLog, "Error details:", errorDetails, "Event object:", event);
      
      if (controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current = null;
      }
      if (onEnd) onEnd(); 
    };
    
    controllerUtteranceRef.current = utterance; 
    synthRef.current.speak(utterance);
  }, [isSynthReady]); // synthRef and controllerUtteranceRef are refs, no need in deps if stable

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
    // Do not force re-render of ChatInterface here, let its own props/state do it.
    return newMessage;
  }, [setChatMessages]); // setChatMessages is stable

  const initiateGreeting = useCallback(() => {
    console.log("IntegratedAssistantController: initiateGreeting called. initialGreetingDoneRef.current:", initialGreetingDoneRef.current);
    if (initialGreetingDoneRef.current) {
      console.log("IntegratedAssistantController: Initial greeting already performed, skipping.");
      return;
    }
    
    setChatMessages([]); // Clear previous messages
    setChatInterfaceRenderKey(prev => prev + 1); // Force re-render ChatInterface for fresh state
    
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    addMessageToChat('ai', greetingText, greetingText); 
    
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <CheckCircle className="mr-2 h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="mr-2 h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowChatBubble(false); 
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); // Reset this as user is being greeted now
    
    console.log("IntegratedAssistantController: Attempting to speak initial greeting.");
    speakTextNow(greetingText); // Speak the greeting
    
    initialGreetingDoneRef.current = true;
    console.log("IntegratedAssistantController: Greeting initiated. isChatInterfaceOpen:", true, "showChatBubble:", false);
  }, [addMessageToChat, speakTextNow, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setUserRespondedToGreeting, setChatInterfaceRenderKey]);

  const handleProjectsStepInController = useCallback(() => {
    console.log("IntegratedAssistantController: ContentReader reached projects step. Opening chat for project selection.");
    setStopVoiceTourSignal(true); // Signal ContentReader to stop its own speech/auto-advance

    setTimeout(() => { // Short delay to ensure ContentReader stops before controller speaks
        setChatMessages([]); // Clear messages for project selection UI
        setChatInterfaceRenderKey(prev => prev + 1);

        const projectPromptMsg = "Select a project to learn more, or choose 'Next Section'.";
        addMessageToChat('ai', <p>{projectPromptMsg}</p>, projectPromptMsg);
        
        const projectDetails = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY || [];
        const projectQuickReplies: ChatbotQuickReplyType[] = projectDetails
            .filter(section => section.id.startsWith('project_detail_')) // Assuming project detail IDs start with this
            .map(project => ({
                text: project.speakableText.split(':')[0], // Extract title before colon
                action: `project_detail_${project.id}`,
                icon: <BrainCircuit className="mr-2 h-4 w-4" /> // Example icon
            }));
        
        projectQuickReplies.push({ text: "Next Section (Education)", action: "next_section_education", icon: <Play className="mr-2 h-4 w-4" /> });
            
        setChatQuickReplies(projectQuickReplies);
        setIsChatInterfaceOpen(true);
        setShowChatBubble(false);
        setAssistantMode('qa'); // Or a dedicated 'project_selection' mode
        setCurrentTourStep('projects_intro'); // Or 'projects_selection'
        setStartVoiceTourSignal(false); // Ensure voice tour doesn't auto-restart
        
        speakTextNow(projectPromptMsg); // Speak the project selection prompt
    }, 300);

  }, [addMessageToChat, speakTextNow, setStopVoiceTourSignal, setChatMessages, setChatQuickReplies, setIsChatInterfaceOpen, setShowChatBubble, setAssistantMode, setCurrentTourStep, setStartVoiceTourSignal, setChatInterfaceRenderKey]);

  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); 

    if (action === 'start_voice_tour_yes') {
      addMessageToChat('user', "Yes, Guide Me");
      setUserRespondedToGreeting(true);
      // initialGreetingDoneRef.current is already true from initiateGreeting
      const startMessage = "Great! Starting the guided audio tour now.";
      addMessageToChat('ai', startMessage, startMessage);
      speakTextNow(startMessage, () => { // onEnd callback for speakTextNow
        setTimeout(() => { // Short delay after speaking before hiding UI and starting tour
            setIsChatInterfaceOpen(false);
            setShowChatBubble(false); // Hide bubble during automated tour
            setCurrentTourStep('about'); 
            setStartVoiceTourSignal(true);
            setStopVoiceTourSignal(false);
            setAssistantMode('voice_tour_active');
        }, 300); 
      });
    } else if (action === 'decline_tour') {
      addMessageToChat('user', "No, Thanks");
      setUserRespondedToGreeting(true);
      // initialGreetingDoneRef.current is true
      const declineMessage = "Alright. Feel free to explore at your own pace. If you have questions later, just click on my icon!";
      addMessageToChat('ai', declineMessage, declineMessage);
      // speakTextNow(declineMessage); // Optional: speak this
      setIsChatInterfaceOpen(false);
      setShowChatBubble(true); // Show bubble if tour is declined
      setAssistantMode('tour_declined_pending_scroll');
    } else if (action.startsWith('project_detail_')) {
      const projectSectionId = action.replace('project_detail_', '');
      const projectDetails = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY || [];
      const project = projectDetails.find(s => s.id === projectSectionId);
      const userClickedMsg = `Tell me about: ${project ? project.speakableText.split(':')[0] : projectSectionId.replace(/_/g, ' ')}`;
      addMessageToChat('user', userClickedMsg);
      
      const projectSpeakableText = project?.speakableText || `Details for ${projectSectionId.replace(/_/g, ' ')} would be shown here.`;
      addMessageToChat('ai', projectSpeakableText, projectSpeakableText); // Assuming speakableText has full detail
      speakTextNow(projectSpeakableText);

      // Re-populate project buttons for further selection or moving on
      const currentProjectReplies: ChatbotQuickReplyType[] = projectDetails
        .filter(section => section.id.startsWith('project_detail_'))
        .map(proj => ({
          text: proj.speakableText.split(':')[0],
          action: `project_detail_${proj.id}`,
          icon: <BrainCircuit className="mr-2 h-4 w-4" />
        }));
      currentProjectReplies.push({ text: "Next Section (Education)", action: "next_section_education", icon: <Play className="mr-2 h-4 w-4" /> });
      setChatQuickReplies(currentProjectReplies);

    } else if (action === 'next_section_education') {
      addMessageToChat('user', "Next Section (from Projects)");
      const nextMessage = "Okay, moving to Education.";
      addMessageToChat('ai', nextMessage, nextMessage);
      speakTextNow(nextMessage, () => {
        setTimeout(() => {
            setIsChatInterfaceOpen(false);
            setShowChatBubble(false); // Hide bubble during automated tour
            setCurrentTourStep('education-section'); 
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
    } else if (action === 'download_resume') {
      window.open('/lakshmi_resume.pdf', '_blank'); // Make sure resume is in public folder
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
      setAssistantMode('idle'); // Or 'ended' if more appropriate
      setStopVoiceTourSignal(true); // Ensure any voice tour is stopped
      setStartVoiceTourSignal(false);
      if(synthRef.current?.speaking) synthRef.current.cancel();
      setUserRespondedToGreeting(true); // Mark that the user has interacted with the greeting sequence
      initialGreetingDoneRef.current = true; // Ensure greeting doesn't re-trigger
    } else if (action === 'resume_voice_tour') {
        const resumeMsg = "Resuming the voice tour...";
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
    setChatInterfaceRenderKey // Added setChatInterfaceRenderKey
  ]);

  const handleVoiceTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
    setStartVoiceTourSignal(false);
    setStopVoiceTourSignal(false);
    setVoiceTourCompleted(true);
    setAssistantMode('post_voice_tour_qa');
    
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
    setIsChatInterfaceOpen, setShowChatBubble, setChatInterfaceRenderKey
  ]);
  
  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen, "Initial Greeting Done:", initialGreetingDoneRef.current, "User Responded:", userRespondedToGreeting);
    
    if (isChatInterfaceOpen) { 
        setIsChatInterfaceOpen(false);
        setShowChatBubble(true);
        setChatQuickReplies([]); 
        if (assistantMode === 'voice_tour_active' || startVoiceTourSignal) {
            console.log("IntegratedAssistantController: Pausing voice tour due to chat interface close.");
            setAssistantMode('voice_tour_paused_by_user');
            setStopVoiceTourSignal(true); 
            setStartVoiceTourSignal(false); 
        } else if (assistantMode === 'greeting' && !userRespondedToGreeting) {
             // If greeting is closed without interaction, treat as declined for scroll-to-end logic
             console.log("IntegratedAssistantController: Greeting closed without direct response, treating as declined.");
             setAssistantMode('tour_declined_pending_scroll'); 
             setUserRespondedToGreeting(true); // Mark as responded to prevent re-greeting on bubble click
             initialGreetingDoneRef.current = true; // Ensure initial greeting doesn't re-trigger immediately
        } else {
          setAssistantMode('idle'); 
        }
        if(synthRef.current?.speaking) synthRef.current.cancel(); // Stop any ongoing speech
    } else { // Chat interface is closed, bubble was clicked
        setShowChatBubble(false); // Hide bubble, open interface
        setChatMessages([]); 
        setChatInterfaceRenderKey(prev => prev + 1); 
        setStopVoiceTourSignal(true); // Stop any ongoing voice tour
        setStartVoiceTourSignal(false);

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
        } else if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
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
             // Only speak if synth is ready and text is there
             if(isSynthReady && scrolledEndMsg) speakTextNow(scrolledEndMsg);
             setChatQuickReplies([
                { text: "Ask a Question", action: 'open_qa', icon: <MessageCircleQuestion className="mr-2 h-4 w-4" /> },
                { text: "Not right now", action: 'not_right_now_scrolled_end', icon: <XCircle className="mr-2 h-4 w-4" /> },
            ]);
             setAssistantMode('scrolled_to_end_greeting'); 
             setHasShownScrolledToEndGreeting(true);
        } else { 
            // Default: Re-initiate greeting if no other specific state applies (e.g., user clicked bubble after declining tour and NOT scrolling to end)
            initiateGreeting();
        }
        setIsChatInterfaceOpen(true);
    }
  }, [
    isChatInterfaceOpen, assistantMode, voiceTourCompleted, userRespondedToGreeting, contactSectionInView, startVoiceTourSignal,
    addMessageToChat, initiateGreeting, speakTextNow, setIsChatInterfaceOpen, setShowChatBubble, setChatQuickReplies,
    setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatMessages, setUserRespondedToGreeting,
    setChatInterfaceRenderKey, hasShownScrolledToEndGreeting, setHasShownScrolledToEndGreeting, isSynthReady
  ]);
  
  // Effect to initialize speech synthesis and set up contact section observer
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const checkVoices = () => {
        if (synthRef.current && synthRef.current.getVoices().length > 0) {
          console.log("IntegratedAssistantController: Voices available.");
          setIsSynthReady(true);
          if (synthRef.current.onvoiceschanged !== undefined) {
            synthRef.current.onvoiceschanged = null; // Clean up listener
          }
        }
      };
      if (synthRef.current.getVoices().length > 0) {
        checkVoices();
      } else if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = checkVoices;
      } else {
        // Fallback if onvoiceschanged is not supported or no voices initially
        setTimeout(() => { // Give a bit of time for voices to load
            if (synthRef.current && synthRef.current.getVoices().length > 0) {
                console.log("IntegratedAssistantController: Voices loaded via timeout fallback.");
                setIsSynthReady(true);
            } else {
                console.warn("IntegratedAssistantController: Voices still not available after timeout.");
                setIsSynthReady(false); // Or true if we want to attempt default voice
            }
        }, 500);
      }
      console.log("IntegratedAssistantController: Speech synthesis interface obtained.");
    } else {
      console.warn("IntegratedAssistantController: Speech synthesis not supported.");
      setIsSynthReady(false);
    }

    // Set up IntersectionObserver for the contact section
    const contactElement = document.getElementById('contact'); // Ensure 'contact' is the ID of your contact section
    if (contactElement) {
      contactSectionRef(contactElement); // This connects the ref from useInView to the DOM element
    } else {
        console.warn("IntegratedAssistantController: Contact section element with ID 'contact' not found for InView.")
    }

    return () => { // Cleanup function
      isMountedRef.current = false;
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
      }
      if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
        console.log("IntegratedAssistantController: Unmounting. Cancelling controller speech.");
        synthRef.current.cancel();
      }
      // No need to clean up onvoiceschanged here if it's set to null after first successful load
    };
  }, [contactSectionRef]); 

  // Effect for initial greeting - runs once when synth is ready and greeting not done
  useEffect(() => {
    console.log("IntegratedAssistantController: Initial greeting effect check. isSynthReady:", isSynthReady, "initialGreetingDoneRef.current:", initialGreetingDoneRef.current);
    if (isSynthReady && !initialGreetingDoneRef.current && isMountedRef.current) {
        console.log("IntegratedAssistantController: Conditions met for initial greeting. Calling initiateGreeting.");
        initiateGreeting();
    }
  }, [isSynthReady, initiateGreeting]); // initiateGreeting is memoized

  // Effect for "scrolled to end after declining tour"
  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !hasShownScrolledToEndGreeting && !isChatInterfaceOpen && userRespondedToGreeting) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined. Opening chat for scrolled-to-end greeting.");
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

  // This derived state determines if the physical bubble icon should be visible
  const effectiveShowBubble = showChatBubble && 
                              !isChatInterfaceOpen && 
                              !(assistantMode === 'voice_tour_active' && startVoiceTourSignal);

  return (
    <>
      <ChatbotBubble
        onClick={mainBubbleClickHandler}
        isVisible={effectiveShowBubble} 
      />
      <InteractiveChatbot
        key={chatInterfaceRenderKey} // Key to re-mount for fresh state when needed
        isOpen={isChatInterfaceOpen}
        mode={assistantMode} 
        initialMessages={chatMessages}
        initialQuickReplies={chatQuickReplies}
        onClose={mainBubbleClickHandler} 
        onQuickReplyAction={handleQuickReplyAction}
        // onSendMessageToAI is handled internally by InteractiveChatbot now
      />
      <ContentReader
        startTour={startVoiceTourSignal}
        stopTourSignal={stopVoiceTourSignal}
        onTourComplete={handleVoiceTourComplete}
        onProjectsStepReached={handleProjectsStepInController}
        currentGlobalStepId={currentTourStep} // Pass the current step ID
      />
    </>
  );
};

export default IntegratedAssistantController;
      
    
