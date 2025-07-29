'use client'

import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const InfrastructureDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardData, setDashboardData] = useState({
    overview: {
      storage: { buckets: 12, totalSize: '2.4 TB', files: 8432 },
      database: { tables: 45, views: 18, functions: 23, size: '890 GB' },
      activity: { lastHour: 1247, lastDay: 28901, errors: 3 }
    },
    health: {
      rls: { status: 'healthy', policies: 67, coverage: 98.2 },
      storage: { status: 'optimal', security: 'enforced', quota: 76.3 },
      database: { status: 'healthy', connections: 23, maxConnections: 100 },
      backup: { status: 'current', lastBackup: '2 hours ago', retention: '30 days' }
    },
    schemas: [
      { name: 'hr_admin', tables: 8, rows: 15420, size: '245 MB', lastAnalyzed: '1 hour ago' },
      { name: 'financial_ops', tables: 12, rows: 45890, size: '678 MB', lastAnalyzed: '2 hours ago' },
      { name: 'operations', tables: 15, rows: 23456, size: '432 MB', lastAnalyzed: '30 minutes ago' },
      { name: 'corporate', tables: 6, rows: 8901, size: '156 MB', lastAnalyzed: '45 minutes ago' },
      { name: 'creative_insights', tables: 9, rows: 67234, size: '1.2 GB', lastAnalyzed: '15 minutes ago' }
    ],
    storage: [
      { bucket: 'creative-assets', files: 2341, size: '856 GB', public: false, lastModified: '5 min ago' },
      { bucket: 'hr-documents', files: 1456, size: '234 MB', public: false, lastModified: '1 hour ago' },
      { bucket: 'financial-reports', files: 890, size: '456 MB', public: false, lastModified: '30 min ago' },
      { bucket: 'project-files', files: 3245, size: '1.1 TB', public: false, lastModified: '2 min ago' },
      { bucket: 'public-assets', files: 567, size: '123 MB', public: true, lastModified: '15 min ago' }
    ],
    activity: [
      { time: '14:45', operation: 'File Upload', details: 'creative-assets/campaign-2025-q1.psd', user: 'j.tolentino@tbwa.com' },
      { time: '14:42', operation: 'Schema Update', details: 'creative_insights.campaigns - added AI metadata fields', user: 'system' },
      { time: '14:38', operation: 'Policy Update', details: 'Updated RLS for hr_admin.employees', user: 'admin' },
      { time: '14:35', operation: 'Backup Complete', details: 'Automated backup to enterprise storage', user: 'system' },
      { time: '14:30', operation: 'Query Execution', details: 'Cross-schema analytics query completed', user: 'scout-dashboard' }
    ]
  })

  const performanceData = [
    { name: 'hr_admin', queries: 1240, avgTime: 45, errors: 2 },
    { name: 'financial_ops', queries: 890, avgTime: 67, errors: 1 },
    { name: 'operations', queries: 2340, avgTime: 32, errors: 0 },
    { name: 'corporate', queries: 456, avgTime: 23, errors: 0 },
    { name: 'creative_insights', queries: 3450, avgTime: 89, errors: 5 }
  ]

  const storageDistribution = dashboardData.storage.map(bucket => ({
    name: bucket.bucket,
    value: parseFloat(bucket.size.replace(/[^\d.]/g, '')),
    files: bucket.files
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const StatusBadge = ({ status, label }: { status: string; label?: string }) => {
    const colors = {
      healthy: 'tbwa-badge-success',
      optimal: 'tbwa-badge-info',
      current: 'tbwa-badge-info',
      warning: 'tbwa-badge-warning',
      error: 'tbwa-badge-error'
    }
    
    return (
      <span className={`tbwa-badge ${colors[status as keyof typeof colors] || colors.healthy}`}>
        {label || status}
      </span>
    )
  }

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="tbwa-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Storage Usage</h3>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.storage.buckets}</p>
              <p className="text-sm text-gray-600">Buckets • {dashboardData.overview.storage.totalSize}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="tbwa-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Database Stats</h3>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.database.tables}</p>
              <p className="text-sm text-gray-600">Tables • {dashboardData.overview.database.size}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="tbwa-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Activity (24h)</h3>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.overview.activity.lastDay.toLocaleString()}</p>
              <p className="text-sm text-red-600">{dashboardData.overview.activity.errors} errors</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Schema Performance Chart */}
      <div className="tbwa-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schema Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="queries" fill="#3B82F6" name="Queries" />
            <Bar dataKey="avgTime" fill="#10B981" name="Avg Time (ms)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )

  const HealthTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RLS Health */}
        <div className="tbwa-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Row Level Security</h3>
            <StatusBadge status="healthy" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Policies</span>
              <span className="font-medium">{dashboardData.health.rls.policies}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Coverage</span>
              <span className="font-medium">{dashboardData.health.rls.coverage}%</span>
            </div>
          </div>
        </div>

        {/* Storage Security */}
        <div className="tbwa-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Storage Security</h3>
            <StatusBadge status="optimal" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Security Status</span>
              <span className="font-medium">{dashboardData.health.storage.security}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quota Used</span>
              <span className="font-medium">{dashboardData.health.storage.quota}%</span>
            </div>
          </div>
        </div>

        {/* Database Health */}
        <div className="tbwa-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Database Health</h3>
            <StatusBadge status="healthy" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Connections</span>
              <span className="font-medium">{dashboardData.health.database.connections}/{dashboardData.health.database.maxConnections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium capitalize">{dashboardData.health.database.status}</span>
            </div>
          </div>
        </div>

        {/* Backup Status */}
        <div className="tbwa-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Backup Status</h3>
            <StatusBadge status="current" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Last Backup</span>
              <span className="font-medium">{dashboardData.health.backup.lastBackup}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Retention</span>
              <span className="font-medium">{dashboardData.health.backup.retention}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const StorageTab = () => (
    <div className="space-y-6">
      {/* Storage Distribution Chart */}
      <div className="tbwa-card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={storageDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {storageDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-4">
            {dashboardData.storage.map((bucket, index) => (
              <div key={bucket.bucket} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-900">{bucket.bucket}</p>
                    <p className="text-sm text-gray-500">{bucket.files} files • {bucket.size}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={bucket.public ? 'warning' : 'healthy'} label={bucket.public ? 'Public' : 'Private'} />
                  <p className="text-xs text-gray-500 mt-1">{bucket.lastModified}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const SchemaTab = () => (
    <div className="space-y-6">
      <div className="tbwa-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Schema Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schema</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tables</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rows</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Analyzed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.schemas.map((schema) => (
                <tr key={schema.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{schema.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {schema.tables}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {schema.rows.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {schema.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {schema.lastAnalyzed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status="healthy" label="Optimal" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const ActivityTab = () => (
    <div className="space-y-6">
      <div className="tbwa-card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {dashboardData.activity.map((activity, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">{activity.operation}</span>
                    <span className="text-xs text-gray-500">{activity.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                  <p className="text-xs text-gray-500 mt-1">by {activity.user}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', component: OverviewTab },
    { id: 'health', label: 'Health Checks', component: HealthTab },
    { id: 'storage', label: 'Storage Analysis', component: StorageTab },
    { id: 'schema', label: 'Schema Analysis', component: SchemaTab },
    { id: 'activity', label: 'Activity', component: ActivityTab }
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">TBWA Enterprise Infrastructure</h1>
                <p className="text-sm text-gray-500">Project: cxzllzyxwpyptfretryc</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Jake Tolentino</p>
                <p className="text-xs text-gray-500">Creative Intelligence Architect</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActiveComponent />
      </div>
    </div>
  )
}

export default function Page() {
  return <InfrastructureDashboard />
}
