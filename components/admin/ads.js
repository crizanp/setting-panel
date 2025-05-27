import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Play, 
  Image, 
  BarChart3, 
  Calendar,
  Link,
  Upload,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const AdministrationPanel = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    active: '',
    type: ''
  });

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'image',
    src: '',
    srcPublicId: '',
    thumbnailSrc: '',
    thumbnailPublicId: '',
    learnMoreLink: '',
    buttonText: 'Learn More',
    active: true,
    status: 'draft',
    priority: 50,
    displayDuration: 5,
    skipDelay: 5,
    campaignName: '',
    targetAudience: 'general',
    startDate: '',
    expiresAt: '',
    tags: []
  });

  const [message, setMessage] = useState({ type: '', text: '' });

  // Helper function to get auth token
  const getAuthToken = () => {
    // First try localStorage
    const localToken = localStorage.getItem('adminToken');
    if (localToken && localToken !== 'null' && localToken !== null) {
      return localToken;
    }
    
    // Then try cookies
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'token') {
        return value;
      }
    }
    
    return null;
  };

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = getAuthToken();
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  };

  // Load ads on component mount
  useEffect(() => {
    loadAds();
    loadAnalytics();
  }, [currentPage, filters]);

  const loadAds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/admin/ads?${params}`, {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setAds(data.data);
        setTotalPages(data.pagination.pages);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showMessage('error', 'Failed to load advertisements');
      console.error('Load ads error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/ads/analytics?type=campaign-stats', {
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const handleCreateAd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.filter(tag => tag.trim())
        })
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Advertisement created successfully');
        setShowCreateModal(false);
        resetForm();
        loadAds();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to create advertisement');
    }
  };

  const handleUpdateAd = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/ads/${selectedAd._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.filter(tag => tag.trim())
        })
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Advertisement updated successfully');
        setShowEditModal(false);
        resetForm();
        loadAds();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to update advertisement');
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!confirm('Are you sure you want to delete this advertisement?')) return;

    try {
      const response = await fetch(`/api/admin/ads/${adId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', 'Advertisement deleted successfully');
        loadAds();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to delete advertisement');
    }
  };

  const handleToggleStatus = async (adId, currentStatus) => {
    try {
      const response = await fetch('/api/admin/ads/analytics', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action: 'toggle-status',
          adId,
          active: !currentStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        showMessage('success', data.message);
        loadAds();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      showMessage('error', error.message || 'Failed to toggle status');
    }
  };

  const openEditModal = (ad) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title || '',
      description: ad.description || '',
      type: ad.type || 'image',
      src: ad.src || '',
      srcPublicId: ad.srcPublicId || '',
      thumbnailSrc: ad.thumbnailSrc || '',
      thumbnailPublicId: ad.thumbnailPublicId || '',
      learnMoreLink: ad.learnMoreLink || '',
      buttonText: ad.buttonText || 'Learn More',
      active: ad.active !== false,
      status: ad.status || 'draft',
      priority: ad.priority || 50,
      displayDuration: ad.displayDuration || 5,
      skipDelay: ad.skipDelay || 5,
      campaignName: ad.campaignName || '',
      targetAudience: ad.targetAudience || 'general',
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
      expiresAt: ad.expiresAt ? new Date(ad.expiresAt).toISOString().split('T')[0] : '',
      tags: ad.tags || []
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'image',
      src: '',
      srcPublicId: '',
      thumbnailSrc: '',
      thumbnailPublicId: '',
      learnMoreLink: '',
      buttonText: 'Learn More',
      active: true,
      status: 'draft',
      priority: 50,
      displayDuration: 5,
      skipDelay: 5,
      campaignName: '',
      targetAudience: 'general',
      startDate: '',
      expiresAt: '',
      tags: []
    });
    setSelectedAd(null);
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim());
    setFormData({ ...formData, tags });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advertisement Management</h1>
          <p className="text-gray-600">Manage your advertising campaigns and track performance</p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <AlertCircle className="w-5 h-5 mr-2" />}
            {message.text}
          </div>
        )}

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Ads</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.totalAds}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Ads</p>
                  <p className="text-2xl font-bold text-green-600">{analytics.activeAds}</p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Impressions</p>
                  <p className="text-2xl font-bold text-purple-600">{analytics.totalImpressions.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                  <p className="text-2xl font-bold text-orange-600">{analytics.totalClicks.toLocaleString()}</p>
                </div>
                <Link className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        )}

        {/* Controls Bar */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
              </select>
              
              <select
                value={filters.active}
                onChange={(e) => setFilters({...filters, active: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Ads</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>
              
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Ad
            </button>
          </div>
        </div>

        {/* Ads Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4">Preview</th>
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Priority</th>
                  <th className="text-left p-4">Analytics</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading ads...</span>
                      </div>
                    </td>
                  </tr>
                ) : ads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-gray-500">
                      No advertisements found
                    </td>
                  </tr>
                ) : (
                  ads.map((ad) => (
                    <tr key={ad._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                          {ad.type === 'video' ? (
                            <video 
                              src={ad.src} 
                              className="w-full h-full object-cover"
                              muted
                            />
                          ) : (
                            <img 
                              src={ad.src} 
                              alt={ad.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-900">{ad.title}</p>
                          <p className="text-gray-500 text-xs">{ad.campaignName}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          {ad.type === 'video' ? <Play className="w-4 h-4" /> : <Image className="w-4 h-4" />}
                          <span className="capitalize">{ad.type}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            ad.status === 'published' ? 'bg-green-100 text-green-800' :
                            ad.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                            ad.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {ad.status}
                          </span>
                          {ad.active ? (
                            <Eye className="w-4 h-4 text-green-500" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{ad.priority}</span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs">
                          <div>👁 {ad.impressions || 0}</div>
                          <div>🔗 {ad.clicks || 0}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStatus(ad._id, ad.active)}
                            className={`p-1 rounded ${ad.active ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                          >
                            {ad.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEditModal(ad)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t p-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {showCreateModal ? 'Create Advertisement' : 'Edit Advertisement'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={showCreateModal ? handleCreateAd : handleUpdateAd} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Name
                    </label>
                    <input
                      type="text"
                      value={formData.campaignName}
                      onChange={(e) => setFormData({...formData, campaignName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Media Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Media URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.src}
                      onChange={(e) => setFormData({...formData, src: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://example.com/media.jpg"
                    />
                  </div>

                  {formData.type === 'video' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thumbnail URL
                      </label>
                      <input
                        type="url"
                        value={formData.thumbnailSrc}
                        onChange={(e) => setFormData({...formData, thumbnailSrc: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="https://example.com/thumbnail.jpg"
                      />
                    </div>
                  )}

                  {/* Action Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={formData.buttonText}
                      onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Learn More URL
                    </label>
                    <input
                      type="url"
                      value={formData.learnMoreLink}
                      onChange={(e) => setFormData({...formData, learnMoreLink: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="https://example.com"
                    />
                  </div>

                  {/* Display Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Duration (seconds)
                    </label>
                    <input
                      type="number"
                      min="3"
                      max="30"
                      value={formData.displayDuration}
                      onChange={(e) => setFormData({...formData, displayDuration: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Skip Delay (seconds)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="15"
                      value={formData.skipDelay}
                      onChange={(e) => setFormData({...formData, skipDelay: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Campaign Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority (0-100)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>

                  {/* Scheduling */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires At
                    </label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Tags */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags.join(', ')}
                      onChange={(e) => handleTagsChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="marketing, promotion, sale"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Active Advertisement</span>
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {showCreateModal ? 'Create Ad' : 'Update Ad'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdministrationPanel;