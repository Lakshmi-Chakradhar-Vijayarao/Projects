
"use client";
import React, { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';
import { CheckCircle, MessageCircleQuestion, Download, Square, BotMessageSquare, Play, XCircle, Send, Loader2, ArrowRight, Newspaper, Award, GraduationCap, Brain, Briefcase, User, HomeIcon, Phone, FileText, Github, Linkedin, Mail } from 'lucide-react';

import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader'; // Assuming ContentReader is appropriately refactored or used

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
  | 'about_me_intro'
  | 'skills_intro'
  | 'experience_intro'
  | 'projects_intro' // Generic intro before ContentReader lists titles or controller shows options
  | 'projects_list_spoken' // State after ContentReader has listed project titles (or controller has spoken them)
  | 'project_detail_specific' // When showing a specific project detail
  | 'education_intro'
  | 'certifications_intro'
  | 'publication_intro'
  | 'additional_info_intro'
  | 'voice_tour_active' // General state when ContentReader is active
  | 'post_voice_tour_qa'
  | 'tour_declined_pending_scroll'
  | 'scrolled_to_end_greeting'
  | 'tour_paused';

const IntegratedAssistantController: React.FC = () => {
  console.log("IntegratedAssistantController: Rendering or re-rendering.");

  // Chat Interface State
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [showChatBubble, setShowChatBubble] = useState(false); // Start with bubble hidden, greeting will open interface
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0); // To force re-render of chat interface

  // Overall Assistant State
  const [assistantMode, setAssistantMode] = useState<TourStepKey>('idle');
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const initialGreetingDoneRef = useRef(false); // Tracks if initial visual greeting + speech attempt was made
  const isMountedRef = useRef(false); // Tracks if component has mounted client-side

  // Voice Tour (ContentReader) State
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false); // Triggers ContentReader to start/resume
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);   // Triggers ContentReader to stop
  const [currentVoiceTourSectionId, setCurrentVoiceTourSectionId] = useState<string | null>('about-me-section'); // Where ContentReader should start

  // Speech Synthesis State
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [isSynthReady, setIsSynthReady] = useState(false);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSpeakingForAvatar, setIsSpeakingForAvatar] = useState(false); // For visual cue on SimpleAvatarDisplay

  // Scroll-to-end state
  const [contactSectionInViewForNoThanks, setContactSectionInViewForNoThanks] = useState(false);
  const [endOfPageGreetingDone, setEndOfPageGreetingDone] = useState(false);

  const { ref: contactSectionRef, inView: contactSectionIsVisible } = useInView({ threshold: 0.3 });
  
  // Assign ref to contact section on mount - a bit hacky, better if SectionWrapper could forward ref
  useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement && contactSectionRef) {
      (contactSectionRef as (node?: Element | null | undefined) => void)(contactElement);
    }
  }, [contactSectionRef]);


  // Initialize isMounted and Speech Synthesis
  useEffect(() => {
    console.log("IntegratedAssistantController: Mount effect running.");
    isMountedRef.current = true;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      constvoicesLoaded = () => {
        const voices = synthRef.current?.getVoices();
        if (voices && voices.length > 0) {
          setIsSynthReady(true);
          console.log("IntegratedAssistantController: Speech synthesis initialized with voices.");
          if(synthRef.current) synthRef.current.onvoiceschanged = null; // Important: Remove listener after voices are loaded
        }
      };

      // Check if voices are already loaded
      if (synthRef.current.getVoices().length > 0) {
        voicesLoaded();
      } else {
        synthRef.current.onvoiceschanged = voicesLoaded;
      }
    } else {
      console.warn("IntegratedAssistantController: Speech synthesis not supported by this browser.");
    }

    // Attempt initial greeting once mounted and if not already done
    if (!initialGreetingDoneRef.current) {
      console.log("IntegratedAssistantController: Attempting initial greeting on mount.");
      // Defer slightly to ensure synth might have a chance to initialize if onvoiceschanged is slow
      const initTimeout = setTimeout(() => {
        if (isMountedRef.current && !initialGreetingDoneRef.current) {
          initiateGreeting();
        }
      }, 100); // Short delay
      return () => clearTimeout(initTimeout);
    }

    return () => {
      isMountedRef.current = false;
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = null;
        if (controllerUtteranceRef.current) {
          controllerUtteranceRef.current.onend = null;
          controllerUtteranceRef.current.onerror = null;
        }
        synthRef.current.cancel(); // Cancel any speech on unmount
      }
    };
  }, []); // Empty dependency array: runs once on mount and cleans up on unmount


  const addMessageToChat = useCallback((sender: 'ai' | 'user', content: ReactNode, speakableText?: string) => {
    console.log(`IntegratedAssistantController: Adding message from ${sender}. Speakable: ${!!speakableText}`);
    const newMessageId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setChatMessages(prev => [...prev, { id: newMessageId, sender, text: content, speakableText: speakableText || (typeof content === 'string' ? content : undefined) }]);
  }, [setChatMessages]);

  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !isSynthReady) {
      console.warn("IntegratedAssistantController: speakTextNow called but synth not ready or not mounted. Text:", text);
      if (onEnd) onEnd(); // Call onEnd immediately if we can't speak
      return;
    }
    console.log(`IntegratedAssistantController: speakTextNow attempting to speak: "${text.substring(0,50)}..."`);

    // Cancel any existing speech from this controller
    if (controllerUtteranceRef.current) {
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    if (synthRef.current.speaking || synthRef.current.pending) {
        console.log("IntegratedAssistantController: Cancelling previous controller speech before new one.");
        synthRef.current.cancel(); 
    }

    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance;
    // Potentially select a voice if desired
    // const voices = synthRef.current.getVoices();
    // utterance.voice = voices[0]; // Example: use the first available voice

    utterance.onstart = () => {
      console.log(`IntegratedAssistantController: Speech started for: "${text.substring(0,50)}..."`);
      setIsSpeakingForAvatar(true);
    };

    utterance.onend = () => {
      console.log(`IntegratedAssistantController: Speech ended for: "${text.substring(0,50)}..."`);
      setIsSpeakingForAvatar(false);
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
      setIsSpeakingForAvatar(false);
      if (controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current.onend = null; // Clean up just in case
          controllerUtteranceRef.current.onerror = null; // Clean up just in case
          controllerUtteranceRef.current = null; 
      }
      if (onEnd) onEnd(); 
    };
    
    synthRef.current.speak(utterance);

  }, [isSynthReady, addMessageToChat, setIsSpeakingForAvatar]);


  const initiateGreeting = useCallback(() => {
    if (initialGreetingDoneRef.current) {
      console.log("IntegratedAssistantController: Greeting already initiated, skipping.");
      return;
    }
    if (!isSynthReady) {
      console.log("IntegratedAssistantController: Synth not ready for greeting, will retry when ready or user interacts.");
      // No need to set initialGreetingDoneRef.current = true yet
      // The useEffect watching isSynthReady will try again.
      // Ensure bubble is visible if chat isn't opening.
      if (!isChatInterfaceOpen) setShowChatBubble(true);
      return;
    }

    console.log("IntegratedAssistantController: Initiating greeting NOW.");
    setChatMessages([]); // Clear previous messages
    setChatInterfaceRenderKey(prev => prev + 1); 

    const greetingText = "Hi there! I’m your AI assistant. Would you like a guided tour through Chakradhar’s portfolio?";
    addMessageToChat('ai', <p>{greetingText}</p>, greetingText);
    
    setChatQuickReplies([
      { text: "Yes, Guide Me", action: 'start_voice_tour_yes', icon: <CheckCircle /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle /> },
    ]);
    
    setIsChatInterfaceOpen(true);
    setShowBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); // User has been greeted, but not yet responded

    speakTextNow(greetingText);
    initialGreetingDoneRef.current = true; // Mark that greeting process has started

  }, [addMessageToChat, speakTextNow, isSynthReady, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey]);
  
  // Effect to trigger greeting if synth becomes ready after initial mount and greeting hasn't run
  useEffect(() => {
    if (isMountedRef.current && isSynthReady && !initialGreetingDoneRef.current && !isChatInterfaceOpen) {
        console.log("IntegratedAssistantController: Synth became ready, and greeting not done. Initiating greeting.");
        initiateGreeting();
    }
  }, [isSynthReady, isChatInterfaceOpen, initiateGreeting]);


  const handleQuickReplyAction = useCallback((action: string) => {
    console.log(`IntegratedAssistantController: Quick reply action: ${action}`);
    setChatQuickReplies([]); 
    setUserRespondedToGreeting(true); // User has now responded

    if (action === 'start_voice_tour_yes') {
      const confirmationText = "Excellent! Let's begin the guided tour. I'll walk you through each section.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText);
      speakTextNow(confirmationText, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(true); // Keep chat interface open
          setShowBubble(false);
          setChatQuickReplies([]); // Clear buttons as tour is automated
          setAssistantMode('voice_tour_active');
          setCurrentVoiceTourSectionId('about-me-section'); // Start with 'about-me-section'
          setStartVoiceTourSignal(prev => !prev); // Toggle to trigger ContentReader
          console.log("IntegratedAssistantController: Signaled ContentReader to start tour from 'about-me-section'.");
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
        }
      });
    } else if (action.startsWith('project_detail_')) {
      // ... (project detail logic remains, will use speakTextNow) ...
    } else if (action === 'next_section_education') {
      // ... (logic for next section after projects, will use speakTextNow) ...
    } else if (action === 'ask_another_question' || action === 'restart_qa') {
        const qaPrompt = "Sure, what else would you like to know about Chakradhar?";
        addMessageToChat('ai', <p>{qaPrompt}</p>, qaPrompt);
        speakTextNow(qaPrompt);
        setAssistantMode('qa'); // Ready for user text input
        setChatQuickReplies([]);
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
    // ... other actions
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStartVoiceTourSignal, setCurrentVoiceTourSectionId, setUserRespondedToGreeting, setChatQuickReplies]);


  const handleContentReaderSectionSpoken = useCallback((sectionId: string, text: string) => {
    console.log(`IntegratedAssistantController: ContentReader spoke section: ${sectionId}`);
    // Add ContentReader's narration to the chat box if it's open and in voice_tour_active mode
    if (isChatInterfaceOpen && assistantMode === 'voice_tour_active') {
        addMessageToChat('ai', <p><em>Narrating: {sectionId.replace(/-/g, ' ')}</em><br/>{text}</p>);
    }
  }, [addMessageToChat, isChatInterfaceOpen, assistantMode]);

  const handleProjectsIntroSpokenByReader = useCallback(() => {
    console.log("IntegratedAssistantController: ContentReader finished projects intro. Setting up project selection.");
    setAssistantMode('project_selection');
    setIsChatInterfaceOpen(true); // Ensure chat is open for project buttons
    setShowBubble(false);

    const projectButtons: ChatbotQuickReplyType[] = pageProjectsData.map(proj => ({
      text: proj.title,
      action: `project_detail_${proj.title.replace(/\s+/g, '_')}`, // Create a unique action
    }));
    projectButtons.push({ text: "Next Section (Education)", action: 'next_section_education', icon: <ArrowRight /> });
    
    const projectPrompt = "Which project would you like to hear more about, or shall we move to Education?";
    addMessageToChat('ai', <p>{projectPrompt}</p>, projectPrompt);
    setChatQuickReplies(projectButtons);
    speakTextNow(projectPrompt);

  }, [addMessageToChat, speakTextNow, setAssistantMode, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies, pageProjectsData]);

  const handleContentReaderTourComplete = useCallback(() => {
    console.log("IntegratedAssistantController: ContentReader tour complete.");
    if (!isMountedRef.current) return;
    
    setStartVoiceTourSignal(false); // Ensure ContentReader doesn't restart
    setStopVoiceTourSignal(prev => !prev); // Signal stop, just in case
    setAssistantMode('post_voice_tour_qa');
    setIsChatInterfaceOpen(true);
    setShowBubble(false);

    const endMessage = "That completes the guided tour. Do you have any questions about Chakradhar's resume or work?";
    addMessageToChat('ai', <p>{endMessage}</p>, endMessage);
    setChatQuickReplies([
      { text: "Ask a Question", action: 'restart_qa', icon: <MessageCircleQuestion /> },
      { text: "Download Resume", action: 'download_resume', icon: <Download /> },
      { text: "End Chat", action: 'end_chat_final', icon: <LogOut /> },
    ]);
    speakTextNow(endMessage);
  }, [addMessageToChat, speakTextNow, setAssistantMode, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies, setStartVoiceTourSignal, setStopVoiceTourSignal]);

  // Scroll-to-end greeting logic
  useEffect(() => {
    if (userRespondedToGreeting && assistantMode === 'tour_declined_pending_scroll' && contactSectionIsVisible && !endOfPageGreetingDone) {
      console.log("IntegratedAssistantController: Scrolled to contact after declining tour. Popping up Q&A.");
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
      setAssistantMode('scrolled_to_end_greeting');
      setChatMessages([]); // Clear previous messages
      const endScrollMessage = "Thanks for exploring! Do you have any questions about Chakradhar's work or experience before you go?";
      addMessageToChat('ai', <p>{endScrollMessage}</p>, endScrollMessage);
      setChatQuickReplies([
        { text: "Ask a Question", action: 'restart_qa', icon: <MessageCircleQuestion /> },
        { text: "No, I'm Good", action: 'end_chat_final', icon: <XCircle /> },
      ]);
      speakTextNow(endScrollMessage);
      setEndOfPageGreetingDone(true);
    }
  }, [contactSectionIsVisible, userRespondedToGreeting, assistantMode, endOfPageGreetingDone, addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setChatMessages, setChatQuickReplies]);


  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    
    // If voice tour is active and user clicks bubble (which shouldn't be visible, but as a fallback) or closes an interactive step
    if (assistantMode === 'voice_tour_active' || assistantMode === 'speaking_project_titles' || assistantMode === 'project_selection') {
      setStopVoiceTourSignal(prev => !prev); // Signal ContentReader to stop
      console.log("IntegratedAssistantController: Stopping voice tour due to bubble/close click.");
    }

    if (isChatInterfaceOpen) { // Closing the chat
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      if (assistantMode !== 'tour_declined_pending_scroll' && assistantMode !== 'idle' ) {
         // If tour was in progress or Q&A was active, set to paused so bubble click re-initiates greeting
        setAssistantMode('tour_paused'); 
      }
    } else { // Opening the chat
      if (assistantMode === 'tour_paused' || assistantMode === 'idle' || assistantMode === 'tour_declined_pending_scroll' || assistantMode === 'post_voice_tour_qa' || assistantMode === 'scrolled_to_end_greeting') {
        // Re-initiate greeting flow or Q&A prompt
        initialGreetingDoneRef.current = false; // Allow greeting to re-trigger
        setUserRespondedToGreeting(false);
        setEndOfPageGreetingDone(false); // Allow scroll-to-end greeting again if applicable
        initiateGreeting();
      }
    }
  }, [isChatInterfaceOpen, assistantMode, initiateGreeting, setStopVoiceTourSignal, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting]);

  // Placeholder for Q&A with Genkit
  const handleSendMessageToAI = useCallback(async (userInput: string) => {
    console.log("IntegratedAssistantController: User asked (Q&A):", userInput);
    addMessageToChat('user', userInput);
    setIsChatbotLoading(true);
    setAvatarAction('thinking');

    try {
      // const aiResponse = await askAboutResume({ question: userInput });
      // For now, placeholder response:
      const aiResponse = { answer: `Regarding "${userInput}", I'd need to consult Chakradhar's full knowledge base. This Q&A part is a placeholder.` };
      addMessageToChat('ai', <p>{aiResponse.answer}</p>, aiResponse.answer);
      speakTextNow(aiResponse.answer, () => {
        if(isMountedRef.current) setAvatarAction('idle');
      });
    } catch (error) {
      console.error("Error fetching AI Q&A response:", error);
      const errorText = "Sorry, I couldn't get a response for that right now.";
      addMessageToChat('ai', <p>{errorText}</p>, errorText);
      speakTextNow(errorText, () => {
        if(isMountedRef.current) setAvatarAction('idle');
      });
    } finally {
      if(isMountedRef.current) {
        setIsChatbotLoading(false);
        // setAvatarAction('idle'); // Moved to onEnd of speakTextNow
      }
    }
  }, [addMessageToChat, speakTextNow, setAvatarAction]);


  // Render all AI components, controlled by this central component
  return (
    <>
      {/* The visual avatar placeholder */}
      <SimpleAvatarDisplay isSpeaking={isSpeakingForAvatar} isVisible={true} />

      {/* The chat bubble that triggers the main chat interface */}
      <ChatbotBubble onClick={mainBubbleClickHandler} isVisible={showChatBubble && !isChatInterfaceOpen} />

      {/* The main chat interface window */}
      <InteractiveChatbot
        key={chatInterfaceRenderKey} // Force re-mount for clean state on re-open
        isOpen={isChatInterfaceOpen}
        messages={chatMessages}
        quickReplies={chatQuickReplies}
        isLoading={isChatbotLoading}
        currentInput={chatInput}
        onInputChange={(e) => setChatInput(e.target.value)}
        onSendMessage={(e) => {
          e.preventDefault();
          if (chatInput.trim()) {
            handleSendMessageToAI(chatInput);
            setChatInput('');
          }
        }}
        onClose={mainBubbleClickHandler} 
        onQuickReplyClick={handleQuickReplyAction}
        mode={assistantMode === 'greeting' || assistantMode === 'project_selection' || assistantMode === 'post_voice_tour_qa' || assistantMode === 'scrolled_to_end_greeting' ? 'quick-reply' : 'qa'}
      />

      {/* The content reader for the voice tour (no UI of its own) */}
      <ContentReader
        startSignal={startVoiceTourSignal}
        stopSignal={stopVoiceTourSignal}
        resumeFromSectionId={currentVoiceTourSectionId}
        speakAndScrollProp={(sectionId, text, onSpeechEndCallback) => {
          // Controller adds message to chat and speaks
          addMessageToChat('ai', <div className="prose prose-sm max-w-none"><p><em>Narrating: {sectionId.replace(/-/g, ' ').replace(/ section/i, '')}</em></p><p>{text}</p></div>, text);
          smoothScrollTo(sectionId);
          speakTextNow(text, onSpeechEndCallback);
        }}
        onProjectsIntroSpoken={() => {
            if (!isMountedRef.current) return;
            console.log("IntegratedAssistantController: ContentReader indicated projects intro spoken.");
            setStopVoiceTourSignal(prev => !prev); // Tell ContentReader to pause its internal auto-advance
            setAssistantMode('project_selection');
            setIsChatInterfaceOpen(true); // Ensure chat is open for project buttons
            setShowBubble(false);

            const projectButtons: ChatbotQuickReplyType[] = pageProjectsData.map(proj => ({
              text: proj.title,
              action: `project_detail_${proj.title.replace(/\s+/g, '_').replace(/[^\w-]+/g, '')}`, 
            }));
            projectButtons.push({ text: "Next Section (Education)", action: 'next_section_education', icon: <ArrowRight /> });
            
            const projectPrompt = "Which project would you like to hear more about in detail, or shall we move to the Education section?";
            addMessageToChat('ai', <p>{projectPrompt}</p>, projectPrompt);
            setChatQuickReplies(projectButtons);
            speakTextNow(projectPrompt);
        }}
        onTourComplete={handleVoiceTourComplete}
      />
    </>
  );
};

