'use client';

import { useState, useEffect } from 'react';

interface DbInfo {
  connected: boolean;
  time?: string;
  tables?: string[];
  error?: string;
}

export default function TestDbPage() {
  const [dbInfo, setDbInfo] = useState<DbInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setDbInfo(data);
    } catch (error) {
      setDbInfo({
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Testing database connection...</p>
        </div>
      </div>
    );
  }

  if (!dbInfo) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <p className="text-red-400">Failed to load database information</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Database Connection Test</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${dbInfo.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{dbInfo.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {dbInfo.connected && dbInfo.time && (
          <p className="text-gray-400 mt-2">Server time: {new Date(dbInfo.time).toLocaleString()}</p>
        )}
        {!dbInfo.connected && (
          <p className="text-red-400 mt-2">Error: {dbInfo.error}</p>
        )}
      </div>
      
      {dbInfo.connected && dbInfo.tables && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Available Tables ({dbInfo.tables.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {dbInfo.tables.map((table) => (
              <div key={table} className="bg-gray-700 px-3 py-2 rounded">
                {table}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={testDatabaseConnection}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium"
        >
          Test Again
        </button>
      </div>
    </div>
  );
}