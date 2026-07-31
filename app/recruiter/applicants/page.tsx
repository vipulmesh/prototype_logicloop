import { redirect } from 'next/navigation';

export default function RecruiterApplicantsPage() {
  redirect('/recruiter?view=applicants');
}
