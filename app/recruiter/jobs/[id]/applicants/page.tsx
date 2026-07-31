import { redirect } from 'next/navigation';

export default async function RecruiterJobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/recruiter?view=applicants&job=${encodeURIComponent(id)}`);
}
