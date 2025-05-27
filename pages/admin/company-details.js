// pages/admin/company-details.js

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import Cookies from 'js-cookie';

export default function CompanyDetails() {
  const [details, setDetails] = useState({
    companyName: '',
    logo: null,
    logoPublicId: null,
    blackLogo: null,
    blackLogoPublicId: null,
    favicon: null,
    faviconPublicId: null,
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: ''
    },
    seo: {
      title: '',
      description: '',
      keywords: ''
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({
    logo: false,
    blackLogo: false,
    favicon: false
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchDetails();
  }, []);

  const fetchDetails = async () => {
    try {
      const response = await fetch('/api/admin/company/details');
      if (response.ok) {
        const data = await response.json();
        setDetails({
          ...data.data,
          seo: data.data.seo || { title: '', description: '', keywords: '' }
        });
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
    } else if (name.startsWith('seo.')) {
      const seoField = name.split('.')[1];
      setDetails(prev => ({
        ...prev,
        seo: {
          ...prev.seo,
          [seoField]: value
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

        const displayName = imageType === 'blackLogo' ? 'black logo' : imageType;
        setMessage({ type: 'success', text: `${displayName} uploaded successfully` });
      } else {
        const error = await response.json();
        const displayName = imageType === 'blackLogo' ? 'black logo' : imageType;
        setMessage({ type: 'error', text: error.error || `Failed to upload ${displayName}` });
      }
    } catch (error) {
      console.error('Upload error:', error);
      const displayName = imageType === 'blackLogo' ? 'black logo' : imageType;
      setMessage({ type: 'error', text: `Failed to upload ${displayName}` });
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

        const displayName = imageType === 'blackLogo' ? 'black logo' : imageType;
        setMessage({ type: 'success', text: `${displayName} removed successfully` });
      }
    } catch (error) {
      console.error('Remove error:', error);
      const displayName = imageType === 'blackLogo' ? 'black logo' : imageType;
      setMessage({ type: 'error', text: `Failed to remove ${displayName}` });
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

  const ImageUploadSection = ({ imageType, label, currentImage, description, previewClass }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {description && (
        <p className="text-sm text-gray-500 mb-2">{description}</p>
      )}
      {currentImage && (
        <div className="mb-3 flex items-center space-x-3">
          <img
            src={currentImage}
            alt={label}
            className={previewClass || "h-20 w-auto object-contain border rounded"}
          />
          <button
            type="button"
            onClick={() => handleRemoveImage(imageType)}
            className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-200 rounded hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload(e.target.files[0], imageType)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        disabled={uploading[imageType]}
      />
      {uploading[imageType] && (
        <p className="text-sm text-blue-600 mt-1 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          Uploading...
        </p>
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Company Details</h1>

        {message.text && (
          <div className={`mb-4 p-4 rounded-md ${message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>

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
          </div>

          {/* Logo Uploads Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Assets</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Primary Logo */}
              <ImageUploadSection
                imageType="logo"
                label="Primary Logo"
                currentImage={details.logo}
                description="Main company logo (typically used on light backgrounds)"
                previewClass="h-20 w-auto object-contain border rounded bg-black p-2"
              />

              {/* Black/Dark Logo */}
              <ImageUploadSection
                imageType="blackLogo"
                label="Black/Dark Logo"
                currentImage={details.blackLogo}
                description="Dark version of your logo (for use on light backgrounds or when a darker variant is needed)"
                previewClass="h-20 w-auto object-contain border rounded bg-gray-100 p-2"
              />
            </div>

            {/* Logo Preview Comparison */}
            {(details.logo || details.blackLogo) && (
              <div className="border rounded-lg p-4 bg-gray-50 mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Logo Preview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {details.logo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Primary Logo (on dark background)</p>
                      <div className="bg-black border rounded p-4 flex items-center justify-center h-24">
                        <img src={details.logo} alt="Primary Logo" className="max-h-16 w-auto object-contain" />
                      </div>
                    </div>
                  )}
                  {details.blackLogo && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Black Logo (on light background)</p>
                      <div className="bg-white border rounded p-4 flex items-center justify-center h-24">
                        <img src={details.blackLogo} alt="Black Logo" className="max-h-16 w-auto object-contain" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Favicon Upload */}
            <ImageUploadSection
              imageType="favicon"
              label="Favicon"
              currentImage={details.favicon}
              description="Small icon that appears in browser tabs (recommended: 32x32px or 16x16px)"
              previewClass="h-8 w-8 object-contain border rounded"
            />
          </div>

          {/* Social Links Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Links</h2>
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

          {/* SEO Settings Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO Settings</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure basic SEO settings for your website. These will be used as default meta tags.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  name="seo.title"
                  value={details.seo?.title || ''}

                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`${details.companyName} - Welcome`}
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 50-60 characters. Leave empty to use default: {details.companyName} - Welcome
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <textarea
                  name="seo.description"
                  value={details.seo?.description || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Welcome to ${details.companyName}. Discover our products and services.`}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 150-160 characters. Leave empty to use default description.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  name="seo.keywords"
                  value={details.seo?.keywords || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`${details.companyName}, business, services`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated keywords relevant to your business. Leave empty to use default keywords.
                </p>
              </div>

              {/* SEO Preview */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Search Engine Preview</h4>
                <div className="bg-white p-3 rounded border">
                  <div className="text-blue-600 text-lg font-medium">
                    {details.seo?.title || `${details.companyName} - Welcome`}
                  </div>
                  <div className="text-green-700 text-sm">
                    https://www.foxbeep.com
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    {details.seo?.description || `Welcome to ${details.companyName}. Discover our products and services.`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}