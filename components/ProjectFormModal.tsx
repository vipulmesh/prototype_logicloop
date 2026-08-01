import React, { useState } from 'react';
import { Button, Card } from '@/components/ui';
import type { CandidateProject } from '@/types';
import { Save, X } from 'lucide-react';

interface ProjectFormModalProps {
  project?: CandidateProject | null;
  onSave: (project: CandidateProject) => void;
  onClose: () => void;
}

export function ProjectFormModal({ project, onSave, onClose }: ProjectFormModalProps) {
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [technologies, setTechnologies] = useState(project?.technologies.join(', ') || '');
  const [role, setRole] = useState(project?.role || 'Lead Engineer');
  const [keyFeatures, setKeyFeatures] = useState(project?.keyFeatures.join('\n') || '');
  const [duration, setDuration] = useState(project?.duration || '3 Months');
  const [githubUrl, setGithubUrl] = useState(project?.githubUrl || '');
  const [liveDemoUrl, setLiveDemoUrl] = useState(project?.liveDemoUrl || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const techArray = technologies.split(',').map((t) => t.trim()).filter(Boolean);
    const featureArray = keyFeatures.split('\n').map((f) => f.trim()).filter(Boolean);

    const updated: CandidateProject = {
      id: project?.id || `proj_manual_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      technologies: techArray.length ? techArray : ['React', 'TypeScript'],
      role: role.trim() || 'Software Developer',
      keyFeatures: featureArray.length ? featureArray : ['Built core application functionality.'],
      duration: duration.trim() || '3 Months',
      githubUrl: githubUrl.trim() || undefined,
      liveDemoUrl: liveDemoUrl.trim() || undefined,

      // Preserve or generate AI metrics
      innovationScore: project?.innovationScore || 85,
      technicalComplexity: project?.technicalComplexity || 82,
      problemSolvingScore: project?.problemSolvingScore || 86,
      industryRelevance: project?.industryRelevance || 88,
      recruiterSummary: project?.recruiterSummary || `Candidate project ${title} demonstrating strong implementation of ${techArray.slice(0, 2).join(' and ')}.`,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border border-primary/30 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {project ? 'Edit Extracted Project' : 'Add Project Manually'}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Project Title *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-primary"
              placeholder="e.g. AI-Powered Analytics Engine"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Candidate Role</label>
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-primary"
                placeholder="e.g. Lead Full Stack Developer"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Duration</label>
              <input
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-primary"
                placeholder="e.g. 4 Months"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Short Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-primary resize-y"
              placeholder="Describe the objective, architecture, and overall solution..."
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Technologies Used (comma separated)</label>
            <input
              value={technologies}
              onChange={(e) => setTechnologies(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-primary"
              placeholder="React, TypeScript, Next.js, Node.js, PostgreSQL"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Key Features (one per line)</label>
            <textarea
              rows={3}
              value={keyFeatures}
              onChange={(e) => setKeyFeatures(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-slate-900 outline-none focus:border-primary resize-y"
              placeholder="Implemented real-time WebSocket connection&#10;Optimized database index queries by 40%&#10;Integrated OAuth 2.0 authentication"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-medium mb-1">GitHub Link (optional)</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-primary"
                placeholder="https://github.com/username/project"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">Live Demo Link (optional)</label>
              <input
                type="url"
                value={liveDemoUrl}
                onChange={(e) => setLiveDemoUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 outline-none focus:border-primary"
                placeholder="https://my-demo-app.vercel.app"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Save size={16} /> Save Project
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
