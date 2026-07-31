import { redirect } from 'next/navigation';

export default async function RecruiterJobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/recruiter?view=jobs&job=${encodeURIComponent(id)}`);
}
