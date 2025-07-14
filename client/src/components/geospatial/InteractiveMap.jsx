import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const InteractiveMap = ({ 
  data = [], 
  latColumn, 
  lngColumn, 
  valueColumn,
  labelColumn,
  mapType = 'markers', // 'markers', 'heatmap', 'clusters'
  height = '500px',
  onMapReady,
  className = ''
}) => {
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [mapZoom, setMapZoom] = useState(10);
  const [mapStyle, setMapStyle] = useState('openstreetmap');
  const [showControls, setShowControls] = useState(true);

  // Process and validate geospatial data
  const processedData = useMemo(() => {
    if (!data || !latColumn || !lngColumn) return [];

    return data
      .map((row, index) => {
        const lat = parseFloat(row[latColumn]);
        const lng = parseFloat(row[lngColumn]);
        const value = valueColumn ? parseFloat(row[valueColumn]) || 0 : 1;
        const label = labelColumn ? row[labelColumn] : `Point ${index + 1}`;

        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return null;
        }

        return {
          id: index,
          lat,
          lng,
          value,
          label,
          originalData: row
        };
      })
      .filter(Boolean);
  }, [data, latColumn, lngColumn, valueColumn, labelColumn]);

  // Auto-fit map to data bounds
  useEffect(() => {
    if (processedData.length > 0) {
      const lats = processedData.map(point => point.lat);
      const lngs = processedData.map(point => point.lng);
      
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      
      setMapCenter([centerLat, centerLng]);
      
      // Calculate appropriate zoom level
      const latRange = Math.max(...lats) - Math.min(...lats);
      const lngRange = Math.max(...lngs) - Math.min(...lngs);
      const maxRange = Math.max(latRange, lngRange);
      
      let zoom = 10;
      if (maxRange < 0.01) zoom = 15;
      else if (maxRange < 0.1) zoom = 12;
      else if (maxRange < 1) zoom = 9;
      else if (maxRange < 10) zoom = 6;
      else zoom = 3;
      
      setMapZoom(zoom);
    }
  }, [processedData]);

  // Prepare heatmap data
  const heatmapPoints = useMemo(() => {
    return processedData.map(point => [point.lat, point.lng, point.value]);
  }, [processedData]);

  // Map style configurations
  const mapStyles = {
    openstreetmap: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '© OpenTopoMap'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '© CartoDB'
    }
  };

  // Simple clustering logic - group nearby points
  const clusterPoints = (points, distance = 0.01) => {
    const clusters = [];
    const processed = new Set();

    points.forEach((point, index) => {
      if (processed.has(index)) return;

      const cluster = {
        center: point,
        points: [point],
        count: 1
      };

      // Find nearby points
      points.forEach((otherPoint, otherIndex) => {
        if (otherIndex === index || processed.has(otherIndex)) return;

        const dist = Math.sqrt(
          Math.pow(point.lat - otherPoint.lat, 2) +
          Math.pow(point.lng - otherPoint.lng, 2)
        );

        if (dist < distance) {
          cluster.points.push(otherPoint);
          cluster.count++;
          processed.add(otherIndex);
        }
      });

      processed.add(index);
      clusters.push(cluster);
    });

    return clusters;
  };

  // Simple heatmap using circles
  const renderHeatmapCircles = () => {
    if (mapType !== 'heatmap' || processedData.length === 0) return null;

    const maxValue = Math.max(...processedData.map(p => p.value));

    return processedData.map((point, index) => {
      const intensity = point.value / maxValue;
      const radius = 50 + (intensity * 100); // 50-150 pixel radius
      const opacity = 0.3 + (intensity * 0.4); // 0.3-0.7 opacity

      // Color based on intensity
      const color = intensity > 0.7 ? '#ff0000' :
                   intensity > 0.4 ? '#ff8800' :
                   intensity > 0.2 ? '#ffff00' : '#00ff00';

      return (
        <Circle
          key={`heatmap-${index}`}
          center={[point.lat, point.lng]}
          radius={radius}
          pathOptions={{
            color: color,
            fillColor: color,
            fillOpacity: opacity,
            weight: 1
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-gray-900">{point.label}</h3>
              <p className="text-sm text-gray-600">Value: {point.value}</p>
              <div className="mt-2 text-xs text-gray-500">
                <p>Lat: {point.lat.toFixed(6)}</p>
                <p>Lng: {point.lng.toFixed(6)}</p>
              </div>
            </div>
          </Popup>
        </Circle>
      );
    });
  };

  const MapController = () => {
    const map = useMap();

    useEffect(() => {
      if (onMapReady) {
        onMapReady(map);
      }
    }, [map]);

    return null;
  };

  const renderMarkers = () => {
    if (mapType === 'clusters') {
      // Use simple clustering
      const clusters = clusterPoints(processedData, 0.01);

      return clusters.map((cluster, index) => {
        if (cluster.count === 1) {
          // Single point
          const point = cluster.points[0];
          return (
            <Marker key={`cluster-${index}`} position={[point.lat, point.lng]}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">{point.label}</h3>
                  {valueColumn && (
                    <p className="text-sm text-gray-600">
                      {valueColumn}: {point.value}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Lat: {point.lat.toFixed(6)}</p>
                    <p>Lng: {point.lng.toFixed(6)}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        } else {
          // Cluster marker
          const center = cluster.center;
          return (
            <Marker
              key={`cluster-${index}`}
              position={[center.lat, center.lng]}
              icon={L.divIcon({
                html: `<div style="background: #3B82F6; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${cluster.count}</div>`,
                className: 'custom-cluster-icon',
                iconSize: [30, 30]
              })}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-gray-900">Cluster of {cluster.count} points</h3>
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Center: {center.lat.toFixed(6)}, {center.lng.toFixed(6)}</p>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-sm font-medium">Points in cluster:</h4>
                    <ul className="text-xs text-gray-600 max-h-32 overflow-y-auto">
                      {cluster.points.slice(0, 10).map((point, i) => (
                        <li key={i}>• {point.label}</li>
                      ))}
                      {cluster.points.length > 10 && (
                        <li>... and {cluster.points.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        }
      });
    }

    if (mapType === 'markers') {
      return processedData.map(point => (
        <Marker key={point.id} position={[point.lat, point.lng]}>
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-gray-900">{point.label}</h3>
              {valueColumn && (
                <p className="text-sm text-gray-600">
                  {valueColumn}: {point.value}
                </p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                <p>Lat: {point.lat.toFixed(6)}</p>
                <p>Lng: {point.lng.toFixed(6)}</p>
              </div>
            </div>
          </Popup>
        </Marker>
      ));
    }

    return null;
  };

  // Remove this function since we're using renderHeatmapCircles instead

  if (!latColumn || !lngColumn) {
    return (
      <Card className="p-8 text-center">
        <Icons.MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Configure Map Columns
        </h3>
        <p className="text-gray-600">
          Please select latitude and longitude columns to display the map.
        </p>
      </Card>
    );
  }

  if (processedData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Icons.AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Valid Geographic Data
        </h3>
        <p className="text-gray-600">
          No valid latitude/longitude coordinates found in the selected columns.
        </p>
      </Card>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-[1000] space-y-2">
          <Card className="p-2">
            <div className="flex flex-col space-y-2">
              {/* Map Type Toggle */}
              <div className="flex space-x-1">
                <Button
                  size="xs"
                  variant={mapType === 'markers' ? 'default' : 'outline'}
                  onClick={() => setMapType('markers')}
                  title="Show individual markers"
                >
                  <Icons.MapPin className="w-3 h-3" />
                </Button>
                <Button
                  size="xs"
                  variant={mapType === 'clusters' ? 'default' : 'outline'}
                  onClick={() => setMapType('clusters')}
                  title="Show clustered markers"
                >
                  <Icons.Grid className="w-3 h-3" />
                </Button>
                <Button
                  size="xs"
                  variant={mapType === 'heatmap' ? 'default' : 'outline'}
                  onClick={() => setMapType('heatmap')}
                  title="Show heatmap"
                >
                  <Icons.Thermometer className="w-3 h-3" />
                </Button>
              </div>

              {/* Map Style Selector */}
              <select
                value={mapStyle}
                onChange={(e) => setMapStyle(e.target.value)}
                className="text-xs border rounded px-2 py-1"
              >
                <option value="openstreetmap">Street Map</option>
                <option value="satellite">Satellite</option>
                <option value="terrain">Terrain</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </Card>
        </div>
      )}

      {/* Map Container */}
      <div style={{ height }} className="rounded-lg overflow-hidden border">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapController />
          
          <TileLayer
            url={mapStyles[mapStyle].url}
            attribution={mapStyles[mapStyle].attribution}
          />

          {renderMarkers()}
          {renderHeatmapCircles()}
        </MapContainer>
      </div>

      {/* Map Statistics */}
      <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
        <span>{processedData.length} data points displayed</span>
        <span>
          Center: {mapCenter[0].toFixed(4)}, {mapCenter[1].toFixed(4)}
        </span>
      </div>
    </div>
  );
};

export default InteractiveMap;
