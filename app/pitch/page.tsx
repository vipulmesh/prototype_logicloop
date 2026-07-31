'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BrainCircuit, FileUp, Loader2, Sparkles, AlertCircle, ArrowRight, Presentation, Target, TrendingUp, Presentation as PresentationIcon } from 'lucide-react';
import { Badge, Button, Card, Progress, ScoreCircle } from '@/components/ui';

interface PitchAnalysis {
  innovationScore: number;
  technicalScore: number;
  businessScore: number;
  presentationQuality: number;
  overallScore: number;
  aiSummary: string;
  improvementSuggestions: string[];
}

export default function PitchAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'>('idle');
  const [analysis, setAnalysis] = useState<PitchAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    setStatus('uploading');
    
    // Simulate upload
    await new Promise(r => setTimeout(r, 800));
    setStatus('analyzing');
    
    // Simulate AI analysis (Deterministic)
    await new Promise(r => setTimeout(r, 1500));
    
    const hash = getHash(selected.name);
    
    const innovationScore = 70 + (hash % 30);
    const technicalScore = 65 + ((hash * 2) % 35);
    const businessScore = 60 + ((hash * 3) % 40);
    const presentationQuality = 75 + ((hash * 5) % 25);
    const overallScore = Math.round((innovationScore + technicalScore + businessScore + presentationQuality) / 4);
    
    const aiSummary = `The pitch deck "${selected.name}" demonstrates a solid understanding of the market with strong technical foundations. The presentation flow is logical, though the business model could be clearer. Overall, a compelling value proposition that stands out in innovation.`;
    
    const improvementSuggestions = [
      "Clarify the specific go-to-market strategy in the early slides.",
      "Include more robust competitive analysis data.",
      "Simplify the technical architecture diagram for non-technical stakeholders.",
      "Strengthen the financial projections section with a clear break-even point."
    ].slice(0, 2 + (hash % 3));

    setAnalysis({
      innovationScore,
      technicalScore,
      businessScore,
      presentationQuality,
      overallScore,
      aiSummary,
      improvementSuggestions
    });
    setStatus('complete');
  };

  return (
    <div className="min-h-screen grid-bg relative overflow-hidden">
      <div className="orb h-96 w-96 bg-primary left-1/4 -top-20" />
      <div className="orb h-80 w-80 bg-accent right-1/3 bottom-10" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">TalentAI</span>
        </Link>
        <Link href="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
      </nav>

      <main className="relative z-10 mx-auto flex min-h-[85vh] max-w-5xl flex-col items-center justify-center px-6 py-12">
        {status === 'idle' && (
          <div className="w-full max-w-xl text-center">
            <Badge variant="accent" className="mb-4">Hackathon Pipeline</Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">AI Pitch Analyzer</h1>
            <p className="mt-4 text-lg text-slate-400">
              Upload your PPT or PDF pitch deck. Our AI will analyze your presentation for innovation, technical depth, and business viability.
            </p>

            <Card className="mt-8 border-dashed border-2 border-primary/30 bg-black/40 p-12 transition-all hover:border-primary/60 hover:bg-black/60 relative group">
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                accept=".pdf,.ppt,.pptx"
                onChange={handleUpload}
              />
              <div className="flex flex-col items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 group-hover:scale-110 transition-transform duration-300">
                  <FileUp className="h-10 w-10 text-primary" />
                </div>
                <h3 className="mt-6 text-xl font-bold">Select a Pitch Deck</h3>
                <p className="mt-2 text-sm text-slate-400 max-w-[250px]">
                  PDF, PPT, or PPTX. Up to 10MB. 
                </p>
                <Button className="mt-6 pointer-events-none" variant="primary">
                  Browse Files
                </Button>
              </div>
            </Card>
          </div>
        )}

        {(status === 'uploading' || status === 'analyzing') && (
          <Card className="w-full max-w-md flex flex-col items-center justify-center text-center p-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
            <h2 className="text-2xl font-bold">
              {status === 'uploading' ? 'Uploading Deck...' : 'Analyzing Pitch...'}
            </h2>
            <p className="mt-3 text-slate-400">
              {status === 'uploading' 
                ? 'Securely transferring your presentation.' 
                : 'Evaluating innovation, business model, and technical feasibility.'}
            </p>
          </Card>
        )}

        {status === 'complete' && analysis && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <Badge variant="success" className="mb-3"><Sparkles size={14} className="mr-1.5"/> AI Analysis Complete</Badge>
                <h1 className="text-3xl font-bold">{file?.name}</h1>
                <p className="text-slate-400 mt-2">Analyzed for Hackathon Pipeline</p>
              </div>
              <Button variant="outline" onClick={() => {setStatus('idle'); setAnalysis(null); setFile(null);}}>
                Analyze Another Deck
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 space-y-6 p-6">
                <div>
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2"><BrainCircuit className="text-primary"/> AI Pitch Summary</h2>
                  <p className="text-slate-300 leading-relaxed">{analysis.aiSummary}</p>
                </div>
                
                <div className="border-t border-border pt-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="text-accent"/> Deep Dive Metrics</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-300">Innovation & Originality</span>
                        <span className="text-sm font-bold text-emerald-400">{analysis.innovationScore}/100</span>
                      </div>
                      <Progress value={analysis.innovationScore} color="success" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-300">Technical Depth</span>
                        <span className="text-sm font-bold text-primary">{analysis.technicalScore}/100</span>
                      </div>
                      <Progress value={analysis.technicalScore} color="primary" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-300">Business Viability</span>
                        <span className="text-sm font-bold text-accent">{analysis.businessScore}/100</span>
                      </div>
                      <Progress value={analysis.businessScore} color="accent" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-300">Presentation Quality</span>
                        <span className="text-sm font-bold text-amber-400">{analysis.presentationQuality}/100</span>
                      </div>
                      <Progress value={analysis.presentationQuality} color="warning" />
                    </div>
                  </div>
                </div>
              </Card>
              
              <div className="space-y-6">
                <Card className="flex flex-col items-center justify-center p-8 text-center bg-black/40 border-primary/20">
                  <h3 className="text-sm uppercase tracking-wider text-slate-400 font-semibold mb-6">Overall Pitch Score</h3>
                  <ScoreCircle value={analysis.overallScore} label="Pitch Quality" size="lg" />
                  <p className="mt-6 text-sm text-slate-400">Excellent potential for hackathon shortlisting.</p>
                </Card>
                
                <Card className="p-6 border-amber-500/20 bg-amber-500/5">
                  <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <Target size={18} /> Improvement Areas
                  </h3>
                  <ul className="space-y-3">
                    {analysis.improvementSuggestions.map((suggestion, idx) => (
                      <li key={idx} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                        <ArrowRight className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
