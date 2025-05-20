
import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import InteractiveChatbot from '@/components/chatbot/InteractiveChatbot';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({
  variable: '--font-roboto-mono',
  subsets: ['latin'],
  weight: ['400', '700'] // Common weights for a mono font
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
      <body className={`${inter.variable} ${robotoMono.variable} antialiased flex flex-col min-h-screen bg-background text-foreground`}>
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
