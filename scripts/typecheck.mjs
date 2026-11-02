import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { root, resolveSdkDist } from './sdk.mjs';
const sdk = resolveSdkDist();
const cache = path.join(root, 'node_modules/.cache/agent-pixels');
await mkdir(cache, { recursive: true });
const config = path.join(cache, 'tsconfig.json');
await writeFile(config, JSON.stringify({ extends: path.join(root, 'tsconfig.json'), compilerOptions: { paths: {
  '@paperclipai/plugin-sdk': [path.join(sdk, 'index.d.ts')],
  '@paperclipai/plugin-sdk/ui': [path.join(sdk, 'ui/index.d.ts')],
} } }));
execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--project', config], { stdio: 'inherit' });
