# shortcuts-mcp

Minimal MCP server that lets Claude Code list and run Apple Shortcuts on this Mac via `/usr/bin/shortcuts`.

- `list_shortcuts`: names of every shortcut synced to the Mac
- `run_shortcut(name, input?)`: runs an exact name, optional text input, returns output

No shell (`execFile` only); input goes through a temp file (`shortcuts run -i` takes a path); only names from `shortcuts list` run.

```sh
npm install
claude mcp add --scope user shortcuts -- /opt/homebrew/bin/node ~/code/shortcuts-mcp/index.mjs
```
