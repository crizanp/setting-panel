import AdministrationPanel from '@/components/admin/ads';
import AdminLayout from '../../components/admin/AdminLayout';
import Dashboard from '../../components/admin/Dashboard';

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <AdministrationPanel />
    </AdminLayout>
  );
}