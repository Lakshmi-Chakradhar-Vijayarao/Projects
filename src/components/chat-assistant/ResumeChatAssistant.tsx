
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ChatBubble from './ChatBubble';
import ChatInterface, { type ChatMessage, type QuickReplyButton } from './ChatInterface';
import { projectsData as pageProjectsData } from '@/components/sections/projects';
import { CheckCircle, XCircle, ArrowRight, Briefcase, Code, GraduationCap, Award, Download, MessageCircleQuestion, LogOut, BookOpen, Info, ListChecks, ScrollText, Lightbulb, User } from 'lucide-react';

type TourStep =
  | 'greeting'
  | 'summary_intro' // Script starts with Summary
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
  | 'thank_you_on_scroll';

// sectionDetails maps tour steps to page section IDs and other metadata
const sectionDetails: Record<string, { id: string, name: string, nextStep?: TourStep, nextButtonText?: string, icon?: React.ReactNode }> = {
  summary: { id: 'about', name: "Lakshmi's Summary", nextStep: 'skills_intro', icon: <User className="h-4 w-4" /> }, // Script "Summary" maps to "About Me" page section
  skills: { id: 'skills-section', name: "Technical Skills", nextStep: 'experience_intro', icon: <ListChecks className="h-4 w-4" />},
  experience: { id: 'experience', name: "Work Experience", nextStep: 'projects_list_intro', icon: <Briefcase className="h-4 w-4" /> },
  projects: { id: 'projects', name: "Projects Showcase", nextStep: 'education_intro' }, // 'nextStep' here is for when user clicks "Next Section" from project list
  education: { id: 'education-section', name: "Education Background", nextStep: 'certifications_intro', icon: <GraduationCap className="h-4 w-4" />},
  certifications: { id: 'certifications-section', name: "Certifications", nextStep: 'publication_intro', icon: <Award className="h-4 w-4" /> },
  publication: {id: 'publication-section', name: "Publication", nextStep: 'additional_info_intro', icon: <BookOpen className="h-4 w-4" />},
  additional_info: {id: 'additional-info-placeholder', name: "Additional Info", nextStep: 'end_tour_prompt', icon: <Info className="h-4 w-4" />} // Placeholder for scrolling if needed
};

const projectItems = pageProjectsData.map(p => ({ title: p.title, projectUrl: p.projectUrl }));

// Project descriptions from the new script
const projectChatDescriptions: Record<string, string> = {
  "AI-Powered Smart Detection of Crops and Weeds": "He built a YOLO-based object detection system with 90% accuracy for identifying crops and weeds. This helped reduce herbicide usage by 15%.",
  "Search Engine for Movie Summaries": "Using PySpark and Hadoop, he developed a search engine that improves query relevance with TF-IDF and cosine similarity across 100K+ records.",
  "Facial Recognition Attendance System": "Designed a face-recognition attendance system using OpenCV, achieving 99% accuracy for 200+ users, with real-time cloud syncing.",
  "Mushroom Classification with Scikit-Learn": "Used ensemble models like Decision Tree, Random Forest, and KNN to classify mushrooms with 95% accuracy, even with 20% missing data.",
  "Custom Process Scheduler": "Programmed priority and lottery-based schedulers in xv6/Linux kernel, reducing context-switching by 18% and validating fairness with simulations."
};


