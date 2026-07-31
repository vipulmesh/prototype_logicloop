import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TalentAI — AI-Powered Talent Intelligence',
  description:
    'Upload your resume and get AI-powered analysis, talent scoring, skill insights, and precision job matching in seconds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
