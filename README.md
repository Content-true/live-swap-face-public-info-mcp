# LiveSwapFace public information MCP server

A small, read-only [Model Context Protocol](https://modelcontextprotocol.io/) server for the public [LiveSwapFace](https://liveswapface.com/) website. It lets an MCP client read selected official pages, retrieve official links, and estimate credits for a planned browser session using rates fetched from the site at call time.

It **does not** perform face swaps, access a camera, upload photos, sign in, purchase credits, or use a private LiveSwapFace API. It sends no user media or credentials to the website. Use a subject's likeness only with permission.

## Requirements and installation

Node.js 20.18.1 or newer. From this repository:

```sh
npm ci
npm run build
```

Add this server to an MCP client as a local stdio process:

```json
{
  "mcpServers": {
    "liveswapface-public-info": {
      "command": "node",
      "args": ["/absolute/path/to/liveswapface-mcp/dist/index.js"]
    }
  }
}
```

## Tools

- `read_official_page`: read one of `home`, `pricing`, `virtualTryOn`, `terms`, `privacy`, or `contact` from the official domain. Output is limited to 16,000 characters.
- `estimate_session_credits`: estimate credits for a specified effect, model, and duration. It fetches current public rates and refuses to estimate when the rate wording cannot be parsed.
- `get_official_links`: list the fixed official routes used by the server.

The server only fetches allowlisted pages under `https://liveswapface.com/` and times out after 12 seconds. Pricing and features can change; check the product's displayed rate before starting a paid session.

## Develop

```sh
npm run build
npm test
npm run dev
```

Standard output is reserved for MCP messages. This project uses the [official TypeScript MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk).

## License

MIT; see [LICENSE](LICENSE).
