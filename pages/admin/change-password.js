import AdminLayout from '../../components/admin/AdminLayout';
import ChangePasswordForm from '../../components/admin/ChangePasswordForm';

export default function AdminChangePassword() {
  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update your password to keep your account secure
          </p>
        </div>
        <ChangePasswordForm />
      </div>
    </AdminLayout>
  );
}