import { FrontSide, type Material, type Mesh, type Object3D } from 'three';

function normalizeMaterial(material: Material): void {
  material.transparent = false;
  material.opacity = 1;
  material.depthWrite = true;
  material.depthTest = true;
  material.side = FrontSide;
  material.needsUpdate = true;

  if ('alphaTest' in material && typeof material.alphaTest === 'number') {
    material.alphaTest = 0;
  }

  if ('transmission' in material && typeof material.transmission === 'number') {
    material.transmission = 0;
  }
}

/**
 * Forces exported GLTF character meshes to render as solid opaque surfaces.
 * Meshy/Blender exports often mark skinned meshes transparent or double-sided,
 * which breaks depth sorting when animated limbs overlap the torso.
 */
export function normalizeOpaqueCharacterMaterials(root: Object3D): void {
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh || !mesh.material) {
      return;
    }

    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) {
        normalizeMaterial(material);
      }
      return;
    }

    normalizeMaterial(mesh.material);
  });
}
