'use client';

import { useRouter } from 'next/router'; // Use 'next/navigation' if you're using Next.js 13+ app directory
import { 
  Home, 
  Settings, 
  Wrench, 
  RefreshCw, 
  Layout, 
  Sliders,
  ChevronRight,
  DollarSign,
  BarChart3,
  Users
} from 'lucide-react';

// Card component
const Card = ({ children, className = "", onClick }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md border border-gray-200 ${className} ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow duration-200' : ''}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Settings card component
const SettingsCard = ({ icon: Icon, title, description, onClick }) => {
  return (
    <Card onClick={onClick} className="p-6 hover:border-blue-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </Card>
  );
};

// Stats card component
const StatsCard = ({ icon: Icon, title, value, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600"
  };

  return (
    <Card className="p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
};

export default function Dashboard() {
  const router = useRouter();

  const handleSettingClick = (settingName) => {
    router.push(`/${settingName}`);
  };

  const settingsCards = [
    {
      icon: Home,
      title: "Homepage Settings",
      description: "Configure homepage layout, hero section, and featured content",
      key: "homepage"
    },
    {
      icon: Wrench,
      title: "Tools Page Settings",
      description: "Manage tools display, categories, and tool configurations",
      key: "tools"
    },
    {
      icon: RefreshCw,
      title: "Convert Page Settings",
      description: "Setup conversion tools, formats, and processing options",
      key: "convert"
    },
    {
      icon: Layout,
      title: "Footer Settings",
      description: "Edit footer links, contact information, and social media",
      key: "footer"
    },
    {
      icon: Sliders,
      title: "Default Settings",
      description: "Configure global defaults, system preferences, and general options",
      key: "default"
    },
    {
      icon: DollarSign,
      title: "AdSense Setup",
      description: "Configure Google AdSense integration and ad placements",
      key: "adsense"
    },
    {
      icon: Settings,
      title: "Default Ads",
      description: "Manage default advertisements and fallback ad content",
      key: "defaultads"
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description: "Setup Google Analytics, tracking codes, and performance monitoring",
      key: "analytics"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Settings Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {settingsCards.map((setting) => (
              <SettingsCard
                key={setting.key}
                icon={setting.icon}
                title={setting.title}
                description={setting.description}
                onClick={() => handleSettingClick(setting.key)}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 hover:shadow-lg cursor-pointer transition-shadow duration-200" onClick={() => handleSettingClick("default")}>
              <div className="text-center">
                <Settings className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">System Settings</p>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-lg cursor-pointer transition-shadow duration-200" onClick={() => handleSettingClick("adsense")}>
              <div className="text-center">
                <DollarSign className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Ad Management</p>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-lg cursor-pointer transition-shadow duration-200" onClick={() => handleSettingClick("analytics")}>
              <div className="text-center">
                <BarChart3 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">View Analytics</p>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-lg cursor-pointer transition-shadow duration-200" onClick={() => handleSettingClick("footer")}>
              <div className="text-center">
                <Layout className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Content Manager</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
