import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch('/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
      } else {
        router.push('/admin/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove('token');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {admin?.name || admin?.email}</span>
              <button
                onClick={() => router.push('/admin/change-password')}
                className="text-blue-600 hover:text-blue-500"
              >
                Change Password
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <div className="flex">
        <div className="w-64 bg-white shadow-sm min-h-screen">
          <nav className="mt-5 px-2">
            <div className="space-y-1">
              <Link
                href="/admin"
                className={`block px-2 py-2 text-sm font-medium rounded-md ${
                  router.pathname === '/admin' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/admin/change-password"
                className={`block px-2 py-2 text-sm font-medium rounded-md ${
                  router.pathname === '/admin/change-password' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Change Password
              </Link>
              <Link
                href="/admin/company-details"
                className={`block px-2 py-2 text-sm font-medium rounded-md ${
                  router.pathname === '/admin/company-details' 
                    ? 'bg-blue-100 text-blue-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Company Details
              </Link>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}