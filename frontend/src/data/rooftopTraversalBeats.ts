import { Vector3 } from 'three';

import {
  buildGrayboxRooftopPlatforms,
  ROOFTOP_EYE_OFFSET,
  ROOFTOP_STREET_LAUNCH,
  ROOFTOP_WALLS_APPROACH,
} from '@/data/odmWorldAnchors';
import { buildFlightCorridorPath } from '@/data/flightCorridorPath';
import { ROOFTOP_DISTRICT_LAYOUT } from '@/scenes/graybox/grayboxRooftopDistrict';
import type { OdmAnchor } from '@/types/odmCamera';
import type { RooftopBeat, RooftopBeatWindow, RooftopPlatformSpec } from '@/types/rooftopTraversal';

export { ROOFTOP_EYE_OFFSET, ROOFTOP_STREET_LAUNCH, ROOFTOP_WALLS_APPROACH };

let rooftopPlatformCache: readonly RooftopPlatformSpec[] | undefined;
let rooftopBeatWindowCache: readonly RooftopBeatWindow[] | undefined;

/** Rooftop platforms — hooks and landings aligned to graybox district buildings. */
export function resolveRooftopPlatformSpecs(): readonly RooftopPlatformSpec[] {
  if (!rooftopPlatformCache) {
    rooftopPlatformCache = buildGrayboxRooftopPlatforms(ROOFTOP_DISTRICT_LAYOUT.buildings);
  }

  return rooftopPlatformCache;
}

/** Longer beats — each phase must read clearly while scrolling. */
const BEAT_WEIGHTS: Record<RooftopBeat['kind'], number> = {
  run: 0.08,
  hook: 0.1,
  pull: 0.16,
  swing: 0.18,
  land: 0.07,
  jump: 0.06,
};

/** @deprecated Use resolveRooftopPlatformSpecs — lazy init after graybox district builds. */
export function getRooftopPlatformSpecs(): readonly RooftopPlatformSpec[] {
  return resolveRooftopPlatformSpecs();
}

function pushBeat(
  beats: RooftopBeat[],
  beat: Omit<RooftopBeat, 'weight'> & { weight?: number },
): void {
  beats.push({
    ...beat,
    weight: beat.weight ?? BEAT_WEIGHTS[beat.kind],
  });
}

function pushTransitionBeats(
  beats: RooftopBeat[],
  from: Vector3,
  hook: Vector3,
  apex: Vector3,
  land: Vector3,
  hookSide: RooftopPlatformSpec['outboundHookSide'],
  surfaceY: number,
  platformId: string,
): void {
  pushBeat(beats, {
    kind: 'pull',
    from: from.clone(),
    to: land.clone(),
    hookAnchor: hook.clone(),
    apex: apex.clone(),
    hookSide,
    minY: surfaceY + 0.85,
    platformId,
  });

  pushBeat(beats, {
    kind: 'swing',
    from: from.clone(),
    to: land.clone(),
    hookAnchor: hook.clone(),
    apex: apex.clone(),
    hookSide,
    minY: surfaceY + 1.1,
    platformId,
  });

  pushBeat(beats, {
    kind: 'land',
    from: land.clone(),
    to: land.clone(),
    minY: surfaceY + 0.85,
    platformId,
  });
}

/**
 * Builds the Wit-style rooftop chain per crossing:
 * RUN → HOOK → PULL → SWING → LAND (repeat), then final RUN → JUMP → HOOK → PULL to walls.
 */
