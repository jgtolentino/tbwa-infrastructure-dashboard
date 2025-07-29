'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface DatabaseSummary {
  total_schemas: number;
  total_tables: number;
  total_size: string;
  scout_tables: number;
  other_schemas: any[];
}

interface HealthCheck {
  database_connected: boolean;
  scout_schema_exists: boolean;
  tables_status: any;
  last_check: string;
}

interface StorageReport {
  total_database_size: string;
  scout_schema_size: string;
  largest_tables: any[];
  storage_by_schema: any[];
}

interface SchemaAnalysis {
  schema_name: string;
  tables: any[];
  indexes: any[];
  constraints: any[];
}

export default function InfrastructurePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbSummary, setDbSummary] = useState<DatabaseSummary | null>(null);
  const [healthCheck, setHealthCheck] = useState<HealthCheck | null>(null);
  const [storageReport, setStorageReport] = useState<StorageReport | null>(null);
  const [schemaAnalysis, setSchemaAnalysis] = useState<SchemaAnalysis | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Loading data for tab: ${activeTab}`);
      
      switch (activeTab) {
        case 'overview':
          await loadOverview();
          break;
        case 'health':
          await loadHealthCheck();
          break;
        case 'storage':
          await loadStorageReport();
          break;
        case 'schema':
          await loadSchemaAnalysis();
          break;
      }
      
      console.log(`Successfully loaded data for tab: ${activeTab}`);
    } catch (err) {
      console.error(`Error loading data for tab ${activeTab}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadOverview = async () => {
    console.log('Calling get_database_summary...');
    const { data, error } = await supabase.rpc('get_database_summary');
    console.log('get_database_summary response:', { data, error });
    if (error) throw error;
    // Functions return arrays, get the first element
    setDbSummary(Array.isArray(data) && data.length > 0 ? data[0] : null);
  };

  const loadHealthCheck = async () => {
    const { data, error } = await supabase.rpc('check_scout_schema_status');
    if (error) throw error;
    
    // Get the first element from the array response
    const result = Array.isArray(data) && data.length > 0 ? data[0] : null;
    
    setHealthCheck({
      database_connected: true,
      scout_schema_exists: result?.schema_exists || false,
      tables_status: {
        table_count: result?.table_count || 0,
        tables: result?.tables || []
      },
      last_check: new Date().toISOString()
    });
  };

  const loadStorageReport = async () => {
    const { data, error } = await supabase.rpc('get_storage_report');
    if (error) throw error;
    // Functions return arrays, get the first element
    setStorageReport(Array.isArray(data) && data.length > 0 ? data[0] : null);
  };

  const loadSchemaAnalysis = async () => {
    const { data, error } = await supabase.rpc('analyze_scout_schema');
    if (error) throw error;
    // Functions return arrays, get the first element
    setSchemaAnalysis(Array.isArray(data) && data.length > 0 ? data[0] : null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Infrastructure Dashboard</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'health', 'storage', 'schema'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm capitalize
                  ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Error: {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && dbSummary && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-700">Total Schemas</h3>
                      <p className="text-2xl font-bold text-blue-900">{dbSummary.total_schemas}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-700">Total Tables</h3>
                      <p className="text-2xl font-bold text-green-900">{dbSummary.total_tables}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-purple-700">Database Size</h3>
                      <p className="text-2xl font-bold text-purple-900">{dbSummary.total_size}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-yellow-700">Scout Tables</h3>
                      <p className="text-2xl font-bold text-yellow-900">{dbSummary.scout_tables}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Schemas Overview</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Schema
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tables
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Size
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dbSummary.other_schemas?.map((schema: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {schema.schema_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {schema.table_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {schema.size || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Health Check Tab */}
              {activeTab === 'health' && healthCheck && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-4 rounded-lg ${healthCheck.database_connected ? 'bg-green-50' : 'bg-red-50'}`}>
                      <h3 className="text-sm font-medium text-gray-700">Database Connection</h3>
                      <p className={`text-xl font-bold ${healthCheck.database_connected ? 'text-green-700' : 'text-red-700'}`}>
                        {healthCheck.database_connected ? 'Connected' : 'Disconnected'}
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${healthCheck.scout_schema_exists ? 'bg-green-50' : 'bg-red-50'}`}>
                      <h3 className="text-sm font-medium text-gray-700">Scout Schema</h3>
                      <p className={`text-xl font-bold ${healthCheck.scout_schema_exists ? 'text-green-700' : 'text-red-700'}`}>
                        {healthCheck.scout_schema_exists ? 'Healthy' : 'Missing'}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50">
                      <h3 className="text-sm font-medium text-gray-700">Scout Tables</h3>
                      <p className="text-xl font-bold text-blue-700">
                        {healthCheck.tables_status?.table_count || 0}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Last Check</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(healthCheck.last_check).toLocaleString()}
                    </p>
                  </div>

                  {healthCheck.tables_status?.tables && healthCheck.tables_status.tables.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Scout Tables Found</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {healthCheck.tables_status.tables.map((table: any, idx: number) => (
                          <div key={idx} className="bg-white p-2 rounded border border-gray-200 text-sm">
                            {table.table_name || table}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Storage Report Tab */}
              {activeTab === 'storage' && storageReport && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-blue-700">Total Database Size</h3>
                      <p className="text-2xl font-bold text-blue-900">{storageReport.total_database_size}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-green-700">Scout Schema Size</h3>
                      <p className="text-2xl font-bold text-green-900">{storageReport.scout_schema_size}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Largest Tables</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Table
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Size
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rows
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {storageReport.largest_tables?.map((table: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {table.table_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {table.total_size}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {table.row_count?.toLocaleString() || '0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Schema Analysis Tab */}
              {activeTab === 'schema' && schemaAnalysis && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Scout Schema Analysis</h3>
                  
                  <div>
                    <h4 className="text-md font-medium mb-3">Tables</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Table
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Columns
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Rows
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {schemaAnalysis.tables?.map((table: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {table.table_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {table.column_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {table.row_count?.toLocaleString() || '0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}