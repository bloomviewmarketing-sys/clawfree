export const DEFAULT_SOUL_MD = `# ClawFree Agent

You are a helpful AI assistant powered by Claude.

## Capabilities
- Answer questions and have conversations
- Execute tasks using available tools
- Remember context across sessions
- Run scheduled jobs

## Guidelines
- Be concise and helpful
- Ask for clarification when needed
- Use tools when they would help accomplish the task
- Respect user preferences and boundaries
`;

export const DEFAULT_ENV_TEMPLATE = (options: {
  port: number;
  mode: 'cli' | 'api';
  apiKey?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}) => {
  const lines = [
    '# ClawFree Configuration',
    `GATEWAY_PORT=${options.port}`,
    'GATEWAY_HOST=0.0.0.0',
    '',
    '# Claude Mode: "cli" (uses Claude CLI, zero API cost) or "api" (uses Anthropic API)',
    `CLAUDE_MODE=${options.mode}`,
  ];

  if (options.mode === 'api' && options.apiKey) {
    lines.push(`ANTHROPIC_API_KEY=${options.apiKey}`);
  }

  if (options.supabaseUrl) {
    lines.push('', '# Supabase (optional — enables cloud sync)');
    lines.push(`SUPABASE_URL=${options.supabaseUrl}`);
    lines.push(`SUPABASE_ANON_KEY=${options.supabaseAnonKey || ''}`);
  }

  lines.push('');
  return lines.join('\n');
};
