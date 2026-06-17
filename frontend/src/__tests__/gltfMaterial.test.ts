import { describe, expect, it } from 'vitest';
import { DoubleSide, FrontSide, Group, Mesh, MeshStandardMaterial } from 'three';

import { normalizeOpaqueCharacterMaterials } from '@/utils/gltfMaterial';

describe('normalizeOpaqueCharacterMaterials', () => {
  it('forces opaque front-facing materials on mesh children', () => {
    const material = new MeshStandardMaterial({
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      side: DoubleSide,
    });
    const mesh = new Mesh(undefined, material);
    const root = new Group();
    root.add(mesh);

    normalizeOpaqueCharacterMaterials(root);

    expect(material.transparent).toBe(false);
    expect(material.opacity).toBe(1);
    expect(material.depthWrite).toBe(true);
    expect(material.side).toBe(FrontSide);
  });
});
