import EmployeesList from '../EmployeesList';
import EmployeeDetail from '../EmployeeDetail';
import { notFound } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  // Tampilan HP ditangani layout: layar sempit melihat pesan "khusus desktop" + tautan ke Menu Admin (/admin/m)
  const { slug } = await params;
  
  if (!slug || slug.length === 0) {
    return <EmployeesList />;
  }
  
  if (slug.length === 1) {
    return <EmployeeDetail params={Promise.resolve({ id: slug[0] })} />;
  }
  
  notFound();
}
