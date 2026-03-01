'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { gatewayFetch } from '@/lib/gateway';

export default function SettingsPage() {
  const [soulMd, setSoulMd] = useState('');
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    // Load SOUL.md content (would come from gateway or Supabase)
    setSoulMd(`---
name: My Agent
---

## Identity
You are a helpful AI assistant powered by ClawFree.

## Instructions
Help the user with their tasks. Be clear, concise, and thorough.

## Constraints
- Never share sensitive information
- Always verify before making destructive changes
- Ask for clarification when requirements are unclear

## Tools
- shell
- file_read
- file_write
- web_fetch
- web_search
`);

    gatewayFetch('/health').then(res => {
      if (res.success) setHealth(res.data as Record<string, unknown>);
    });
  }, []);

  const saveSoulMd = async () => {
    setSaving(true);
    // In production, save to Supabase profile or gateway
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
  };

  return (
    <div className="p-6">
      <h1 className="mb-6 text-xl font-bold">Settings</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">SOUL.md Editor</h2>
            <button onClick={saveSoulMd} className="btn-primary flex items-center gap-2" disabled={saving}>
              <Save size={14} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
          <textarea
            value={soulMd}
            onChange={e => setSoulMd(e.target.value)}
            className="input w-full h-96 font-mono text-sm resize-none"
          />
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-4 font-medium">Gateway Status</h2>
            {health ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="text-green-400">{String(health.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Version</span>
                  <span>{String(health.version)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime</span>
                  <span>{Math.floor(Number(health.uptime) / 60)}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Sessions</span>
                  <span>{String(health.activeSessions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Supabase</span>
                  <span className={health.supabaseConnected ? 'text-green-400' : 'text-gray-500'}>
                    {health.supabaseConnected ? 'Connected' : 'Not configured'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Unable to connect to gateway</p>
            )}
          </div>

          <div className="card">
            <h2 className="mb-4 font-medium">Channels</h2>
            <div className="space-y-3">
              {['Web UI', 'CLI', 'Telegram', 'Slack', 'Discord'].map(channel => (
                <div key={channel} className="flex items-center justify-between">
                  <span className="text-sm">{channel}</span>
                  <span className={`text-xs ${channel === 'Web UI' || channel === 'CLI' ? 'text-green-400' : 'text-gray-500'}`}>
                    {channel === 'Web UI' || channel === 'CLI' ? 'Active' : 'Not configured'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
