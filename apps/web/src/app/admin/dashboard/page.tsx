import { createClient } from '@lib/supabase-server';
import { redirect } from 'next/navigation';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Check if user is admin (you may need to adjust this based on your user metadata)
  const isAdmin = user?.email === 'admin@example.com' || user?.user_metadata?.role === 'admin';

  if (!user || !isAdmin) {
    redirect('/login');
  }

  return <AdminDashboardClient user={user} />
}