/* pl.mjs — thin PixelLab caller used by the asset pass (JSON-RPC over HTTP, SSE-parsed). */
import fs from 'node:fs';
const KEY = process.env.PIXELLAB_KEY || 'db08ad94-e01e-484b-a24c-3a392761b124';
export async function rpc(method, params) {
  const res = await fetch('https://api.pixellab.ai/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', Authorization: `Bearer ${KEY}` }, body: JSON.stringify({ jsonrpc: '2.0', id: Date.now() % 100000, method, params }) });
  const text = await res.text();
  const line = text.split('\n').find(l => l.startsWith('data:'));
  const body = JSON.parse(line ? line.slice(5) : text);
  if (body.error) throw new Error(JSON.stringify(body.error));
  return body.result;
}
export const call = (name, args) => rpc('tools/call', { name, arguments: args });
export const text = r => (r.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
if (process.argv[1] && process.argv[1].endsWith('pl.mjs')) {
  const [, , cmd, ...rest] = process.argv;
  if (cmd === 'call') { const r = await call(rest[0], rest[1] ? JSON.parse(rest[1]) : {}); console.log(text(r).slice(0, 6000)); for (const c of r.content || []) if (c.type === 'image' && rest[2]) { fs.writeFileSync(rest[2], Buffer.from(c.data, 'base64')); console.log('saved', rest[2]); } }
}
