import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Settings, Users, BarChart3 } from 'lucide-react';
import Cookies from 'js-cookie';

const AdminHomepagePanel = () => {
  const [settings, setSettings] = useState({
    hero: {
      title: '',
      description: '',
      features: []
    },
    about: {
      title: '',
      description: ''
    },
    newsletter: {
      enabled: true,
      title: '',
      description: ''
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    recentSubscribers: 0
  });
  
  const [newFeature, setNewFeature] = useState('');

  // Get actual JWT token from cookies
  const getAuthToken = () => {
    return Cookies.get('token');
  };

  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setMessage({ type: 'error', text: 'No authentication token found' });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/homepage/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading settings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('/api/admin/newsletter/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
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

      const response = await fetch('/api/admin/homepage/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
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

  const addFeature = () => {
    if (newFeature.trim()) {
      setSettings(prev => ({
        ...prev,
        hero: {
          ...prev.hero,
          features: [...prev.hero.features, newFeature.trim()]
        }
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setSettings(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        features: prev.hero.features.filter((_, i) => i !== index)
      }
    }));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Settings className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Homepage Settings</h1>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{stats.totalSubscribers} subscribers</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <BarChart3 className="h-4 w-4" />
                <span>{stats.recentSubscribers} new (30d)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
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
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={settings.hero.title}
                  onChange={(e) => updateField('hero', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter hero title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={settings.hero.description}
                  onChange={(e) => updateField('hero', 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter hero description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="space-y-2">
                  {settings.hero.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...settings.hero.features];
                          newFeatures[index] = e.target.value;
                          updateField('hero', 'features', newFeatures);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => removeFeature(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add new feature"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                    />
                    <button
                      onClick={addFeature}
                      className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About Section</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={settings.about.title}
                  onChange={(e) => updateField('about', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter about title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={settings.about.description}
                  onChange={(e) => updateField('about', 'description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter about description"
                />
              </div>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Newsletter Section</h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.newsletter.enabled}
                  onChange={(e) => updateField('newsletter', 'enabled', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">
                  Enable newsletter section
                </label>
              </div>
              
              {settings.newsletter.enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={settings.newsletter.title}
                      onChange={(e) => updateField('newsletter', 'title', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter newsletter title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={settings.newsletter.description}
                      onChange={(e) => updateField('newsletter', 'description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter newsletter description"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
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

export default AdminHomepagePanel;