import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, X, ImageIcon, Video, ArrowRight } from 'lucide-react';

const ConverterAdminPanel = () => {
  const [selectedConverter, setSelectedConverter] = useState('mp4-to-mkv');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef(null);

  const converters = [
    { id: 'mp4-to-mkv', name: 'MP4 to MKV', from: 'MP4', to: 'MKV' },
    { id: 'mkv-to-mp4', name: 'MKV to MP4', from: 'MKV', to: 'MP4' },
    { id: 'avi-to-mp4', name: 'AVI to MP4', from: 'AVI', to: 'MP4' },
    { id: 'webm-to-mp4', name: 'WEBM to MP4', from: 'WEBM', to: 'MP4' },
    { id: 'mov-to-mp4', name: 'MOV to MP4', from: 'MOV', to: 'MP4' },
    { id: 'mp4-to-webm', name: 'MP4 to WEBM', from: 'MP4', to: 'WEBM' }
  ];

  const getAuthToken = () => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  };

  useEffect(() => {
    fetchConverterSettings();
  }, [selectedConverter]);

  const fetchConverterSettings = async () => {
    setLoading(true);
    try {
      // Use unified API endpoint
      const response = await fetch(`/api/converter/settings?converterId=${selectedConverter}`);

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      } else {
        // If settings don't exist, use default
        setSettings(getDefaultSettings());
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading settings' });
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = () => {
    const converter = converters.find(c => c.id === selectedConverter);
    return {
      hero: {
        title: `Convert ${converter.from} to ${converter.to} Online`,
        description: `Convert your ${converter.from} files to ${converter.to} format quickly and easily. High quality conversion with fast processing.`,
        image: null,
        imageAlt: `${converter.from} to ${converter.to} converter`
      },
      ways: {
        title: 'How to Convert',
        description: `Follow these simple steps to convert your ${converter.from} files to ${converter.to}`,
        image: null,
        imageAlt: 'Conversion process',
        steps: [
          `Upload your ${converter.from} file`,
          'Choose conversion settings',
          `Download your ${converter.to} file`
        ]
      },
      features: {
        title: 'Why Choose Our Converter',
        items: [
          'Fast conversion speed',
          'High quality output',
          'Secure file processing',
          'No registration required'
        ]
      }
    };
  };

  const handleImageUpload = async (event, section) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
      return;
    }

    setUploading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = getAuthToken();
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found' });
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/admin/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            image: data.data.url,
            imagePublicId: data.data.publicId
          }
        }));
        setMessage({ type: 'success', text: 'Image uploaded successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to upload image' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error uploading image' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (section) => {
    const imagePublicId = settings[section]?.imagePublicId;
    if (!imagePublicId) return;

    try {
      const token = getAuthToken();
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found' });
        return;
      }

      // Use unified API to delete image
      const response = await fetch('/api/converter/settings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          converterId: selectedConverter,
          imagePublicId: imagePublicId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
        setMessage({ type: 'success', text: 'Image removed successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to remove image' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error removing image' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const token = getAuthToken();
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found' });
        setSaving(false);
        return;
      }

      // Use unified API to save settings
      const response = await fetch('/api/converter/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          converterId: selectedConverter,
          ...settings
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateArrayField = (section, field, index, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].map((item, i) => i === index ? value : item)
      }
    }));
  };

  const addStep = () => {
    setSettings(prev => ({
      ...prev,
      ways: {
        ...prev.ways,
        steps: [...prev.ways.steps, 'New step']
      }
    }));
  };

  const removeStep = (index) => {
    setSettings(prev => ({
      ...prev,
      ways: {
        ...prev.ways,
        steps: prev.ways.steps.filter((_, i) => i !== index)
      }
    }));
  };

  const addFeature = () => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: [...prev.features.items, 'New feature']
      }
    }));
  };

  const removeFeature = (index) => {
    setSettings(prev => ({
      ...prev,
      features: {
        ...prev.features,
        items: prev.features.items.filter((_, i) => i !== index)
      }
    }));
  };

  const renderImageUpload = (section, label) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label}
      </label>

      {settings[section]?.image ? (
        <div className="relative">
          <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              src={settings[section].image}
              alt={settings[section].imageAlt || label}
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <button
                onClick={() => handleRemoveImage(section)}
                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                title="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alt Text
            </label>
            <input
              type="text"
              value={settings[section]?.imageAlt || ''}
              onChange={(e) => updateField(section, 'imageAlt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the image for accessibility"
            />
          </div>

          <div className="mt-3">
            <label htmlFor={`${section}-image-replace`} className="cursor-pointer">
              <div className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Replace Image'}
              </div>
            </label>
            <input
              ref={fileInputRef}
              id={`${section}-image-replace`}
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, section)}
              disabled={uploading}
            />
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor={`${section}-image`} className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  {uploading ? 'Uploading...' : `Choose ${label.toLowerCase()}`}
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  PNG, JPG, GIF up to 5MB
                </span>
              </label>
              <input
                ref={fileInputRef}
                id={`${section}-image`}
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, section)}
                disabled={uploading}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Converter Settings</h1>
          <p className="text-gray-600">Manage content for different video converter pages</p>
        </div>

        {/* Converter Selector */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {converters.map((converter) => (
              <button
                key={converter.id}
                onClick={() => setSelectedConverter(converter.id)}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedConverter === converter.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <Video className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium text-center">
                  {converter.from}
                  <ArrowRight className="h-3 w-3 mx-1 inline" />
                  {converter.to}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-md ${message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          {/* Hero Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hero Section</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={settings.hero?.title || ''}
                    onChange={(e) => updateField('hero', 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={settings.hero?.description || ''}
                    onChange={(e) => updateField('hero', 'description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                {renderImageUpload('hero', 'Hero Image')}
              </div>
            </div>
          </div>

          {/* Ways Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Convert Section</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={settings.ways?.title || ''}
                    onChange={(e) => updateField('ways', 'title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={settings.ways?.description || ''}
                    onChange={(e) => updateField('ways', 'description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Steps</label>
                  <div className="space-y-2">
                    {settings.ways?.steps?.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                        <input
                          type="text"
                          value={step}
                          onChange={(e) => updateArrayField('ways', 'steps', index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => removeStep(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addStep}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Add step
                    </button>
                  </div>
                </div>
              </div>
              <div>
                {renderImageUpload('ways', 'Process Image')}
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Features Section</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={settings.features?.title || ''}
                  onChange={(e) => updateField('features', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
                <div className="space-y-2">
                  {settings.features?.items?.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateArrayField('features', 'items', index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeFeature(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addFeature}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add feature
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConverterAdminPanel;