
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatBubble from './ChatBubble';
import ChatInterface, { type ExtendedChatMessageFromParent, type QuickReplyButton } from './ChatInterface'; // Ensure this type matches
import { projectsData as pageProjectsData } from '@/components/sections/projects';
import { CheckCircle, XCircle, ArrowRight, Briefcase, Code, GraduationCap, Award, Download, MessageCircleQuestion, LogOut, BookOpen, Info, ListChecks, ScrollText, Lightbulb, User } from 'lucide-react';

type TourStep =
  | 'greeting'
  | 'summary_intro'
  | 'skills_intro'
  | 'experience_intro'
  | 'projects_list_intro'
  | 'projects_detail' // When a specific project is being detailed
  | 'education_intro'
  | 'certifications_intro'
  | 'publication_intro'
  | 'additional_info_intro'
  | 'end_tour_prompt'
  | 'ended'
  | 'thank_you_on_scroll' // For users who decline the tour but scroll
  | 'tour_paused';


const sectionDetails: Record<string, { id: string, name: string, nextStep?: TourStep, nextButtonText?: string, icon?: React.ReactNode, autoAdvanceDelay?: number }> = {
  summary: { id: 'about', name: "Lakshmi's Summary", nextStep: 'skills_intro', icon: <User className="h-4 w-4" />, autoAdvanceDelay: 100 },
  skills: { id: 'skills-section', name: "Technical Skills", nextStep: 'experience_intro', icon: <ListChecks className="h-4 w-4" />, autoAdvanceDelay: 100 },
  experience: { id: 'experience', name: "Work Experience", nextStep: 'projects_list_intro', icon: <Briefcase className="h-4 w-4" />, autoAdvanceDelay: 100 },
  projects_list: { id: 'projects', name: "Projects Showcase", nextStep: 'education_intro' }, // Interactive, so no autoAdvanceDelay here
  education: { id: 'education-section', name: "Education Background", nextStep: 'certifications_intro', icon: <GraduationCap className="h-4 w-4" />, autoAdvanceDelay: 100 },
  certifications: { id: 'certifications-section', name: "Certifications", nextStep: 'publication_intro', icon: <Award className="h-4 w-4" />, autoAdvanceDelay: 100 },
  publication: {id: 'publication-section', name: "Publication", nextStep: 'additional_info_intro', icon: <BookOpen className="h-4 w-4" />, autoAdvanceDelay: 100 },
  additional_info: {id: 'additional-info-placeholder', name: "Additional Info", nextStep: 'end_tour_prompt', icon: <Info className="h-4 w-4" />, autoAdvanceDelay: 100 }
};


const projectItems = pageProjectsData.map(p => ({ title: p.title, projectUrl: p.projectUrl }));

const projectChatDescriptions: Record<string, string> = {
  "AI-Powered Smart Detection of Crops and Weeds": "He built a YOLO-based object detection system with 90% accuracy for identifying crops and weeds. This helped reduce herbicide usage by 15%.",
  "Search Engine for Movie Summaries": "Using PySpark and Hadoop, he developed a search engine that improves query relevance with TF-IDF and cosine similarity across 100K+ records.",
  "Facial Recognition Attendance System": "Designed a face-recognition attendance system using OpenCV, achieving 99% accuracy for 200+ users, with real-time cloud syncing.",
  "Mushroom Classification using Scikit-Learn": "Used ensemble models like Decision Tree, Random Forest, and KNN to classify mushrooms with 95% accuracy, even with 20% missing data.",
  "Custom Process Scheduler Development": "Programmed priority and lottery-based schedulers in xv6/Linux kernel, reducing context-switching by 18% and validating fairness with simulations."
};

