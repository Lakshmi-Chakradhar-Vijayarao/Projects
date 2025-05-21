// src/components/ai/AnimatedVideoAvatar.tsx
"use client";
import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type AvatarAction = 'idle' | 'talking' | 'waving' | 'pointing' | 'thinking';

interface AnimatedVideoAvatarProps {
  action: AvatarAction;
  isVisible: boolean;
  className?: string;
}

const videoSources: Record<AvatarAction, string> = {
  idle: '/videos/avatar-idle.mp4',       // Replace with your actual path
  talking: '/videos/avatar-talking.mp4', // Replace with your actual path
  waving: '/videos/avatar-waving.mp4',    // Replace with your actual path
  pointing: '/videos/avatar-pointing.mp4',// Replace with your actual path
  thinking: '/videos/avatar-thinking.mp4',// Replace with your actual path
};

const AnimatedVideoAvatar: React.FC<AnimatedVideoAvatarProps> = ({ action, isVisible, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentSrc, setCurrentSrc] = useState(videoSources.idle);

  useEffect(() => {
    const newSrc = videoSources[action] || videoSources.idle;
    if (videoRef.current && videoRef.current.src.endsWith(newSrc)) {
      // If current source is already the target, ensure it's playing if it should be.
      if (videoRef.current.paused && (action === 'idle' || action === 'talking')) {
        videoRef.current.play().catch(error => console.warn("Video play (re-play existing src) failed:", error, newSrc));
      }
    } else {
      setCurrentSrc(newSrc);
    }
  }, [action]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = currentSrc;
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        // Autoplay is often restricted until user interaction or if not muted
        console.warn(`Video play failed for ${currentSrc}:`, error, "Ensure videos are muted for autoplay or user has interacted.");
      });
    }
  }, [currentSrc]);
  
  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-0 right-0 w-48 h-80 md:w-64 md:h-[28rem] lg:w-72 lg:h-[32rem] z-[9990] pointer-events-none transition-opacity duration-300",
      isVisible ? "opacity-100" : "opacity-0",
      className
    )}>
      <video
        ref={videoRef}
        key={currentSrc} 
        loop={action === 'idle' || action === 'talking'}
        autoPlay
        muted // Mute for autoplay to work reliably across browsers. Unmute programmatically if needed.
        playsInline
        className="w-full h-full object-cover" // Use object-cover or object-contain based on your avatar aspect ratio
      >
        {/* Provide fallback content or a poster image if desired */}
      </video>
    </div>
  );
};

export default AnimatedVideoAvatar;
