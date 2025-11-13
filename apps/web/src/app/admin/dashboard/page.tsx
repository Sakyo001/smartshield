import {getServerSession} from 'next-auth/next';
import {redirect} from 'next/navigation';
import {authOptions} from '@lib/auth';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if(!session || session.user.role !== 'admin'){
    redirect('/login');
  }

  return <AdminDashboardClient session={session} />

}