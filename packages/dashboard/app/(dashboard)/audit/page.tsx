'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Filter } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';

interface ToolExecution {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  output?: string;
  error?: string;
  status: string;
  durationMs: number;
  createdAt: string;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<ToolExecution[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const query = filter ? `?tool=${filter}` : '';
    const res = await gatewayFetch<ToolExecution[]>(`/api/audit${query}`);
    if (res.success && res.data) setEntries(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={14} className="text-green-400" />;
      case 'error': return <XCircle size={14} className="text-red-400" />;
      case 'denied': return <AlertTriangle size={14} className="text-yellow-400" />;
      default: return <Shield size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Audit Log</h1>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="input text-xs">
            <option value="">All tools</option>
            <option value="shell">Shell</option>
            <option value="file_read">File Read</option>
            <option value="file_write">File Write</option>
            <option value="web_fetch">Web Fetch</option>
            <option value="browser_navigate">Browser</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          <Shield size={48} className="mx-auto mb-4 opacity-30" />
          <p>No tool executions logged</p>
        </div>
      ) : (
        <div className="space-y-1">
          {entries.map(entry => (
            <div key={entry.id} className="card py-3 flex items-center gap-4">
              {statusIcon(entry.status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium">{entry.toolName}</span>
                  <span className="text-xs text-gray-500">{entry.durationMs}ms</span>
                </div>
                <p className="truncate text-xs text-gray-400">{JSON.stringify(entry.args)}</p>
                {entry.error && <p className="text-xs text-red-400 mt-1">{entry.error}</p>}
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(entry.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
