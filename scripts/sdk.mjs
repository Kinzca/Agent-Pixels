import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function resolveSdkDist() {
  const resolved = [process.env.PAPERCLIP_SDK_DIST,
    path.resolve(root, 'node_modules/@paperclipai/plugin-sdk/dist'),
    path.resolve(root, '../../packages/plugins/sdk/dist'),
  ].find(candidate => candidate && existsSync(path.join(candidate, 'index.js')));
  if (!resolved) throw new Error('请将 PAPERCLIP_SDK_DIST 指向正在运行的 Paperclip plugin-sdk/dist；构建与宿主 SDK 必须匹配。');
  return path.resolve(resolved);
}
