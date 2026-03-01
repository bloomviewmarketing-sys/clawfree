import {
  Server,
  DollarSign,
  Brain,
  Zap,
  MessageSquare,
  Code2,
  Terminal,
  Copy,
  ArrowRight,
  Github,
  ExternalLink,
  Check,
  ChevronRight,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Copy button — the only client island on this page                 */
/* ------------------------------------------------------------------ */
function CopyButton({ text }: { text: string }) {
  return (
    <button
      data-copy={text}
      className="copy-btn group relative flex items-center justify-center rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-700/50 hover:text-gray-300"
      aria-label={`Copy: ${text}`}
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
const FEATURES = [
  {
    icon: Server,
    title: 'Runs Locally',
    description:
      'Your agent runs on your machine. Full access to filesystem, shell, and browser. No cloud required.',
  },
  {
    icon: DollarSign,
    title: 'Zero API Cost',
    description:
      'Uses Claude CLI under the hood. Powered by your existing Claude subscription. No tokens to buy.',
  },
  {
    icon: Brain,
    title: 'Persistent Memory',
    description:
      'Your agent remembers across conversations. Local markdown files + optional Supabase cloud sync.',
  },
  {
    icon: Zap,
    title: '13,000+ Skills',
    description:
      'Compatible with ClawHub marketplace. Install community-built skills in one command.',
  },
  {
    icon: MessageSquare,
    title: 'Multi-Channel',
    description:
      'Chat via web dashboard, terminal, Telegram, Slack, or Discord. Your agent, everywhere.',
  },
  {
    icon: Code2,
    title: 'Fully Open Source',
    description:
      'MIT licensed. Fork it, extend it, make it yours. No vendor lock-in.',
  },
] as const;

const STEPS = [
  {
    step: '01',
    title: 'Install',
    command: 'npm install -g clawfree',
    description: 'One command. Works on macOS, Linux, and Windows.',
  },
  {
    step: '02',
    title: 'Start',
    command: 'clawfree start',
    description:
      'Boots your gateway on localhost:4000 and opens the dashboard.',
  },
  {
    step: '03',
    title: 'Chat',
    command: null,
    description:
      'Talk to your agent via the dashboard, terminal, or your favorite messaging app.',
  },
] as const;

const INSTALL_LINES = [
  'npm install -g clawfree',
  'clawfree start',
  '# Dashboard opens at http://localhost:3000',
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function LandingPage() {
  return (
    <>
      {/* ---------- copy-to-clipboard inline script ---------- */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('click', function(e) {
              var btn = e.target.closest('[data-copy]');
              if (!btn) return;
              var text = btn.getAttribute('data-copy');
              navigator.clipboard.writeText(text).then(function() {
                btn.classList.add('copied');
                setTimeout(function() { btn.classList.remove('copied'); }, 1500);
              });
            });
          `,
        }}
      />

      {/* ---------- inline styles for copy feedback + grid bg ---------- */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .copy-btn.copied svg { display: none; }
            .copy-btn.copied::after {
              content: '\\2713';
              font-size: 13px;
              color: #4ade80;
            }
            .grid-bg {
              background-image:
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
              background-size: 64px 64px;
            }
            .hero-glow {
              background: radial-gradient(ellipse 600px 400px at 50% 0%, rgba(0,108,219,0.15), transparent);
            }
            .feature-card {
              transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
            }
            .feature-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 30px -12px rgba(0,108,219,0.15);
            }
            .terminal-bar::before {
              content: '';
              display: inline-flex;
              width: 12px; height: 12px;
              border-radius: 50%;
              background: #ef4444;
              margin-right: 6px;
              box-shadow: 18px 0 0 #eab308, 36px 0 0 #22c55e;
            }
            @media (prefers-reduced-motion: reduce) {
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
          `,
        }}
      />

      <div className="relative min-h-dvh overflow-x-hidden bg-gray-950 grid-bg">
        {/* ==================== NAV ==================== */}
        <nav className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-lg">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-lg shadow-brand-600/20">
                CF
              </span>
              <span className="text-lg font-semibold tracking-tight text-white">
                ClawFree
              </span>
            </a>

            {/* Links */}
            <div className="hidden items-center gap-8 sm:flex">
              <a
                href="#features"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Features
              </a>
              <a
                href="#install"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                Install
              </a>
              <a
                href="https://github.com/bloomviewmarketing-sys/clawfree"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 transition-colors hover:text-white"
              >
                GitHub
              </a>
            </div>

            {/* CTA */}
            <a
              href="#install"
              className="btn-primary hidden text-sm sm:inline-flex items-center gap-1.5"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </nav>

        {/* ==================== HERO ==================== */}
        <section className="relative">
          {/* Gradient glow */}
          <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[600px] animate-glow" />

          <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-28 text-center sm:pt-36 sm:pb-32">
            {/* Badge */}
            <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900/60 px-4 py-1.5 text-xs text-gray-400 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse-subtle" />
              Open source &middot; MIT licensed
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up-delay-1 text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Your AI agent that
              <br />
              <span className="bg-gradient-to-r from-brand-400 via-brand-300 to-brand-500 bg-clip-text text-transparent">
                actually does things.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="animate-fade-in-up-delay-2 mx-auto mt-6 max-w-xl text-lg text-gray-400 sm:text-xl">
              Open-source. Runs on your machine. Powered by Claude.{' '}
              <span className="text-gray-300">Zero API costs.</span>
            </p>

            {/* Install command block */}
            <div className="animate-fade-in-up-delay-3 mx-auto mt-10 max-w-md">
              <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900/70 backdrop-blur">
                <div className="terminal-bar flex items-center border-b border-gray-800/60 px-4 py-2.5">
                  <span className="ml-14 text-xs text-gray-500 select-none">
                    terminal
                  </span>
                </div>
                <div className="space-y-0 px-5 py-4 font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="text-brand-400 select-none">$ </span>
                      <span className="text-gray-200">
                        npm install -g clawfree
                      </span>
                    </span>
                    <CopyButton text="npm install -g clawfree" />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>
                      <span className="text-brand-400 select-none">$ </span>
                      <span className="text-gray-200">clawfree start</span>
                    </span>
                    <CopyButton text="clawfree start" />
                  </div>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="animate-fade-in-up-delay-4 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#install"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-base"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/bloomviewmarketing-sys/clawfree"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-base"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </a>
            </div>
          </div>
        </section>

        {/* ==================== FEATURES ==================== */}
        <section id="features" className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-6">
            {/* Section header */}
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-brand-400">
                Features
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything you need.
                <br className="hidden sm:block" />
                Nothing you don&apos;t.
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                ClawFree gives you a powerful AI agent without the complexity,
                cost, or cloud dependency.
              </p>
            </div>

            {/* Grid */}
            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`feature-card group rounded-xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm animate-fade-in-up-delay-${
                    i < 3 ? i + 1 : i - 2
                  }`}
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/10 text-brand-400 ring-1 ring-brand-500/20 transition-colors group-hover:bg-brand-600/20">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">
                    {f.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== HOW IT WORKS ==================== */}
        <section className="relative border-t border-gray-800/50 py-24 sm:py-32">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-brand-400">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Three commands. That&apos;s it.
              </h2>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.step} className="relative text-center sm:text-left">
                  {/* Connector line (between cards, desktop only) */}
                  {i < STEPS.length - 1 && (
                    <div className="absolute right-0 top-8 hidden h-px w-8 translate-x-full bg-gradient-to-r from-gray-700 to-transparent sm:block" />
                  )}

                  <span className="text-xs font-bold uppercase tracking-widest text-brand-500/60">
                    Step {s.step}
                  </span>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {s.title}
                  </h3>

                  {s.command && (
                    <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900/60 px-3.5 py-2 font-mono text-sm text-gray-300 sm:mx-0">
                      <Terminal className="h-3.5 w-3.5 text-gray-500" />
                      {s.command}
                    </div>
                  )}

                  <p className="mt-3 text-sm leading-relaxed text-gray-400">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== INSTALL ==================== */}
        <section
          id="install"
          className="relative border-t border-gray-800/50 py-24 sm:py-32"
        >
          {/* Subtle glow */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-brand-600/5 to-transparent" />

          <div className="relative mx-auto max-w-2xl px-6">
            <div className="mx-auto max-w-xl text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-brand-400">
                Get Started
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Up and running in seconds.
              </h2>
              <p className="mt-4 text-gray-400">
                Install ClawFree globally, start the agent, and open your
                dashboard. It really is that simple.
              </p>
            </div>

            {/* Terminal card */}
            <div className="mt-12 overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/70 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="terminal-bar flex items-center border-b border-gray-800/60 px-4 py-3">
                <span className="ml-14 text-xs text-gray-500 select-none">
                  terminal
                </span>
              </div>
              <div className="space-y-3 px-6 py-5 font-mono text-sm">
                {INSTALL_LINES.map((line) => {
                  const isComment = line.startsWith('#');
                  return (
                    <div
                      key={line}
                      className="flex items-center justify-between"
                    >
                      <span>
                        {!isComment && (
                          <span className="text-brand-400 select-none">
                            ${' '}
                          </span>
                        )}
                        <span
                          className={
                            isComment ? 'text-gray-600' : 'text-gray-200'
                          }
                        >
                          {isComment ? line : line}
                        </span>
                      </span>
                      {!isComment && <CopyButton text={line} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* After install note */}
            <p className="mt-6 text-center text-sm text-gray-500">
              Requires{' '}
              <span className="text-gray-400">Node.js 18+</span> and a{' '}
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 transition-colors"
              >
                Claude
              </a>{' '}
              subscription.
            </p>
          </div>
        </section>

        {/* ==================== FOOTER ==================== */}
        <footer className="border-t border-gray-800/50 bg-gray-950">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-6 py-12 sm:flex-row sm:justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                CF
              </span>
              <span className="text-sm font-semibold text-white">
                ClawFree
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a
                href="https://github.com/bloomviewmarketing-sys/clawfree"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gray-300"
              >
                GitHub
              </a>
              <a
                href="https://github.com/bloomviewmarketing-sys/clawfree#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gray-300"
              >
                Documentation
              </a>
              <a
                href="#features"
                className="transition-colors hover:text-gray-300"
              >
                ClawHub
              </a>
            </div>

            {/* Built with + license */}
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span>Built with Claude</span>
              <span className="rounded-md border border-gray-800 px-2 py-0.5 text-gray-500">
                MIT
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
