import React, { useState } from 'react';
import InteractiveMap from '../geospatial/InteractiveMap';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const GeospatialMapTest = () => {
  const [testData, setTestData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sample test data for different scenarios
  const testDataSets = {
    nyc: [
      { name: 'Central Park', latitude: 40.7829, longitude: -73.9654, value: 100, category: 'Park' },
      { name: 'Times Square', latitude: 40.7580, longitude: -73.9855, value: 200, category: 'Tourist' },
      { name: 'Brooklyn Bridge', latitude: 40.7061, longitude: -73.9969, value: 150, category: 'Landmark' },
      { name: 'Statue of Liberty', latitude: 40.6892, longitude: -74.0445, value: 180, category: 'Monument' },
      { name: 'Empire State Building', latitude: 40.7484, longitude: -73.9857, value: 220, category: 'Building' }
    ],
    world: [
      { name: 'New York', latitude: 40.7128, longitude: -74.0060, value: 100, category: 'City' },
      { name: 'London', latitude: 51.5074, longitude: -0.1278, value: 90, category: 'City' },
      { name: 'Tokyo', latitude: 35.6762, longitude: 139.6503, value: 120, category: 'City' },
      { name: 'Sydney', latitude: -33.8688, longitude: 151.2093, value: 80, category: 'City' },
      { name: 'Paris', latitude: 48.8566, longitude: 2.3522, value: 95, category: 'City' }
    ],
    invalid: [
      { name: 'Invalid 1', latitude: 'not a number', longitude: -74.0060, value: 100 },
      { name: 'Invalid 2', latitude: 40.7128, longitude: 'not a number', value: 100 },
      { name: 'Out of Range', latitude: 200, longitude: -74.0060, value: 100 },
      { name: 'Valid Point', latitude: 40.7128, longitude: -74.0060, value: 100 }
    ]
  };

  const loadTestData = async (dataSetKey) => {
    setIsLoading(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setTestData(testDataSets[dataSetKey]);
    setIsLoading(false);
  };

  const clearData = () => {
    setTestData([]);
  };

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🧪 Geospatial Map Test Component
        </h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Test Data Sets</h3>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => loadTestData('nyc')}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Icons.MapPin className="w-4 h-4 mr-2" />
              NYC Landmarks (5 points)
            </Button>
            
            <Button
              onClick={() => loadTestData('world')}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Icons.Globe className="w-4 h-4 mr-2" />
              World Cities (5 points)
            </Button>
            
            <Button
              onClick={() => loadTestData('invalid')}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
            >
              <Icons.AlertTriangle className="w-4 h-4 mr-2" />
              Invalid Data Test
            </Button>
            
            <Button
              onClick={clearData}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <Icons.X className="w-4 h-4 mr-2" />
              Clear Data
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <Icons.Loader className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading test data...</p>
          </div>
        )}

        {testData.length > 0 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Test Data Loaded</h4>
              <div className="text-sm text-blue-700">
                <p>Data Points: {testData.length}</p>
                <p>Sample: {testData[0]?.name} at ({testData[0]?.latitude}, {testData[0]?.longitude})</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Interactive Map Test</h4>
              
              {/* Test with Premium Access */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Premium User Simulation</h5>
                <InteractiveMap
                  data={testData}
                  latColumn="latitude"
                  lngColumn="longitude"
                  valueColumn="value"
                  labelColumn="name"
                  height="400px"
                  interactive={true}
                  allowClustering={true}
                  allowHeatmaps={true}
                  totalDataPoints={testData.length}
                  limitedDataPoints={testData.length}
                  isPremiumLimited={false}
                />
              </div>

              {/* Test with Free User Restrictions */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Free User Simulation</h5>
                <InteractiveMap
                  data={testData.slice(0, 3)} // Limit to 3 points
                  latColumn="latitude"
                  lngColumn="longitude"
                  valueColumn="value"
                  labelColumn="name"
                  height="400px"
                  interactive={false}
                  allowClustering={false}
                  allowHeatmaps={false}
                  totalDataPoints={testData.length}
                  limitedDataPoints={3}
                  isPremiumLimited={true}
                  onUpgrade={() => alert('Upgrade clicked!')}
                />
              </div>
            </div>
          </div>
        )}

        {testData.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <Icons.MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Select a test data set to begin testing the map component</p>
          </div>
        )}
      </Card>

      {/* Debug Information */}
      {testData.length > 0 && (
        <Card className="p-4 bg-gray-50">
          <h4 className="font-semibold text-gray-800 mb-2">Debug Information</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Environment: {import.meta.env.DEV ? 'Development' : 'Production'}</div>
            <div>Leaflet Available: {typeof window !== 'undefined' && window.L ? 'Yes' : 'No'}</div>
            <div>Test Data: {JSON.stringify(testData[0], null, 2)}</div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default GeospatialMapTest;
