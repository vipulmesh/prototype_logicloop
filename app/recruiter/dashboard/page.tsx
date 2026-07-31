import { redirect } from 'next/navigation';

export default function RecruiterDashboardPage() {
  redirect('/recruiter?view=dashboard');
}
