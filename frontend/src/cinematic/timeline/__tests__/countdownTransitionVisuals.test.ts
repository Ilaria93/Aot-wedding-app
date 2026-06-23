import { describe, expect, it } from 'vitest';

import { Mesh, Object3D } from 'three';

import { resolveCountdownTransitionVisuals } from '@/cinematic/timeline/countdownTransitionVisuals';
import { sceneHasRenderableMeshes } from '@/scenes/models/sceneGeometry';

describe('resolveCountdownTransitionVisuals', () => {
  it('ramps blackout and countdown across the finale', () => {
    const early = resolveCountdownTransitionVisuals(0.1);
    const mid = resolveCountdownTransitionVisuals(0.45);
    const late = resolveCountdownTransitionVisuals(0.8);

    expect(early.flashOpacity).toBeGreaterThan(0);
    expect(mid.blackoutOpacity).toBeGreaterThan(0);
    expect(mid.countdownOpacity).toBeGreaterThan(0);
    expect(late.countdownOpacity).toBeGreaterThan(0);
    expect(late.showOverlay).toBe(true);
  });

  it('skips flash when reduced motion is enabled', () => {
    const visuals = resolveCountdownTransitionVisuals(0.6, { reduceMotion: true });

    expect(visuals.flashOpacity).toBe(0);
    expect(visuals.metaOpacity).toBeGreaterThan(0);
  });
});

describe('sceneHasRenderableMeshes', () => {
  it('returns false for an empty object graph', () => {
    expect(sceneHasRenderableMeshes(new Object3D())).toBe(false);
  });

  it('returns true when a mesh is present', () => {
    const root = new Object3D();
    root.add(new Mesh());

    expect(sceneHasRenderableMeshes(root)).toBe(true);
  });
});
