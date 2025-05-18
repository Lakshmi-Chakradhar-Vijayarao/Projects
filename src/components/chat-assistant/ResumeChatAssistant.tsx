
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatBubble from './ChatBubble';
import ChatInterface, { type ChatMessage, type QuickReplyButton } from './ChatInterface';
import { projectsData as pageProjectsData } from '@/components/sections/projects'; // Ensure this path is correct
import { CheckCircle, XCircle, ArrowRight, Briefcase, Code, GraduationCap, Award, Download, MessageCircleQuestion, LogOut, BookOpen, Info, ListChecks, ScrollText, Lightbulb, User } from 'lucide-react';

type TourStep =
  | 'greeting'
  | 'summary_intro'
  | 'skills_intro'
  | 'experience_intro'
  | 'projects_list_intro'
  | 'projects_detail'
  | 'education_intro'
  | 'certifications_intro'
  | 'publication_intro'
  | 'additional_info_intro'
  | 'end_tour_prompt'
  | 'ended'
  | 'thank_you_on_scroll'
  | 'tour_paused'; // New state for when tour is paused by user closing interactive chat

const sectionDetails: Record<string, { id: string, name: string, nextStep?: TourStep, nextButtonText?: string, icon?: React.ReactNode, autoAdvanceDelay?: number }> = {
  summary: { id: 'about', name: "Lakshmi's Summary", nextStep: 'skills_intro', icon: <User className="h-4 w-4" />, autoAdvanceDelay: 8000 },
  skills: { id: 'skills-section', name: "Technical Skills", nextStep: 'experience_intro', icon: <ListChecks className="h-4 w-4" />, autoAdvanceDelay: 12000 },
  experience: { id: 'experience', name: "Work Experience", nextStep: 'projects_list_intro', icon: <Briefcase className="h-4 w-4" />, autoAdvanceDelay: 15000 },
  projects_list: { id: 'projects', name: "Projects Showcase", nextStep: 'education_intro' }, // nextStep here is when user clicks "Next Section" button
  education: { id: 'education-section', name: "Education Background", nextStep: 'certifications_intro', icon: <GraduationCap className="h-4 w-4" />, autoAdvanceDelay: 7000 },
  certifications: { id: 'certifications-section', name: "Certifications", nextStep: 'publication_intro', icon: <Award className="h-4 w-4" />, autoAdvanceDelay: 7000 },
  publication: {id: 'publication-section', name: "Publication", nextStep: 'additional_info_intro', icon: <BookOpen className="h-4 w-4" />, autoAdvanceDelay: 7000 },
  additional_info: {id: 'additional-info-placeholder', name: "Additional Info", nextStep: 'end_tour_prompt', icon: <Info className="h-4 w-4" />, autoAdvanceDelay: 7000 }
};

const projectItems = pageProjectsData.map(p => ({ title: p.title, projectUrl: p.projectUrl }));

const projectChatDescriptions: Record<string, string> = {
  "AI-Powered Smart Detection of Crops and Weeds": "He built a YOLO-based object detection system with 90% accuracy for identifying crops and weeds. This helped reduce herbicide usage by 15%.",
  "Search Engine for Movie Summaries": "Using PySpark and Hadoop, he developed a search engine that improves query relevance with TF-IDF and cosine similarity across 100K+ records.",
  "Facial Recognition Attendance System": "Designed a face-recognition attendance system using OpenCV, achieving 99% accuracy for 200+ users, with real-time cloud syncing.",
  "Mushroom Classification with Scikit-Learn": "Used ensemble models like Decision Tree, Random Forest, and KNN to classify mushrooms with 95% accuracy, even with 20% missing data.",
  "Custom Process Scheduler": "Programmed priority and lottery-based schedulers in xv6/Linux kernel, reducing context-switching by 18% and validating fairness with simulations."
};

// Update ChatMessage type to include optional speakableTextOverride
type ExtendedChatMessage = ChatMessage & { speakableTextOverride?: string };

