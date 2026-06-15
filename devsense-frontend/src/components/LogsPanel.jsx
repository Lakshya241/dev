import { useState, useEffect } from 'react';
import { getLogs } from '../api';

export default function LogsPanel({ projectName }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectName) return;
    
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const data = await getLogs({ project_name: projectName, limit: 50 });
        setLogs(data.logs || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    
    // Refresh logs every 10 seconds
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, [projectName]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'ingestion_started':
        return '📥';
      case 'ingestion_completed':
        return '✅';
      case 'ingestion_failed':
        return '❌';
      case 'query_submitted':
        return '💬';
      case 'query_completed':
        return '✓';
      default:
        return '📝';
    }
  };

  const getActionColor = (action) => {
    if (action.includes('failed')) return 'text-red-400';
    if (action.includes('completed')) return 'text-green-400';
    if (action.includes('started')) return 'text-blue-400';
    return 'text-gray-400';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 h-96 overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-white">Activity Logs</h3>
        {loading && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {logs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No activity logs yet
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className="bg-gray-700 rounded p-3 hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{getActionIcon(log.action)}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className={`font-medium ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(log.timestamp)}
                    </span>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-1 text-sm text-gray-300">
                      {log.details.repo_url && (
                        <div className="truncate">Repo: {log.details.repo_url}</div>
                      )}
                      {log.details.query && (
                        <div className="truncate">Query: {log.details.query}</div>
                      )}
                      {log.details.error && (
                        <div className="text-red-400">Error: {log.details.error}</div>
                      )}
                      {log.details.files_processed && (
                        <div>Files: {log.details.files_processed}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
