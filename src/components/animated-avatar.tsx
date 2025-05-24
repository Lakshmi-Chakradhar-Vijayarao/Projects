// src/components/animated-avatar.tsx
"use client";

import type { ReactNode } from 'react';
import React, { useEffect, useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DotStyle {
  width: string;
  height: string;
  top: string;
  left: string;
  animationDelay: string;
  animationDuration: string;
}

interface LineStyle {
  width: string;
  top: string;
  left: string;
  transform: string;
}

const AnimatedAvatar: React.FC = () => {
  const [animate, setAnimate] = useState(false);
  const [dotStyles, setDotStyles] = useState<DotStyle[]>([]);
  const [lineStyles, setLineStyles] = useState<LineStyle[]>([]);

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => setAnimate(true), 500);

    // Generate random styles only on the client-side
    const newDotStyles = Array.from({ length: 8 }).map((_, i) => ({
      width: `${Math.random() * 20 + 10}px`,
      height: `${Math.random() * 20 + 10}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      animationDelay: `${i * 0.3}s`,
      animationDuration: `${Math.random() * 3 + 2}s`,
    }));
    setDotStyles(newDotStyles);

    const newLineStyles = Array.from({ length: 6 }).map(() => ({
      width: `${Math.random() * 30 + 20}px`,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      transform: `rotate(${Math.random() * 360}deg)`,
    }));
    setLineStyles(newLineStyles);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {/* Background elements */}
      <div className="absolute inset-0 -m-4">
        <div className={`w-full h-full rounded-full bg-gradient-to-br from-primary via-secondary to-accent overflow-hidden
          ${animate ? 'animate-pulse' : ''}`}>
          {/* Technology-themed pixel dots */}
          {dotStyles.map((style, i) => (
            <div
              key={`dot-${i}`}
              className="absolute rounded-full bg-accent/30 animate-pulse"
              style={style}
            />
          ))}
          {/* Code-like patterns */}
          {lineStyles.map((style, i) => (
            <div
              key={`line-${i}`}
              className="absolute h-1 bg-primary/20"
              style={style}
            />
          ))}
        </div>
      </div>

      {/* Avatar with animation */}
      <Avatar
        className={`relative w-48 h-48 border-4 border-card shadow-lg transition-all duration-700 ease-in-out
          ${animate ? 'scale-100' : 'scale-95'}`}
      >
        <AvatarImage
          src="/chakradhar-portrait.jpg" // User needs to edit this image file
          alt="Chakradhar Vijayarao"
          data-ai-hint="professional avatar"
          className={`transition-all duration-1000 ${animate ? 'brightness-105' : 'brightness-90'}`} 
        />
        <AvatarFallback className="bg-primary text-primary-foreground text-2xl">CV</AvatarFallback>
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