export function buildRooftopBeatTimeline(): readonly RooftopBeat[] {
  const beats: RooftopBeat[] = [];
  const platforms = resolveRooftopPlatformSpecs();
  const lastIndex = platforms.length - 1;
  const first = platforms[0];

  if (!first?.streetHook || !first.streetSwingApex) {
    throw new Error('First rooftop platform requires streetHook and streetSwingApex.');
  }

  const streetAir = ROOFTOP_STREET_LAUNCH.clone();
  streetAir.x = -4.5;
  streetAir.y = 2.8;
  streetAir.z = -5;

  pushBeat(beats, {
    kind: 'jump',
    from: ROOFTOP_STREET_LAUNCH.clone(),
    to: streetAir,
    apex: streetAir.clone().setY(5.2),
    minY: ROOFTOP_STREET_LAUNCH.y,
    platformId: first.id,
  });

  pushBeat(beats, {
    kind: 'hook',
    from: streetAir,
    to: streetAir.clone(),
    hookAnchor: first.streetHook.clone(),
    hookSide: first.streetHookSide ?? 'left',
    minY: ROOFTOP_STREET_LAUNCH.y,
    platformId: first.id,
  });

  pushTransitionBeats(
    beats,
    streetAir,
    first.streetHook,
    first.streetSwingApex,
    first.land,
    first.streetHookSide ?? 'left',
    first.surfaceY,
    first.id,
  );

  for (let index = 0; index < lastIndex; index += 1) {
    const platform = platforms[index];
    const next = platforms[index + 1];
    const [runA, runB] = platform.runSteps;

    pushBeat(beats, {
      kind: 'run',
      from: platform.land.clone(),
      to: runB.clone(),
      runSteps: [runA.clone(), runB.clone()],
      minY: platform.surfaceY + 0.85,
      platformId: platform.id,
    });

    pushBeat(beats, {
      kind: 'hook',
      from: runB.clone(),
      to: runB.clone(),
      hookAnchor: platform.outboundHook.clone(),
      hookSide: platform.outboundHookSide,
      minY: platform.surfaceY + 0.85,
      platformId: platform.id,
    });

    pushTransitionBeats(
      beats,
      runB,
      platform.outboundHook,
      platform.outboundSwingApex,
      next.land,
      platform.outboundHookSide,
      next.surfaceY,
      next.id,
    );
  }

  const last = platforms[lastIndex];
  const [lastRunA, lastRunB] = last.runSteps;

  pushBeat(beats, {
    kind: 'run',
    from: last.land.clone(),
    to: lastRunB.clone(),
    runSteps: [lastRunA.clone(), lastRunB.clone()],
    minY: last.surfaceY + 0.85,
    platformId: last.id,
  });

  pushBeat(beats, {
    kind: 'jump',
    from: lastRunB.clone(),
    to: last.jumpOff.clone(),
    apex: last.jumpOff.clone().setY(last.jumpOff.y + 2.8),
    minY: last.surfaceY + 0.7,
    platformId: last.id,
  });

  pushBeat(beats, {
    kind: 'hook',
    from: last.jumpOff.clone(),
    to: last.jumpOff.clone(),
    hookAnchor: last.outboundHook.clone(),
    hookSide: last.outboundHookSide,
    minY: last.surfaceY + 0.7,
    platformId: last.id,
  });

  pushBeat(beats, {
    kind: 'pull',
    from: last.jumpOff.clone(),
    to: ROOFTOP_WALLS_APPROACH.clone(),
    hookAnchor: last.outboundHook.clone(),
    hookSide: last.outboundHookSide,
    minY: last.surfaceY + 2,
    weight: 0.18,
    platformId: last.id,
  });

  return beats;
}

/** Normalizes beat weights into scroll windows on aerial progress [0, 1]. */
export function buildRooftopBeatWindows(): readonly RooftopBeatWindow[] {
  const beats = buildRooftopBeatTimeline();
  const totalWeight = beats.reduce((sum, beat) => sum + beat.weight, 0);
  const windows: RooftopBeatWindow[] = [];
  let cumulative = 0;

  for (const beat of beats) {
    const span = beat.weight / Math.max(totalWeight, 1e-6);
    const start = cumulative;
    cumulative += span;
    windows.push({
      ...beat,
      start,
      end: cumulative,
    });
  }

  if (windows.length > 0) {
    windows[windows.length - 1] = {
      ...windows[windows.length - 1],
      end: 1,
    };
  }

  return windows;
}

/** Anchor positions for debug overlays — not a traversal spline. */
export function buildAerialRooftopPathKeyframes(): Vector3[] {
  const points: Vector3[] = [ROOFTOP_STREET_LAUNCH.clone()];

  for (const platform of resolveRooftopPlatformSpecs()) {
    points.push(platform.land.clone());
    points.push(platform.runSteps[0].clone());
    points.push(platform.runSteps[1].clone());
    points.push(platform.jumpOff.clone());
    points.push(platform.outboundHook.clone());
    points.push(platform.outboundSwingApex.clone());

    if (platform.streetHook) {
      points.push(platform.streetHook.clone());
    }
  }

  points.push(ROOFTOP_WALLS_APPROACH.clone());

  const deduped: Vector3[] = [];

  for (const point of points) {
    const last = deduped[deduped.length - 1];

    if (!last || last.distanceTo(point) > 0.35) {
      deduped.push(point);
    }
  }

  return deduped;
}

/** Sparse spine for graybox flight-corridor clearance — matches rooftop beat landings. */
export function buildRooftopFlightCorridorPath(): Vector3[] {
  return buildFlightCorridorPath();
}

/** Scroll-weighted rooftop beats — lazy init after graybox district builds. */
export function resolveRooftopBeatWindows(): readonly RooftopBeatWindow[] {
  if (!rooftopBeatWindowCache) {
    rooftopBeatWindowCache = buildRooftopBeatWindows();
  }

  return rooftopBeatWindowCache;
}

/** Hook anchors for ODM cable targets and squad offsets. */
export function buildRooftopHookAnchors(): readonly OdmAnchor[] {
  const hooks: OdmAnchor[] = [];
  let hookIndex = 0;

  for (const beat of buildRooftopBeatTimeline()) {
    if (!beat.hookAnchor) {
      continue;
    }

    const duplicate = hooks.some((entry) => entry.position.distanceTo(beat.hookAnchor!) < 0.4);

    if (duplicate) {
      continue;
    }

    hooks.push({
      id: `roof-hook-${hookIndex}`,
      position: beat.hookAnchor.clone(),
      side: beat.hookSide ?? (hookIndex % 2 === 0 ? 'right' : 'left'),
      segmentId: 'rooftops',
    });
    hookIndex += 1;
  }

  return hooks;
}

