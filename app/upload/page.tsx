'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  X,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';
import { useResumeUpload } from '@/hooks/useResumeUpload';
import { clearCachedAnalysis, markResumeForAnalysis } from '@/lib/analysis-cache';
import { cn } from '@/lib/utils';

/* ─── Status Steps ─── */
const steps = [
  { key: 'uploading', label: 'Uploading file', icon: Upload },
  { key: 'extracting', label: 'Extracting text', icon: FileText },
  { key: 'complete', label: 'Ready for analysis', icon: CheckCircle2 },
] as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const {
    status,
    fileName,
    fileSize,
    extractedText,
    pageCount,
    error,
    upload,
    reset,
  } = useResumeUpload();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) upload(file);
    },
    [upload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    disabled: status !== 'idle' && status !== 'error',
  });

  const handleAnalyze = () => {
    if (extractedText) {
      clearCachedAnalysis();
      // Store in sessionStorage to pass to the dashboard
      sessionStorage.setItem(
        'talentai_resume',
        JSON.stringify({
          text: extractedText,
          fileName,
          fileSize,
          pageCount,
        }),
      );
      markResumeForAnalysis();
      router.push('/dashboard');
    }
  };

  const isProcessing = status === 'uploading' || status === 'extracting';

  return (
    <div className="min-h-screen grid-bg">
      {/* ─── Decorative Orbs ─── */}
      <div className="orb h-80 w-80 bg-primary left-1/3 top-10" />
      <div className="orb h-64 w-64 bg-accent right-1/4 bottom-20" />

      {/* ─── Navbar ─── */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">TalentAI</span>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={15} /> Back
          </Button>
        </Link>
      </nav>

      {/* ─── Main Content ─── */}
      <main className="relative z-10 mx-auto max-w-2xl px-6 pb-20 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Badge variant="default" className="px-4 py-1.5">
            <Sparkles size={13} className="mr-1.5" />
            AI Resume Analysis
          </Badge>
          <h1 className="mt-6 text-3xl font-bold md:text-4xl">
            Upload your resume
          </h1>
          <p className="mt-3 text-slate-400">
            Drop your PDF or DOCX and let AI decode your career potential.
          </p>
        </motion.div>

        {/* ─── Dropzone ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10"
        >
          <div
            {...getRootProps()}
            className={cn(
              'glass rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer',
              isDragActive
                ? 'border-primary bg-primary/5 shadow-glow'
                : 'border-border hover:border-primary/40 hover:bg-white/[0.02]',
              isProcessing && 'pointer-events-none opacity-60',
              status === 'error' && 'border-red-500/40',
            )}
          >
            <input {...getInputProps()} />

            <AnimatePresence mode="wait">
              {status === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
                    <Upload className="h-7 w-7 text-primary" />
                  </div>
                  <p className="mt-5 text-lg font-medium">
                    {isDragActive
                      ? 'Drop your resume here...'
                      : 'Drag & drop your resume'}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    or click to browse · PDF or DOCX · Max 5 MB
                  </p>
                </motion.div>
              )}

              {isProcessing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                  <p className="mt-4 text-lg font-medium">
                    {status === 'uploading' ? 'Uploading...' : 'Extracting text...'}
                  </p>
                  {fileName && (
                    <p className="mt-2 text-sm text-muted-foreground">{fileName}</p>
                  )}
                </motion.div>
              )}

              {status === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
                  <p className="mt-4 text-lg font-medium text-red-300">
                    Upload failed
                  </p>
                  <p className="mt-2 text-sm text-red-400/80">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      reset();
                    }}
                  >
                    Try again
                  </Button>
                </motion.div>
              )}

              {status === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                  <p className="mt-4 text-lg font-medium text-emerald-300">
                    Resume parsed successfully
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <span>{fileName}</span>
                    <span>·</span>
                    <span>{fileSize && formatFileSize(fileSize)}</span>
                    <span>·</span>
                    <span>{pageCount} {pageCount === 1 ? 'page' : 'pages'}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ─── Progress Steps ─── */}
        {status !== 'idle' && status !== 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="p-5">
              <div className="flex items-center justify-between">
                {steps.map((step, i) => {
                  const stepIndex = steps.findIndex((s) => s.key === status);
                  const isActive = step.key === status;
                  const isDone = i < stepIndex || status === 'complete';

                  return (
                    <div key={step.key} className="flex items-center gap-2">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full transition-all',
                          isDone
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : isActive
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {isDone ? (
                          <CheckCircle2 size={16} />
                        ) : isActive ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <step.icon size={14} />
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-sm hidden sm:inline',
                          isDone
                            ? 'text-emerald-400'
                            : isActive
                              ? 'text-white font-medium'
                              : 'text-muted-foreground',
                        )}
                      >
                        {step.label}
                      </span>
                      {i < steps.length - 1 && (
                        <div
                          className={cn(
                            'mx-3 h-px w-8 md:w-12',
                            isDone ? 'bg-emerald-500/40' : 'bg-border',
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ─── Extracted Text Preview ─── */}
        {status === 'complete' && extractedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-300">
                  Extracted Text Preview
                </h3>
                <Badge variant="muted">
                  {extractedText.length.toLocaleString()} chars
                </Badge>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl bg-black/30 p-4 text-xs leading-relaxed text-slate-400 font-mono">
                {extractedText.slice(0, 1500)}
                {extractedText.length > 1500 && (
                  <span className="text-muted-foreground">... (truncated)</span>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ─── Action Buttons ─── */}
        {status === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAnalyze}
            >
              <Sparkles size={17} />
              Analyze with AI
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={reset}
            >
              <X size={15} />
              Upload Different File
            </Button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
