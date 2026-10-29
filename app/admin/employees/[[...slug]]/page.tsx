import EmployeesList from '../EmployeesList';
import EmployeeDetail from '../EmployeeDetail';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  if (isMobile) {
    redirect('/employee/dashboard');
  }

  const { slug } = await params;
  
  if (!slug || slug.length === 0) {
    return <EmployeesList />;
  }
  
  if (slug.length === 1) {
    return <EmployeeDetail params={Promise.resolve({ id: slug[0] })} />;
  }
  
  notFound();
}
