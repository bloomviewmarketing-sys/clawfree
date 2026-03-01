'use client';

import { useState, useEffect } from 'react';
import { Brain, Search, Plus, Pin, Trash2, X } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';

interface MemoryEntry {
  id: string;
  type: string;
  content: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('fact');
  const [newTags, setNewTags] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await gatewayFetch<MemoryEntry[]>('/api/memory');
    if (res.success && res.data) setMemories(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSearch = async () => {
    if (!search.trim()) { load(); return; }
    const res = await gatewayFetch<MemoryEntry[]>('/api/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query: search, limit: 20 }),
    });
    if (res.success && res.data) setMemories(res.data);
  };

  const addMemory = async () => {
    if (!newContent.trim()) return;
    await gatewayFetch('/api/memory', {
      method: 'POST',
      body: JSON.stringify({
        content: newContent,
        type: newType,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      }),
    });
    setNewContent('');
    setNewTags('');
    setShowAdd(false);
    load();
  };

  const deleteMemory = async (id: string) => {
    await gatewayFetch(`/api/memory/${id}`, { method: 'DELETE' });
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const togglePin = async (entry: MemoryEntry) => {
    await gatewayFetch(`/api/memory/${entry.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pinned: !entry.pinned }),
    });
    setMemories(prev =>
      prev.map(m => m.id === entry.id ? { ...m, pinned: !m.pinned } : m)
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Memory</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Memory
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search memories..."
          className="input flex-1"
        />
        <button onClick={handleSearch} className="btn-secondary">
          <Search size={16} />
        </button>
      </div>

      {showAdd && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">New Memory</h3>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
          </div>
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="What should the agent remember?"
            className="input w-full mb-3 h-24 resize-none"
          />
          <div className="flex gap-3 mb-3">
            <select value={newType} onChange={e => setNewType(e.target.value)} className="input">
              <option value="fact">Fact</option>
              <option value="preference">Preference</option>
              <option value="procedure">Procedure</option>
              <option value="context">Context</option>
            </select>
            <input
              type="text"
              value={newTags}
              onChange={e => setNewTags(e.target.value)}
              placeholder="Tags (comma-separated)"
              className="input flex-1"
            />
          </div>
          <button onClick={addMemory} className="btn-primary">Save Memory</button>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading...</div>
      ) : memories.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          <Brain size={48} className="mx-auto mb-4 opacity-30" />
          <p>No memories yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {memories.map(entry => (
            <div key={entry.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs">{entry.type}</span>
                    {entry.pinned && <Pin size={12} className="text-yellow-500" />}
                    {entry.tags.map(tag => (
                      <span key={tag} className="text-xs text-gray-500">#{tag}</span>
                    ))}
                  </div>
                  <p className="text-sm">{entry.content}</p>
                  <p className="mt-1 text-xs text-gray-500">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => togglePin(entry)} className={`${entry.pinned ? 'text-yellow-500' : 'text-gray-500'} hover:text-yellow-400`}>
                    <Pin size={14} />
                  </button>
                  <button onClick={() => deleteMemory(entry.id)} className="text-gray-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
