#!/usr/bin/env node
// Minimal MCP server for macOS Shortcuts. No shell: execFile only; input via temp file.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

const run = promisify(execFile);
const list = async () =>
  (await run("shortcuts", ["list"])).stdout.split("\n").map(s => s.trim()).filter(Boolean);

const server = new McpServer({ name: "shortcuts", version: "1.0.0" });

server.tool("list_shortcuts", "List the Apple Shortcuts available on this Mac", {}, async () => ({
  content: [{ type: "text", text: (await list()).join("\n") }],
}));

server.tool(
  "run_shortcut",
  "Run an Apple Shortcut by exact name, optionally passing text input; returns its output",
  { name: z.string(), input: z.string().optional() },
  async ({ name, input }) => {
    if (!(await list()).includes(name))
      return { isError: true, content: [{ type: "text", text: `No shortcut named "${name}"` }] };
    const dir = await mkdtemp(join(tmpdir(), "shortcuts-mcp-"));
    try {
      const args = ["run", name, "-o", join(dir, "out")];
      if (input !== undefined) { await writeFile(join(dir, "in.txt"), input); args.push("-i", join(dir, "in.txt")); }
      await run("shortcuts", args, { timeout: 120_000 });
      const out = await readFile(join(dir, "out"), "utf8").catch(() => "");
      return { content: [{ type: "text", text: out || "Shortcut ran (no output)." }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: `Failed: ${e.stderr || e.message}` }] };
    } finally { await rm(dir, { recursive: true, force: true }); }
  }
);

await server.connect(new StdioServerTransport());
