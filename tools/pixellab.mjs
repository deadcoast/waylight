#!/usr/bin/env node
/* pixellab.mjs — WAYLIGHT's line to the PixelLab MCP (https://api.pixellab.ai/mcp).
   Generic JSON-RPC-over-HTTP caller with SSE response parsing. No SDK, no session state.

     node tools/pixellab.mjs tools                       — list tool names
     node tools/pixellab.mjs call <tool> '<json-args>'   — call any tool
     node tools/pixellab.mjs character "<desc>" [name]   — queue a 4-dir standard character (size 48, low top-down)
     node tools/pixellab.mjs get <character_id>          — poll a job, save preview PNG beside this script when done

   Asset flow into the game (the LEDGERLIGHT law: authored, quantized, embedded):
   1. queue via `character`/`call` (async: returns an id; standard ~2-5 min)
   2. `get` until status done — preview PNG lands in tools/out/
   3. quantize to the game's palette bands (tools/quantize.py if present, else by hand)
   4. embed as a rig-texel table or data URI in src/17_render.js — never a hotlink. */
import fs from 'node:fs';
import path from 'node:path';
const KEY = process.env.PIXELLAB_KEY || 'db08ad94-e01e-484b-a24c-3a392761b124';
const URL2 = 'https://api.pixellab.ai/mcp';
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname), 'out');

async function rpc(method, params) {
  const res = await fetch(URL2, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now() % 100000, method, params }),
  });
  const text = await res.text();
  const line = text.split('\n').find(l => l.startsWith('data:'));
  const body = JSON.parse(line ? line.slice(5) : text);
  if (body.error) throw new Error(JSON.stringify(body.error));
  return body.result;
}
const call = (name, args) => rpc('tools/call', { name, arguments: args });

const [, , cmd, ...rest] = process.argv;
if (cmd === 'tools') {
  const r = await rpc('tools/list', {});
  console.log(r.tools.map(t => t.name).join('\n'));
} else if (cmd === 'call') {
  const r = await call(rest[0], rest[1] ? JSON.parse(rest[1]) : {});
  console.log(JSON.stringify(r, null, 1).slice(0, 4000));
} else if (cmd === 'character') {
  const r = await call('create_character', {
    description: rest[0], name: rest[1] || rest[0].slice(0, 24),
    body_type: 'humanoid', mode: 'standard', n_directions: 4, size: 48, view: 'low top-down',
  });
  console.log(JSON.stringify(r.content, null, 1));
} else if (cmd === 'get') {
  const r = await call('get_character', { character_id: rest[0], include_preview: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const c of r.content || []) {
    if (c.type === 'image') { const f = path.join(OUT, `${rest[0]}.png`); fs.writeFileSync(f, Buffer.from(c.data, 'base64')); console.log('saved', f); }
    else console.log((c.text || '').slice(0, 1500));
  }
} else {
  console.log('usage: pixellab.mjs tools | call <tool> <json> | character "<desc>" [name] | get <id>');
}
