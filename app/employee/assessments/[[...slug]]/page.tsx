import AssessmentsList from '../AssessmentsList';
import AssessmentDetail from '../AssessmentDetail';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  
  if (!slug || slug.length === 0) {
    return <AssessmentsList />;
  }
  
  if (slug.length === 1) {
    return <AssessmentDetail params={Promise.resolve({ id: slug[0] })} />;
  }
  
  notFound();
}