export default function ResumeChatAssistant() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuickReplies, setCurrentQuickReplies] = useState<QuickReplyButton[]>([]);
  const [currentTourStep, setCurrentTourStep] = useState<TourStep>('greeting');
  const [hasBeenGreeted, setHasBeenGreeted] = useState(false);
  const [chatInterfaceRenderKey, setChatInterfaceRenderKey] = useState(0);
  const [hasDeclinedTour, setHasDeclinedTour] = useState(false);
  const [endOfPageReachedAfterDecline, setEndOfPageReachedAfterDecline] = useState(false);
  
  const currentTourStepRef = useRef(currentTourStep);
  useEffect(() => {
    currentTourStepRef.current = currentTourStep;
  }, [currentTourStep]);

  const endOfPageReachedAfterDeclineRef = useRef(endOfPageReachedAfterDecline);
   useEffect(() => {
    endOfPageReachedAfterDeclineRef.current = endOfPageReachedAfterDecline;
  }, [endOfPageReachedAfterDecline]);


  const addMessage = useCallback((sender: 'user' | 'assistant', text: React.ReactNode) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), sender, text }]);
  }, []);

  const speakText = useCallback((textToSpeak: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'assistant' && typeof lastMessage.text === 'string') {
        speakText(lastMessage.text);
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
    let assistantMessage: React.ReactNode | null = null;
    let repliesForInterface: QuickReplyButton[] = [];
    let openChatInterface = false;
    let showTheBubble = true;

    // Stop any ongoing speech when a new step is handled
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }

    switch (step) {
      case 'greeting':
        openChatInterface = true;
        showTheBubble = false;
        if (!hasBeenGreeted) {
          assistantMessage = "Hi there! 👋 Would you like me to walk you through Lakshmi’s resume?";
        }
        repliesForInterface = [
            { text: "Yes, please!", onClick: () => { addMessage('user', "Yes, please!"); handleTourStep('summary_intro'); }, icon: <CheckCircle className="h-4 w-4"/> },
            { text: "No thanks", onClick: () => { addMessage('user', "No thanks"); setHasDeclinedTour(true); handleTourStep('ended'); }, icon: <XCircle className="h-4 w-4"/> },
        ];
        setHasBeenGreeted(true); // Mark that initial greeting has occurred.
        break;
      
      case 'summary_intro': {
        const detail = sectionDetails.summary;
        assistantMessage = "Lakshmi is a versatile Software Engineer and Machine Learning practitioner. He’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. He's strong in Agile practices, backend optimization, and AI-powered solutions.";
        smoothScrollTo(detail.id);
        openChatInterface = false; 
        showTheBubble = true;
        break;
      }

      case 'skills_intro': {
        const detail = sectionDetails.skills;
        assistantMessage = (
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
        openChatInterface = false; 
        showTheBubble = true;
        break;
      }

      case 'experience_intro': {
        const detail = sectionDetails.experience;
        assistantMessage = (
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
        openChatInterface = false;
        showTheBubble = true;
        break;
      }

      case 'projects_list_intro': {
        const detail = sectionDetails.projects;
        assistantMessage = "Lakshmi has led and contributed to impactful projects. Here are the titles:";
        smoothScrollTo(detail.id);
        openChatInterface = true;
        showTheBubble = false;
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
        const description = projectChatDescriptions[projectTitle];
        assistantMessage = description || "Sorry, I don't have details for that specific project right now.";
        openChatInterface = true; // Keep chat open for more project selections or next section
        showTheBubble = false;
        const projectButtonsAfterDetail: QuickReplyButton[] = projectItems.map(proj => ({
          text: proj.title,
          onClick: () => { addMessage('user', `Tell me about ${proj.title}`); handleTourStep('projects_detail', proj.title); },
          icon: <Lightbulb className="h-4 w-4"/>
        }));
        projectButtonsAfterDetail.push({ text: "Next Section ➡️", onClick: () => { addMessage('user', "Next Section"); handleTourStep(sectionDetails.projects.nextStep!); }, icon: <ArrowRight className="h-4 w-4" /> });
        repliesForInterface = projectButtonsAfterDetail;
        break;

      case 'education_intro': {
        const detail = sectionDetails.education;
         assistantMessage = (
          <>
            <p className="mb-1">🎓 The University of Texas at Dallas – M.S. in Computer Science (GPA: 3.607/4.0)</p>
            <p>🎓 R.M.K Engineering College, India – B.E. in Electronics and Communication (GPA: 9.04/10.0)</p>
          </>
        );
        smoothScrollTo(detail.id);
        openChatInterface = false;
        showTheBubble = true;
        break;
      }

      case 'certifications_intro': {
        const detail = sectionDetails.certifications;
        assistantMessage = (
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
        openChatInterface = false;
        showTheBubble = true;
        break;
      }
      
      case 'publication_intro': {
        const detail = sectionDetails.publication;
        assistantMessage = (
          <>
            <p className="font-semibold mb-1">📰 Text Detection Using Deep Learning</p>
            <p className="text-sm">Built a handwriting recognition model using MNIST-style data, reaching 98.6% training accuracy. Presented at IEEE Intelligent Data Communication and Analytics Conference.</p>
          </>
        );
        smoothScrollTo(detail.id);
        openChatInterface = false;
        showTheBubble = true;
        break;
      }

      case 'additional_info_intro': {
        const detail = sectionDetails.additional_info;
        assistantMessage = (
          <>
            <p className="font-semibold mb-1">Additionally, Lakshmi is:</p>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              <li>✅ Proficient with Git, Linux, REST APIs</li>
              <li>✅ Strong OOP and multithreading in Java</li>
              <li>✅ Experienced in model evaluation, preprocessing, and computer vision using Scikit-learn and YOLO</li>
            </ul>
          </>
        );
        // Optional: Scroll to a general area if no specific section ID for additional info
        if(detail.id && document.getElementById(detail.id)) smoothScrollTo(detail.id);
        openChatInterface = false;
        showTheBubble = true;
        break;
      }

      case 'end_tour_prompt':
        assistantMessage = "That’s a complete tour of Lakshmi’s resume. Would you like to explore anything else?";
        openChatInterface = true;
        showTheBubble = false;
        repliesForInterface = [
          { text: "Ask a question", onClick: () => { /* Placeholder for AI integration */ addMessage('user', "I have a question."); addMessage('assistant', "Great! While this feature is planned for AI integration, for now, please use the contact form to ask Lakshmi specific questions."); setCurrentQuickReplies([{text: "Download Resume", onClick: () => { addMessage('user', "Download resume"); addMessage('assistant', "You got it! The download should start automatically."); const link = document.createElement('a'); link.href = '/lakshmi_resume.pdf'; link.setAttribute('download', 'Lakshmi_Vijayarao_Resume.pdf'); document.body.appendChild(link); link.click(); document.body.removeChild(link);setCurrentQuickReplies([{text: "End Chat", onClick: () => handleTourStep('ended'), icon: <LogOut className="h-4 w-4"/>}]) }, icon: <Download className="h-4 w-4"/> },{text: "End Chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/>}]); }, icon: <MessageCircleQuestion className="h-4 w-4"/> },
          { text: "Download resume", onClick: () => { addMessage('user', "I'd like to download the resume."); addMessage('assistant', "You got it! The download should start automatically."); const link = document.createElement('a'); link.href = '/lakshmi_resume.pdf'; link.setAttribute('download', 'Lakshmi_Vijayarao_Resume.pdf'); document.body.appendChild(link); link.click(); document.body.removeChild(link); setCurrentQuickReplies([{text: "Ask another question", onClick: () => { addMessage('assistant', "What else can I help with?"); handleTourStep('end_tour_prompt');}, icon: <MessageCircleQuestion className="h-4 w-4"/>}, {text: "End Chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/>}]);}, icon: <Download className="h-4 w-4"/> },
          { text: "End chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/> },
        ];
        break;

      case 'ended':
        openChatInterface = true;
        showTheBubble = false; // Keep interface open for final message
        assistantMessage = "Thanks for stopping by! Have a great day.";
        repliesForInterface = [];
        if (typeof window !== 'undefined' && window.speechSynthesis) { window.speechSynthesis.cancel(); }
        setTimeout(() => {
          setIsChatOpen(false);
          setShowBubble(true);
          // Optional: reset to greeting if user re-engages bubble later
          // setCurrentTourStep('greeting'); 
          // setHasBeenGreeted(false);
          // setHasDeclinedTour(false);
          // endOfPageReachedAfterDeclineRef.current = false;
          // setEndOfPageReachedAfterDecline(false);
        }, 3000);
        break;
      
      case 'thank_you_on_scroll':
        openChatInterface = true;
        showTheBubble = false;
        assistantMessage = "Thanks for taking the time to look through Lakshmi's portfolio!";
        repliesForInterface = [{ text: "Close Chat", onClick: () => { setIsChatOpen(false); setShowBubble(true); speakText(''); }, icon: <XCircle className="h-4 w-4"/> }];
        break;
    }

    if (assistantMessage) { addMessage('assistant', assistantMessage); }
    
    // Only force remount ChatInterface if it's explicitly being opened
    if (openChatInterface && !isChatOpen) {
      setChatInterfaceRenderKey(prevKey => prevKey + 1);
    }
    setIsChatOpen(openChatInterface);
    setShowBubble(showTheBubble);
    setCurrentQuickReplies(repliesForInterface);

  }, [addMessage, speakText, hasBeenGreeted, isChatOpen, currentTourStep, setIsChatOpen, setShowBubble, setCurrentQuickReplies, setCurrentTourStep, setHasBeenGreeted, setChatInterfaceRenderKey, setEndOfPageReachedAfterDecline, setHasDeclinedTour]);

  const handleBubbleClickForNext = useCallback(() => {
    let nextStepKey: keyof typeof sectionDetails | undefined;
    switch (currentTourStepRef.current) { // Use ref for up-to-date value
        case 'summary_intro': nextStepKey = 'summary'; break;
        case 'skills_intro': nextStepKey = 'skills'; break;
        case 'experience_intro': nextStepKey = 'experience'; break;
        case 'education_intro': nextStepKey = 'education'; break;
        case 'certifications_intro': nextStepKey = 'certifications'; break;
        case 'publication_intro': nextStepKey = 'publication'; break;
        case 'additional_info_intro': nextStepKey = 'additional_info'; break;
        default: return; // Not a presentation step where bubble click means "next"
    }

    if (nextStepKey && sectionDetails[nextStepKey]?.nextStep) {
        addMessage('user', sectionDetails[nextStepKey].nextButtonText || "Next ➡️");
        handleTourStep(sectionDetails[nextStepKey].nextStep!);
    } else if (nextStepKey && sectionDetails[nextStepKey] && !sectionDetails[nextStepKey].nextStep) {
        addMessage('user', "Finish Resume Tour 🎉"); // Last presentation step
        handleTourStep('end_tour_prompt');
    }
  }, [addMessage, handleTourStep]);

  const mainBubbleClickHandler = useCallback(() => {
    const presentationSteps: TourStep[] = ['summary_intro', 'skills_intro', 'experience_intro', 'education_intro', 'certifications_intro', 'publication_intro', 'additional_info_intro'];
    const currentStep = currentTourStepRef.current; // Use ref for up-to-date value

    if (!isChatOpen && presentationSteps.includes(currentStep)) {
        handleBubbleClickForNext();
    } else {
      const newChatOpenState = !isChatOpen;
      if (newChatOpenState) { 
          setChatInterfaceRenderKey(prevKey => prevKey + 1);
          if (!hasBeenGreeted) {
              handleTourStep('greeting');
          } else if (currentStep === 'ended' || currentStep === 'thank_you_on_scroll') {
              setMessages([]);
              setHasBeenGreeted(false);
              setHasDeclinedTour(false);
              endOfPageReachedAfterDeclineRef.current = false;
              setEndOfPageReachedAfterDecline(false);
              handleTourStep('greeting');
          } else {
             // Re-open chat to the current step's interactive state (if applicable)
             handleTourStep(currentStep); 
          }
      } else { // User is closing the chat via bubble click or 'X'
          if (typeof window !== 'undefined' && window.speechSynthesis) { window.speechSynthesis.cancel(); }
          setIsChatOpen(false);
          setShowBubble(true);
          if (currentStep === 'greeting') { // If user closes initial greeting popup
            const lastUserMsg = messages.slice().reverse().find(m => m.sender === 'user');
            if (!lastUserMsg || (lastUserMsg.text !== "Yes, please!" && lastUserMsg.text !== "No thanks")) {
              setHasDeclinedTour(true); // Treat 'X' on greeting as declining tour
              // No immediate message, wait for scroll or re-engagement
            }
          }
      }
    }
  }, [isChatOpen, hasBeenGreeted, handleTourStep, addMessage, setMessages, messages, handleBubbleClickForNext, setEndOfPageReachedAfterDecline, setHasDeclinedTour]);

  // Effect for initial greeting popup
  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      if (currentTourStepRef.current === 'greeting' && !isChatOpen && !hasBeenGreeted) {
        handleTourStep('greeting');
      }
    }, 1500);
    return () => clearTimeout(greetingTimer);
  }, [isChatOpen, hasBeenGreeted, handleTourStep]);

  // Effect for "No thanks" scroll-to-end thank you message
  useEffect(() => {
    if (!hasDeclinedTour || endOfPageReachedAfterDeclineRef.current) {
      return; 
    }

    const scrollHandler = () => {
      const contactSection = document.getElementById('contact');
      if (contactSection && !endOfPageReachedAfterDeclineRef.current) {
        const rect = contactSection.getBoundingClientRect();
        const isContactVisible = rect.top < window.innerHeight && rect.bottom >= Math.min(100, window.innerHeight * 0.2);

        if (isContactVisible) {
          endOfPageReachedAfterDeclineRef.current = true; 
          setEndOfPageReachedAfterDecline(true);
          handleTourStep('thank_you_on_scroll'); // Let handleTourStep manage UI for this message
          window.removeEventListener('scroll', scrollHandler);
        }
      }
    };

    window.addEventListener('scroll', scrollHandler);
    return () => {
      window.removeEventListener('scroll', scrollHandler);
    };
  }, [hasDeclinedTour, handleTourStep, setEndOfPageReachedAfterDecline]);


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

    