'use client';

import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, ExternalLink, X } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';

interface Skill {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  triggers: string[];
  sourceUrl?: string;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [showInstall, setShowInstall] = useState(false);
  const [installUrl, setInstallUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await gatewayFetch<Skill[]>('/api/skills');
    if (res.success && res.data) setSkills(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const install = async () => {
    if (!installUrl.trim()) return;
    await gatewayFetch('/api/skills', {
      method: 'POST',
      body: JSON.stringify({ url: installUrl }),
    });
    setInstallUrl('');
    setShowInstall(false);
    load();
  };

  const remove = async (name: string) => {
    await gatewayFetch(`/api/skills/${encodeURIComponent(name)}`, { method: 'DELETE' });
    setSkills(prev => prev.filter(s => s.name !== name));
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Skills</h1>
        <button onClick={() => setShowInstall(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Install Skill
        </button>
      </div>

      {showInstall && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Install from URL</h3>
            <button onClick={() => setShowInstall(false)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
          </div>
          <div className="flex gap-2">
            <input
              type="url"
              value={installUrl}
              onChange={e => setInstallUrl(e.target.value)}
              placeholder="https://example.com/skill.md"
              className="input flex-1"
            />
            <button onClick={install} className="btn-primary">Install</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading...</div>
      ) : skills.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          <Zap size={48} className="mx-auto mb-4 opacity-30" />
          <p>No skills installed</p>
          <p className="text-sm mt-1">Install skills to extend your agent</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skills.map(skill => (
            <div key={skill.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-brand-400" />
                  <h3 className="font-medium">{skill.name}</h3>
                </div>
                <button onClick={() => remove(skill.name)} className="text-gray-500 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-sm text-gray-400 mb-3">{skill.description}</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {skill.triggers.map(t => (
                  <span key={t} className="rounded bg-gray-800 px-2 py-0.5 text-xs text-gray-300">{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>v{skill.version} by {skill.author}</span>
                {skill.sourceUrl && (
                  <a href={skill.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-brand-400 hover:text-brand-300">
                    Source <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
