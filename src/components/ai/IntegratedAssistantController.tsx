// src/components/ai/IntegratedAssistantController.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { 
  type ChatMessage as ChatbotMessageType, 
  type QuickReply as ChatbotQuickReplyType 
} from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import AnimatedVideoAvatar, { type AvatarAction } from './AnimatedVideoAvatar';
import { generateSpeechWithElevenLabs } from '@/app/actions/elevenlabs-tts';
import { useInView } from 'react-intersection-observer';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, BotMessageSquare, Play } from 'lucide-react';

type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'voice_tour_paused'
  | 'speaking_project_titles' // This mode might be simplified if ContentReader handles all project details
  | 'projects_interactive'    // When chat shows project buttons
  | 'post_voice_tour_qa'
  | 'qa_active'
  | 'tour_declined_pending_scroll'
  | 'scrolled_to_end_greeting';

interface ChatMessage extends ChatbotMessageType {}
interface ChatQuickReply extends ChatbotQuickReplyType {}

const IntegratedAssistantController: React.FC = () => {
  const [isChatInterfaceOpen, setIsChatInterfaceOpen] = useState(false);
  const [showChatBubble, setShowBubble] = useState(true);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>('idle');
  const [userRespondedToGreeting, setUserRespondedToGreeting] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatQuickReplies, setChatQuickReplies] = useState<ChatQuickReply[]>([]);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  
  const [startVoiceTourSignal, setStartVoiceTourSignal] = useState(false);
  const [stopVoiceTourSignal, setStopVoiceTourSignal] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState<string | null>('about'); // Initial section for tour
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);

  const [isSynthReady, setIsSynthReady] = useState(false); // For browser TTS fallback
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);
  
  const [avatarAction, setAvatarAction] = useState<AvatarAction>('idle');
  const [avatarVisible, setAvatarVisible] = useState(true); // Initially visible

  const initialGreetingDoneRef = useRef(false);
  const isMountedRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null); // Browser SpeechSynthesis
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messageIdCounterRef = useRef(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null); // For ElevenLabs audio

  const { ref: contactSectionRef, inView: contactSectionInView } = useInView({ threshold: 0.1, triggerOnce: true });

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined') {
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis;
        const voices = synthRef.current.getVoices();
        if (voices.length > 0) {
          setIsSynthReady(true);
        } else {
          synthRef.current.onvoiceschanged = () => {
            if (isMountedRef.current && synthRef.current && synthRef.current.onvoiceschanged) {
              setIsSynthReady(true);
              synthRef.current.onvoiceschanged = null; // Remove listener once voices are loaded
            }
          };
        }
      }
      audioPlayerRef.current = new Audio();
    }
    return () => {
      isMountedRef.current = false;
      if (synthRef.current) synthRef.current.cancel();
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = '';
      }
    };
  }, []);

  // Centralized speech function
  const speakTextNow = useCallback(async (text: string, onEnd?: () => void, isChainedCall = false) => {
    if (!isMountedRef.current || !text) {
      if (onEnd) onEnd();
      return;
    }
    
    setAvatarAction('talking');

    // Stop any currently playing audio (browser or ElevenLabs)
    if (synthRef.current?.speaking) synthRef.current.cancel();
    if (controllerUtteranceRef.current) {
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
      controllerUtteranceRef.current = null;
    }
    if (audioPlayerRef.current && !audioPlayerRef.current.paused) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0; 
    }
    
    console.log("IntegratedAssistantController: Attempting to speak:", `"${text.substring(0,30)}..."`);

    // Attempt ElevenLabs TTS
    try {
      const elevenLabsResponse = await generateSpeechWithElevenLabs({ text });
      if (elevenLabsResponse.success && elevenLabsResponse.audioUrl && audioPlayerRef.current) {
        console.log("IntegratedAssistantController: Playing ElevenLabs audio:", elevenLabsResponse.audioUrl);
        audioPlayerRef.current.src = elevenLabsResponse.audioUrl; // This should be a data URL if base64
        audioPlayerRef.current.play().catch(e => {
            console.error("Error playing ElevenLabs audio:", e);
            setAvatarAction('idle'); // Fallback if play fails
            if (onEnd) onEnd();
        });
        audioPlayerRef.current.onended = () => {
          if (isMountedRef.current) {
            setAvatarAction('idle');
            if (onEnd) onEnd();
          }
        };
        audioPlayerRef.current.onerror = (e) => {
          console.error("Error with ElevenLabs audio player:", e);
          if (isMountedRef.current) {
            setAvatarAction('idle');
            if (onEnd) onEnd(); 
          }
        };
        return; // Successfully started ElevenLabs audio
      } else if (elevenLabsResponse.success && !elevenLabsResponse.audioUrl) {
        console.log("IntegratedAssistantController: ElevenLabs placeholder success (no audio URL). Falling back to browser TTS.");
      } else if (!elevenLabsResponse.success) {
        console.warn("IntegratedAssistantController: ElevenLabs TTS failed:", elevenLabsResponse.error, ". Falling back to browser TTS.");
      }
    } catch (elevenError) {
        console.error("IntegratedAssistantController: Error calling ElevenLabs action:", elevenError, ". Falling back to browser TTS.");
    }

    // Fallback to browser TTS if ElevenLabs failed or not configured/returned no audio
    if (!synthRef.current || !isSynthReady) {
      console.warn("IntegratedAssistantController: Browser speech synth not ready, cannot speak (fallback):", text);
      if (isMountedRef.current) setAvatarAction('idle');
      if (onEnd) onEnd();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance; // Track this utterance
    
    utterance.onend = () => {
      if (isMountedRef.current && controllerUtteranceRef.current === utterance) {
        setAvatarAction('idle');
        controllerUtteranceRef.current = null;
        if (onEnd) onEnd();
      }
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) errorDetails = event.error; 
      console.error("IntegratedAssistantController browser TTS error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Event object:", event);
      if (isMountedRef.current && controllerUtteranceRef.current === utterance) { 
          controllerUtteranceRef.current = null;
          setAvatarAction('idle');
          if (onEnd) onEnd(); 
      }
    };
    synthRef.current.speak(utterance);
  }, [isSynthReady]); // Depends on isSynthReady for browser fallback

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
    if (!isMountedRef.current || initialGreetingDoneRef.current) return;
    console.log("IntegratedAssistantController: Initiating greeting.");
    
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

    speakTextNow(greetingText); // Speak the greeting
    initialGreetingDoneRef.current = true;
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey]);

  // Initial greeting useEffect
  useEffect(() => {
    if (isMountedRef.current && !initialGreetingDoneRef.current && isSynthReady) { // Ensure synth is ready for initial speech
        const timer = setTimeout(() => {
            if(isMountedRef.current && !initialGreetingDoneRef.current) { // Double check before initiating
                 initiateGreeting();
            }
        }, 500); // Short delay to ensure page is stable
        return () => clearTimeout(timer);
    }
  }, [initiateGreeting, isSynthReady]);


  const handleQuickReplyAction = useCallback((action: string) => {
    if (!isMountedRef.current) return;
    setChatQuickReplies([]);

    if (action === 'start_voice_tour_yes') {
      setUserRespondedToGreeting(true);
      const confirmationText = "Excellent! Let's begin the tour.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText);
      speakTextNow(confirmationText, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false); // Close chat for tour
          setShowBubble(false); // Hide bubble during tour
          setAvatarVisible(true);
          setCurrentTourStep('about'); // Start tour from 'about'
          setStartVoiceTourSignal(true);
          setStopVoiceTourSignal(false);
          setAssistantMode('voice_tour_active');
        }
      });
    } else if (action === 'decline_tour') {
      setUserRespondedToGreeting(true);
      const declineMessage = "Alright. Feel free to explore at your own pace. You can click my icon if you have questions later!";
      addMessageToChat('ai', <p>{declineMessage}</p>, declineMessage);
      speakTextNow(declineMessage, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false);
          setShowBubble(true); // Show bubble
          setAvatarVisible(true);
          setAssistantMode('tour_declined_pending_scroll');
        }
      });
    }  else if (action.startsWith('project_detail_')) {
      const projectTitle = action.substring('project_detail_'.length).replace(/_/g, ' ');
      const project = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(p => p.id === 'projects')?.projectDetails?.find(pd => pd.title === projectTitle);
      if (project && project.description) {
        addMessageToChat('ai', <div><p className="font-semibold">{project.title}</p><p>{project.description}</p></div>, `${project.title}. ${project.description}`);
        speakTextNow(`${project.title}. ${project.description}`, () => {
           if (isMountedRef.current) {
             // Re-present project options
             const projectReplies = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(s => s.id === 'projects')?.projectDetails?.map(p => ({ text: p.title, action: `project_detail_${p.title.replace(/\s+/g, '_')}` })) || [];
             setChatQuickReplies([
                ...projectReplies,
                { text: "Next Section (Education)", action: 'next_section_education', icon: <Play className="h-4 w-4" /> }
             ]);
           }
        });
      }
    } else if (action === 'next_section_education') {
      // Triggered from projects section to move to education
      setIsChatInterfaceOpen(false);
      setShowBubble(false); // Keep bubble hidden as tour continues
      setCurrentTourStep('education-section');
      setStartVoiceTourSignal(true); // Resume ContentReader
      setStopVoiceTourSignal(false);
      setAssistantMode('voice_tour_active');
    } else if (action === 'ask_question_init') {
      setAssistantMode('qa_active');
      const qaPrompt = "Sure, what would you like to know about Chakradhar?";
      addMessageToChat('ai', <p>{qaPrompt}</p>, qaPrompt);
      speakTextNow(qaPrompt);
    } else if (action === 'download_resume_action') {
      addMessageToChat('ai', <p>Downloading the resume...</p>, "Downloading the resume.");
      speakTextNow("Downloading the resume.");
      window.open('/Lakshmi_resume.pdf', '_blank');
      setChatQuickReplies([
        { text: "Ask another question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
      ]);
    } else if (action === 'end_chat_action') {
      addMessageToChat('ai', <p>Thanks for visiting!</p>, "Thanks for visiting!");
      speakTextNow("Thanks for visiting!", () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false); setShowBubble(true); setAssistantMode('idle'); setAvatarVisible(true);
        }
      });
    }
  }, [addMessageToChat, speakTextNow, setAssistantMode, setCurrentTourStep, setStartVoiceTourSignal, setStopVoiceTourSignal, setIsChatInterfaceOpen, setShowBubble, setUserRespondedToGreeting, setChatQuickReplies, setAvatarVisible]);

  const handleVoiceTourComplete = useCallback(() => {
    if (isMountedRef.current) {
      setStartVoiceTourSignal(false);
      setVoiceTourCompleted(true);
      setAssistantMode('post_voice_tour_qa');
      setChatInterfaceRenderKey(prev => prev + 1); 
      setChatMessages([]); 
      const endMessage = "That's a complete tour of Chakradhar’s resume. Would you like to know more about anything else?";
      addMessageToChat('ai', <p>{endMessage}</p>, endMessage);
      speakTextNow(endMessage);
      setChatQuickReplies([
        { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
        { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
        { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
      ]);
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
      setAvatarVisible(true); 
    }
  }, [addMessageToChat, speakTextNow, setStartVoiceTourSignal, setVoiceTourCompleted, setAssistantMode, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies, setChatMessages, setChatInterfaceRenderKey, setAvatarVisible]);
  
  const handleProjectsStepInController = useCallback(() => {
    if (isMountedRef.current) {
      setStartVoiceTourSignal(false); 
      setStopVoiceTourSignal(true); // Signal ContentReader to stop its own TTS for this step
      setAssistantMode('projects_interactive');
      setChatInterfaceRenderKey(prev => prev + 1);
      
      const projectIntroText = "Chakradhar has led and contributed to impactful projects. Select one to learn more, or proceed to the next section.";
      addMessageToChat('ai', <p>{projectIntroText}</p>, projectIntroText);
      speakTextNow(projectIntroText);

      const projectDetails = ContentReader.sectionsToReadData_FOR_DETAILS_ONLY?.find(s => s.id === 'projects')?.projectDetails;
      const projectButtons = projectDetails?.map(p => ({ text: p.title, action: `project_detail_${p.title.replace(/\s+/g, '_')}`, icon: <BotMessageSquare className="h-4 w-4"/> })) || [];
      
      setChatQuickReplies([
          ...projectButtons,
          { text: "Next Section (Education)", action: 'next_section_education', icon: <Play className="h-4 w-4" /> }
      ]);
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
      setAvatarVisible(true);
    }
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatQuickReplies, setChatInterfaceRenderKey, setAvatarVisible]);

  // Scroll-to-end greeting
   useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !voiceTourCompleted && userRespondedToGreeting && !startVoiceTourSignal) {
      if (isMountedRef.current) {
        setAssistantMode('scrolled_to_end_greeting');
        setChatInterfaceRenderKey(prev => prev + 1);
        setChatMessages([]);
        const endScrollMessage = "Thanks for taking the time to look through Chakradhar's portfolio! Have any questions?";
        addMessageToChat('ai', <p>{endScrollMessage}</p>, endScrollMessage);
        speakTextNow(endScrollMessage);
        setChatQuickReplies([
          { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" />  },
          { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
        ]);
        setIsChatInterfaceOpen(true);
        setShowBubble(false);
        setAvatarVisible(true);
      }
    }
  }, [contactSectionInView, assistantMode, voiceTourCompleted, addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey, setAvatarVisible, userRespondedToGreeting, startVoiceTourSignal]);
  
  const mainBubbleClickHandler = useCallback(() => {
    if (!isMountedRef.current) return;

    // Stop any ongoing speech from controller or reader
    if (synthRef.current?.speaking) synthRef.current.cancel();
    if (audioPlayerRef.current && !audioPlayerRef.current.paused) audioPlayerRef.current.pause();
    setStopVoiceTourSignal(true); // Also signal ContentReader to stop

    if (isChatInterfaceOpen) {
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      setStartVoiceTourSignal(false); // Ensure tour doesn't auto-restart
      if (assistantMode === 'voice_tour_active') {
        setAssistantMode('voice_tour_paused');
      } else if (assistantMode !== 'tour_declined_pending_scroll' && assistantMode !== 'scrolled_to_end_greeting') {
         setAssistantMode(voiceTourCompleted ? 'post_voice_tour_qa' : 'idle');
      }
    } else { 
      setChatInterfaceRenderKey(prev => prev + 1);
      setChatMessages([]); 
      if (assistantMode === 'voice_tour_paused') {
        const pauseMessage = "The guided tour is paused. You can ask a question, resume, or end the chat.";
        addMessageToChat('ai', <p>{pauseMessage}</p>, pauseMessage);
        speakTextNow(pauseMessage);
        setChatQuickReplies([
            { text: "Resume Tour", action: 'start_voice_tour_yes', icon: <Play className="h-4 w-4" />}, // Resume from currentTourStep
            { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
            { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
            { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
        ]);
      } else if (assistantMode === 'post_voice_tour_qa' || voiceTourCompleted) {
          const endMessage = "The tour is complete. Feel free to ask any questions about Chakradhar, download the resume, or end the chat.";
          addMessageToChat('ai', <p>{endMessage}</p>, endMessage);
          speakTextNow(endMessage);
          setChatQuickReplies([
            { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
            { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
            { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
          ]);
          setAssistantMode('post_voice_tour_qa');
      } else { 
          // Default to re-initiating greeting if idle or after declined scroll
          initialGreetingDoneRef.current = false; // Allow re-greeting
          initiateGreeting(); 
      }
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
    }
    // Avatar visibility tied to chat interface state, unless tour is active
    setAvatarVisible(isChatInterfaceOpen || (assistantMode === 'voice_tour_active' && startVoiceTourSignal));
  }, [isChatInterfaceOpen, assistantMode, voiceTourCompleted, initiateGreeting, addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStopVoiceTourSignal, setStartVoiceTourSignal, setChatQuickReplies, setChatMessages, setChatInterfaceRenderKey, setAvatarVisible, currentTourStep]); // Added currentTourStep

  // This determines if the bubble should be visible.
  // Bubble is hidden if chat is open OR if voice tour is actively presenting.
  const effectiveShowBubble = showChatBubble && !isChatInterfaceOpen && !(assistantMode === 'voice_tour_active' && startVoiceTourSignal);

  return (
    <>
      {/* The contact section ref needs to be attached to the actual contact section on the page */}
      {/* This is a common pattern, but typically you'd attach it to the <SectionWrapper id="contact"> in page.tsx or contact.tsx */}
      {/* For now, this hook will work if the element with id="contact" is present in the DOM */}
      <div ref={contactSectionRef} style={{ position: 'absolute', bottom: '0px' }} />

      <AnimatedVideoAvatar action={avatarAction} isVisible={avatarVisible} />
      <ChatbotBubble 
        onClick={mainBubbleClickHandler} 
        isVisible={effectiveShowBubble} 
      />
      {isMountedRef.current && ( // Conditionally render ChatbotInterface
        <InteractiveChatbot
          key={`chat-interface-${chatInterfaceRenderKey}`}
          isOpen={isChatInterfaceOpen}
          onClose={mainBubbleClickHandler}
          initialMessages={chatMessages}
          initialQuickReplies={chatQuickReplies}
          onQuickReplyAction={handleQuickReplyAction}
          isLoading={isChatbotLoading} 
          currentMode={assistantMode}
          speakTextProp={speakTextNow} 
          setAvatarActionProp={setAvatarAction}
        />
      )}
      {isMountedRef.current && ( // Conditionally render ContentReader
        <ContentReader
          startTourSignal={startVoiceTourSignal}
          stopTourSignal={stopVoiceTourSignal}
          currentGlobalStepId={currentTourStep}
          onTourComplete={handleVoiceTourComplete}
          onProjectsStepReached={handleProjectsStepInController}
          addMessageToChat={addMessageToChat}
          speakTextProp={speakTextNow} // Pass the controller's speakTextNow
          // setAvatarActionProp={setAvatarAction} // ContentReader will call speakTextProp which handles avatar
        />
      )}
    </>
  );
};

export default IntegratedAssistantController;
