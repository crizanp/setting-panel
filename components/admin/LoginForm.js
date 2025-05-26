import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      // Verify token is still valid
      fetch('/api/admin/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          router.push('/admin');
        }
      })
      .catch(() => {
        // Token invalid, remove it
        Cookies.remove('token');
      });
    }
  }, [router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const redirectToAdmin = async () => {
    console.log('Attempting redirect to /admin');
    
    try {
      // Method 1: Try Next.js router
      await router.push('/admin');
      console.log('Router.push successful');
    } catch (routerError) {
      console.log('Router.push failed:', routerError);
      
      // Method 2: Fallback to window.location
      try {
        window.location.href = '/admin';
      } catch (locationError) {
        console.log('window.location.href failed:', locationError);
        
        // Method 3: Last resort - replace
        window.location.replace('/admin');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    console.log('Attempting login with:', { email: formData.email });
    console.log('Environment:', process.env.NODE_ENV);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.token) {
        console.log('Login successful, setting token and redirecting');
        
        // Set cookie with comprehensive options
        const cookieOptions = {
          expires: 7,
          path: '/',
          sameSite: 'lax'
        };
        
        // Only set secure in production with HTTPS
        if (process.env.NODE_ENV === 'production') {
          cookieOptions.secure = true;
        }
        
        console.log('Setting cookie with options:', cookieOptions);
        Cookies.set('token', data.token, cookieOptions);
        
        // Verify cookie was set
        const setCookie = Cookies.get('token');
        console.log('Cookie verification:', setCookie ? 'Cookie set successfully' : 'Cookie not set');
        
        // Redirect with a slight delay to ensure cookie is processed
        setTimeout(() => {
          redirectToAdmin();
        }, 100);
        
      } else {
        console.log('Login failed:', data.message);
        setErrors({ general: data.message || 'Login failed' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Admin Login
          </h2>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}
            
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}