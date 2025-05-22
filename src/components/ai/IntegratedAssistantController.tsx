// src/components/ai/IntegratedAssistantController.tsx
"use client";
import React, { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useInView } from 'react-intersection-observer';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { type ChatMessage as ChatbotMessageType, type QuickReply as ChatbotQuickReplyType } from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import Avatar3D, { type AvatarAction } from '@/components/ai/Avatar3D';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, Play, BotMessageSquare } from 'lucide-react';
// import { generateSpeechWithElevenLabs } from '@/app/actions/elevenlabs-tts'; // Placeholder for now
import { askAboutResume } from '@/ai/flows/resume-qa-flow'; // Assuming you have this

type TourStepKey = 
  | 'about' 
  | 'skills-section' 
  | 'experience' 
  | 'projects' // This is the general intro to projects for ContentReader
  | 'education-section' 
  | 'certifications-section' 
  | 'publication-section' 
  | 'additional_info';

type AssistantMode =
  | 'idle' // Chat closed, bubble visible (or initial hidden state before greeting)
  | 'greeting' // Chat open for initial Yes/No tour question
  | 'voice_tour_active' // Chat open, ContentReader is narrating sections, no user quick replies shown in chat
  | 'project_selection' // Chat open, ContentReader paused, project buttons shown
  | 'project_detail_spoken' // After a project detail is spoken, re-show project buttons
  | 'qa' // Chat open for general Q&A after tour or if tour declined
  | 'post_voice_tour_qa' // Specific Q&A mode after tour completion
  | 'tour_declined_pending_scroll' // User said no, bubble visible, waiting for scroll
  | 'scrolled_to_end_greeting'; // User said no, scrolled to end, chat reopened for Q&A