export default IntegratedAssistantController;

// Data for ContentReader (could be moved to a separate file)
// Note: 'about-me-section' is what ContentReader will look for. Ensure your AboutMe component has id="about-me-section"
// Similarly for other sections.
const sectionsToReadData = [
  { id: 'about-me-section', speakableText: "First, about Chakradhar: He is a versatile Software Engineer and Machine Learning practitioner, skilled in delivering scalable, secure, and user-centric applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices and AI-powered solutions.", autoAdvanceTo: 'skills-section', autoAdvanceDelay: 500 },
  { id: 'skills-section', speakableText: "Regarding technical skills: Chakradhar primarily works with Python, PySpark, DevOps methodologies, and various Machine Learning frameworks.", autoAdvanceTo: 'experience-section', autoAdvanceDelay: 500 },
  { id: 'experience-section', speakableText: "In terms of experience: He interned at NSIC, developing an e-commerce platform and enhancing security. At Zoho, he optimized backend performance for a video conferencing app and integrated WebRTC.", autoAdvanceTo: 'projects-section', autoAdvanceDelay: 500 },
  { id: 'projects-section', speakableText: "Next, the projects. Chakradhar has worked on several impactful projects.", onAction: 'triggerProjectsInteractive' }, // This will trigger the controller
  { id: 'education-section', speakableText: "For education: Chakradhar is pursuing a Master's in Computer Science at The University of Texas at Dallas, and holds a Bachelor's in Electronics and Communication from R.M.K. Engineering College.", autoAdvanceTo: 'certifications-section', autoAdvanceDelay: 500 },
  { id: 'certifications-section', speakableText: "He also holds certifications from IBM in DevOps, Microsoft as a Full-Stack Developer, Meta as a Back-End Developer, and is an AWS Certified Cloud Practitioner.", autoAdvanceTo: 'publication-section', autoAdvanceDelay: 500 },
  { id: 'publication-section', speakableText: "His publication, 'Text Detection Using Deep Learning,' was presented at an IEEE Conference, showcasing a model with high accuracy in handwriting recognition.", autoAdvanceTo: 'additional-info-section', autoAdvanceDelay: 500 }, // Placeholder for now
  { id: 'additional-info-section', speakableText: "Additionally, Chakradhar is proficient with Git, Linux, REST APIs, and has a strong foundation in Java programming, including OOP and multithreading.", onAction: 'triggerTourComplete' } // Last item
];
const pageProjectsData = [ // Simplified from projects.tsx, ensure consistency or import
  { title: "AI-Powered Smart Detection of Crops and Weeds", description: "He built a YOLO-based object detection system with 90% accuracy for identifying crops and weeds. This helped reduce herbicide usage by 15%." },
  { title: "Search Engine for Movie Summaries", description: "Using PySpark and Hadoop, he developed a search engine that improves query relevance with TF-IDF and cosine similarity across 100K+ records." },
  { title: "Facial Recognition Attendance System", description: "Designed a face-recognition attendance system using OpenCV, achieving 99% accuracy for 200+ users, with real-time cloud syncing." },
  { title: "Mushroom Classification with Scikit-Learn", description: "Used ensemble models like Decision Tree, Random Forest, and KNN to classify mushrooms with 95% accuracy, even with 20% missing data." },
  { title: "Custom Process Scheduler Development", description: "Programmed priority and lottery-based schedulers in xv6/Linux kernel, reducing context-switching by 18% and validating fairness with simulations." }
];


    