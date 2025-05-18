
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import ChatBubble from './ChatBubble';
import ChatInterface, { type ChatMessage, type QuickReplyButton } from './ChatInterface';
import { projectsData as pageProjectsData } from '@/components/sections/projects'; // For project titles
import { CheckCircle, XCircle, ArrowRight, Briefcase, Code, GraduationCap, Award, Download, MessageCircleQuestion, LogOut, BookOpen, Info, ListChecks, ScrollText, Lightbulb } from 'lucide-react';

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
  | 'ended';

// sectionDetails should align with the IDs of your actual page sections
const sectionDetails: Record<string, { id: string, name: string, nextStep?: TourStep, nextButtonText?: string, icon?: React.ReactNode }> = {
  summary: { id: 'summary-section', name: "Lakshmi's Summary", nextStep: 'skills_intro', nextButtonText: "Next: Skills", icon: <ScrollText className="h-4 w-4" /> },
  skills: { id: 'skills-section', name: "Technical Skills", nextStep: 'experience_intro', nextButtonText: "Next: Experience", icon: <ListChecks className="h-4 w-4" />},
  experience: { id: 'experience', name: "Work Experience", nextStep: 'projects_list_intro', nextButtonText: "Next: Projects", icon: <Briefcase className="h-4 w-4" /> },
  projects: { id: 'projects', name: "Projects Showcase" },
  education: { id: 'education-section', name: "Education Background", nextStep: 'certifications_intro', nextButtonText: "Next: Certifications", icon: <GraduationCap className="h-4 w-4" />},
  certifications: { id: 'certifications-section', name: "Certifications", nextStep: 'publication_intro', nextButtonText: "Next: Publication", icon: <Award className="h-4 w-4" /> },
  publication: {id: 'publication-section', name: "Publication", nextStep: 'additional_info_intro', nextButtonText: "Next: Additional Info", icon: <BookOpen className="h-4 w-4" />},
  additional_info: {id: 'additional-info-placeholder', name: "Additional Info", nextStep: 'end_tour_prompt', nextButtonText: "Finish Resume Tour 🎉", icon: <Info className="h-4 w-4" />} // No specific scroll for additional info, handled in chat
};

const projectItems = pageProjectsData.map(p => ({ title: p.title, projectUrl: p.projectUrl }));

