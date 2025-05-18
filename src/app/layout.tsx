import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import ResumeChatAssistant from '@/components/chat-assistant/ResumeChatAssistant'; // Added import

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Lakshmi Chakradhar Vijayarao | ML Practitioner & Software Engineer",
  description: 'Portfolio of Lakshmi Chakradhar Vijayarao, showcasing expertise in Machine Learning, Full Stack Development (React.js, Node.js, Python), and building scalable, secure systems.',
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
        <ResumeChatAssistant /> {/* Added Chat Assistant */}
      </body>
    </html>
  );
}
