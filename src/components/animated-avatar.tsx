
"use client";

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DotStyle {
  id: string;
  width: string;
  height: string;
  top: string;
  left: string;
  animationDelay: string;
  animationDuration: string;
}
interface LineStyle {
  id: string;
  width: string;
  top: string;
  left: string;
  transform: string;
}

const AnimatedAvatar: React.FC = () => {
  const [animate, setAnimate] = useState(false);
  const [dotStyles, setDotStyles] = useState<DotStyle[]>([]);
  const [lineStyles, setLineStyles] = useState<LineStyle[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Start animation after component mounts
    const timer = setTimeout(() => setAnimate(true), 500);

    // Generate styles for dots
    const newDotStyles = Array.from({ length: 8 }).map((_, i) => ({
      id: `dot-${i}`,
      width: `${Math.random() * 20 + 10}px`,
      height: `${Math.random() * 20 + 10}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${i * 0.3}s`,
      animationDuration: `${Math.random() * 3 + 2}s`,
    }));
    setDotStyles(newDotStyles);

    // Generate styles for lines
    const newLineStyles = Array.from({ length: 6 }).map((_, i) => ({
      id: `line-${i}`,
      width: `${Math.random() * 30 + 20}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      transform: `rotate(${Math.random() * 360}deg)`,
    }));
    setLineStyles(newLineStyles);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) {
    // Render nothing or a placeholder on the server to avoid hydration mismatch
    return (
      <div className="relative w-48 h-48">
        <Avatar className="relative w-48 h-48 border-4 border-white shadow-lg">
          <AvatarFallback className="bg-primary text-white text-2xl">LC</AvatarFallback>
        </Avatar>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Pixel art tech background - circles representing different technologies */}
      <div className="absolute inset-0 -m-4">
        <div className={`w-full h-full rounded-full bg-gradient-to-br from-primary to-accent overflow-hidden
          ${animate ? 'animate-pulse' : ''}`}>
          {/* Technology-themed pixel dots */}
          {dotStyles.map((style) => (
            <div 
              key={style.id}
              className={`absolute rounded-full bg-accent/30 animate-pulse`}
              style={{
                width: style.width,
                height: style.height,
                top: style.top,
                left: style.left,
                animationDelay: style.animationDelay,
                animationDuration: style.animationDuration
              }}
            />
          ))}
          {/* Code-like patterns */}
          {lineStyles.map((style) => (
            <div 
              key={style.id}
              className="absolute h-1 bg-primary/20"
              style={{
                width: style.width,
                top: style.top,
                left: style.left,
                transform: style.transform
              }}
            />
          ))}
        </div>
      </div>

      {/* Avatar with animation */}
      <Avatar 
        className={`relative w-48 h-48 border-4 border-white shadow-lg transition-all duration-700 ease-in-out
          ${animate ? 'scale-100' : 'scale-95'}`}
      >
        <AvatarImage 
          src="https://placehold.co/200x200.png" 
          alt="Lakshmi Chakradhar Vijayarao"
          data-ai-hint="pixel art avatar"
          className={`transition-all duration-1000 ${animate ? 'brightness-105' : 'brightness-90'}`}
        />
        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">LC</AvatarFallback>
      </Avatar>

      {/* Animated ring representing tech expertise */}
      <div 
        className={`absolute inset-0 rounded-full border-4 border-accent/30 transition-all duration-1500
          ${animate ? 'scale-110 opacity-100' : 'scale-100 opacity-0'}`}
      ></div>
      <div 
        className={`absolute inset-0 rounded-full border-2 border-primary/40 transition-all duration-2000 delay-300
          ${animate ? 'scale-125 opacity-100' : 'scale-100 opacity-0'}`}
      ></div>
    </div>
  );
};

export default AnimatedAvatar;
