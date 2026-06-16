import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const SCENE_IDS = [
  'rooftops',
  'walls-approach',
  'wall-launch',
  'titan-corridor',
  'couple-strike',
];

const root = join(process.cwd(), 'assets/cinematic/scenes');

const json = JSON.stringify({
  asset: { version: '2.0', generator: 'aot-wedding-placeholder' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: 'placeholder-root' }],
});
const jsonBytes = Buffer.from(json);
const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
const jsonChunkLen = jsonBytes.length + jsonPad;
const totalLen = 12 + 8 + jsonChunkLen;
const buffer = Buffer.alloc(totalLen);

let offset = 0;
buffer.writeUInt32LE(0x46546c67, offset);
offset += 4;
buffer.writeUInt32LE(2, offset);
offset += 4;
buffer.writeUInt32LE(totalLen, offset);
offset += 4;
buffer.writeUInt32LE(jsonChunkLen, offset);
offset += 4;
buffer.writeUInt32LE(0x4e4f534a, offset);
offset += 4;
jsonBytes.copy(buffer, offset);
offset += jsonBytes.length;
buffer.fill(0x20, offset, offset + jsonPad);

for (const sceneId of SCENE_IDS) {
  const outDir = join(root, sceneId);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'scene.glb');
  writeFileSync(outPath, buffer);
  console.log(`wrote ${outPath} (${buffer.length} bytes)`);
}
