import { registerTool } from './registry.js';

// MCP (Model Context Protocol) tool adapter
// Allows connecting to external MCP servers for additional tool capabilities

interface McpServer {
  name: string;
  url: string;
  tools: Array<{ name: string; description: string; parameters?: Record<string, unknown> }>;
}

const connectedServers = new Map<string, McpServer>();

registerTool(
  {
    name: 'mcp_connect',
    description: 'Connect to an MCP server to access its tools',
    parameters: {
      name: { type: 'string', description: 'Name for this MCP connection' },
      url: { type: 'string', description: 'MCP server URL (stdio:// or http://)' },
    },
    requiresApproval: true,
    timeout: 15000,
  },
  async (args) => {
    const name = args.name as string;
    const url = args.url as string;

    // For now, register the server metadata
    // Full MCP protocol implementation would go here
    const server: McpServer = {
      name,
      url,
      tools: [],
    };

    connectedServers.set(name, server);
    return `Connected to MCP server: ${name} at ${url}`;
  }
);

registerTool(
  {
    name: 'mcp_list',
    description: 'List connected MCP servers and their available tools',
    parameters: {},
    requiresApproval: false,
    timeout: 5000,
  },
  async () => {
    if (connectedServers.size === 0) {
      return 'No MCP servers connected';
    }

    const lines: string[] = [];
    for (const [name, server] of connectedServers) {
      lines.push(`${name} (${server.url})`);
      for (const tool of server.tools) {
        lines.push(`  - ${tool.name}: ${tool.description}`);
      }
    }
    return lines.join('\n');
  }
);

export function getConnectedServers(): Map<string, McpServer> {
  return connectedServers;
}
