import AdministrationPanel from '@/components/admin/ads';
import AdminLayout from '../../components/admin/AdminLayout';
import Dashboard from '../../components/admin/Dashboard';
import AdSenseAdminPanel from '@/components/admin/Adsence';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <AdSenseAdminPanel />
    </AdminLayout>
  );
}