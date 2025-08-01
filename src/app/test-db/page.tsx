import { pool } from '@/lib/db';

async function testDatabaseConnection() {
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected:', result.rows[0]);
    
    // List all tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    return {
      connected: true,
      time: result.rows[0].now,
      tables: tables.rows.map(r => r.table_name)
    };
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default async function TestDbPage() {
  const dbInfo = await testDatabaseConnection();
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Database Connection Test</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${dbInfo.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{dbInfo.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        {dbInfo.connected && (
          <p className="text-gray-400 mt-2">Server time: {new Date(dbInfo.time).toLocaleString()}</p>
        )}
        {!dbInfo.connected && (
          <p className="text-red-400 mt-2">Error: {dbInfo.error}</p>
        )}
      </div>
      
      {dbInfo.connected && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Available Tables ({dbInfo.tables?.length || 0})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {dbInfo.tables?.map((table) => (
              <div key={table} className="bg-gray-700 px-3 py-2 rounded">
                {table}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}