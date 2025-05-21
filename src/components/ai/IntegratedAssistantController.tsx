// src/components/ai/IntegratedAssistantController.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatbotBubble from '@/components/chatbot/ChatbotBubble';
import InteractiveChatbot, { 
  type ChatMessage as ChatbotMessageType, 
  type QuickReply as ChatbotQuickReplyType 
} from '@/components/chatbot/InteractiveChatbot';
import ContentReader from '@/components/ai/ContentReader';
import { CheckCircle, XCircle, MessageCircleQuestion, Download, BotMessageSquare, Play } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import AnimatedVideoAvatar, { type AvatarAction } from './AnimatedVideoAvatar';
import { generateSpeechWithElevenLabs } from '@/app/actions/elevenlabs-tts'; // Import ElevenLabs action

type AssistantMode =
  | 'idle'
  | 'greeting'
  | 'voice_tour_active'
  | 'voice_tour_paused'
  | 'speaking_project_titles'
  | 'projects_interactive'
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
  const [currentTourStep, setCurrentTourStep] = useState<string | null>('about'); 
  const [voiceTourCompleted, setVoiceTourCompleted] = useState(false);
  const [isSynthReady, setIsSynthReady] = useState(false);
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);
  const [avatarAction, setAvatarAction] = useState<AvatarAction>('idle');
  const [avatarVisible, setAvatarVisible] = useState(true); // Controls avatar visibility

  const initialGreetingDoneRef = useRef(false);
  const isMountedRef = useRef(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const controllerUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messageIdCounterRef = useRef(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const { ref: contactViewRef, inView: contactSectionInView } = useInView({ threshold: 0.1 });

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      const voices = synthRef.current.getVoices();
      if (voices.length > 0) {
        setIsSynthReady(true);
      } else {
        synthRef.current.onvoiceschanged = () => {
          if (isMountedRef.current && synthRef.current && synthRef.current.onvoiceschanged) {
            setIsSynthReady(true);
            synthRef.current.onvoiceschanged = null;
          }
        };
      }
    }
    audioPlayerRef.current = new Audio();
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

  const speakTextNow = useCallback(async (text: string, onEnd?: () => void, isChainedCall = false) => {
    if (!isMountedRef.current || !text) {
      if (onEnd) onEnd();
      return;
    }
    
    setAvatarAction('talking');

    // Prioritize ElevenLabs
    const elevenLabsResponse = await generateSpeechWithElevenLabs({ text });
    if (elevenLabsResponse.success && elevenLabsResponse.audioUrl && audioPlayerRef.current) {
      console.log("IntegratedAssistantController: Playing ElevenLabs audio:", elevenLabsResponse.audioUrl);
      audioPlayerRef.current.src = elevenLabsResponse.audioUrl;
      audioPlayerRef.current.play().catch(e => console.error("Error playing ElevenLabs audio:", e));
      audioPlayerRef.current.onended = () => {
        setAvatarAction('idle');
        if (onEnd) onEnd();
      };
      audioPlayerRef.current.onerror = (e) => {
        console.error("Error with ElevenLabs audio player:", e);
        setAvatarAction('idle');
        if (onEnd) onEnd(); 
      };
      return;
    } else if (elevenLabsResponse.success && !elevenLabsResponse.audioUrl) {
      // Placeholder success, but no audio URL means we might fallback or just complete.
      // For now, let's assume this means we just show text.
      console.log("IntegratedAssistantController: ElevenLabs TTS placeholder success (no audio URL).");
      setAvatarAction('idle'); // Or keep 'talking' for a bit if text is displayed
      if(onEnd) setTimeout(() => onEnd(), text.length * 50); // Simulate speech time
      return;
    }

    // Fallback to browser TTS if ElevenLabs failed or not configured
    console.log("IntegratedAssistantController: Falling back to browser TTS for:", `"${text.substring(0,30)}..."`);
    if (!synthRef.current || !isSynthReady) {
      console.warn("IntegratedAssistantController: Browser speech synth not ready, cannot speak:", text);
      setAvatarAction('idle');
      if (onEnd) onEnd();
      return;
    }

    if (controllerUtteranceRef.current) {
      controllerUtteranceRef.current.onend = null;
      controllerUtteranceRef.current.onerror = null;
    }
    if (!isChainedCall && synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    controllerUtteranceRef.current = null;

    const utterance = new SpeechSynthesisUtterance(text);
    controllerUtteranceRef.current = utterance;

    utterance.onend = () => {
      if (controllerUtteranceRef.current === utterance) {
        controllerUtteranceRef.current.onerror = null;
        controllerUtteranceRef.current = null;
        setAvatarAction('idle');
        if (onEnd) onEnd();
      }
    };
    utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
      let errorDetails = "Unknown speech error";
      if (event && event.error) errorDetails = event.error;
      console.error("IntegratedAssistantController speakTextNow error for text:", `"${text.substring(0,50)}..."`, "Error details:", errorDetails, "Event object:", event);
      if (controllerUtteranceRef.current === utterance) {
        controllerUtteranceRef.current.onend = null; 
        controllerUtteranceRef.current = null;
      }
      setAvatarAction('idle');
      if (onEnd) onEnd();
    };

    let spokenOrQueuedThisCall = false;
    const tryToSpeak = () => {
      if (spokenOrQueuedThisCall || !synthRef.current || !controllerUtteranceRef.current || controllerUtteranceRef.current !== utterance) return;
      spokenOrQueuedThisCall = true;
      synthRef.current.speak(utterance);
    };

    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      tryToSpeak();
    } else {
      const voiceLoadTimeout = setTimeout(() => { if (isMountedRef.current && !spokenOrQueuedThisCall) tryToSpeak(); }, 500);
      synthRef.current.onvoiceschanged = () => {
        if (synthRef.current) synthRef.current.onvoiceschanged = null;
        clearTimeout(voiceLoadTimeout);
        if (isMountedRef.current && !spokenOrQueuedThisCall) tryToSpeak();
      };
      if(synthRef.current && synthRef.current.getVoices().length > 0 && !spokenOrQueuedThisCall) {
        if(synthRef.current.onvoiceschanged) synthRef.current.onvoiceschanged(new Event('voiceschanged'));
      }
    }
  }, [isSynthReady]);

  const addMessageToChat = useCallback((sender: 'user' | 'ai', textNode: React.ReactNode, speakableText?: string) => {
    setChatMessages(prev => {
      messageIdCounterRef.current += 1;
      const newMessage: ChatMessage = { id: `${Date.now()}-${messageIdCounterRef.current}`, sender, text: textNode, speakableTextOverride: speakableText };
      return [...prev, newMessage];
    });
  }, []);
  
  const initiateGreeting = useCallback(() => {
    if (initialGreetingDoneRef.current || !isMountedRef.current) return;
    console.log("IntegratedAssistantController: Initiating greeting.");
    setChatMessages([]);
    setChatInterfaceRenderKey(prev => prev + 1);
    const greetingText = "Hi there! I’m your AI assistant. Would you like me to walk you through Chakradhar’s portfolio?";
    addMessageToChat('ai', <p>{greetingText}</p>, greetingText);
    setChatQuickReplies([
      { text: "Guide Me Through Portfolio", action: 'start_voice_tour_yes', icon: <Play className="h-4 w-4" /> },
      { text: "No, Thanks", action: 'decline_tour', icon: <XCircle className="h-4 w-4" /> },
    ]);
    setIsChatInterfaceOpen(true);
    setShowBubble(false);
    setAssistantMode('greeting');
    setUserRespondedToGreeting(false); // User has been greeted, but not yet responded

    requestAnimationFrame(() => {
      if (isMountedRef.current && isSynthReady) {
        console.log("IntegratedAssistantController: Speaking initial greeting (deferred).");
        speakTextNow(greetingText); 
      }
    });
    initialGreetingDoneRef.current = true;
  }, [addMessageToChat, speakTextNow, isSynthReady, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setUserRespondedToGreeting, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey ]);

  useEffect(() => {
    if (!initialGreetingDoneRef.current && isMountedRef.current && isSynthReady && assistantMode === 'idle' && !isChatInterfaceOpen) {
      initiateGreeting();
    }
  }, [initiateGreeting, isSynthReady, assistantMode, isChatInterfaceOpen]);

  const handleQuickReplyAction = useCallback((action: string) => {
    setChatQuickReplies([]);
    if (action === 'start_voice_tour_yes') {
      setUserRespondedToGreeting(true);
      const confirmationText = "Excellent! Let's begin the tour.";
      addMessageToChat('ai', <p>{confirmationText}</p>, confirmationText);
      speakTextNow(confirmationText, () => {
        if (isMountedRef.current) {
          setIsChatInterfaceOpen(false);
          setShowBubble(false); 
          setAvatarVisible(true); // Make sure avatar is visible for the tour
          setCurrentTourStep('about');
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
          setShowBubble(true);
          setAvatarVisible(true); // Avatar stays visible
          setAssistantMode('tour_declined_pending_scroll');
        }
      });
    } else if (action.startsWith('project_detail_')) {
      // ... (project detail logic, if needed here or in InteractiveChatbot)
    } else if (action === 'ask_question_init') {
      setAssistantMode('qa_active');
      const qaPrompt = "Sure, what would you like to know about Chakradhar?";
      addMessageToChat('ai', <p>{qaPrompt}</p>, qaPrompt);
      speakTextNow(qaPrompt);
    } else if (action === 'download_resume_action') {
      addMessageToChat('ai', <p>Downloading the resume...</p>, "Downloading the resume.");
      speakTextNow("Downloading the resume.");
      window.open('/Lakshmi_resume.pdf', '_blank');
      // No need to close interface immediately, user might want to ask another question
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
      console.log("IntegratedAssistantController: Voice tour completed.");
      setStartVoiceTourSignal(false);
      setVoiceTourCompleted(true);
      setAssistantMode('post_voice_tour_qa');
      setChatInterfaceRenderKey(prev => prev + 1); // Force re-render of chat interface for fresh state
      setChatMessages([]); // Clear previous tour messages
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
      setAvatarVisible(true); // Ensure avatar is visible
    }
  }, [addMessageToChat, speakTextNow, setStartVoiceTourSignal, setVoiceTourCompleted, setAssistantMode, setIsChatInterfaceOpen, setShowBubble, setChatQuickReplies, setChatMessages, setChatInterfaceRenderKey, setAvatarVisible]);
  
  const handleProjectsStepInController = useCallback(() => {
    if (isMountedRef.current) {
      console.log("IntegratedAssistantController: Reached projects step in tour. Opening chat for selection.");
      setStartVoiceTourSignal(false); // Pause ContentReader by stopping its signal
      setStopVoiceTourSignal(true); // Explicitly signal stop
      setAssistantMode('projects_interactive');
      setChatInterfaceRenderKey(prev => prev + 1);
      
      const projectIntroText = "Chakradhar has worked on several interesting projects. Select one to learn more, or proceed to the next section.";
      addMessageToChat('ai', <p>{projectIntroText}</p>, projectIntroText);
      speakTextNow(projectIntroText);

      // Assuming pageProjectsData is imported and available
      // const projectButtons = pageProjectsData.map(p => ({ text: p.title, action: `project_detail_${p.title.replace(/\s+/g, '_')}` }));
      // For now, let's keep this simple without dynamic project buttons from ContentReader
      // This part will be handled by InteractiveChatbot if project buttons are generated there.
      // The controller primarily manages the flow.
      setChatQuickReplies([
          // Project buttons would be dynamically added here based on ContentReader's data,
          // or InteractiveChatbot itself will manage fetching/displaying them.
          // For now, let's assume the user has to type project name if QA is active later
          { text: "Next Section (Education)", action: 'next_section_education', icon: <Play className="h-4 w-4" /> }
      ]);
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
      setAvatarVisible(true);
    }
  }, [addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStartVoiceTourSignal, setStopVoiceTourSignal, setChatQuickReplies, setChatInterfaceRenderKey, setAvatarVisible]);


  useEffect(() => {
    if (contactSectionInView && assistantMode === 'tour_declined_pending_scroll' && !voiceTourCompleted) {
      console.log("IntegratedAssistantController: Contact section in view after tour declined.");
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
  }, [contactSectionInView, assistantMode, voiceTourCompleted, addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey, setAvatarVisible]);
  
  const mainBubbleClickHandler = useCallback(() => {
    console.log("IntegratedAssistantController: Bubble/Close clicked. Current mode:", assistantMode, "Chat open:", isChatInterfaceOpen);
    
    if (isMountedRef.current && synthRef.current) {
      if (controllerUtteranceRef.current) {
        controllerUtteranceRef.current.onend = null;
        controllerUtteranceRef.current.onerror = null;
        controllerUtteranceRef.current = null;
      }
      synthRef.current.cancel();
    }
    if (audioPlayerRef.current) audioPlayerRef.current.pause();

    setStopVoiceTourSignal(true); // Signal ContentReader to stop if it's active

    if (isChatInterfaceOpen) {
      setIsChatInterfaceOpen(false);
      setShowBubble(true);
      setStartVoiceTourSignal(false); 
      setAvatarAction('idle'); // Avatar back to idle when chat closes
      if (assistantMode === 'voice_tour_active') {
        setAssistantMode('voice_tour_paused');
      } else if (assistantMode !== 'tour_declined_pending_scroll' && assistantMode !== 'scrolled_to_end_greeting') {
         setAssistantMode(voiceTourCompleted ? 'post_voice_tour_qa' : 'idle');
      }
    } else { 
      setChatInterfaceRenderKey(prev => prev + 1); // Force re-render of chat
      setChatMessages([]); // Clear messages when reopening
      if (assistantMode === 'voice_tour_paused') {
        addMessageToChat('ai', <p>The guided tour is paused. You can ask a question or end the chat.</p>, "The guided tour is paused. You can ask a question or end the chat.");
        setChatQuickReplies([
            { text: "Ask a question", action: 'ask_question_init', icon: <MessageCircleQuestion className="h-4 w-4" /> },
            { text: "Download Resume", action: 'download_resume_action', icon: <Download className="h-4 w-4" /> },
            { text: "End Chat", action: 'end_chat_action', icon: <XCircle className="h-4 w-4" /> },
        ]);
      } else if (assistantMode === 'idle' || assistantMode === 'tour_declined_pending_scroll' || assistantMode === 'scrolled_to_end_greeting' || voiceTourCompleted) {
        // If tour was declined, or completed, or is just idle, re-initiate greeting or post-tour options
        if (voiceTourCompleted || assistantMode === 'post_voice_tour_qa') {
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
            initiateGreeting(); // This will set mode to 'greeting'
        }
      } else {
        // Default to greeting if in an unexpected state
        initiateGreeting();
      }
      setIsChatInterfaceOpen(true);
      setShowBubble(false);
    }
    setAvatarVisible(isChatInterfaceOpen); // Avatar visible only if chat is open, or during tour
  }, [isChatInterfaceOpen, assistantMode, voiceTourCompleted, initiateGreeting, addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setStopVoiceTourSignal, setStartVoiceTourSignal, setChatQuickReplies, setChatMessages, setChatInterfaceRenderKey, setAvatarVisible, setUserRespondedToGreeting, initialGreetingDoneRef]);
  
  useEffect(() => {
    const contactElement = document.getElementById('contact');
    if (contactElement) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && assistantMode === 'tour_declined_pending_scroll' && !voiceTourCompleted) {
            if (isMountedRef.current) {
              console.log("IntegratedAssistantController: Contact section in view after tour declined.");
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
        },
        { threshold: 0.1 }
      );
      observer.observe(contactElement);
      return () => observer.unobserve(contactElement);
    }
  }, [assistantMode, voiceTourCompleted, addMessageToChat, speakTextNow, setIsChatInterfaceOpen, setShowBubble, setAssistantMode, setChatMessages, setChatQuickReplies, setChatInterfaceRenderKey, setAvatarVisible]);

  const effectiveShowBubble = showChatBubble && !isChatInterfaceOpen && !(assistantMode === 'voice_tour_active' && startVoiceTourSignal);

  return (
    <>
      <AnimatedVideoAvatar action={avatarAction} isVisible={avatarVisible} />
      <ChatbotBubble 
        onClick={mainBubbleClickHandler} 
        isVisible={effectiveShowBubble} 
      />
      <InteractiveChatbot
        key={`chat-interface-${chatInterfaceRenderKey}`} // Use a key to force re-mount if needed for fresh state
        isOpen={isChatInterfaceOpen}
        onClose={mainBubbleClickHandler} // Chat interface close button also uses this
        initialMessages={chatMessages}
        initialQuickReplies={chatQuickReplies}
        onQuickReplyAction={handleQuickReplyAction}
        isLoading={isChatbotLoading} 
        currentMode={assistantMode}
        // Pass speakTextNow for InteractiveChatbot to use for its own AI responses
        speakTextProp={speakTextNow} 
        setAvatarActionProp={setAvatarAction}
      />
      {isMountedRef.current && ( // Only render ContentReader on client
        <ContentReader
          startTourSignal={startVoiceTourSignal}
          stopTourSignal={stopVoiceTourSignal}
          currentGlobalStepId={currentTourStep}
          onTourComplete={handleVoiceTourComplete}
          onProjectsStepReached={handleProjectsStepInController}
          addMessageToChat={addMessageToChat}
          speakTextProp={speakTextNow} 
          setAvatarActionProp={setAvatarAction}
        />
      )}
    </>
  );
};

export default IntegratedAssistantController;
