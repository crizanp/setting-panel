import AdminHomepagePanel from '@/components/admin/AdminHomepage';
import AdminLayout from '../components/admin/AdminLayout';
import Dashboard from '../components/admin/Dashboard';
import ConverterAdminPanel from '@/components/admin/AdminConvertPage';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <ConverterAdminPanel />
    </AdminLayout>
  );
}