
"use client";

import React, { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AnimatedAvatar: React.FC = () => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => setAnimate(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative">
      {/* Pixel art tech background - circles representing different technologies */}
      <div className="absolute inset-0 -m-4">
        <div className={`w-full h-full rounded-full bg-gradient-to-br from-portfolio-dark-blue to-portfolio-purple overflow-hidden
          ${animate ? 'animate-pulse' : ''}`}>
          {/* Technology-themed pixel dots */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div 
              key={i}
              className={`absolute rounded-full bg-portfolio-teal/30 animate-pulse`}
              style={{
                width: `${Math.random() * 20 + 10}px`,
                height: `${Math.random() * 20 + 10}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            />
          ))}
          {/* Code-like patterns */}
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={`line-${i}`}
              className="absolute h-1 bg-portfolio-light-purple/20"
              style={{
                width: `${Math.random() * 30 + 20}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`
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
          src="/lovable-uploads/c84e0123-93ab-4e02-9520-5dc24ca13f71.png" 
          alt="Lakshmi Chakradhar Vijayarao"
          className={`transition-all duration-1000 ${animate ? 'brightness-105' : 'brightness-90'}`}
        />
        <AvatarFallback className="bg-portfolio-light-purple text-white text-2xl">LC</AvatarFallback>
      </Avatar>

      {/* Animated ring representing tech expertise */}
      <div 
        className={`absolute inset-0 rounded-full border-4 border-portfolio-teal/30 transition-all duration-1500
          ${animate ? 'scale-110 opacity-100' : 'scale-100 opacity-0'}`}
      ></div>
      <div 
        className={`absolute inset-0 rounded-full border-2 border-portfolio-light-purple/40 transition-all duration-2000 delay-300
          ${animate ? 'scale-125 opacity-100' : 'scale-100 opacity-0'}`}
      ></div>
    </div>
  );
};

export default AnimatedAvatar;
