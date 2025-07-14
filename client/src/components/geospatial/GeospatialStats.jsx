import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import Button, { Icons } from '../ui/Button';
import Card from '../ui/Card';

const GeospatialStats = ({ 
  data = [], 
  latColumn, 
  lngColumn, 
  valueColumn,
  categoryColumn,
  className = ''
}) => {
  // Process and analyze geospatial data
  const analysis = useMemo(() => {
    if (!data || !latColumn || !lngColumn) return null;

    const validPoints = data
      .map((row, index) => {
        const lat = parseFloat(row[latColumn]);
        const lng = parseFloat(row[lngColumn]);
        const value = valueColumn ? parseFloat(row[valueColumn]) || 0 : 1;
        const category = categoryColumn ? row[categoryColumn] : 'Default';

        if (isNaN(lat) || isNaN(lng)) return null;

        return { lat, lng, value, category, index };
      })
      .filter(Boolean);

    if (validPoints.length === 0) return null;

    // Basic statistics
    const lats = validPoints.map(p => p.lat);
    const lngs = validPoints.map(p => p.lng);
    const values = validPoints.map(p => p.value);

    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };

    const center = {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2
    };

    const span = {
      lat: bounds.north - bounds.south,
      lng: bounds.east - bounds.west
    };

    // Calculate distances from center
    const distances = validPoints.map(point => {
      return calculateDistance(center.lat, center.lng, point.lat, point.lng);
    });

    // Density analysis (points per square km)
    const area = calculateArea(bounds);
    const density = validPoints.length / area;

    // Category analysis
    const categoryStats = {};
    validPoints.forEach(point => {
      if (!categoryStats[point.category]) {
        categoryStats[point.category] = {
          count: 0,
          totalValue: 0,
          avgLat: 0,
          avgLng: 0,
          points: []
        };
      }
      categoryStats[point.category].count++;
      categoryStats[point.category].totalValue += point.value;
      categoryStats[point.category].points.push(point);
    });

    // Calculate category averages
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.avgValue = stats.totalValue / stats.count;
      stats.avgLat = stats.points.reduce((sum, p) => sum + p.lat, 0) / stats.count;
      stats.avgLng = stats.points.reduce((sum, p) => sum + p.lng, 0) / stats.count;
    });

    // Clustering analysis (simple grid-based)
    const clusters = performGridClustering(validPoints, 0.01); // 0.01 degree grid

    // Outlier detection
    const outliers = detectOutliers(validPoints, center);

    return {
      totalPoints: validPoints.length,
      bounds,
      center,
      span,
      area: area.toFixed(2),
      density: density.toFixed(2),
      distances: {
        min: Math.min(...distances).toFixed(2),
        max: Math.max(...distances).toFixed(2),
        avg: (distances.reduce((sum, d) => sum + d, 0) / distances.length).toFixed(2)
      },
      values: valueColumn ? {
        min: Math.min(...values).toFixed(2),
        max: Math.max(...values).toFixed(2),
        avg: (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(2),
        sum: values.reduce((sum, v) => sum + v, 0).toFixed(2)
      } : null,
      categoryStats,
      clusters,
      outliers
    };
  }, [data, latColumn, lngColumn, valueColumn, categoryColumn]);

  // Haversine distance calculation
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

  // Approximate area calculation
  const calculateArea = (bounds) => {
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    
    // Rough approximation: 1 degree ≈ 111 km
    const latKm = latDiff * 111;
    const lngKm = lngDiff * 111 * Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180);
    
    return Math.abs(latKm * lngKm);
  };

  // Simple grid-based clustering
  const performGridClustering = (points, gridSize) => {
    const clusters = {};
    
    points.forEach(point => {
      const gridLat = Math.floor(point.lat / gridSize) * gridSize;
      const gridLng = Math.floor(point.lng / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;
      
      if (!clusters[key]) {
        clusters[key] = {
          lat: gridLat,
          lng: gridLng,
          count: 0,
          totalValue: 0,
          points: []
        };
      }
      
      clusters[key].count++;
      clusters[key].totalValue += point.value;
      clusters[key].points.push(point);
    });

    return Object.values(clusters).map(cluster => ({
      ...cluster,
      avgValue: cluster.totalValue / cluster.count
    }));
  };

  // Simple outlier detection based on distance from center
  const detectOutliers = (points, center) => {
    const distances = points.map(point => ({
      ...point,
      distance: calculateDistance(center.lat, center.lng, point.lat, point.lng)
    }));

    const avgDistance = distances.reduce((sum, p) => sum + p.distance, 0) / distances.length;
    const threshold = avgDistance * 2; // Points more than 2x average distance

    return distances.filter(point => point.distance > threshold);
  };

  // Prepare chart data
  const categoryChartData = analysis ? Object.entries(analysis.categoryStats).map(([category, stats]) => ({
    category,
    count: stats.count,
    avgValue: stats.avgValue.toFixed(2)
  })) : [];

  const clusterChartData = analysis ? analysis.clusters
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((cluster, index) => ({
      cluster: `Cluster ${index + 1}`,
      count: cluster.count,
      density: (cluster.count / 0.01).toFixed(1) // points per grid cell
    })) : [];

  if (!analysis) {
    return (
      <Card className="p-8 text-center">
        <Icons.BarChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Valid Geographic Data
        </h3>
        <p className="text-gray-600">
          Please ensure your data contains valid latitude and longitude coordinates.
        </p>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{analysis.totalPoints}</div>
          <div className="text-sm text-gray-600">Total Points</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{analysis.area} km²</div>
          <div className="text-sm text-gray-600">Coverage Area</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{analysis.density}</div>
          <div className="text-sm text-gray-600">Points/km²</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{analysis.clusters.length}</div>
          <div className="text-sm text-gray-600">Clusters</div>
        </Card>
      </div>

      {/* Geographic Bounds */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Bounds</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Boundaries</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>North:</span>
                <span>{analysis.bounds.north.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span>South:</span>
                <span>{analysis.bounds.south.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span>East:</span>
                <span>{analysis.bounds.east.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span>West:</span>
                <span>{analysis.bounds.west.toFixed(6)}°</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Center Point</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Latitude:</span>
                <span>{analysis.center.lat.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span>Longitude:</span>
                <span>{analysis.center.lng.toFixed(6)}°</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Span</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Latitude:</span>
                <span>{analysis.span.lat.toFixed(6)}°</span>
              </div>
              <div className="flex justify-between">
                <span>Longitude:</span>
                <span>{analysis.span.lng.toFixed(6)}°</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-700 mb-2">Distance Stats</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Min:</span>
                <span>{analysis.distances.min} km</span>
              </div>
              <div className="flex justify-between">
                <span>Max:</span>
                <span>{analysis.distances.max} km</span>
              </div>
              <div className="flex justify-between">
                <span>Avg:</span>
                <span>{analysis.distances.avg} km</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Value Statistics */}
      {analysis.values && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Value Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analysis.values.min}</div>
              <div className="text-sm text-gray-600">Minimum</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analysis.values.max}</div>
              <div className="text-sm text-gray-600">Maximum</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analysis.values.avg}</div>
              <div className="text-sm text-gray-600">Average</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{analysis.values.sum}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>
        </Card>
      )}

      {/* Category Analysis */}
      {categoryColumn && categoryChartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Cluster Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clusters by Density</h3>
        <div style={{ height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clusterChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="cluster" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Outliers */}
      {analysis.outliers.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Outliers ({analysis.outliers.length} points)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Points that are significantly far from the center of your data distribution.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Index</th>
                  <th className="text-left py-2 px-3">Latitude</th>
                  <th className="text-left py-2 px-3">Longitude</th>
                  <th className="text-left py-2 px-3">Distance from Center</th>
                  {valueColumn && <th className="text-left py-2 px-3">Value</th>}
                </tr>
              </thead>
              <tbody>
                {analysis.outliers.slice(0, 10).map((outlier, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-3">{outlier.index + 1}</td>
                    <td className="py-2 px-3">{outlier.lat.toFixed(6)}</td>
                    <td className="py-2 px-3">{outlier.lng.toFixed(6)}</td>
                    <td className="py-2 px-3">{outlier.distance.toFixed(2)} km</td>
                    {valueColumn && <td className="py-2 px-3">{outlier.value}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Export Options */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900">Export Analysis</h4>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" icon={Icons.Download}>
              Export CSV
            </Button>
            <Button variant="outline" size="sm" icon={Icons.FileText}>
              Export Report
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GeospatialStats;