const IntegratedAssistantController: React.FC = () => {
  // Refs first
  const initialGreetingDoneRef = useRef(false);
  const isMountedRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const messageIdCounterRef = useRef(0); // For unique message keys
  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({ threshold: 0.1, triggerOnce: false });


  // State declarations
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [showChatBubble, setShowBubble] = useState(true); // Start with bubble potentially visible
  const [chatMessages, setChatMessages] = useState<ChatbotMessageType[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatbotQuickReplyType[]>([]);
  const [currentChatInput, setCurrentChatInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);

  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false); // Toggle to signal ContentReader
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false); // Toggle
  const [currentVoiceTourSectionId, setCurrentVoiceTourSectionId] = useState<string | null>(null);
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [contactSectionInViewForNoThanks, setContactSectionInViewForNoThanks] = useState(false);

  const [avatarAction, setAvatarAction] = useState<AvatarAction>('idle');
  const [isAvatarVisible, setIsAvatarVisible] = useState(true); 

  const [isSynthReady, setIsSynthReady] = useState(false);
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);


  // Centralized Speech Function (for controller's own speech)
  const speakTextNow = useCallback((text: string, onEnd?: () => void) => {
    if (!isMountedRef.current || !synthRef.current || !isSynthReady) {
      console.warn("IntegratedAssistantController: SpeakTextNow called but synth not ready or component not mounted.");
      if (onEnd) onEnd();
      return;
    }
    console.log("IntegratedAssistantController: speakTextNow called for text:", `"${text.substring(0, 50)}..."`);

    setAvatarAction('talking');

    // Clear previous controller utterance and cancel global speech
    if (controllerUtteranceRef.current) {
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    if(synthRef.current.speaking) { // Only cancel if actively speaking
        console.log("IntegratedAssistantController: Cancelling active speech before new utterance.");
        synthRef.current.cancel();
    }
    controllerUtteranceRef.current = null;

    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance;

    utterance.onend = () => {
      console.log("IntegratedAssistantController: speakTextNow ONEND for text:", `"${text.substring(0, 50)}..."`);
      if (controllerUtteranceRef.current === utterance) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
        controllerUtteranceRef.current = null;
      }
      if (isMountedRef.current) setAvatarAction('idle');
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
      if (isMountedRef.current) setAvatarAction('idle');
      if (onEnd) onEnd(); 
    };
    
    // Voice selection (optional, ensure voices are loaded)
    // const voices = synthRef.current.getVoices();
    // if (voices.length > 0) utterance.voice = voices[0];

    console.log("IntegratedAssistantController: Attempting to speak with browser synth:", `"${text.substring(0,50)}..."`);
    synthRef.current.speak(utterance);
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
  }, []);

  const initiateGreeting = useCallback(() => {
    if (!isMountedRef.current) {
      console.log("IntegratedAssistantController: initiateGreeting called, but not mounted.");
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
    setUserRespondedToGreeting(false); // Reset this as greeting is fresh

    requestAnimationFrame(() => {
      if (isMountedRef.current && synthRef.current && isSynthReady) {
        console.log("IntegratedAssistantController: Speaking initial greeting (deferred).");
        speakTextNow(greetingText);
      } else {
        console.warn("IntegratedAssistantController: Conditions not met for speaking initial greeting (deferred).", {isMounted: isMountedRef.current, synth: !!synthRef.current, isSynthReady});
      }
    });
  }, [addMessageToChat, speakTextNow, isSynthReady]);

  // Effect for initial greeting
  useEffect(() => {
    console.log("IntegratedAssistantController: Initial greeting effect triggered. Mounted:", isMountedRef.current, "SynthReady:", isSynthReady, "GreetingDone:", initialGreetingDoneRef.current);
    if (isMountedRef.current && isSynthReady && !initialGreetingDoneRef.current) {
      console.log("IntegratedAssistantController: Conditions met for initial greeting.");
      initiateGreeting();
      initialGreetingDoneRef.current = true; 
    }
  }, [initiateGreeting, isSynthReady]);


  const handleQuickReplyAction = useCallback((action: string) => {
    if (!isMountedRef.current) return;
    setChatQuickReplies([]); 
    console.log("IntegratedAssistantController: Quick reply action:", action);
    // Cancel any ongoing controller speech before processing new action
    if (synthRef.current && controllerUtteranceRef.current) {
        console.log("IntegratedAssistantController: Cancelling controller speech due to quick reply.");
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
        synthRef.current.cancel();
        controllerUtteranceRef.current = null;
        setAvatarAction('idle');
    }


    if (action === 'start_voice_tour_yes') {
      setUserRespondedToGreeting(true);
      const confirmationText = "Excellent! Let's begin the guided audio tour of Chakradhar's portfolio.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText);
      speakTextNow(confirmationText, () => {
        if (isMountedRef.current) {
          console.log("IntegratedAssistantController: Starting voice tour.");
          // Keep chat interface open for narration
          setIsChatInterfaceOpen(true); 
          setShowBubble(false);
          setChatQuickReplies([]); // Clear greeting buttons
          setAssistantMode('voice_tour_active');
          setCurrentVoiceTourSectionId(ContentReader.sectionsToReadData_FOR_DETAILS_ONLY[0].id);
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
        const project = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY.find(p => p.id === 'projects')?.projectDetails?.find(pd => pd.title === projectName);
        if (project && project.fullDescription) {
            addMessageToChat('user', `Tell me about: ${projectName}`);
            addMessageToChat('ai', <p>{project.fullDescription}</p>, project.fullDescription);
            speakTextNow(project.fullDescription, () => {
                // Re-prompt for more projects or next section
                if (isMountedRef.current) {
                    const reprompt = "Anything else on projects, or shall we move to Education?";
                    addMessageToChat('ai', <p>{reprompt}</p>, reprompt);
                    setChatQuickReplies(ContentReader.sectionsToReadData_FOR_DETAILS_ONLY.find(s => s.id === 'projects')?.projectDetails?.map(p => ({
                        text: p.title,
                        action: `project_detail_${p.title.replace(/\s+/g, '_')}`
                    })).concat([{ text: "Next Section (Education)", action: 'next_section_education', icon: <Play /> }]) || []);
                    speakTextNow(reprompt);
                }
            });
        }
    } else if (action === 'next_section_education') {
        const educationTransitionMsg = "Moving to the Education section.";
        addMessageToChat('ai', <p>{educationTransitionMsg}</p>, educationTransitionMsg);
        speakTextNow(educationTransitionMsg, () => {
            if (isMountedRef.current) {
                setAssistantMode('voice_tour_active');
                setCurrentVoiceTourSectionId('education-section');
                setIsChatInterfaceOpen(true); // Keep open
                setShowBubble(false);
                setChatQuickReplies([]);
                setStartVoiceTourSignal(prev => !prev); // Resume ContentReader
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
            }
        });
    }
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setCurrentVoiceTourSectionId, setStartVoiceTourSignal]);

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
      console.error("Error getting AI response for chatbot:", error);
      const errorText = "Sorry, I couldn't fetch a response right now.";
      if (isMountedRef.current) {
        addMessageToChat('ai', <p>{errorText}</p>, errorText);
        speakTextNow(errorText);
      }
    } finally {
      if (isMountedRef.current) {
        setIsAiResponding(false);
        // setAvatarAction('idle'); // Handled by speakTextNow onEnd
      }
    }
  }, [addMessageToChat, speakTextNow, setAvatarAction]);

  const handleSectionSpokenByContentReader = useCallback((sectionId: string, text: string) => {
    if (isMountedRef.current && assistantMode === 'voice_tour_active') {
      // Display ContentReader's narration in the already open chat box
      addMessageToChat('ai', <div><h4 className="font-semibold mb-1 text-sm text-primary">{sectionId.replace(/_/g, ' ').replace(/-/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h4><p className="text-sm">{text}</p></div>, text);
    }
  }, [addMessageToChat, assistantMode]);

  const handleProjectsIntroSpokenByContentReader = useCallback(() => {
    if (isMountedRef.current) {
      console.log("IntegratedAssistantController: Projects intro spoken. Setting up project selection.");
      setStopVoiceTourSignal(prev => !prev); // Tell ContentReader to pause its internal sequence
      setAssistantMode('project_selection');
      setIsChatInterfaceOpen(true); // Should already be true, but ensure
      setShowBubble(false);
      
      const projectButtons: ChatbotQuickReplyType[] = (ContentReader.sectionsToReadData_FOR_DETAILS_ONLY.find(s => s.id === 'projects')?.projectDetails || [])
        .map(p => ({
          text: p.title,
          action: `project_detail_${p.title.replace(/\s+/g, '_')}`
        }));
      projectButtons.push({ text: "Next Section (Education)", action: 'next_section_education', icon: <Play /> });
      
      const projectsPrompt = "Which project would you like to hear more about in detail, or shall we move to the Education section?";
      addMessageToChat('ai', <p>{projectsPrompt}</p>, projectsPrompt);
      setChatQuickReplies(projectButtons);
      speakTextNow(projectsPrompt);
    }
  }, [addMessageToChat, speakTextNow]);

  const handleVoiceTourComplete = useCallback(() => {
    if (isMountedRef.current) {
      console.log("IntegratedAssistantController: Voice tour completed by ContentReader.");
      setStartVoiceTourSignal(false); 
      setStopVoiceTourSignal(false); // Reset stop signal
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
    }
  }, [addMessageToChat, speakTextNow]);

  const mainBubbleClickHandler = useCallback(() => {
    if (!isMountedRef.current) return;
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    
    if (tourTimeoutRef.current) clearTimeout(tourTimeoutRef.current); // Clear any ContentReader advancement
    if (synthRef.current && (synthRef.current.speaking || synthRef.current.pending)) {
      console.log("IntegratedAssistantController: Cancelling speech due to bubble/close click.");
       if(controllerUtteranceRef.current) {
         controllerUtteranceRef.current.onend = null;
         controllerUtteranceRef.current.onerror = null;
       }
      synthRef.current.cancel();
      controllerUtteranceRef.current = null;
      setAvatarAction('idle');
    }
    setStopVoiceTourSignal(prev => !prev); // Toggle to signal ContentReader to stop

    if (isChatInterfaceOpen) { // If chat is open, this click means close it
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      setChatQuickReplies([]); // Clear buttons when closing
      if (assistantMode === 'voice_tour_active' || assistantMode === 'project_selection' || assistantMode === 'project_detail_spoken') {
        setAssistantMode('idle'); // Reset mode if tour was interrupted by closing chat
      }
    } else { // If chat is closed, this click means open it
      if (assistantMode === 'idle' || assistantMode === 'tour_declined_pending_scroll' || assistantMode === 'scrolled_to_end_greeting' || voiceTourCompleted ) {
        initiateGreeting(); // Restart greeting / offer Q&A
      } else {
        // This case should ideally be handled by specific mode logic if a tour was paused
        setIsChatInterfaceOpen(true);
        setShowBubble(false);
        setAssistantMode('qa'); // Default to Q&A
        const helpMsg = "How can I help you regarding Chakradhar's portfolio?";
        addMessageToChat('ai', <p>{helpMsg}</p>, helpMsg);
        speakTextNow(helpMsg);
      }
    }
  }, [isChatInterfaceOpen, assistantMode, voiceTourCompleted, initiateGreeting, addMessageToChat, speakTextNow, setAvatarAction]);
  
  // Effect for "No, Thanks" and scroll to end
  useEffect(() => {
    if (assistantMode === 'tour_declined_pending_scroll' && contactSectionInView && !contactSectionInViewForNoThanks && isMountedRef.current) {
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
      setContactSectionInViewForNoThanks(true); 
      speakTextNow(scrolledToEndMessage);
    }
  }, [contactSectionInView, assistantMode, contactSectionInViewForNoThanks, addMessageToChat, speakTextNow, initiateGreeting]); // Added initiateGreeting

  // Determine bubble visibility
  const effectiveShowBubble = !isChatInterfaceOpen && !(assistantMode === 'voice_tour_active' && startVoiceTourSignal && !voiceTourCompleted);

  return (
    <>
      {/* Intersection observer target for contact section */}
      <div ref={contactSectionRef} style={{ position: 'absolute', bottom: '0px', height: '1px', width: '1px', pointerEvents: 'none', opacity: 0 }} />
      
      {/* Removed SimpleAvatarDisplay, to be replaced by 3D Avatar */}
      {/* <SimpleAvatarDisplay isSpeaking={isSpeakingForAvatar} isVisible={isAvatarVisible} /> */}
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
        startSignal={startVoiceTourSignal}
        stopSignal={stopVoiceTourSignal}
        currentSectionIdToSpeak={currentVoiceTourSectionId}
        onSectionSpoken={handleSectionSpokenByContentReader}
        onProjectsIntroSpoken={handleProjectsIntroSpokenByContentReader}
        onTourComplete={handleVoiceTourComplete}
        // Pass speakTextNow from controller to ContentReader
        speakTextProp={speakTextNow}
        setAvatarActionProp={setAvatarAction}
      />
    </>
  );
};

export default IntegratedAssistantController;
