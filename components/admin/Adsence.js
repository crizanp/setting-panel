import { useState, useEffect } from 'react';
import { Eye, EyeOff, Settings, Plus, Trash2, Edit, Save, X, BarChart3, Globe, Smartphone, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdSenseAdminPanel() {
  const [settings, setSettings] = useState({
    publisherId: '',
    adClientId: '',
    globalSettings: {
      enabled: false,
      autoAds: false,
      adBlockDetection: false,
      respectDoNotTrack: true,
      lazyLoading: true,
      testMode: false
    },
    adPlacements: {
      header: { enabled: false, adSlot: '', adFormat: 'auto', status: 'draft' },
      sidebar: { enabled: false, adSlot: '', adFormat: 'rectangle', status: 'draft' },
      footer: { enabled: false, adSlot: '', adFormat: 'horizontal', status: 'draft' },
      inContent: { enabled: false, adSlot: '', adFormat: 'auto', position: 'middle', status: 'draft' },
      mobile: { enabled: false, adSlot: '', adFormat: 'mobile-banner', status: 'draft' }
    },
    customAdUnits: [],
    performance: {
      trackClicks: true,
      trackImpressions: true,
      reportingEnabled: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('general');
  const [showNewUnitForm, setShowNewUnitForm] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [newUnit, setNewUnit] = useState({
    name: '',
    adSlot: '',
    adFormat: 'auto',
    placement: '',
    enabled: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/adsense/settings', {
        headers: {
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0] || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load AdSense settings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    setLoadingPerformance(true);
    try {
      const response = await fetch('/api/admin/adsense/performance?days=30', {
        headers: {
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0] || ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data.data);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setMessage({ type: 'error', text: 'Failed to load performance data' });
    } finally {
      setLoadingPerformance(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/adsense/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0] || ''}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'AdSense settings updated successfully' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update settings' });
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  const handlePlacementStatusChange = async (placementKey, newStatus) => {
    try {
      const response = await fetch('/api/admin/adsense/placement-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0] || ''}`
        },
        body: JSON.stringify({ placementKey, status: newStatus })
      });

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          adPlacements: {
            ...prev.adPlacements,
            [placementKey]: {
              ...prev.adPlacements[placementKey],
              status: newStatus
            }
          }
        }));
        setMessage({ type: 'success', text: `${placementKey} status updated to ${newStatus}` });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update status' });
      }
    } catch (error) {
      console.error('Status update error:', error);
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleAddCustomUnit = async () => {
    if (!newUnit.name.trim()) {
      setMessage({ type: 'error', text: 'Ad unit name is required' });
      return;
    }

    try {
      const response = await fetch('/api/admin/adsense/custom-units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0] || ''}`
        },
        body: JSON.stringify(newUnit)
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({
          ...prev,
          customAdUnits: [...prev.customAdUnits, data.data]
        }));
        setNewUnit({ name: '', adSlot: '', adFormat: 'auto', placement: '', enabled: true });
        setShowNewUnitForm(false);
        setMessage({ type: 'success', text: 'Custom ad unit created successfully' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to create ad unit' });
      }
    } catch (error) {
      console.error('Create unit error:', error);
      setMessage({ type: 'error', text: 'Failed to create ad unit' });
    }
  };

  const handleCustomUnitStatusChange = async (unitId, newStatus) => {
    try {
      const response = await fetch('/api/admin/adsense/custom-units', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0] || ''}`
        },
        body: JSON.stringify({ unitId, status: newStatus })
      });

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          customAdUnits: prev.customAdUnits.map(unit =>
            unit.id === unitId ? { ...unit, status: newStatus } : unit
          )
        }));
        setMessage({ type: 'success', text: `Custom unit status updated to ${newStatus}` });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update status' });
      }
    } catch (error) {
      console.error('Status update error:', error);
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleDeleteCustomUnit = async (unitId) => {
    if (!confirm('Are you sure you want to delete this custom ad unit?')) return;

    try {
      const response = await fetch('/api/admin/adsense/custom-units', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0] || ''}`
        },
        body: JSON.stringify({ unitId })
      });

      if (response.ok) {
        setSettings(prev => ({
          ...prev,
          customAdUnits: prev.customAdUnits.filter(unit => unit.id !== unitId)
        }));
        setMessage({ type: 'success', text: 'Custom ad unit deleted successfully' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to delete unit' });
      }
    } catch (error) {
      console.error('Delete unit error:', error);
      setMessage({ type: 'error', text: 'Failed to delete unit' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'unpublished': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const renderMessage = () => {
    if (!message.text) return null;
    
    return (
      <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${
        message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
        'bg-red-50 text-red-800 border border-red-200'
      }`}>
        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        {message.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading AdSense settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">AdSense Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  settings.globalSettings.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {settings.globalSettings.enabled ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex gap-1 mt-4">
              {[
                { id: 'general', label: 'General', icon: Settings },
                { id: 'placements', label: 'Ad Placements', icon: Globe },
                { id: 'custom', label: 'Custom Units', icon: Plus },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'performance') fetchPerformanceData();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {renderMessage()}

            {/* General Settings Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Publisher ID
                    </label>
                    <input
                      type="text"
                      value={settings.publisherId}
                      onChange={(e) => setSettings(prev => ({ ...prev, publisherId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="pub-1234567890123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ad Client ID
                    </label>
                    <input
                      type="text"
                      value={settings.adClientId}
                      onChange={(e) => setSettings(prev => ({ ...prev, adClientId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ca-pub-1234567890123456"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Global Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries({
                      enabled: 'Enable AdSense',
                      autoAds: 'Auto Ads',
                      adBlockDetection: 'Ad Block Detection',
                      respectDoNotTrack: 'Respect Do Not Track',
                      lazyLoading: 'Lazy Loading',
                      testMode: 'Test Mode'
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.globalSettings[key]}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            globalSettings: {
                              ...prev.globalSettings,
                              [key]: e.target.checked
                            }
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Tracking</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries({
                      trackClicks: 'Track Clicks',
                      trackImpressions: 'Track Impressions',
                      reportingEnabled: 'Enable Reporting'
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.performance[key]}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            performance: {
                              ...prev.performance,
                              [key]: e.target.checked
                            }
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ad Placements Tab */}
            {activeTab === 'placements' && (
              <div className="space-y-6">
                {Object.entries(settings.adPlacements).map(([key, placement]) => (
                  <div key={key} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-medium text-gray-900 capitalize">{key} Placement</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(placement.status)}`}>
                          {placement.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={placement.enabled}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              adPlacements: {
                                ...prev.adPlacements,
                                [key]: {
                                  ...prev.adPlacements[key],
                                  enabled: e.target.checked
                                }
                              }
                            }))}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Enabled</span>
                        </label>
                        <select
                          value={placement.status}
                          onChange={(e) => handlePlacementStatusChange(key, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="unpublished">Unpublished</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad Slot ID</label>
                        <input
                          type="text"
                          value={placement.adSlot}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            adPlacements: {
                              ...prev.adPlacements,
                              [key]: {
                                ...prev.adPlacements[key],
                                adSlot: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad Format</label>
                        <select
                          value={placement.adFormat}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            adPlacements: {
                              ...prev.adPlacements,
                              [key]: {
                                ...prev.adPlacements[key],
                                adFormat: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="auto">Auto</option>
                          <option value="rectangle">Rectangle</option>
                          <option value="horizontal">Horizontal</option>
                          <option value="vertical">Vertical</option>
                          <option value="mobile-banner">Mobile Banner</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Units Tab */}
            {activeTab === 'custom' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Custom Ad Units</h3>
                  <button
                    onClick={() => setShowNewUnitForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom Unit
                  </button>
                </div>

                {showNewUnitForm && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900">New Custom Ad Unit</h4>
                      <button
                        onClick={() => setShowNewUnitForm(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unit Name</label>
                        <input
                          type="text"
                          value={newUnit.name}
                          onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="My Custom Ad Unit"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad Slot ID</label>
                        <input
                          type="text"
                          value={newUnit.adSlot}
                          onChange={(e) => setNewUnit(prev => ({ ...prev, adSlot: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ad Format</label>
                        <select
                          value={newUnit.adFormat}
                          onChange={(e) => setNewUnit(prev => ({ ...prev, adFormat: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="auto">Auto</option>
                          <option value="rectangle">Rectangle</option>
                          <option value="horizontal">Horizontal</option>
                          <option value="vertical">Vertical</option>
                          <option value="mobile-banner">Mobile Banner</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Placement</label>
                        <input
                          type="text"
                          value={newUnit.placement}
                          onChange={(e) => setNewUnit(prev => ({ ...prev, placement: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., article-bottom, sidebar-top"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setShowNewUnitForm(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddCustomUnit}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Create Unit
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {settings.customAdUnits.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No custom ad units created yet</p>
                    </div>
                  ) : (
                    settings.customAdUnits.map((unit) => (
                      <div key={unit.id} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="text-md font-medium text-gray-900">{unit.name}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(unit.status || 'draft')}`}>
                              {unit.status || 'draft'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={unit.status || 'draft'}
                              onChange={(e) => handleCustomUnitStatusChange(unit.id, e.target.value)}
                              className="px-3 py-1 border border-gray-300 rounded text-sm"
                            >
                              <option value="draft">Draft</option>
                              <option value="published">Published</option>
                              <option value="unpublished">Unpublished</option>
                            </select>
                            <button
                              onClick={() => handleDeleteCustomUnit(unit.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Ad Slot:</span> {unit.adSlot || 'Not set'}
                          </div>
                          <div>
                            <span className="font-medium">Format:</span> {unit.adFormat}
                          </div>
                          <div>
                            <span className="font-medium">Placement:</span> {unit.placement || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Total Ad Units: {Object.keys(settings.adPlacements).length + settings.customAdUnits.length}</span>
              <span>Active Placements: {Object.values(settings.adPlacements).filter(p => p.enabled).length}</span>
              <span>Custom Units: {settings.customAdUnits.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettings(prev => ({
                  ...prev,
                  globalSettings: { ...prev.globalSettings, testMode: !prev.globalSettings.testMode }
                }))}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  settings.globalSettings.testMode 
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {settings.globalSettings.testMode ? 'Test Mode ON' : 'Test Mode OFF'}
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}