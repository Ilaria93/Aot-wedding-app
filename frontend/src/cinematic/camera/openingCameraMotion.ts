import { CatmullRomCurve3, Vector3 } from 'three';

import {
  OPENING_GROUND_ROLL_AMPLITUDE,
  OPENING_GROUND_SWAY_AMPLITUDE,
  OPENING_ODM_GEAR_REVEAL_END,
  OPENING_RUN_BOB_AMPLITUDE,
  OPENING_RUN_PHASE_END,
  OPENING_STREET_EYE_HEIGHT,
  OPENING_WALK_BOB_AMPLITUDE,
  OPENING_WALK_PHASE_END,
  OPERATION_RAVENNA_GROUND_SPRINT_END,
  OPERATION_RAVENNA_ROOFTOPS_END,
} from '@/constants/operationRavennaOpening';
import {
  OPENING_ESTABLISHING_CAMERA_FOV,
  OPENING_ESTABLISHING_CAMERA_POSITION,
  OPENING_ESTABLISHING_CAMERA_TARGET,
} from '@/scenes/graybox/openingEstablishingLayout';
import {
  aerialRooftopsPath,
  aerialRooftopsTargetPath,
  streetOpeningPath,
  streetOpeningTargetPath,
} from '@/data/cameraPaths';
import { AERIAL_ODM_CAMERA_LEGS } from '@/data/odmCameraAnchors';
import type { OdmGrapplePhase } from '@/types/odmCamera';
import type { CameraPose, NormalizedProgress } from '@/types/cameraRig';
import { HERO_CAMERA_FOV } from '@/cinematic/camera/cameraConfig';
import {
  DEFAULT_ODM_CAMERA_TUNING,
  FIRST_ODM_LAUNCH_TUNING,
  clampOdmProgress,
  resolveOdmCameraPose,
} from '@/cinematic/camera/odmCameraMotion';

const streetOpeningCurve = new CatmullRomCurve3(streetOpeningPath);
const streetOpeningTargetCurve = new CatmullRomCurve3(streetOpeningTargetPath);

const scratchPosition = new Vector3();
const scratchTarget = new Vector3();
const scratchForward = new Vector3();
const scratchLateral = new Vector3();

export type StreetOpeningPhase = 'walk' | 'run' | 'accel';

type MutableOpeningPose = {
  position: Vector3;
  target: Vector3;
  roll: number;
  fov: number;
  phase: OdmGrapplePhase | 'static' | StreetOpeningPhase;
};

function smoothstep(value: number): number {
  const clamped = clampOdmProgress(value);
  return clamped * clamped * (3 - 2 * clamped);
}

/** Street-opening sub-phase: walk → run → final acceleration into the hook. */
export function resolveStreetOpeningPhase(streetT: number): StreetOpeningPhase {
  const clamped = clampOdmProgress(streetT);

  if (clamped <= OPENING_WALK_PHASE_END) {
    return 'walk';
  }

  if (clamped <= OPENING_RUN_PHASE_END) {
    return 'run';
  }

  return 'accel';
}

/**
 * Maps street-opening scroll to path distance — slow walk, steady run, then surge to the hook.
 * Returns spline parameter t in [0, 1].
 */
export function resolveStreetOpeningPathEase(streetT: number): number {
  const clamped = clampOdmProgress(streetT);
  const walkReach = 0.07;
  const runReach = 0.36;

  if (clamped <= OPENING_WALK_PHASE_END) {
    const walkProgress = clamped / OPENING_WALK_PHASE_END;
    return smoothstep(walkProgress) * walkReach;
  }

  if (clamped <= OPENING_RUN_PHASE_END) {
    const runProgress = (clamped - OPENING_WALK_PHASE_END) /
      Math.max(OPENING_RUN_PHASE_END - OPENING_WALK_PHASE_END, 1e-6);

    return walkReach + smoothstep(runProgress) * (runReach - walkReach);
  }

  const accelProgress = (clamped - OPENING_RUN_PHASE_END) /
    Math.max(1 - OPENING_RUN_PHASE_END, 1e-6);
  const accelEase = accelProgress * accelProgress * accelProgress;

  return runReach + accelEase * (1 - runReach);
}

/** Whether overlays (HUD, hints, captions) stay hidden during the quiet opening. */
export function isOpeningUiHidden(globalProgress: number): boolean {
  return globalProgress < OPERATION_RAVENNA_GROUND_SPRINT_END;
}

