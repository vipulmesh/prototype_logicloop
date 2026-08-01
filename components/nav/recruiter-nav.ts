import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Trophy,
  Users,
} from 'lucide-react';

export type RecruiterNavId =
  | 'dashboard'
  | 'directory'
  | 'jobs'
  | 'applicants'
  | 'hackathons'
  | 'company';

export const recruiterNavigation: {
  id: RecruiterNavId;
  label: string;
  href: string;
  icon: typeof BarChart3;
}[] = [
  { id: 'dashboard', label: 'Analytics', href: '/recruiter/dashboard', icon: BarChart3 },
  { id: 'directory', label: 'Candidate Discovery', href: '/recruiter/directory', icon: Users },
  { id: 'jobs', label: 'My jobs', href: '/recruiter/jobs', icon: BriefcaseBusiness },
  { id: 'applicants', label: 'Applicants', href: '/recruiter/applicants', icon: CheckCircle2 },
  { id: 'hackathons', label: 'Hackathons', href: '/recruiter/hackathons', icon: Trophy },
  { id: 'company', label: 'Company profile', href: '/recruiter/company', icon: Building2 },
];

export function getActiveRecruiterNav(
  pathname: string,
  viewParam: string | null,
): RecruiterNavId {
  if (pathname.includes('/recruiter/directory')) return 'directory';
  if (pathname.includes('/recruiter/hackathons')) return 'hackathons';
  if (pathname.includes('/recruiter/jobs')) return 'jobs';
  if (pathname.includes('/recruiter/applicants')) return 'applicants';
  if (pathname.includes('/recruiter/company')) return 'company';
  if (pathname.includes('/recruiter/dashboard')) return 'dashboard';

  const valid: RecruiterNavId[] = [
    'dashboard',
    'directory',
    'jobs',
    'applicants',
    'hackathons',
    'company',
  ];
  if (viewParam && valid.includes(viewParam as RecruiterNavId)) {
    return viewParam as RecruiterNavId;
  }
  return 'dashboard';
}
