import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

test('MCP client can list and call the local server', async () => {
  const client = new Client({ name: 'liveswapface-smoke-test', version: '0.1.0' });
  const serverFile = fileURLToPath(new URL('./index.js', import.meta.url));
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [serverFile] }));
  try {
    const { tools } = await client.listTools();
    assert.deepEqual(tools.map((tool) => tool.name).sort(), [
      'estimate_session_credits', 'get_official_links', 'read_official_page',
    ]);
    const result = await client.callTool({ name: 'get_official_links', arguments: {} });
    assert.equal(result.isError, undefined);
    assert.match(JSON.stringify(result.content), /https:\/\/liveswapface\.com\/pricing/);
  } finally {
    await client.close();
  }
});
