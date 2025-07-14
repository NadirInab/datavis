import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const RouteAnalysis = ({ 
  data = [], 
  latColumn, 
  lngColumn, 
  timestampColumn,
  labelColumn,
  className = ''
}) => {
  const [selectedRoute, setSelectedRoute] = useState(0);
  const [showWaypoints, setShowWaypoints] = useState(true);
  const [showDirections, setShowDirections] = useState(false);
  const [routeMetrics, setRouteMetrics] = useState({});

  // Process route data
  const routeData = useMemo(() => {
    if (!data || !latColumn || !lngColumn) return [];

    // Sort by timestamp if available
    let sortedData = [...data];
    if (timestampColumn) {
      sortedData.sort((a, b) => {
        const dateA = new Date(a[timestampColumn]);
        const dateB = new Date(b[timestampColumn]);
        return dateA - dateB;
      });
    }

    // Convert to route points
    const points = sortedData
      .map((row, index) => {
        const lat = parseFloat(row[latColumn]);
        const lng = parseFloat(row[lngColumn]);
        
        if (isNaN(lat) || isNaN(lng)) return null;
        
        return {
          id: index,
          lat,
          lng,
          timestamp: timestampColumn ? new Date(row[timestampColumn]) : null,
          label: labelColumn ? row[labelColumn] : `Point ${index + 1}`,
          originalData: row
        };
      })
      .filter(Boolean);

    // Group into routes (for now, treat all as one route)
    // In future, could split by gaps in time or distance
    return [points];
  }, [data, latColumn, lngColumn, timestampColumn, labelColumn]);

  // Calculate route metrics
  useEffect(() => {
    if (routeData.length > 0 && routeData[selectedRoute]) {
      const route = routeData[selectedRoute];
      const metrics = calculateRouteMetrics(route);
      setRouteMetrics(metrics);
    }
  }, [routeData, selectedRoute]);

  const calculateRouteMetrics = (route) => {
    if (route.length < 2) {
      return {
        totalDistance: 0,
        totalTime: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        waypoints: route.length
      };
    }

    let totalDistance = 0;
    let maxSpeed = 0;
    const speeds = [];

    for (let i = 1; i < route.length; i++) {
      const prev = route[i - 1];
      const curr = route[i];
      
      // Calculate distance using Haversine formula
      const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      totalDistance += distance;

      // Calculate speed if timestamps are available
      if (prev.timestamp && curr.timestamp) {
        const timeDiff = (curr.timestamp - prev.timestamp) / 1000 / 3600; // hours
        if (timeDiff > 0) {
          const speed = distance / timeDiff; // km/h
          speeds.push(speed);
          maxSpeed = Math.max(maxSpeed, speed);
        }
      }
    }

    const totalTime = route.length > 1 && route[0].timestamp && route[route.length - 1].timestamp
      ? (route[route.length - 1].timestamp - route[0].timestamp) / 1000 / 3600 // hours
      : 0;

    const averageSpeed = speeds.length > 0 
      ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length 
      : 0;

    return {
      totalDistance: totalDistance.toFixed(2),
      totalTime: totalTime.toFixed(2),
      averageSpeed: averageSpeed.toFixed(2),
      maxSpeed: maxSpeed.toFixed(2),
      waypoints: route.length,
      speeds
    };
  };

  // Haversine formula for distance calculation
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get map bounds for the selected route
  const getMapBounds = () => {
    if (!routeData[selectedRoute] || routeData[selectedRoute].length === 0) {
      return [[40.7128, -74.0060], [40.7128, -74.0060]]; // Default to NYC
    }

    const route = routeData[selectedRoute];
    const lats = route.map(point => point.lat);
    const lngs = route.map(point => point.lng);

    return [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ];
  };

  // Create custom icons for start/end points
  const startIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const endIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  if (routeData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Icons.Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Route Data Available
        </h3>
        <p className="text-gray-600">
          Please ensure your data contains valid latitude and longitude coordinates.
        </p>
      </Card>
    );
  }

  const currentRoute = routeData[selectedRoute] || [];
  const bounds = getMapBounds();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Route Controls */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {routeData.length > 1 && (
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Route:</label>
                <select
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(parseInt(e.target.value))}
                  className="border rounded px-3 py-1 text-sm"
                >
                  {routeData.map((_, index) => (
                    <option key={index} value={index}>Route {index + 1}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showWaypoints"
                checked={showWaypoints}
                onChange={(e) => setShowWaypoints(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showWaypoints" className="text-sm text-gray-700">
                Show Waypoints
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showDirections"
                checked={showDirections}
                onChange={(e) => setShowDirections(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="showDirections" className="text-sm text-gray-700">
                Show Directions
              </label>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={Icons.Download}
            onClick={() => {/* Export route data */}}
          >
            Export Route
          </Button>
        </div>
      </Card>

      {/* Route Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{routeMetrics.waypoints || 0}</div>
          <div className="text-sm text-gray-600">Waypoints</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{routeMetrics.totalDistance || 0} km</div>
          <div className="text-sm text-gray-600">Total Distance</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{routeMetrics.totalTime || 0} h</div>
          <div className="text-sm text-gray-600">Total Time</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{routeMetrics.averageSpeed || 0} km/h</div>
          <div className="text-sm text-gray-600">Avg Speed</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{routeMetrics.maxSpeed || 0} km/h</div>
          <div className="text-sm text-gray-600">Max Speed</div>
        </Card>
      </div>

      {/* Route Map */}
      <Card className="p-4">
        <div style={{ height: '500px' }} className="rounded-lg overflow-hidden">
          <MapContainer
            bounds={bounds}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />

            {/* Route Line */}
            {currentRoute.length > 1 && (
              <Polyline
                positions={currentRoute.map(point => [point.lat, point.lng])}
                color="blue"
                weight={3}
                opacity={0.7}
              />
            )}

            {/* Start Point */}
            {currentRoute.length > 0 && (
              <Marker position={[currentRoute[0].lat, currentRoute[0].lng]} icon={startIcon}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-green-700">Start Point</h3>
                    <p className="text-sm">{currentRoute[0].label}</p>
                    {currentRoute[0].timestamp && (
                      <p className="text-xs text-gray-500">
                        {currentRoute[0].timestamp.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* End Point */}
            {currentRoute.length > 1 && (
              <Marker 
                position={[currentRoute[currentRoute.length - 1].lat, currentRoute[currentRoute.length - 1].lng]} 
                icon={endIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-red-700">End Point</h3>
                    <p className="text-sm">{currentRoute[currentRoute.length - 1].label}</p>
                    {currentRoute[currentRoute.length - 1].timestamp && (
                      <p className="text-xs text-gray-500">
                        {currentRoute[currentRoute.length - 1].timestamp.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Waypoints */}
            {showWaypoints && currentRoute.slice(1, -1).map((point, index) => (
              <Marker key={point.id} position={[point.lat, point.lng]}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900">Waypoint {index + 2}</h3>
                    <p className="text-sm">{point.label}</p>
                    {point.timestamp && (
                      <p className="text-xs text-gray-500">
                        {point.timestamp.toLocaleString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>

      {/* Speed Analysis */}
      {routeMetrics.speeds && routeMetrics.speeds.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Speed Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Speed Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>0-20 km/h:</span>
                  <span>{routeMetrics.speeds.filter(s => s <= 20).length} segments</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>20-50 km/h:</span>
                  <span>{routeMetrics.speeds.filter(s => s > 20 && s <= 50).length} segments</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>50+ km/h:</span>
                  <span>{routeMetrics.speeds.filter(s => s > 50).length} segments</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Speed Statistics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Median Speed:</span>
                  <span>
                    {routeMetrics.speeds.length > 0 
                      ? routeMetrics.speeds.sort((a, b) => a - b)[Math.floor(routeMetrics.speeds.length / 2)].toFixed(2)
                      : 0
                    } km/h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Min Speed:</span>
                  <span>{Math.min(...routeMetrics.speeds).toFixed(2)} km/h</span>
                </div>
                <div className="flex justify-between">
                  <span>Segments:</span>
                  <span>{routeMetrics.speeds.length}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-700 mb-2">Route Efficiency</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Moving Time:</span>
                  <span>{routeMetrics.totalTime} hours</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Pace:</span>
                  <span>
                    {routeMetrics.averageSpeed > 0 
                      ? (60 / parseFloat(routeMetrics.averageSpeed)).toFixed(1) 
                      : 0
                    } min/km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Efficiency:</span>
                  <span className="text-green-600">Good</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default RouteAnalysis;
