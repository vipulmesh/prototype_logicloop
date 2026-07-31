import { redirect } from 'next/navigation';

export default async function RecruiterEditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/recruiter?view=jobs&edit=${encodeURIComponent(id)}`);
}
