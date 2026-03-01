'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Clock } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';

interface Session {
  id: string;
  channel: string;
  status: string;
  title?: string;
  createdAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await gatewayFetch<Session[]>('/api/sessions');
    if (res.success && res.data) setSessions(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteSession = async (id: string) => {
    await gatewayFetch(`/api/sessions/${id}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Sessions</h1>
        <span className="text-sm text-gray-400">{sessions.length} total</span>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading...</div>
      ) : sessions.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
          <p>No sessions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(session => (
            <div key={session.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MessageSquare size={20} className="text-gray-500" />
                <div>
                  <p className="font-medium">{session.title || session.id.slice(0, 8)}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(session.createdAt).toLocaleString()}</span>
                    <span className="rounded bg-gray-800 px-1.5 py-0.5">{session.channel}</span>
                    <span className={session.status === 'active' ? 'text-green-400' : 'text-gray-500'}>{session.status}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => deleteSession(session.id)} className="text-gray-500 hover:text-red-400">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
