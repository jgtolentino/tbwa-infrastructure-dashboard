'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Users, DollarSign, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { geoAPI, type ChoroplethResponse, type DotStripResponse } from './api';

// Demo data generator (fallback when API unavailable)
const generateDemoData = () => {
  const regions = [
    'NCR', 'Calabarzon', 'Central Luzon', 'Central Visayas', 'Davao Region',
    'Northern Mindanao', 'Western Visayas', 'Eastern Visayas', 'Bicol Region', 'Ilocos Region'
  ];
  
  const gridSize = 10;
  const features = [];
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const value = Math.random() * 1000000;
      features.push({
        type: 'Feature',
        properties: {
          id: i * gridSize + j,
          province_code: `PH-${i}${j}`,
          province_name: `Province ${i}-${j}`,
          region_name: regions[Math.floor(Math.random() * regions.length)],
          value,
          total_sales: value,
          transaction_count: Math.floor(value / 1000),
          unique_customers: Math.floor(value / 5000),
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [120 + j * 0.5, 20 - i * 0.5],
            [120 + (j + 1) * 0.5, 20 - i * 0.5],
            [120 + (j + 1) * 0.5, 20 - (i + 1) * 0.5],
            [120 + j * 0.5, 20 - (i + 1) * 0.5],
            [120 + j * 0.5, 20 - i * 0.5],
          ]],
        },
      });
    }
  }
  
  return {
    type: 'FeatureCollection',
    features,
    quantiles: [0, 200000, 400000, 600000, 800000, 1000000],
    summary: {
      total_sales: features.reduce((sum, f) => sum + f.properties.total_sales, 0),
      total_transactions: features.reduce((sum, f) => sum + f.properties.transaction_count, 0),
      total_customers: features.reduce((sum, f) => sum + f.properties.unique_customers, 0),
      date_range: { from: '2025-06-01', to: '2025-07-31' },
    },
  };
};

const generateDemoDotStrip = () => {
  const regions = [
    { code: 'NCR', name: 'National Capital Region' },
    { code: 'IV-A', name: 'Calabarzon' },
    { code: 'III', name: 'Central Luzon' },
    { code: 'VII', name: 'Central Visayas' },
    { code: 'XI', name: 'Davao Region' },
  ];
  
  return {
    dotstrip: regions.map((r, i) => ({
      rank: i + 1,
      region_code: r.code,
      region_name: r.name,
      value: (5 - i) * 1000000,
      formatted_value: `₱${(5 - i)}M`,
      percentage: 100 - i * 20,
      color_intensity: 1 - i * 0.2,
    })),
    quantiles: [0, 1000000, 2000000, 3000000, 4000000, 5000000],
    summary: {
      metric: 'sales',
      date_range: { from: '2025-06-01', to: '2025-07-31' },
      total: 15000000,
    },
  };
};

export function GeographicAnalyticsLive() {
  const [selectedMetric, setSelectedMetric] = useState<'sales' | 'transactions' | 'customers'>('sales');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  
  const [choroplethData, setChoroplethData] = useState<ChoroplethResponse | null>(null);
  const [dotStripData, setDotStripData] = useState<DotStripResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [selectedMetric, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [choropleth, dotstrip] = await Promise.all([
        geoAPI.getChoroplethData({
          from: dateRange.from,
          to: dateRange.to,
          metric: selectedMetric,
        }),
        geoAPI.getDotStripData({
          from: dateRange.from,
          to: dateRange.to,
          metric: selectedMetric,
          limit: 10,
        }),
      ]);
      
      setChoroplethData(choropleth);
      setDotStripData(dotstrip);
      setIsDemo(false);
    } catch (err) {
      console.error('Failed to fetch geo data:', err);
      setError('Using demo data - API unavailable');
      
      // Fallback to demo data
      setChoroplethData(generateDemoData() as any);
      setDotStripData(generateDemoDotStrip());
      setIsDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await geoAPI.refreshGeoData();
      await fetchData();
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Color mapping based on quantiles
  const getColor = (value: number, quantiles: number[]) => {
    if (!quantiles || quantiles.length === 0) return '#f3f4f6';
    
    const colors = ['#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626'];
    
    for (let i = quantiles.length - 1; i >= 0; i--) {
      if (value >= quantiles[i]) {
        return colors[Math.min(i, colors.length - 1)];
      }
    }
    return colors[0];
  };

  // Render map (simplified SVG version)
  const renderMap = () => {
    if (!choroplethData) return null;
    
    const { features, quantiles } = choroplethData;
    
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    features.forEach(feature => {
      const coords = feature.geometry.coordinates[0];
      coords.forEach((coord: number[]) => {
        minX = Math.min(minX, coord[0]);
        maxX = Math.max(maxX, coord[0]);
        minY = Math.min(minY, coord[1]);
        maxY = Math.max(maxY, coord[1]);
      });
    });
    
    const width = 800;
    const height = 600;
    const padding = 20;
    
    const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * (width - 2 * padding) + padding;
    const scaleY = (y: number) => height - (((y - minY) / (maxY - minY)) * (height - 2 * padding) + padding);
    
    return (
      <svg width={width} height={height} className="border rounded">
        {features.map((feature, idx) => {
          const pathData = feature.geometry.coordinates[0]
            .map((coord: number[], i: number) => {
              const x = scaleX(coord[0]);
              const y = scaleY(coord[1]);
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ') + ' Z';
          
          return (
            <g key={idx}>
              <path
                d={pathData}
                fill={getColor(feature.properties.value, quantiles)}
                stroke="#e5e7eb"
                strokeWidth="1"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
              <title>
                {feature.properties.province_name}
                {'\n'}Value: {feature.properties.formatted_value || feature.properties.value.toLocaleString()}
              </title>
            </g>
          );
        })}
      </svg>
    );
  };

  // Render dot strip rankings
  const renderDotStrip = () => {
    if (!dotStripData) return null;
    
    return (
      <div className="space-y-2">
        {dotStripData.dotstrip.map((item) => (
          <div key={item.region_code} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
            <div className="w-8 text-center font-semibold text-gray-500">
              {item.rank}
            </div>
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: getColor(item.value, dotStripData.quantiles),
              }}
            />
            <div className="flex-1">
              <div className="font-medium">{item.region_name}</div>
              <div className="text-sm text-gray-500">{item.region_code}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{item.formatted_value}</div>
              <div className="text-sm text-gray-500">{item.percentage.toFixed(1)}%</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const metricIcons = {
    sales: DollarSign,
    transactions: BarChart3,
    customers: Users,
  };

  const MetricIcon = metricIcons[selectedMetric];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Geographic Analytics</h1>
          <p className="text-gray-600 mt-1">
            Philippine regional performance metrics
            {isDemo && <span className="ml-2 text-amber-600 font-medium">(Demo Mode)</span>}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || isDemo}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={selectedMetric} onValueChange={(v: any) => setSelectedMetric(v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales Revenue</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
                <SelectItem value="customers">Unique Customers</SelectItem>
              </SelectContent>
            </Select>
            
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="px-3 py-2 border rounded"
            />
            
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="px-3 py-2 border rounded"
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {choroplethData && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold">
                    ₱{(choroplethData.summary.total_sales / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold">
                    {choroplethData.summary.total_transactions.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Customers</p>
                  <p className="text-2xl font-bold">
                    {choroplethData.summary.total_customers.toLocaleString()}
                  </p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Regional Heat Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                </div>
              ) : error && !isDemo ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full overflow-auto">
                  {renderMap()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Regions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                renderDotStrip()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}