/** Whether ODM gear (handles, cables, gas) should be visible. */
export function isOdmGearVisible(globalProgress: number): boolean {
  return globalProgress >= OPERATION_RAVENNA_GROUND_SPRINT_END;
}

/** Opacity ramp for ODM gear reveal at the first hook. */
export function resolveOdmGearRevealOpacity(globalProgress: number): number {
  if (!isOdmGearVisible(globalProgress)) {
    return 0;
  }

  if (globalProgress >= OPENING_ODM_GEAR_REVEAL_END) {
    return 1;
  }

  const span = OPENING_ODM_GEAR_REVEAL_END - OPERATION_RAVENNA_GROUND_SPRINT_END;

  if (span <= 0) {
    return 1;
  }

  return smoothstep(
    (globalProgress - OPERATION_RAVENNA_GROUND_SPRINT_END) / span,
  );
}

/** Whether ODM grapple camera movement is active (only after the first hook). */
export function isOdmMovementActive(globalProgress: number): boolean {
  return globalProgress >= OPERATION_RAVENNA_GROUND_SPRINT_END;
}

/** Static opening pose — anime establishing shot down the portico street. */
export function resolveStaticOpeningPose(out: MutableOpeningPose): void {
  out.position.set(...OPENING_ESTABLISHING_CAMERA_POSITION);
  out.target.set(...OPENING_ESTABLISHING_CAMERA_TARGET);
  out.roll = 0;
  out.fov = OPENING_ESTABLISHING_CAMERA_FOV;
  out.phase = 'static';
}

function resolveStreetTangent(pathEase: number, outForward: Vector3): Vector3 {
  const epsilon = 0.006;
  streetOpeningCurve.getPoint(pathEase, scratchPosition);
  streetOpeningCurve.getPoint(Math.min(1, pathEase + epsilon), scratchTarget);
  outForward.subVectors(scratchTarget, scratchPosition);

  if (outForward.lengthSq() < 1e-6) {
    outForward.set(0, 0, -1);
  } else {
    outForward.normalize();
  }

  return outForward;
}

function resolveStreetLateral(forward: Vector3, outLateral: Vector3): Vector3 {
  outLateral.crossVectors(new Vector3(0, 1, 0), forward);

  if (outLateral.lengthSq() < 1e-6) {
    outLateral.set(1, 0, 0);
  } else {
    outLateral.normalize();
  }

  return outLateral;
}

function applyStreetMotionFeel(
  streetPhase: StreetOpeningPhase,
  streetT: number,
  pathEase: number,
  out: MutableOpeningPose,
): void {
  const walkBlend =
    streetPhase === 'walk'
      ? streetT / Math.max(OPENING_WALK_PHASE_END, 1e-6)
      : 1;
  const runBlend =
    streetPhase === 'run'
      ? (streetT - OPENING_WALK_PHASE_END) /
        Math.max(OPENING_RUN_PHASE_END - OPENING_WALK_PHASE_END, 1e-6)
      : streetPhase === 'accel'
        ? 1
        : 0;
  const accelBlend =
    streetPhase === 'accel'
      ? (streetT - OPENING_RUN_PHASE_END) / Math.max(1 - OPENING_RUN_PHASE_END, 1e-6)
      : 0;

  const bobFrequency =
    streetPhase === 'walk' ? 5.5 : streetPhase === 'run' ? 10.5 : 14;
  const bobPhase = pathEase * Math.PI * bobFrequency;
  const walkBob = Math.sin(bobPhase) * OPENING_WALK_BOB_AMPLITUDE * smoothstep(walkBlend);
  const runBob =
    Math.sin(bobPhase) *
    OPENING_RUN_BOB_AMPLITUDE *
    smoothstep(runBlend) *
    (1 + accelBlend * 0.65);

  out.position.y += walkBob + runBob;

  if (streetPhase !== 'walk') {
    const swayEnvelope = smoothstep(runBlend) * (1 + accelBlend * 0.4);
    const forward = resolveStreetTangent(pathEase, scratchForward);
    const lateral = resolveStreetLateral(forward, scratchLateral);
    const sway = Math.sin(bobPhase * 0.42) * OPENING_GROUND_SWAY_AMPLITUDE * swayEnvelope;

    out.target.addScaledVector(lateral, sway);
    out.roll =
      Math.sin(bobPhase * 0.5) *
      OPENING_GROUND_ROLL_AMPLITUDE *
      swayEnvelope;
  }

  const speedFeel = pathEase + accelBlend * 0.35;
  out.fov = HERO_CAMERA_FOV + speedFeel * 2.2 + accelBlend * 5.5;
}

