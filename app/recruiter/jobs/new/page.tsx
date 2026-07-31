import { redirect } from 'next/navigation';

export default function RecruiterNewJobPage() {
  redirect('/recruiter?view=jobs&create=true');
}
