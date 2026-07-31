import { redirect } from 'next/navigation';

export default function RecruiterCompanyPage() {
  redirect('/recruiter?view=company');
}
