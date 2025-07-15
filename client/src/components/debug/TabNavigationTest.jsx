import React, { useState } from 'react';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const TabNavigationTest = () => {
  const [activeTab, setActiveTab] = useState('setup');

  const tabs = [
    { id: 'setup', name: 'Setup', icon: Icons.Settings, description: 'Configure data columns' },
    { id: 'map', name: 'Interactive Map', icon: Icons.MapPin, description: 'View data on map' },
    { id: 'routes', name: 'Route Analysis', icon: Icons.Route, description: 'Analyze GPS routes' },
    { id: 'stats', name: 'Statistics', icon: Icons.BarChart, description: 'Geographic insights' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'setup':
        return (
          <Card className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Tab Content</h3>
            <p className="text-gray-600">This is the setup tab content. Column mapping would go here.</p>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700">✅ Setup tab is working correctly!</p>
            </div>
          </Card>
        );
      
      case 'map':
        return (
          <Card className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Map Tab Content</h3>
            <p className="text-gray-600">This is the map tab content. Interactive map would go here.</p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-700">✅ Map tab is working correctly!</p>
            </div>
          </Card>
        );
      
      case 'routes':
        return (
          <Card className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Routes Tab Content</h3>
            <p className="text-gray-600">This is the routes tab content. Route analysis would go here.</p>
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded">
              <p className="text-purple-700">✅ Routes tab is working correctly!</p>
            </div>
          </Card>
        );
      
      case 'stats':
        return (
          <Card className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stats Tab Content</h3>
            <p className="text-gray-600">This is the stats tab content. Geographic statistics would go here.</p>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-700">✅ Stats tab is working correctly!</p>
            </div>
          </Card>
        );
      
      default:
        return (
          <Card className="p-8">
            <h3 className="text-lg font-semibold text-red-900 mb-4">Unknown Tab</h3>
            <p className="text-red-600">Tab "{activeTab}" not found!</p>
          </Card>
        );
    }
  };

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🧪 Tab Navigation Test
        </h2>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This component tests the basic tab navigation functionality to isolate any issues.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Current State</h4>
            <div className="text-sm text-blue-700">
              <p>Active Tab: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{activeTab}</span></p>
              <p>Total Tabs: {tabs.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    console.log('Tab clicked:', tab.id);
                    setActiveTab(tab.id);
                  }}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className={`
                    -ml-0.5 mr-2 h-5 w-5
                    ${isActive
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                    }
                  `} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {renderTabContent()}
        </div>

        {/* Debug Information */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">Debug Information</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>React Version: {React.version}</div>
            <div>Environment: {import.meta.env.DEV ? 'Development' : 'Production'}</div>
            <div>Tabs Available: {tabs.map(t => t.id).join(', ')}</div>
            <div>Active Tab: {activeTab}</div>
          </div>
        </div>

        {/* Test All Tabs Button */}
        <div className="mt-4">
          <Button
            onClick={() => {
              tabs.forEach((tab, index) => {
                setTimeout(() => {
                  console.log('Auto-switching to tab:', tab.id);
                  setActiveTab(tab.id);
                }, index * 1000);
              });
            }}
            variant="outline"
            size="sm"
          >
            <Icons.Play className="w-4 h-4 mr-2" />
            Test All Tabs (Auto-switch)
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TabNavigationTest;
