import { describe, expect, it } from 'vitest';

import { Vector3 } from 'three';

import {
  resolveRooftopBeatWindows,
  resolveRooftopPlatformSpecs,
  ROOFTOP_STREET_LAUNCH,
  buildRooftopBeatTimeline,
} from '@/data/rooftopTraversalBeats';
import {
  findActiveRooftopBeat,
  resolvePullEndBesideFacade,
  resolveRooftopTraversalPose,
} from '@/cinematic/camera/rooftopBeatMotion';
import { mapGlobalProgressToAerialOdm, resolveHeroCameraPose } from '@/cinematic/camera/openingCameraMotion';
import {
  OPERATION_RAVENNA_GROUND_SPRINT_END,
  OPERATION_RAVENNA_ROOFTOPS_END,
} from '@/constants/operationRavennaOpening';

describe('rooftopBeatMotion', () => {
  const pose = {
    position: new Vector3(),
    target: new Vector3(),
    roll: 0,
    fov: 60,
    phase: 'pull' as const,
    beatKind: 'run' as const,
  };

  it('builds the Wit-style ODM cycle per rooftop', () => {
    const beats = buildRooftopBeatTimeline();
    const kinds = beats.map((beat) => beat.kind);

    expect(kinds[0]).toBe('jump');
    expect(kinds[1]).toBe('hook');
    expect(kinds).toContain('pull');
    expect(kinds).toContain('run');
    expect(kinds).toContain('jump');
    expect(kinds).toContain('swing');
    expect(kinds).toContain('land');
    expect(kinds).toContain('hook');
    expect(beats.length).toBeGreaterThan(resolveRooftopPlatformSpecs().length * 4);
  });

  it('repeats RUN → HOOK → PULL → SWING → LAND on each rooftop crossing', () => {
    const beats = buildRooftopBeatTimeline();
    const firstRunIndex = beats.findIndex(
      (beat) => beat.kind === 'run' && beat.platformId === resolveRooftopPlatformSpecs()[0]?.id,
    );
    const crossing = beats.slice(firstRunIndex, firstRunIndex + 5).map((beat) => beat.kind);

    expect(crossing).toEqual(['run', 'hook', 'pull', 'swing', 'land']);
  });

  it('covers aerial progress without gaps', () => {
    const beatWindows = resolveRooftopBeatWindows();
    expect(beatWindows[0]?.start).toBe(0);
    expect(beatWindows[beatWindows.length - 1]?.end).toBe(1);

    for (let index = 1; index < beatWindows.length; index += 1) {
      const previous = beatWindows[index - 1];
      const current = beatWindows[index];
      expect(current.start).toBeCloseTo(previous.end, 5);
    }
  });

  it('keeps run beats above rooftop surfaces', () => {
    for (const beat of resolveRooftopBeatWindows()) {
      if (beat.kind !== 'run') {
        continue;
      }

      resolveRooftopTraversalPose(beat.start + 0.001, pose);
      expect(pose.position.y).toBeGreaterThanOrEqual(beat.minY - 0.01);
      expect(pose.beatKind).toBe('run');
    }
  });

  it('assigns a hook anchor to every hook and pull beat', () => {
    for (const beat of resolveRooftopBeatWindows()) {
      if (beat.kind !== 'hook' && beat.kind !== 'pull') {
        continue;
      }

      expect(beat.hookAnchor).toBeDefined();
    }
  });

  it('gives hook, pull and swing beats enough scroll time to read', () => {
    const readableKinds = new Set(['hook', 'pull', 'swing']);
    const readableSpans = resolveRooftopBeatWindows().filter((beat) => readableKinds.has(beat.kind)).map(
      (beat) => beat.end - beat.start,
    );

    expect(Math.min(...readableSpans)).toBeGreaterThanOrEqual(0.035);
  });

  it('maps rooftop scroll linearly for readable beat timing', () => {
    expect(mapGlobalProgressToAerialOdm(OPERATION_RAVENNA_GROUND_SPRINT_END)).toBe(0);
    expect(mapGlobalProgressToAerialOdm(OPERATION_RAVENNA_ROOFTOPS_END)).toBe(1);
    expect(mapGlobalProgressToAerialOdm(0.28)).toBeCloseTo(0.5, 2);
  });

  it('pulls the first hook beside the facade — never through the left building', () => {
    const firstPull = resolveRooftopBeatWindows().find(
      (beat) => beat.kind === 'pull' && beat.hookAnchor && beat.from.distanceTo(ROOFTOP_STREET_LAUNCH) < 6,
    );

    expect(firstPull?.hookAnchor).toBeDefined();

    resolveRooftopTraversalPose(firstPull!.start + 0.5, pose);

    expect(pose.position.x).toBeGreaterThan(firstPull!.hookAnchor!.x);
    expect(pose.position.y).toBeGreaterThan(ROOFTOP_STREET_LAUNCH.y + 2);
  });

  it('keeps pull end offset outside the facade on left hooks', () => {
    const hook = new Vector3(-11.8, 13, -6.5);
    const pullEnd = resolvePullEndBesideFacade(hook, 'left');

    expect(pullEnd.x).toBeGreaterThan(hook.x);
  });

  it('does not bounce backward on land beats', () => {
    for (const beat of resolveRooftopBeatWindows()) {
      if (beat.kind !== 'land') {
        continue;
      }

      resolveRooftopTraversalPose(beat.start + 0.001, pose);
      const startDistance = pose.position.distanceTo(beat.to);

      resolveRooftopTraversalPose(beat.end - 0.001, pose);
      const endDistance = pose.position.distanceTo(beat.to);

      expect(startDistance).toBeLessThan(0.2);
      expect(endDistance).toBeLessThan(0.2);
    }
  });

  it('resolves hero rooftop pose above street height after the first hook', () => {
    resolveHeroCameraPose(0.12, pose);

    expect(pose.position.y).toBeGreaterThan(4);
    expect(['hook', 'pull', 'land', 'run', 'jump', 'swing']).toContain(pose.beatKind);
  });

  it('samples many distinct beats across the rooftop segment', () => {
    const samples = [0.02, 0.06, 0.1, 0.14, 0.2, 0.28, 0.36, 0.44, 0.52, 0.6, 0.72, 0.84, 0.94];
    const kinds = samples.map((progress) => findActiveRooftopBeat(progress).beat.kind);

    expect(new Set(kinds).size).toBeGreaterThanOrEqual(5);
  });
});
