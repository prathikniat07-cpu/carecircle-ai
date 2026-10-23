import { Router, Request, Response } from 'express';
import { toolRegistry } from '../tools/registry.js';
import { approvalGate } from '../ai/gate.js';

export const mcpRouter = Router();

// MCP Info
mcpRouter.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'CareCircle-AI-MCP-Server',
    version: '1.0.0',
    protocol_version: '2024-11-05',
    capabilities: {
      tools: {
        listChanged: false,
      },
    },
    transport: 'Streamable HTTP (JSON-RPC 2.0 / SSE)',
    status: 'online',
  });
});

// JSON-RPC 2.0 Handler for tools/list and tools/call
mcpRouter.post('/', async (req: Request, res: Response) => {
  const { jsonrpc, id, method, params } = req.body || {};

  if (jsonrpc !== '2.0') {
    res.status(400).json({
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0"' },
    });
    return;
  }

  try {
    switch (method) {
      // 1. tools/list
      case 'tools/list': {
        const tools = toolRegistry.getAllTools().map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: t.parameters,
        }));

        res.json({
          jsonrpc: '2.0',
          id,
          result: { tools },
        });
        return;
      }

      // 2. tools/call
      case 'tools/call': {
        const { name, arguments: args } = params || {};
        if (!name) {
          res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: tool "name" is required' },
          });
          return;
        }

        const tool = toolRegistry.getTool(name);
        if (!tool) {
          res.status(404).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Tool "${name}" not found in CareCircle allowlist` },
          });
          return;
        }

        const output = await tool.execute(args || {});

        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
              },
            ],
            isError: false,
          },
        });
        return;
      }

      // 3. send_approved_reminder
      case 'tools/execute_approved_action': {
        const { action_id } = params || {};
        if (!action_id) {
          res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'action_id is required' },
          });
          return;
        }

        const result = await approvalGate.confirmPendingAction(action_id);
        res.json({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          },
        });
        return;
      }

      default:
        res.status(404).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method "${method}" not implemented` },
        });
    }
  } catch (err: any) {
    res.status(500).json({
      jsonrpc: '2.0',
      id,
      error: { code: -32603, message: err.message || 'Internal tool execution error' },
    });
  }
});
