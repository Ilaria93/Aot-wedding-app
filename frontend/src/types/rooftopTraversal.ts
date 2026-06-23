import type { Vector3 } from 'three';

import type { OdmAnchorSide } from '@/types/odmCamera';

/** ODM gameplay beat — rhythm over smooth spline interpolation. */
export type RooftopBeatKind = 'run' | 'hook' | 'pull' | 'swing' | 'land' | 'jump';

/** One discrete beat in the rooftop traversal timeline. */
export type RooftopBeat = {
  readonly kind: RooftopBeatKind;
  readonly weight: number;
  readonly from: Vector3;
  readonly to: Vector3;
  readonly hookAnchor?: Vector3;
  readonly apex?: Vector3;
  readonly runSteps?: readonly Vector3[];
  readonly hookSide?: OdmAnchorSide;
  /** Minimum camera Y — keeps the rig above roof geometry. */
  readonly minY: number;
  readonly platformId?: string;
};

/** Scroll-weighted beat with normalized [start, end] on aerial progress. */
export type RooftopBeatWindow = RooftopBeat & {
  readonly start: number;
  readonly end: number;
};

/**
 * One rooftop gameplay event — buildings are grapple anchors, not scenery.
 * Each platform defines landing, a short run, departure, and the next architectural hook.
 */
export type RooftopPlatformSpec = {
  readonly id: string;
  readonly surfaceY: number;
  /** Where PULL → SWING → LAND ends on this roof. */
  readonly land: Vector3;
  /** Exactly two staccato sprint steps on the roof. */
  readonly runSteps: readonly [Vector3, Vector3];
  /** Roof edge takeoff before the outbound hook. */
  readonly jumpOff: Vector3;
  /** Cornice / ledge on the destination building — next grapple anchor. */
  readonly outboundHook: Vector3;
  readonly outboundHookSide: OdmAnchorSide;
  /** Apex beside the destination facade during the inbound swing. */
  readonly outboundSwingApex: Vector3;
  /** First grapple anchor from the street (platform 0 only). */
  readonly streetHook?: Vector3;
  readonly streetHookSide?: OdmAnchorSide;
  readonly streetSwingApex?: Vector3;
};
