import React, { useState } from 'react';
import { Badge, Button, Card } from '@/components/ui';
import type { CandidateProject } from '@/types';
import { ExternalLink, Github, Sparkles, Brain, Edit3, Trash2, Code2, Info } from 'lucide-react';

interface ProjectCardProps {
  project: CandidateProject;
  onEdit?: (project: CandidateProject) => void;
  onDelete?: (projectId: string) => void;
  isRecruiterView?: boolean;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card className="p-5 border border-primary/20 hover:border-primary/40 transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              🏷️ {project.title}
            </h3>
            {project.role && <Badge variant="accent" className="text-xs">{project.role}</Badge>}
            {project.duration && <Badge variant="muted" className="text-xs">{project.duration}</Badge>}
          </div>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            📝 {project.description}
          </p>
        </div>

        {/* Links & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-black/30 border border-border px-2.5 py-1.5 rounded-lg"
            >
              <Github size={13} /> GitHub
            </a>
          )}
          {project.liveDemoUrl && (
            <a
              href={project.liveDemoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 bg-primary/10 border border-primary/20 px-2.5 py-1.5 rounded-lg"
            >
              <ExternalLink size={13} /> Live Demo
            </a>
          )}
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(project)} title="Edit Project">
              <Edit3 size={14} />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(project.id)} title="Delete Project">
              <Trash2 size={14} className="text-amber-400" />
            </Button>
          )}
        </div>
      </div>

      {/* Tech Stack Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-slate-400 mr-1">💻 Tech Stack:</span>
        {project.technologies.map((tech) => (
          <Badge key={tech} variant="default" className="text-xs">
            {tech}
          </Badge>
        ))}
      </div>

      {/* AI Insights & Recruiter Summary */}
      <div className="mt-4 pt-4 border-t border-border/60 grid md:grid-cols-2 gap-4">
        <div className="space-y-2 bg-black/20 p-3 rounded-xl border border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1"><Sparkles size={13} className="text-amber-400" /> ⭐ AI Innovation Score</span>
            <span className="font-bold text-amber-400">{project.innovationScore}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1"><Brain size={13} className="text-accent" /> 🧠 Technical Complexity</span>
            <span className="font-bold text-accent">{project.technicalComplexity}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 flex items-center gap-1"><Code2 size={13} className="text-emerald-400" /> Problem Solving</span>
            <span className="font-bold text-emerald-400">{project.problemSolvingScore}%</span>
          </div>
        </div>

        <div className="bg-black/20 p-3 rounded-xl border border-border flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-primary block mb-1 flex items-center gap-1">
              🎯 Recruiter Summary
            </span>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              "{project.recruiterSummary}"
            </p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-2 text-[11px] text-slate-400 hover:text-white flex items-center gap-1 underline self-end"
          >
            <Info size={11} /> {showDetails ? 'Hide details' : 'View key features & details'}
          </button>
        </div>
      </div>

      {/* Expanded Key Features */}
      {showDetails && (
        <div className="mt-4 p-3 bg-black/30 rounded-xl border border-border/80 text-xs space-y-2">
          <p className="font-semibold text-slate-200">Key Features & Execution:</p>
          <ul className="list-disc pl-4 space-y-1 text-slate-300">
            {project.keyFeatures.map((feat, idx) => (
              <li key={idx}>{feat}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