const projectChatDescriptions: Record<string, string> = {
  "AI-Powered Smart Detection of Crops and Weeds": "She built a YOLO-based object detection system with 90% accuracy for identifying crops and weeds. This helped reduce herbicide usage by 15%.",
  "Search Engine for Movie Summaries": "Using PySpark and Hadoop, she developed a search engine that improves query relevance with TF-IDF and cosine similarity across 100K+ records.",
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

  const addMessage = useCallback((sender: 'user' | 'assistant', text: React.ReactNode) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), sender, text }]);
  }, []);

  const speakText = useCallback((textToSpeak: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      window.speechSynthesis.cancel(); 
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
    setCurrentQuickReplies([]); 

    switch (step) {
      case 'greeting':
        if (!hasBeenGreeted) {
          if (!isChatOpen) { 
            setChatInterfaceRenderKey(prevKey => prevKey + 1);
            setIsChatOpen(true);
            setShowBubble(false);
          }
          addMessage('assistant', "Hi there! I’m your assistant. Would you like me to walk you through Lakshmi’s resume?");
          setCurrentQuickReplies([
            { text: "Yes, please!", onClick: () => { addMessage('user', "Yes, please!"); handleTourStep('summary_intro'); }, icon: <CheckCircle className="h-4 w-4"/> },
            { text: "No thanks", onClick: () => { addMessage('user', "No thanks"); handleTourStep('ended'); }, icon: <XCircle className="h-4 w-4"/> },
          ]);
          setHasBeenGreeted(true);
        }
        break;

      case 'summary_intro': {
        const detail = sectionDetails.summary;
        addMessage('assistant', "Lakshmi is a versatile Software Engineer and Machine Learning practitioner. She’s built secure, scalable, and user-focused applications using Python, React.js, Node.js, and MySQL. She's strong in Agile practices, backend optimization, and AI-powered solutions.");
        smoothScrollTo(detail.id);
         setTimeout(() => { 
            setCurrentQuickReplies([
                { text: "Next ➡️", onClick: () => { addMessage('user', `Next`); handleTourStep(detail.nextStep!); }, icon: <ArrowRight className="h-4 w-4"/> }
            ]);
        }, 1500);
        break;
      }
      
      case 'skills_intro': {
        const detail = sectionDetails.skills;
        addMessage('assistant', (
          <>
            <p className="mb-1">Here’s what Lakshmi works with regularly:</p>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              <li><strong>Languages:</strong> Python, Java, JavaScript (ES6+), C++, C, C#</li>
              <li><strong>Web & ML Libraries:</strong> React.js, Node.js, Express.js, Django, Scikit-learn, YOLO, OpenCV</li>
              <li><strong>Data & Cloud:</strong> PySpark, Hadoop, Databricks, AWS, Docker</li>
              <li><strong>Databases:</strong> MySQL, PostgreSQL, Oracle</li>
              <li><strong>Tools:</strong> Git, Linux, VS Code, REST APIs</li>
              <li><strong>Practices:</strong> Agile, CI/CD, API Design</li>
            </ul>
          </>
        ));
        smoothScrollTo(detail.id);
        setTimeout(() => {
            setCurrentQuickReplies([
                { text: "Next ➡️", onClick: () => { addMessage('user', `Next`); handleTourStep(detail.nextStep!); }, icon: <ArrowRight className="h-4 w-4"/> }
            ]);
        }, 1500);
        break;
      }

      case 'experience_intro': {
        const detail = sectionDetails.experience;
        addMessage('assistant', (
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
        ));
        smoothScrollTo(detail.id);
        setTimeout(() => {
            setCurrentQuickReplies([
                { text: "Next ➡️", onClick: () => { addMessage('user', `Next`); handleTourStep(detail.nextStep!); }, icon: <ArrowRight className="h-4 w-4"/> }
            ]);
        }, 1500);
        break;
      }
      
      case 'projects_list_intro': {
        const detail = sectionDetails.projects;
        addMessage('assistant', "Lakshmi has led and contributed to impactful projects. Here are the titles:");
        smoothScrollTo(detail.id);
        
        const projectButtons: QuickReplyButton[] = projectItems.map(proj => ({
          text: proj.title,
          onClick: () => {
            addMessage('user', `Tell me about ${proj.title}`);
            handleTourStep('projects_detail', proj.title);
          },
          icon: <Lightbulb className="h-4 w-4" />
        }));
        projectButtons.push({
            text: "Next Section ➡️",
            onClick: () => { addMessage('user', "Next Section"); handleTourStep('education_intro'); },
            icon: <ArrowRight className="h-4 w-4" />
        });
        setCurrentQuickReplies(projectButtons);
        break;
      }

      case 'projects_detail':
        const projectTitle = payload as string;
        const description = projectChatDescriptions[projectTitle];
        if (description) {
          addMessage('assistant', description);
        } else {
          addMessage('assistant', "Sorry, I don't have details for that specific project right now.");
        }
        // After showing detail, offer same project buttons again + next section
        const projectButtonsAfterDetail: QuickReplyButton[] = projectItems.map(proj => ({
          text: proj.title,
          onClick: () => {
            addMessage('user', `Tell me about ${proj.title}`);
            handleTourStep('projects_detail', proj.title);
          },
          icon: <Lightbulb className="h-4 w-4"/>
        }));
        projectButtonsAfterDetail.push({
            text: "Next Section ➡️",
            onClick: () => { addMessage('user', "Next Section"); handleTourStep('education_intro'); },
            icon: <ArrowRight className="h-4 w-4" />
        });
        setCurrentQuickReplies(projectButtonsAfterDetail);
        break;

      case 'education_intro': {
        const detail = sectionDetails.education;
         addMessage('assistant', (
          <>
            <p className="mb-1">🎓 The University of Texas at Dallas – M.S. in Computer Science (GPA: 3.607/4.0)</p>
            <p>🎓 R.M.K Engineering College, India – B.E. in Electronics and Communication (GPA: 9.04/10.0)</p>
          </>
        ));
        smoothScrollTo(detail.id);
        setTimeout(() => {
            setCurrentQuickReplies([
                { text: "Next ➡️", onClick: () => { addMessage('user', `Next`); handleTourStep(detail.nextStep!); }, icon: <ArrowRight className="h-4 w-4"/> }
            ]);
        }, 1500);
        break;
      }
      
      case 'certifications_intro': {
        const detail = sectionDetails.certifications;
        addMessage('assistant', (
          <>
            <p className="mb-1">Lakshmi holds certifications from leading organizations:</p>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              <li>✅ IBM DevOps & Software Engineering</li>
              <li>✅ Microsoft Full-Stack Developer</li>
              <li>✅ Meta Back-End Developer</li>
              <li>✅ AWS Certified Cloud Practitioner</li>
            </ul>
          </>
        ));
        smoothScrollTo(detail.id);
        setTimeout(() => {
            setCurrentQuickReplies([
                { text: "Next ➡️", onClick: () => { addMessage('user', `Next`); handleTourStep(detail.nextStep!); }, icon: <ArrowRight className="h-4 w-4"/> }
            ]);
        }, 1500);
        break;
      }

      case 'publication_intro': {
        const detail = sectionDetails.publication;
        addMessage('assistant', (
          <>
            <p className="font-semibold mb-1">📰 Text Detection Using Deep Learning</p>
            <p className="text-sm">Built a handwriting recognition model using MNIST-style data, reaching 98.6% training accuracy. Presented at IEEE Intelligent Data Communication and Analytics Conference.</p>
          </>
        ));
        smoothScrollTo(detail.id);
        setTimeout(() => {
            setCurrentQuickReplies([
                { text: "Next ➡️", onClick: () => { addMessage('user', `Next`); handleTourStep(detail.nextStep!); }, icon: <ArrowRight className="h-4 w-4"/> }
            ]);
        }, 1500);
        break;
      }
      
      case 'additional_info_intro': {
        const detail = sectionDetails.additional_info;
        addMessage('assistant', (
          <>
            <ul className="list-disc list-inside text-sm space-y-0.5">
              <li>✅ Proficient with Git, Linux, REST APIs</li>
              <li>✅ Strong OOP and multithreading in Java</li>
              <li>✅ Experienced in model evaluation, preprocessing, and computer vision using Scikit-learn and YOLO</li>
            </ul>
          </>
        ));
        // No specific scroll for additional info, it's a chat message
        setTimeout(() => {
            setCurrentQuickReplies([
                { text: detail.nextButtonText || "Finish Resume Tour 🎉", onClick: () => { addMessage('user', `Finish tour`); handleTourStep(detail.nextStep!); }, icon: <CheckCircle className="h-4 w-4"/> }
            ]);
        }, 1500);
        break;
      }

      case 'end_tour_prompt':
        addMessage('assistant', "That’s a complete tour of Lakshmi’s resume. Would you like to explore anything else?");
        setCurrentQuickReplies([
          { text: "Ask a question", onClick: () => { 
            addMessage('user', "I have a question."); 
            addMessage('assistant', "Great! While this feature is planned for AI integration, for now, please use the contact form to ask Lakshmi specific questions."); 
            setCurrentQuickReplies([
                {text: "Download Resume", onClick: () => {
                    addMessage('user', "Download resume");
                    addMessage('assistant', "You got it! The download should start automatically.");
                    const link = document.createElement('a');
                    link.href = '/lakshmi_resume.pdf'; 
                    link.setAttribute('download', 'Lakshmi_Vijayarao_Resume.pdf');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setCurrentQuickReplies([{text: "End Chat", onClick: () => handleTourStep('ended'), icon: <LogOut className="h-4 w-4"/>}])
                }, icon: <Download className="h-4 w-4"/> },
                {text: "End Chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/>}
            ]);
          }, icon: <MessageCircleQuestion className="h-4 w-4"/> },
          { text: "Download resume", onClick: () => {
            addMessage('user', "I'd like to download the resume.");
            addMessage('assistant', "You got it! The download should start automatically.");
            const link = document.createElement('a');
            link.href = '/lakshmi_resume.pdf'; 
            link.setAttribute('download', 'Lakshmi_Vijayarao_Resume.pdf');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setCurrentQuickReplies([
                {text: "Ask another question", onClick: () => { /* Re-prompt or similar logic */ addMessage('assistant', "What else can I help with?"); handleTourStep('end_tour_prompt');}, icon: <MessageCircleQuestion className="h-4 w-4"/>},
                {text: "End Chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/>}
            ]);
          }, icon: <Download className="h-4 w-4"/> },
          { text: "End chat", onClick: () => { addMessage('user', "End chat."); handleTourStep('ended'); }, icon: <LogOut className="h-4 w-4"/> },
        ]);
        break;

      case 'ended':
        addMessage('assistant', "Thanks for stopping by! Have a great day.");
        setCurrentQuickReplies([]);
        if (window.speechSynthesis) { 
            window.speechSynthesis.cancel();
        }
        setTimeout(() => {
          setIsChatOpen(false);
          setShowBubble(true);
        }, 2000);
        break;
    }
  }, [addMessage, hasBeenGreeted, isChatOpen, speakText]); 


  useEffect(() => {
    const greetingTimer = setTimeout(() => {
      if (currentTourStep === 'greeting' && !isChatOpen && !hasBeenGreeted) {
        handleTourStep('greeting');
      }
    }, 1500); 

    return () => clearTimeout(greetingTimer);
  }, [currentTourStep, isChatOpen, hasBeenGreeted, handleTourStep]);

  const toggleChat = useCallback(() => {
    const newChatOpenState = !isChatOpen;
    if (newChatOpenState) { 
        setChatInterfaceRenderKey(prevKey => prevKey + 1); 
        if (!hasBeenGreeted) { 
            handleTourStep('greeting'); 
        } else if (currentTourStep === 'ended') { 
            setMessages([]); 
            addMessage('assistant', "Welcome back! How can I help you today?");
            setCurrentQuickReplies([ 
                { text: "Resume Walkthrough", onClick: () => { addMessage('user', "Let's do the walkthrough."); handleTourStep('summary_intro'); }, icon: <Briefcase className="h-4 w-4"/> },
                { text: "Just Browsing", onClick: () => { addMessage('user', "Just browsing."); handleTourStep('ended'); }, icon: <XCircle className="h-4 w-4"/> },
            ]);
        }
        setIsChatOpen(true); 
        setShowBubble(false);
    } else { 
        if (window.speechSynthesis) { 
            window.speechSynthesis.cancel();
        }
        setIsChatOpen(false);
        setShowBubble(true); 
    }
  }, [isChatOpen, hasBeenGreeted, currentTourStep, handleTourStep, addMessage]);

  return (
    <>
      <ChatBubble onClick={toggleChat} isVisible={showBubble && currentTourStep !== 'greeting'} />
      <ChatInterface
        key={chatInterfaceRenderKey} 
        isOpen={isChatOpen}
        onClose={toggleChat}
        messages={messages}
        quickReplies={currentQuickReplies}
      />
    </>
  );
}