export default function ResumeChatAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState<ExtendedChatMessageFromParent[]>([]);
  const [currentQuickReplies, setCurrentQuickReplies] = useState<QuickReplyButton[]>([]);
  const [currentTourStep, setCurrentTourStep] = useState<TourStep>('greeting');
  const [hasBeenGreeted, setHasBeenGreeted] = useState(false);
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0); // To force re-render of ChatInterface
  const [hasDeclinedTour, setHasDeclinedTour] = useState(false);
  const [endOfPageReachedAfterDecline, setEndOfPageReachedAfterDecline] = useState(false);

  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addMessage = useCallback((sender: 'user' | 'assistant', uiNode: React.ReactNode, speakableTextOverride?: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), sender, text: uiNode, speakableTextOverride }]);
  }, []);

  const speakText = useCallback((textToSpeak: string | undefined) => {
    if (typeof window !== 'undefined' && window.speechSynthesis && textToSpeak) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    }
  }, []);
  
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'assistant') {
        // Prioritize speakableTextOverride if available, otherwise use stringified text
        const textToActuallySpeak = lastMessage.speakableTextOverride || (typeof lastMessage.text === 'string' ? lastMessage.text : '');
        if(textToActuallySpeak) {
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
    if (tourTimeoutRef.current) { // Clear any pending auto-advance
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }

    let assistantMessageNode: React.ReactNode | null = null;
    let textForSpeech: string | undefined = undefined;
    let repliesForInterface: QuickReplyButton[] = [];
    let openChatInterface = false; // Determine if main chat window should open
    let hideBubbleForThisStep = false; // Determine if bubble should be hidden
    
    let autoAdvanceToNext: TourStep | undefined = undefined;
    let advanceDelay: number | undefined = undefined;

    // Stop any ongoing speech when a new step is handled
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    switch (step) {
      case 'greeting':
        openChatInterface = true;
        hideBubbleForThisStep = true; // Hide bubble when chat interface is open for greeting
        if (!hasBeenGreeted) {
          textForSpeech = "Hi there! I’m your assistant. Would you like me to walk you through Lakshmi’s resume?";
          assistantMessageNode = textForSpeech;
          setHasBeenGreeted(true);
        }
        repliesForInterface = [
            { text: "Yes, please!", onClick: () => { addMessage('user', "Yes, please!"); handleTourStep('summary_intro'); }, icon: <CheckCircle className="h-4 w-4"/> },
            { text: "No thanks", onClick: () => { addMessage('user', "No thanks"); setHasDeclinedTour(true); handleTourStep('ended'); }, icon: <XCircle className="h-4 w-4"/> },
        ];
        break;
      
      case 'summary_intro': {
        const detail = sectionDetails.summary;
        textForSpeech = "Lakshmi is a versatile Software Engineer and Machine Learning practitioner. He’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.";
        assistantMessageNode = textForSpeech;
        if (detail.id) smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        hideBubbleForThisStep = true; // Keep bubble hidden during auto-advance
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
        if (detail.id) smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        hideBubbleForThisStep = true;
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
            <p className="text-xs text-muted-foreground mb-1">🗓️ Summer Internship Project Associate – Mar to Apr 2022</p>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              <li>Refined backend APIs and SQL queries for better video app performance</li>
              <li>Integrated WebRTC for 1,000+ real-time users</li>
              <li>Collaborated in Agile sprints for scalable feature releases</li>
            </ul>
          </>
        );
        if (detail.id) smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep; // This will be 'projects_list_intro'
        advanceDelay = detail.autoAdvanceDelay;
        hideBubbleForThisStep = true;
        break;
      }

      case 'projects_list_intro': { // This is an interactive step
        const detail = sectionDetails.projects_list;
        textForSpeech = "Lakshmi has led and contributed to impactful projects. Here are the titles:";
        assistantMessageNode = textForSpeech;
        if (detail.id) smoothScrollTo(detail.id);
        openChatInterface = true;
        hideBubbleForThisStep = true;
        const projectButtons: QuickReplyButton[] = projectItems.map(proj => ({
          text: proj.title,
          onClick: () => { addMessage('user', `Tell me about ${proj.title}`); handleTourStep('projects_detail', proj.title); },
          icon: <Lightbulb className="h-4 w-4" />
        }));
        projectButtons.push({ text: "Next Section ➡️", onClick: () => { addMessage('user', "Next Section"); handleTourStep(detail.nextStep!); }, icon: <ArrowRight className="h-4 w-4" /> });
        repliesForInterface = projectButtons;
        break;
      }

      case 'projects_detail': // Interactive step after selecting a project
        const projectTitle = payload as string;
        textForSpeech = projectChatDescriptions[projectTitle] || "Sorry, I don't have details for that specific project right now.";
        assistantMessageNode = textForSpeech;
        openChatInterface = true; 
        hideBubbleForThisStep = true;
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
        if (detail.id) smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        hideBubbleForThisStep = true;
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
        if (detail.id) smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        hideBubbleForThisStep = true;
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
        if (detail.id) smoothScrollTo(detail.id);
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        hideBubbleForThisStep = true;
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
        else if (document.getElementById('contact')) smoothScrollTo('contact'); 
        autoAdvanceToNext = detail.nextStep;
        advanceDelay = detail.autoAdvanceDelay;
        hideBubbleForThisStep = true;
        break;
      }

      case 'end_tour_prompt': // Interactive step
        textForSpeech = "That’s a complete tour of Lakshmi’s resume. Would you like to explore anything else?";
        assistantMessageNode = textForSpeech;
        openChatInterface = true;
        hideBubbleForThisStep = true;
        repliesForInterface = [
          { text: "Ask a question", onClick: () => { addMessage('user', "I have a question."); addMessage('assistant', "Great! While this feature is planned for AI integration, for now, please use the contact form to ask Lakshmi specific questions.", "Great! While this feature is planned for AI integration, for now, please use the contact form to ask Lakshmi specific questions."); setCurrentQuickReplies([{text: "Download Resume", onClick: () => { addMessage('user', "Download resume"); addMessage('assistant', "You got it! The download should start automatically.", "You got it! The download should start automatically."); const link = document.createElement('a'); link.href = '/lakshmi_resume.pdf'; link.setAttribute('download', 'Lakshmi_Vijayarao_Resume.pdf'); document.body.appendChild(link); link.click(); document.body.removeChild(link);setCurrentQuickReplies([{text: "End Chat", onClick: () => handleTourStep('ended'), icon: <LogOut className="h-4 w-4"/>}]) }, icon: <Download className="h-4 w-4"/> },{text: "End Chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/>}]); }, icon: <MessageCircleQuestion className="h-4 w-4"/> },
          { text: "Download resume", onClick: () => { addMessage('user', "I'd like to download the resume."); addMessage('assistant', "You got it! The download should start automatically.", "You got it! The download should start automatically."); const link = document.createElement('a'); link.href = '/lakshmi_resume.pdf'; link.setAttribute('download', 'Lakshmi_Vijayarao_Resume.pdf'); document.body.appendChild(link); link.click(); document.body.removeChild(link); setCurrentQuickReplies([{text: "Ask another question", onClick: () => { addMessage('assistant', "What else can I help with?", "What else can I help with?"); handleTourStep('end_tour_prompt');}, icon: <MessageCircleQuestion className="h-4 w-4"/>}, {text: "End Chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/>}]);}, icon: <Download className="h-4 w-4"/> },
          { text: "End chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/> },
        ];
        break;

      case 'ended':
        textForSpeech = "Thanks for stopping by! Have a great day.";
        assistantMessageNode = textForSpeech;
        openChatInterface = true; 
        hideBubbleForThisStep = true; // Keep bubble hidden for the final message
        repliesForInterface = [];
        if (typeof window !== 'undefined' && window.speechSynthesis) { window.speechSynthesis.cancel(); }
        // No longer auto-close here; user can close with X or just leave. Bubble might reappear on next load or interaction.
        // If we want it to auto-close, add back a short timeout for setIsChatOpen(false); setShowBubble(true);
        break;
      
      case 'thank_you_on_scroll':
        textForSpeech = "Thanks for taking the time to look through Lakshmi's portfolio!";
        assistantMessageNode = textForSpeech;
        openChatInterface = true;
        hideBubbleForThisStep = true;
        repliesForInterface = [{ text: "Close Chat", onClick: () => { setIsChatOpen(false); setShowBubble(true); speakText(''); }, icon: <XCircle className="h-4 w-4"/> }];
        break;

      case 'tour_paused': // User closed an interactive chat window
        openChatInterface = false; // Keep chat closed
        hideBubbleForThisStep = false; // Show bubble so user can re-engage
        // No new message from assistant here. Re-opening will go to current step's interactive prompt or greeting.
        break;
    }

    if (assistantMessageNode) { 
      addMessage('assistant', assistantMessageNode, textForSpeech); 
    }
    
    if (openChatInterface && !isChatOpen) {
      setChatInterfaceRenderKey(prevKey => prevKey + 1); // Force remount if opening
    }
    setIsChatOpen(openChatInterface);
    setShowBubble(!hideBubbleForThisStep && !openChatInterface); // Show bubble if not explicitly hidden AND chat interface is closed
    setCurrentQuickReplies(repliesForInterface);

    // Auto-advance logic for presentation steps
    if (autoAdvanceToNext && advanceDelay && 
        step !== 'projects_list_intro' && 
        step !== 'projects_detail' && 
        step !== 'greeting' && 
        step !== 'end_tour_prompt' && 
        step !== 'thank_you_on_scroll' && 
        step !== 'tour_paused'
    ) {
      tourTimeoutRef.current = setTimeout(() => {
        handleTourStep(autoAdvanceToNext);
      }, advanceDelay);
    }

  }, [addMessage, speakText, hasBeenGreeted, isChatOpen, setHasBeenGreeted, setHasDeclinedTour, setEndOfPageReachedAfterDecline ]); // Removed handleTourStep from its own deps

  const handleBubbleClickForNext = useCallback(() => {
    // This function is called when the bubble is clicked during a presentation step
    // to advance the tour.
    if (tourTimeoutRef.current) {
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
    }

    let nextLogicalStep: TourStep | undefined = undefined;
    // Determine the next step based on the current presentation step
    if (currentTourStep === 'summary_intro') nextLogicalStep = sectionDetails.summary.nextStep;
    else if (currentTourStep === 'skills_intro') nextLogicalStep = sectionDetails.skills.nextStep;
    // ... Add other presentation steps here that should advance via bubble click if auto-advance is paused
    // For now, this function is less critical if most presentation steps auto-advance quickly.
    // It mainly serves to resume a paused tour.

    if (nextLogicalStep) {
      handleTourStep(nextLogicalStep);
    } else {
      // If no specific next step, or if called in an unexpected state, default to greeting or current step.
      handleTourStep(currentTourStep === 'ended' || !hasBeenGreeted ? 'greeting' : currentTourStep);
    }
  }, [currentTourStep, hasBeenGreeted, handleTourStep]);

  const mainBubbleClickHandler = useCallback(() => {
    if (tourTimeoutRef.current) { 
      clearTimeout(tourTimeoutRef.current);
      tourTimeoutRef.current = null;
      // When auto-advancing, clicking bubble should pause and show current step's interactive options if any,
      // or just open to the greeting if tour is over/not started.
      // For simplicity, pausing an auto-advance will show the bubble.
      // Re-clicking the bubble can then use handleBubbleClickForNext if implemented, or re-open chat.
      setShowBubble(true);
      setIsChatOpen(false);
      setCurrentTourStep(prev => {
        // If paused during an auto-advancing step, mark as 'tour_paused' to allow re-engagement via bubble
        const currentIsAutoAdvancing = sectionDetails[prev]?.autoAdvanceDelay && prev !== 'projects_list_intro' && prev !== 'projects_detail' && prev !== 'end_tour_prompt';
        return currentIsAutoAdvancing ? 'tour_paused' : prev;
      });
      return;
    }

    const newChatOpenState = !isChatOpen;
    if (newChatOpenState) { 
        setChatInterfaceRenderKey(prevKey => prevKey + 1); // Force remount
        if (!hasBeenGreeted || currentTourStep === 'ended' || currentTourStep === 'thank_you_on_scroll' || currentTourStep === 'tour_paused') {
            setMessages([]); 
            setHasBeenGreeted(false); 
            setHasDeclinedTour(false);
            setEndOfPageReachedAfterDecline(false);
            handleTourStep('greeting');
        } else {
           // Re-open chat to the current step's interactive state if applicable
           handleTourStep(currentTourStep); 
        }
    } else { // User is closing an already open chat interface
        if (typeof window !== 'undefined' && window.speechSynthesis) { window.speechSynthesis.cancel(); }
        setIsChatOpen(false);
        setShowBubble(true); // Always show bubble when chat is closed by user
        // If user closes an interactive chat mid-tour, set to 'tour_paused'.
        // This allows re-engagement by clicking the bubble which will re-evaluate the currentTourStep.
        if (currentTourStep !== 'greeting' && currentTourStep !== 'ended' && currentTourStep !== 'thank_you_on_scroll') {
           setCurrentTourStep('tour_paused');
        }
    }
  }, [isChatOpen, hasBeenGreeted, currentTourStep, handleTourStep, addMessage, setMessages, setEndOfPageReachedAfterDecline, setHasDeclinedTour]);


  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      if (currentTourStep === 'greeting' && !isChatOpen && !hasBeenGreeted) {
        handleTourStep('greeting');
      }
    }, 1500); // Initial popup delay
    return () => {
      clearTimeout(greetingTimer);
      if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
      }
    };
  }, [isChatOpen, hasBeenGreeted, currentTourStep, handleTourStep]);

  useEffect(() => {
    if (!hasDeclinedTour || endOfPageReachedAfterDecline) {
      return; 
    }

    const scrollHandler = () => {
      const contactSection = document.getElementById('contact');
      if (contactSection && !endOfPageReachedAfterDecline) {
        const rect = contactSection.getBoundingClientRect();
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