export default function ResumeChatAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [currentQuickReplies, setCurrentQuickReplies] = useState<QuickReplyButton[]>([]);
  const [currentTourStep, setCurrentTourStep] = useState<TourStep>('greeting');
  const [hasBeenGreeted, setHasBeenGreeted] = useState(false);
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);
  const [hasDeclinedTour, setHasDeclinedTour] = useState(false);
  const [endOfPageReachedAfterDecline, setEndOfPageReachedAfterDecline] = useState(false);
  
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addMessage = useCallback((sender: 'user' | 'assistant', uiNode: React.ReactNode, speakableTextOverride?: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), sender, text: uiNode, speakableTextOverride }]);
  }, []);

  const speakText = useCallback((textToSpeak: string | undefined) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && textToSpeak) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      window.speechSynthesis.cancel(); 
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'assistant') {
        const textToActuallySpeak = lastMessage.speakableTextOverride || (typeof lastMessage.text === 'string' ? lastMessage.text : '');
        if (textToActuallySpeak) {
          speakText(textToActuallySpeak);
        }
      }
    }
  }, [messages, speakText]);


  const smoothScrollTo = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTourStep = useCallback((step: TourStep, payload?: any) => {
    setCurrentTourStep(step);
    if (tourTimeoutRef.current) {
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }

    let assistantMessageNode: React.ReactNode | null = null;
    let textForSpeech: string | undefined = undefined;
    let repliesForInterface: QuickReplyButton[] = [];
    let openChatNow = false; // Default to chat closed for presentation steps
    let showTheBubbleNow = false; // Default to bubble hidden during auto-advance
    let autoAdvanceToNext: TourStep | undefined = undefined;
    let advanceDelay: number | undefined = undefined;
    
    // Stop any ongoing speech when a new step is handled
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    switch (step) {
      case 'greeting':
        openChatNow = true;
        showTheBubbleNow = false; // Bubble hidden when chat interface is open for greeting
        if (!hasBeenGreeted) {
          textForSpeech = "Hi there! I’m your assistant. Would you like me to walk you through Lakshmi’s resume?";
          assistantMessageNode = textForSpeech;
        }
        repliesForInterface = [
            { text: "Yes, please!", onClick: () => { addMessage('user', "Yes, please!"); handleTourStep('summary_intro'); }, icon: <CheckCircle className="h-4 w-4"/> },
            { text: "No thanks", onClick: () => { addMessage('user', "No thanks"); setHasDeclinedTour(true); handleTourStep('ended'); }, icon: <XCircle className="h-4 w-4"/> },
        ];
        setHasBeenGreeted(true);
        break;
      
      case 'summary_intro': {
        const detail = sectionDetails.summary;
        textForSpeech = "Lakshmi is a versatile Software Engineer and Machine Learning practitioner. He’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.";
        assistantMessageNode = textForSpeech;
        smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        break;
      }

      case 'skills_intro': {
        const detail = sectionDetails.skills;
        textForSpeech = "Here’s what Lakshmi works with regularly: Languages: Python, Java, JavaScript (ES6+), C++, C, C#. Web & ML Libraries: React.js, Node.js, Express.js, Django, Scikit-learn, YOLO, OpenCV. Data & Cloud: PySpark, Hadoop, Databricks, AWS, Docker. Databases: MySQL, PostgreSQL, Oracle. Tools: Git, Linux, VS Code, REST APIs. Practices: Agile, CI/CD, API Design.";
        assistantMessageNode = (
          <>
            <p className="mb-1 font-semibold">Here’s what Lakshmi works with regularly:</p>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              <li><strong>Languages:</strong> Python, Java, JavaScript (ES6+), C++, C, C#</li>
              <li><strong>Web & ML Libraries:</strong> React.js, Node.js, Express.js, Django, Scikit-learn, YOLO, OpenCV</li>
              <li><strong>Data & Cloud:</strong> PySpark, Hadoop, Databricks, AWS, Docker</li>
              <li><strong>Databases:</strong> MySQL, PostgreSQL, Oracle</li>
              <li><strong>Tools:</strong> Git, Linux, VS Code, REST APIs</li>
              <li><strong>Practices:</strong> Agile, CI/CD, API Design</li>
            </ul>
          </>
        );
        smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        break;
      }
      case 'experience_intro': {
        const detail = sectionDetails.experience;
        textForSpeech = "At NSIC Technical Services Centre in Chennai, as an Internship Project Trainee from April to June 2023, Lakshmi built an e-commerce platform, implemented secure authentication reducing errors by 25%, and facilitated Android full-stack training. At Zoho Corporation in Chennai, as a Summer Internship Project Associate in March to April 2022, he streamlined backend performance, integrated WebRTC for over 1,000 users, and collaborated in Agile sprints.";
        assistantMessageNode = (
          <>
            <p className="font-semibold">NSIC Technical Services Centre, Chennai</p>
            <p className="text-xs text-muted-foreground mb-1">🗓️ Internship – Apr to Jun 2023</p>
            <ul className="list-disc list-inside text-sm space-y-0.5 mb-2">
              <li>Built an e-commerce platform using React.js, Node.js, MySQL</li>
              <li>Secured login with OAuth2 and JWT, cut session errors by 25%</li>
              <li>Conducted Android full-stack training, resulting in 40% job placement boost</li>
            </ul>
            <p className="font-semibold mt-3">Zoho Corporation, Chennai</p>
            <p className="text-xs text-muted-foreground mb-1">🗓️ Summer Internship Project Associate</p>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              <li>Refined backend APIs and SQL queries for better video app performance</li>
              <li>Integrated WebRTC for 1,000+ real-time users</li>
              <li>Collaborated in Agile sprints for scalable feature releases</li>
            </ul>
          </>
        );
        smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        break;
      }

      case 'projects_list_intro': {
        const detail = sectionDetails.projects_list;
        textForSpeech = "Lakshmi has led and contributed to impactful projects. Here are the titles:";
        assistantMessageNode = textForSpeech;
        smoothScrollTo(detail.id);
        openChatNow = true; // Interactive step
        const projectButtons: QuickReplyButton[] = projectItems.map(proj => ({
          text: proj.title,
          onClick: () => { addMessage('user', `Tell me about ${proj.title}`); handleTourStep('projects_detail', proj.title); },
          icon: <Lightbulb className="h-4 w-4" />
        }));
        projectButtons.push({ text: "Next Section ➡️", onClick: () => { addMessage('user', "Next Section"); handleTourStep(detail.nextStep!); }, icon: <ArrowRight className="h-4 w-4" /> });
        repliesForInterface = projectButtons;
        break;
      }

      case 'projects_detail':
        const projectTitle = payload as string;
        textForSpeech = projectChatDescriptions[projectTitle] || "Sorry, I don't have details for that specific project right now.";
        assistantMessageNode = textForSpeech;
        openChatNow = true; // Keep chat open for more project selections or next section
        const projectButtonsAfterDetail: QuickReplyButton[] = projectItems.map(proj => ({
          text: proj.title,
          onClick: () => { addMessage('user', `Tell me about ${proj.title}`); handleTourStep('projects_detail', proj.title); },
          icon: <Lightbulb className="h-4 w-4"/>
        }));
        projectButtonsAfterDetail.push({ text: "Next Section ➡️", onClick: () => { addMessage('user', "Next Section"); handleTourStep(sectionDetails.projects_list.nextStep!); }, icon: <ArrowRight className="h-4 w-4" /> });
        repliesForInterface = projectButtonsAfterDetail;
        break;

      case 'education_intro': {
        const detail = sectionDetails.education;
        textForSpeech = "Lakshmi holds a Master of Science in Computer Science from The University of Texas at Dallas, with a GPA of 3.607, and a Bachelor of Engineering in Electronics and Communication from R.M.K Engineering College, India, with a GPA of 9.04.";
         assistantMessageNode = (
          <>
            <p className="mb-1">🎓 The University of Texas at Dallas – M.S. in Computer Science (GPA: 3.607/4.0)</p>
            <p>🎓 R.M.K Engineering College, India – B.E. in Electronics and Communication (GPA: 9.04/10.0)</p>
          </>
        );
        smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        break;
      }

      case 'certifications_intro': {
        const detail = sectionDetails.certifications;
        textForSpeech = "Lakshmi holds certifications from leading organizations including: IBM DevOps & Software Engineering, Microsoft Full-Stack Developer, Meta Back-End Developer, and AWS Certified Cloud Practitioner.";
        assistantMessageNode = (
          <>
            <p className="mb-1">Lakshmi holds certifications from leading organizations:</p>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              <li>✅ IBM DevOps & Software Engineering</li>
              <li>✅ Microsoft Full-Stack Developer</li>
              <li>✅ Meta Back-End Developer</li>
              <li>✅ AWS Certified Cloud Practitioner</li>
            </ul>
          </>
        );
        smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        break;
      }
      
      case 'publication_intro': {
        const detail = sectionDetails.publication;
        textForSpeech = "Regarding publications, his work on 'Text Detection Using Deep Learning' involved building a handwriting recognition model with 98.6% training accuracy, presented at an IEEE Conference.";
        assistantMessageNode = (
          <>
            <p className="font-semibold mb-1">📰 Text Detection Using Deep Learning</p>
            <p className="text-sm">Built a handwriting recognition model using MNIST-style data, reaching 98.6% training accuracy. Presented at IEEE Intelligent Data Communication and Analytics Conference.</p>
          </>
        );
        smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        break;
      }

      case 'additional_info_intro': {
        const detail = sectionDetails.additional_info;
        textForSpeech = "Additionally, Lakshmi is proficient with Git, Linux, and REST APIs, has strong OOP and multithreading skills in Java, and is experienced in ML model evaluation and computer vision with Scikit-learn and YOLO.";
        assistantMessageNode = (
          <>
            <p className="font-semibold mb-1">Additionally, Lakshmi is:</p>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              <li>✅ Proficient with Git, Linux, REST APIs</li>
              <li>✅ Strong OOP and multithreading in Java</li>
              <li>✅ Experienced in model evaluation, preprocessing, and computer vision using Scikit-learn and YOLO</li>
            </ul>
          </>
        );
        if(detail.id && document.getElementById(detail.id)) smoothScrollTo(detail.id);
        else if (document.getElementById('contact')) smoothScrollTo('contact'); // Scroll to contact if placeholder not found
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        break;
      }

      case 'end_tour_prompt':
        textForSpeech = "That’s a complete tour of Lakshmi’s resume. Would you like to explore anything else?";
        assistantMessageNode = textForSpeech;
        openChatNow = true; // Interactive step
        repliesForInterface = [
          { text: "Ask a question", onClick: () => { addMessage('user', "I have a question."); addMessage('assistant', "Great! While this feature is planned for AI integration, for now, please use the contact form to ask Lakshmi specific questions.", "Great! While this feature is planned for AI integration, for now, please use the contact form to ask Lakshmi specific questions."); setCurrentQuickReplies([{text: "Download Resume", onClick: () => { addMessage('user', "Download resume"); addMessage('assistant', "You got it! The download should start automatically.", "You got it! The download should start automatically."); const link = document.createElement('a'); link.href = '/lakshmi_resume.pdf'; link.setAttribute('download', 'Lakshmi_Vijayarao_Resume.pdf'); document.body.appendChild(link); link.click(); document.body.removeChild(link);setCurrentQuickReplies([{text: "End Chat", onClick: () => handleTourStep('ended'), icon: <LogOut className="h-4 w-4"/>}]) }, icon: <Download className="h-4 w-4"/> },{text: "End Chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/>}]); }, icon: <MessageCircleQuestion className="h-4 w-4"/> },
          { text: "Download resume", onClick: () => { addMessage('user', "I'd like to download the resume."); addMessage('assistant', "You got it! The download should start automatically.", "You got it! The download should start automatically."); const link = document.createElement('a'); link.href = '/lakshmi_resume.pdf'; link.setAttribute('download', 'Lakshmi_Vijayarao_Resume.pdf'); document.body.appendChild(link); link.click(); document.body.removeChild(link); setCurrentQuickReplies([{text: "Ask another question", onClick: () => { addMessage('assistant', "What else can I help with?", "What else can I help with?"); handleTourStep('end_tour_prompt');}, icon: <MessageCircleQuestion className="h-4 w-4"/>}, {text: "End Chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/>}]);}, icon: <Download className="h-4 w-4"/> },
          { text: "End chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/> },
        ];
        break;

      case 'ended':
        textForSpeech = "Thanks for stopping by! Have a great day.";
        assistantMessageNode = textForSpeech;
        openChatNow = true; // Keep interface open for final message
        showTheBubbleNow = false; // Explicitly hide bubble
        repliesForInterface = [];
        if (typeof window !== 'undefined' && window.speechSynthesis) { window.speechSynthesis.cancel(); }
        tourTimeoutRef.current = setTimeout(() => {
          setIsChatOpen(false);
          setShowBubble(true); // Show bubble again after chat closes
        }, 3000);
        break;
      
      case 'thank_you_on_scroll':
        textForSpeech = "Thanks for taking the time to look through Lakshmi's portfolio!";
        assistantMessageNode = textForSpeech;
        openChatNow = true;
        showTheBubbleNow = false; // Bubble hidden when chat interface is open
        repliesForInterface = [{ text: "Close Chat", onClick: () => { setIsChatOpen(false); setShowBubble(true); speakText(''); }, icon: <XCircle className="h-4 w-4"/> }];
        break;

      case 'tour_paused': // User closed an interactive chat window
        openChatNow = false;
        showTheBubbleNow = true; // Show bubble so user can re-engage
        // Quick replies and message depend on the step where it was paused.
        // For simplicity, re-opening will go to the current step's interactive prompt.
        // No new message from assistant here.
        break;
    }

    if (assistantMessageNode) { 
      addMessage('assistant', assistantMessageNode, textForSpeech); 
    }
    
    if (openChatNow && !isChatOpen) {
      setChatInterfaceRenderKey(prevKey => prevKey + 1);
    }
    setIsChatOpen(openChatNow);
    setShowBubble(showTheBubbleNow); // Updated logic for bubble visibility
    setCurrentQuickReplies(repliesForInterface);

    if (autoAdvanceToNext && advanceDelay) {
      tourTimeoutRef.current = setTimeout(() => {
        handleTourStep(autoAdvanceToNext);
      }, advanceDelay);
    } else if (!openChatNow && step !== 'ended' && step !== 'thank_you_on_scroll' && step !== 'tour_paused') {
      // If it was a presentation step but no auto-advance (e.g. last one before interactive prompt)
      // ensure bubble is shown to allow user to trigger next or re-open chat
      setShowBubble(true);
    }

  }, [addMessage, hasBeenGreeted, isChatOpen, speakText, setHasBeenGreeted, setHasDeclinedTour, setEndOfPageReachedAfterDecline]);


  const mainBubbleClickHandler = useCallback(() => {
    if (tourTimeoutRef.current) { // If auto-advancing, clicking bubble could skip/pause
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
      // Potentially show an interactive prompt or just re-open current step's chat
      // For now, let's make it open the chat to the current step's interactive mode if applicable
      // or just open the greeting if tour is over/not started.
      setCurrentTourStep(prev => prev === 'ended' || prev === 'thank_you_on_scroll' || !hasBeenGreeted ? 'greeting' : prev);
      handleTourStep(currentTourStep);
      return;
    }

    const newChatOpenState = !isChatOpen;
    if (newChatOpenState) { 
        setChatInterfaceRenderKey(prevKey => prevKey + 1);
        if (!hasBeenGreeted || currentTourStep === 'ended' || currentTourStep === 'thank_you_on_scroll') {
            setMessages([]); // Clear messages for a fresh start
            setHasBeenGreeted(false); // Reset greeting state
            setHasDeclinedTour(false);
            setEndOfPageReachedAfterDecline(false);
            handleTourStep('greeting');
        } else {
           // Re-open chat to the current step's interactive state (if applicable)
           handleTourStep(currentTourStep); 
        }
    } else { // User is closing an already open chat interface
        if (typeof window !== 'undefined' && window.speechSynthesis) { window.speechSynthesis.cancel(); }
        setIsChatOpen(false);
        setShowBubble(true); // Always show bubble when chat is closed by user
        if (currentTourStep !== 'greeting' && currentTourStep !== 'ended' && currentTourStep !== 'thank_you_on_scroll') {
           // If user closes an interactive chat mid-tour, pause the tour.
           setCurrentTourStep('tour_paused');
        }
    }
  }, [isChatOpen, hasBeenGreeted, currentTourStep, handleTourStep, addMessage, setMessages, setEndOfPageReachedAfterDecline, setHasDeclinedTour]);


  // Effect for initial greeting popup
  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      if (currentTourStep === 'greeting' && !isChatOpen && !hasBeenGreeted) {
        handleTourStep('greeting');
      }
    }, 1500);
    return () => {
      clearTimeout(greetingTimer);
      if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
      }
    };
  }, [isChatOpen, hasBeenGreeted, currentTourStep, handleTourStep]);

  // Effect for "No thanks" scroll-to-end thank you message
  useEffect(() => {
    if (!hasDeclinedTour || endOfPageReachedAfterDecline) {
      return; 
    }

    const scrollHandler = () => {
      const contactSection = document.getElementById('contact');
      if (contactSection && !endOfPageReachedAfterDecline) {
        const rect = contactSection.getBoundingClientRect();
        // Check if a small part of the contact section is visible at the bottom of the viewport
        const isContactVisible = rect.top < window.innerHeight && rect.bottom >= Math.min(100, window.innerHeight * 0.2) ;

        if (isContactVisible) {
          setEndOfPageReachedAfterDecline(true);
          handleTourStep('thank_you_on_scroll');
          window.removeEventListener('scroll', scrollHandler);
        }
      }
    };

    window.addEventListener('scroll', scrollHandler);
    return () => {
      window.removeEventListener('scroll', scrollHandler);
    };
  }, [hasDeclinedTour, endOfPageReachedAfterDecline, handleTourStep]);


  return (
    <>
      <ChatBubble onClick={mainBubbleClickHandler} isVisible={showBubble} />
      <ChatInterface
        key={chatInterfaceRenderKey}
        isOpen={isChatOpen}
        onClose={mainBubbleClickHandler} 
        messages={messages}
        quickReplies={currentQuickReplies}
      />
    </>
  );
}
