'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Play, Pause, Trash2, X } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  prompt: string;
  status: string;
  lastRunAt?: string;
  nextRunAt?: string;
}

export default function CronPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [schedule, setSchedule] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await gatewayFetch<CronJob[]>('/api/cron');
    if (res.success && res.data) setJobs(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const addJob = async () => {
    if (!name || !schedule || !prompt) return;
    await gatewayFetch('/api/cron', {
      method: 'POST',
      body: JSON.stringify({ name, schedule, prompt }),
    });
    setName(''); setSchedule(''); setPrompt('');
    setShowAdd(false);
    load();
  };

  const toggleJob = async (job: CronJob) => {
    const newStatus = job.status === 'active' ? 'paused' : 'active';
    await gatewayFetch(`/api/cron/${job.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  };

  const removeJob = async (id: string) => {
    await gatewayFetch(`/api/cron/${id}`, { method: 'DELETE' });
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Cron Jobs</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Job
        </button>
      </div>

      {showAdd && (
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">New Cron Job</h3>
            <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-200"><X size={16} /></button>
          </div>
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Job name" className="input w-full" />
            <input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="Schedule (e.g., */5 * * * *)" className="input w-full" />
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Prompt to run" className="input w-full h-20 resize-none" />
            <button onClick={addJob} className="btn-primary">Create Job</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-20">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          <Clock size={48} className="mx-auto mb-4 opacity-30" />
          <p>No cron jobs</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => (
            <div key={job.id} className="card flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{job.name}</h3>
                  <span className={`text-xs ${job.status === 'active' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {job.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 font-mono">{job.schedule}</p>
                <p className="text-sm text-gray-300 mt-1">{job.prompt.slice(0, 100)}{job.prompt.length > 100 ? '...' : ''}</p>
                {job.nextRunAt && <p className="text-xs text-gray-500 mt-1">Next: {new Date(job.nextRunAt).toLocaleString()}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleJob(job)} className="text-gray-400 hover:text-gray-200">
                  {job.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button onClick={() => removeJob(job.id)} className="text-gray-500 hover:text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
