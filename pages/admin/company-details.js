// pages/admin/company-details.js

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Cookies from 'js-cookie';

export default function CompanyDetails() {
  const [details, setDetails] = useState({
    companyName: '',
    logo: null,
    logoPublicId: null,
    favicon: null,
    faviconPublicId: null,
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({ logo: false, favicon: false });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      const response = await fetch('/api/admin/company/details');
      if (response.ok) {
        const data = await response.json();
        setDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      setMessage({ type: 'error', text: 'Failed to load company details' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social.')) {
      const socialField = name.split('.')[1];
      setDetails(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialField]: value
        }
      }));
    } else {
      setDetails(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageUpload = async (file, imageType) => {
    if (!file) return;

    setUploading(prev => ({ ...prev, [imageType]: true }));
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = Cookies.get('token');
      const response = await fetch(`/api/admin/company/upload-image?type=${imageType}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setDetails(prev => ({
          ...prev,
          [imageType]: data.data.url,
          [`${imageType}PublicId`]: data.data.publicId
        }));
        setMessage({ type: 'success', text: `${imageType} uploaded successfully` });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || `Failed to upload ${imageType}` });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: `Failed to upload ${imageType}` });
    } finally {
      setUploading(prev => ({ ...prev, [imageType]: false }));
    }
  };

  const handleRemoveImage = async (imageType) => {
    const publicId = details[`${imageType}PublicId`];
    if (!publicId) return;

    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/admin/company/details', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          imagePublicId: publicId,
          imageType: imageType
        })
      });

      if (response.ok) {
        setDetails(prev => ({
          ...prev,
          [imageType]: null,
          [`${imageType}PublicId`]: null
        }));
        setMessage({ type: 'success', text: `${imageType} removed successfully` });
      }
    } catch (error) {
      console.error('Remove error:', error);
      setMessage({ type: 'error', text: `Failed to remove ${imageType}` });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = Cookies.get('token');
      const response = await fetch('/api/admin/company/details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(details)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Company details updated successfully' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update details' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to update details' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Details</h1>

        {message.text && (
          <div className={`mb-4 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              name="companyName"
              value={details.companyName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter company name"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo
            </label>
            {details.logo && (
              <div className="mb-3">
                <img 
                  src={details.logo} 
                  alt="Company Logo" 
                  className="h-20 w-auto object-contain border rounded"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage('logo')}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files[0], 'logo')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={uploading.logo}
            />
            {uploading.logo && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
          </div>

          {/* Favicon Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favicon
            </label>
            {details.favicon && (
              <div className="mb-3">
                <img 
                  src={details.favicon} 
                  alt="Favicon" 
                  className="h-8 w-8 object-contain border rounded"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage('favicon')}
                  className="ml-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files[0], 'favicon')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={uploading.favicon}
            />
            {uploading.favicon && <p className="text-sm text-blue-600 mt-1">Uploading...</p>}
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  name="social.facebook"
                  value={details.socialLinks.facebook}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  name="social.instagram"
                  value={details.socialLinks.instagram}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://instagram.com/yourpage"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter URL
                </label>
                <input
                  type="url"
                  name="social.twitter"
                  value={details.socialLinks.twitter}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://twitter.com/yourpage"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="social.linkedin"
                  value={details.socialLinks.linkedin}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}