import { redirect } from 'next/navigation';

export default function RecruiterJobsPage() {
  redirect('/recruiter?view=jobs');
}
