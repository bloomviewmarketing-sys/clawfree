# ClawFree

**Open-source AI agent platform powered by Claude CLI. Zero API cost.**

ClawFree is a local-first AI agent platform that uses your existing Claude subscription (via the CLI) instead of API tokens. It includes a gateway runtime, web dashboard, CLI tool, and optional cloud sync via Supabase.

## Features

- **Zero API Cost** — Uses Claude CLI (`claude -p`) with your existing subscription
- **Local-First** — Gateway runs on your machine, accessing your filesystem and shell
- **Web Dashboard** — Real-time chat, session history, memory management, skills marketplace
- **CLI Tool** — `clawfree chat`, `clawfree run`, `clawfree status`
- **Persistent Memory** — Local markdown files with optional Supabase cloud sync
- **Skills System** — Install/create SKILL.md files (compatible with 13K+ ClawHub skills)
- **Cron Scheduler** — Schedule recurring agent tasks
- **Tool Sandbox** — Permission model, audit logging, command safety checks
- **Multi-Channel** — Web, CLI, Telegram, Slack, Discord
- **Full Observability** — Tool execution audit log, daily metrics, analytics dashboard

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Claude CLI installed and authenticated (`claude --version`)

### Install

```bash
git clone https://github.com/yourusername/clawfree.git
cd clawfree
pnpm install
```

### Configure

```bash
cp .env.example .env
# Edit .env with your settings (Supabase is optional)
```

### Run

```bash
# Start the gateway (port 4000)
pnpm dev:gateway

# In another terminal, start the dashboard (port 3000)
pnpm dev:dashboard
```

### CLI Usage

```bash
# Check gateway status
npx clawfree status

# Interactive chat
npx clawfree chat

# Single prompt
npx clawfree run "Summarize the latest HackerNews posts"

# Manage skills
npx clawfree skill list
npx clawfree skill install https://example.com/skill.md

# Manage cron jobs
npx clawfree cron list
npx clawfree cron add -n "daily-digest" -s "0 9 * * *" -p "Give me a morning briefing"

# Manage memory
npx clawfree memory add "User prefers TypeScript" --type preference
npx clawfree memory search "TypeScript"
```

## Architecture

```
┌──────────────┐     ┌──────────────────────────────────────┐
│   Dashboard   │────▶│            Gateway (:4000)            │
│   (:3000)     │ WS  │                                      │
└──────────────┘     │  ┌─────────┐  ┌──────────┐           │
                     │  │  Agent   │  │  Tools   │           │
┌──────────────┐     │  │  Loop    │  │ Registry │           │
│     CLI      │────▶│  └────┬────┘  └──────────┘           │
└──────────────┘ HTTP │       │                               │
                     │  ┌────▼────┐  ┌──────────┐           │
┌──────────────┐     │  │ Claude  │  │  Memory  │           │
│  Telegram /  │────▶│  │  CLI    │  │ Manager  │           │
│  Slack /     │     │  │ Runner  │  └──────────┘           │
│  Discord     │     │  └─────────┘                          │
└──────────────┘     └──────────────┬───────────────────────┘
                                    │ (optional)
                              ┌─────▼─────┐
                              │  Supabase  │
                              │  (cloud)   │
                              └───────────┘
```

### Packages

| Package | Description |
|---------|-------------|
| `@clawfree/shared` | TypeScript types, Zod schemas, utilities |
| `@clawfree/gateway` | Core runtime — Fastify server, agent loop, Claude runner |
| `@clawfree/dashboard` | Next.js 14 web dashboard |
| `@clawfree/cli` | Command-line interface |

### How It Works

1. **User sends message** (via dashboard, CLI, or bot)
2. **Gateway builds context** — loads SOUL.md, retrieves relevant memories, checks active skills
3. **Claude CLI processes** — spawns `claude -p "prompt" --output-format stream-json`
4. **Tools execute** — Claude's tool calls are handled by the tool registry
5. **Response streams back** — via WebSocket (dashboard) or HTTP (CLI/bots)
6. **Session persists** — messages stored locally and optionally synced to Supabase

### SOUL.md

Your agent's personality and instructions live in `workspace/SOUL.md`:

```markdown
---
name: My Agent
---

## Identity
You are a helpful assistant...

## Instructions
Help users with their tasks...

## Constraints
- Never share sensitive information
- Ask before destructive operations

## Tools
- shell
- file_read
- web_fetch
```

### SKILL.md

Skills extend your agent's capabilities:

```markdown
---
name: Summarize URL
description: Summarize any web page
version: 1.0.0
author: You
---

## Triggers
- summarize this url
- tldr this page

## Instructions
1. Fetch the URL
2. Extract key points
3. Provide a concise summary

## Tools
- web_fetch
```

## Supabase Setup (Optional)

ClawFree works fully offline. To enable cloud sync and the authenticated dashboard:

1. Create a Supabase project
2. Run the migrations:
   ```bash
   supabase db push
   ```
3. Add your credentials to `.env`:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```

## Development

```bash
# Build all packages
pnpm build

# Type check
pnpm typecheck

# Run tests
pnpm test

# Dev mode (gateway)
pnpm dev:gateway

# Dev mode (dashboard)
pnpm dev:dashboard
```

## License

MIT