/** Samples walk → run → accel along the street before the first ODM hook. */
export function sampleStreetOpeningPose(
  globalProgress: number,
  out: MutableOpeningPose,
): void {
  const streetT = clampOdmProgress(globalProgress / OPERATION_RAVENNA_GROUND_SPRINT_END);
  const streetPhase = resolveStreetOpeningPhase(streetT);
  const pathEase = resolveStreetOpeningPathEase(streetT);

  streetOpeningCurve.getPoint(pathEase, out.position);
  streetOpeningTargetCurve.getPoint(pathEase, out.target);
  out.roll = 0;

  applyStreetMotionFeel(streetPhase, streetT, pathEase, out);
  out.phase = streetPhase;
}

/** Maps global hero progress to aerial ODM progress within the rooftops window. */
export function mapGlobalProgressToAerialOdm(globalProgress: number): NormalizedProgress {
  const aerialSpan = OPERATION_RAVENNA_ROOFTOPS_END - OPERATION_RAVENNA_GROUND_SPRINT_END;

  if (aerialSpan <= 0) {
    return 0;
  }

  const aerialT =
    (clampOdmProgress(globalProgress) - OPERATION_RAVENNA_GROUND_SPRINT_END) / aerialSpan;

  return clampOdmProgress(aerialT);
}

/** Whether the hero camera is in the static opening frame (no scroll yet). */
export function isStaticOpeningFrame(globalProgress: number): boolean {
  return globalProgress <= 0;
}

/** Whether the player is still on the street (walk / run / accel — no ODM yet). */
export function isStreetOpeningPhase(globalProgress: number): boolean {
  return globalProgress > 0 && globalProgress < OPERATION_RAVENNA_GROUND_SPRINT_END;
}

/** @deprecated Use isStreetOpeningPhase */
export function isGroundSprintPhase(globalProgress: number): boolean {
  return isStreetOpeningPhase(globalProgress);
}

/** Whether aerial ODM traversal is active (existing rooftop segment — unchanged). */
export function isAerialTraversalPhase(globalProgress: number): boolean {
  return (
    globalProgress >= OPERATION_RAVENNA_GROUND_SPRINT_END &&
    globalProgress < OPERATION_RAVENNA_ROOFTOPS_END
  );
}

/** Whether the first ODM hook / rooftop launch window is active. */
export function isFirstOdmLaunchPhase(globalProgress: number): boolean {
  const aerialProgress = mapGlobalProgressToAerialOdm(globalProgress);
  return (
    globalProgress >= OPERATION_RAVENNA_GROUND_SPRINT_END &&
    aerialProgress < 0.14
  );
}

/**
 * Resolves the hero camera — static hold, street walk/run, then existing aerial ODM.
 */
export function resolveHeroCameraPose(
  globalProgress: number,
  out: MutableOpeningPose,
): CameraPose & { roll: number; fov: number; phase: MutableOpeningPose['phase'] } {
  if (isStaticOpeningFrame(globalProgress)) {
    resolveStaticOpeningPose(out);
    return out;
  }

  if (isStreetOpeningPhase(globalProgress)) {
    sampleStreetOpeningPose(globalProgress, out);
    return out;
  }

  const aerialProgress = mapGlobalProgressToAerialOdm(globalProgress);
  const tuning =
    aerialProgress < 0.14 ? FIRST_ODM_LAUNCH_TUNING : DEFAULT_ODM_CAMERA_TUNING;

  resolveOdmCameraPose(AERIAL_ODM_CAMERA_LEGS, aerialProgress, out, tuning);
  return out;
}

/** Samples a street frame for optional debug helpers. */
export function sampleGroundSprintFrame(
  globalProgress: number,
  outPosition: Vector3,
  outForward: Vector3,
): void {
  const streetT = clampOdmProgress(globalProgress / OPERATION_RAVENNA_GROUND_SPRINT_END);
  const pathEase = resolveStreetOpeningPathEase(streetT);

  streetOpeningCurve.getPoint(pathEase, outPosition);
  resolveStreetTangent(pathEase, outForward);
  outPosition.y = OPENING_STREET_EYE_HEIGHT;
}

/** First rooftop hook anchor — mission launch point. */
export function getFirstRooftopLaunchPoint(out: Vector3 = scratchPosition): Vector3 {
  return out.copy(aerialRooftopsPath[0]);
}
