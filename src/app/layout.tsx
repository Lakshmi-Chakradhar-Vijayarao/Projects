
// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter as GeistSans, Roboto_Mono as GeistMono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import React from 'react';
import InteractiveChatbot from '@/components/chatbot/InteractiveChatbot';


const geistSans = GeistSans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  weight: ['400', '700'] 
});

export const metadata: Metadata = {
  title: "Chakradhar Vijayarao | ML Practitioner & Software Engineer",
  description: "Portfolio of Chakradhar Vijayarao, showcasing expertise in Machine Learning, Full Stack Development (React.js, Node.js, Python), and building scalable, secure systems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <Toaster />
        <InteractiveChatbot /> 
      </body>
    </html>
  );
}
