'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  ArrowRight,
  FileText,
  BarChart3,
  BriefcaseBusiness,
  Target,
  Sparkles,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
};

const features = [
  {
    icon: FileText,
    title: 'Smart Resume Parsing',
    description: 'Upload any PDF resume and get instant AI-powered text extraction and structured analysis.',
  },
  {
    icon: BrainCircuit,
    title: 'Talent Intelligence',
    description: 'AI evaluates skills, experience, and potential to generate a comprehensive talent score.',
  },
  {
    icon: Target,
    title: 'Precision Job Matching',
    description: 'Match resumes against real job listings with explainable compatibility percentages.',
  },
  {
    icon: BarChart3,
    title: 'Skill Gap Analysis',
    description: 'Identify missing skills and get actionable recommendations to close the gap.',
  },
  {
    icon: ShieldCheck,
    title: 'ATS Compatibility',
    description: 'Get an ATS score with tips to ensure your resume passes applicant tracking systems.',
  },
  {
    icon: Sparkles,
    title: 'Resume Enhancement',
    description: 'AI-generated improvements for your summary, project descriptions, and skills section.',
  },
];

const stats = [
  { value: '95%', label: 'Analysis Accuracy' },
  { value: '<10s', label: 'Processing Time' },
  { value: '10+', label: 'Job Matches' },
  { value: '50+', label: 'Skill Signals' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden grid-bg">
      {/* ─── Decorative Orbs ─── */}
      <div className="orb h-96 w-96 bg-primary left-1/4 -top-20" />
      <div className="orb h-72 w-72 bg-accent right-1/4 top-40" />

      {/* ─── Navbar ─── */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">TalentAI</span>
        </div>
        <div className="flex gap-2">
          <Link href="/upload"><Button variant="ghost" size="sm">Continue as Candidate</Button></Link>
          <Link href="/recruiter"><Button size="sm">Continue as Recruiter</Button></Link>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center"
        >
          <motion.div custom={0} variants={fadeUp}>
            <Badge variant="default" className="px-4 py-1.5 text-sm">
              <Zap size={13} className="mr-1.5" />
              AI-Powered Resume Intelligence
            </Badge>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            className="mx-auto mt-8 max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl"
          >
            Your resume, decoded by{' '}
            <span className="text-gradient">artificial intelligence.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400"
          >
            Upload your resume and get instant talent scoring, skill analysis,
            ATS compatibility checks, and precision job matching — all powered by
            Google Gemini.
          </motion.p>

          <motion.div custom={3} variants={fadeUp} className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link href="/upload">
              <Button size="lg">Continue as Candidate <ArrowRight size={17} /></Button>
            </Link>
            <Link href="/recruiter">
              <Button variant="ghost" size="lg">Continue as Recruiter <BriefcaseBusiness size={17} /></Button>
            </Link>
          </motion.div>

          {/* ─── Stats Row ─── */}
          <motion.div
            custom={4}
            variants={fadeUp}
            className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4"
          >
            {stats.map((stat) => (
              <Card key={stat.label} className="p-5 text-center" hover>
                <div className="text-2xl font-bold text-gradient">{stat.value}</div>
                <div className="mt-1.5 text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Features Grid ─── */}
      <section id="features" className="relative mx-auto max-w-6xl px-6 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center"
        >
          <motion.div custom={0} variants={fadeUp}>
            <Badge variant="accent" className="px-4 py-1.5">Features</Badge>
          </motion.div>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="mt-5 text-3xl font-bold md:text-4xl"
          >
            Everything you need to{' '}
            <span className="text-gradient">stand out.</span>
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeUp}
            className="mx-auto mt-4 max-w-xl text-slate-400"
          >
            From parsing to matching, TalentAI handles every step of resume intelligence.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((feature, i) => (
            <motion.div key={feature.title} custom={i} variants={fadeUp}>
              <Card hover className="h-full">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="text-center"
        >
          <motion.div custom={0} variants={fadeUp}>
            <Badge variant="success" className="px-4 py-1.5">How It Works</Badge>
          </motion.div>
          <motion.h2
            custom={1}
            variants={fadeUp}
            className="mt-5 text-3xl font-bold md:text-4xl"
          >
            Three steps to{' '}
            <span className="text-gradient">career clarity.</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-14 grid gap-6 md:grid-cols-3"
        >
          {[
            {
              step: '01',
              title: 'Upload Your Resume',
              desc: 'Drag & drop your PDF. Our parser extracts every detail instantly.',
            },
            {
              step: '02',
              title: 'AI Analyzes Everything',
              desc: 'Gemini evaluates skills, experience, strengths, and weaknesses.',
            },
            {
              step: '03',
              title: 'Get Matched & Improve',
              desc: 'See job matches, ATS score, and actionable improvements.',
            },
          ].map((item, i) => (
            <motion.div key={item.step} custom={i} variants={fadeUp}>
              <Card hover className="relative overflow-hidden">
                <span className="absolute -right-3 -top-3 text-7xl font-black text-white/[0.03]">
                  {item.step}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-sm font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── CTA ─── */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.div custom={0} variants={fadeUp}>
            <Card className="flex flex-col items-center gap-6 p-10 text-center md:flex-row md:justify-between md:text-left">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">
                  Ready to decode your career potential?
                </h2>
                <p className="mt-3 text-slate-400">
                  Upload your resume and get AI insights in under 10 seconds.
                </p>
              </div>
              <Link href="/upload" className="shrink-0">
                <Button size="lg">
                  Start Analysis <ArrowRight size={17} />
                </Button>
              </Link>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <span className="font-semibold text-slate-300">TalentAI</span>
          </div>
          <p className="mt-2">Built with Next.js, Tailwind CSS & Google Gemini</p>
        </div>
      </footer>
    </div>
  );
}
