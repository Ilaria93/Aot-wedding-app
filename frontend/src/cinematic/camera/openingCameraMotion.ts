import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';

import {
  OPENING_AERIAL_LAUNCH_PATH_SHARE,
  OPENING_AERIAL_LAUNCH_SCROLL_SHARE,
  OPENING_FIRST_ODM_LAUNCH_AERIAL_END,
  OPENING_GROUND_ROLL_AMPLITUDE,
  OPENING_GROUND_SWAY_AMPLITUDE,
  OPENING_ODM_GEAR_REVEAL_END,
  OPENING_ODM_GEAR_REVEAL_START,
  OPENING_RUN_BOB_AMPLITUDE,
  OPENING_RUN_PHASE_END,
  OPENING_SPRINT_EYE_HEIGHT,
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
import {
  FIRST_ODM_LAUNCH_TUNING,
  ROOFTOP_ODM_SWING_TUNING,
  clampOdmProgress,
  findActiveOdmLeg,
  resolveOdmCameraPose,
} from '@/cinematic/camera/odmCameraMotion';
import { setGrappleCableTarget } from '@/cinematic/camera/cameraMotion';

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

/** Street-opening sub-phase: sprint from frame zero → final acceleration into the hook. */
export function resolveStreetOpeningPhase(streetT: number): StreetOpeningPhase {
  const clamped = clampOdmProgress(streetT);

  if (OPENING_WALK_PHASE_END > 0 && clamped <= OPENING_WALK_PHASE_END) {
    return 'walk';
  }

  if (clamped <= OPENING_RUN_PHASE_END) {
    return 'run';
  }

  return 'accel';
}

/**
 * Maps street-opening scroll to path distance — steady sprint, then surge to the hook.
 * Returns spline parameter t in [0, 1].
 */
export function resolveStreetOpeningPathEase(streetT: number): number {
  const clamped = clampOdmProgress(streetT);
  const runReach = 0.88;

  if (OPENING_WALK_PHASE_END > 0 && clamped <= OPENING_WALK_PHASE_END) {
    const walkProgress = clamped / OPENING_WALK_PHASE_END;
    return smoothstep(walkProgress) * 0.08;
  }

  if (clamped <= OPENING_RUN_PHASE_END) {
    const runProgress =
      (clamped - OPENING_WALK_PHASE_END) /
      Math.max(OPENING_RUN_PHASE_END - OPENING_WALK_PHASE_END, 1e-6);

    return smoothstep(runProgress) * runReach;
  }

  const accelProgress =
    (clamped - OPENING_RUN_PHASE_END) / Math.max(1 - OPENING_RUN_PHASE_END, 1e-6);

  return runReach + smoothstep(accelProgress) * (1 - runReach);
}

/** Whether overlays (HUD, hints, captions) stay hidden during the quiet opening. */
export function isOpeningUiHidden(globalProgress: number): boolean {
  return globalProgress < OPERATION_RAVENNA_GROUND_SPRINT_END;
}

/** Whether ODM gear (handles, cables, gas) should be visible. */
export function isOdmGearVisible(globalProgress: number): boolean {
  return globalProgress >= OPENING_ODM_GEAR_REVEAL_START;
}

/** Opacity ramp for ODM gear reveal at the first hook. */
export function resolveOdmGearRevealOpacity(globalProgress: number): number {
  if (!isOdmGearVisible(globalProgress)) {
    return 0;
  }

  if (globalProgress >= OPENING_ODM_GEAR_REVEAL_END) {
    return 1;
  }

  const span = OPENING_ODM_GEAR_REVEAL_END - OPENING_ODM_GEAR_REVEAL_START;

  if (span <= 0) {
    return 1;
  }

  return smoothstep(
    (globalProgress - OPENING_ODM_GEAR_REVEAL_START) / span,
  );
}

/** Whether ODM grapple camera movement is active (only after the first hook). */
export function isOdmMovementActive(globalProgress: number): boolean {
  return globalProgress >= OPERATION_RAVENNA_GROUND_SPRINT_END;
}

/** Opening pose at progress zero — already sprinting from the far outskirts. */
export function resolveStaticOpeningPose(out: MutableOpeningPose): void {
  sampleStreetOpeningPose(0, out);
  out.phase = 'run';
}

function applySprintCameraBias(pathEase: number, out: MutableOpeningPose): void {
  const sprintBias = 1 - smoothstep(pathEase * 1.15);
  const eyeHeight = MathUtils.lerp(OPENING_SPRINT_EYE_HEIGHT, OPENING_STREET_EYE_HEIGHT, pathEase);

  out.position.y = MathUtils.lerp(out.position.y, eyeHeight, 0.72);
  out.target.y = MathUtils.lerp(
    out.target.y,
    out.position.y + 1.6 + sprintBias * 1.4,
    0.55 + sprintBias * 0.25,
  );
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
  const runBlend =
    streetPhase === 'run'
      ? Math.max(
          0.88,
          (streetT - OPENING_WALK_PHASE_END) /
            Math.max(OPENING_RUN_PHASE_END - OPENING_WALK_PHASE_END, 1e-6),
        )
      : streetPhase === 'accel'
        ? 1
        : 0;
  const accelBlend =
    streetPhase === 'accel'
      ? (streetT - OPENING_RUN_PHASE_END) / Math.max(1 - OPENING_RUN_PHASE_END, 1e-6)
      : 0;

  const bobFrequency = streetPhase === 'walk' ? 6.5 : streetPhase === 'run' ? 11.5 : 15;
  const bobPhase = pathEase * Math.PI * bobFrequency;
  const walkBob =
    streetPhase === 'walk'
      ? Math.sin(bobPhase) * OPENING_WALK_BOB_AMPLITUDE
      : 0;
  const runBob =
    Math.sin(bobPhase) *
    OPENING_RUN_BOB_AMPLITUDE *
    smoothstep(runBlend) *
    (1 + accelBlend * 0.75);

  out.position.y += walkBob + runBob;

  const swayEnvelope = Math.max(0.9, smoothstep(runBlend)) * (1 + accelBlend * 0.45);

  if (streetPhase !== 'walk') {
    const forward = resolveStreetTangent(pathEase, scratchForward);
    const lateral = resolveStreetLateral(forward, scratchLateral);
    const sway = Math.sin(bobPhase * 0.42) * OPENING_GROUND_SWAY_AMPLITUDE * swayEnvelope;

    out.target.addScaledVector(lateral, sway);
    out.roll =
      Math.sin(bobPhase * 0.5) *
      OPENING_GROUND_ROLL_AMPLITUDE *
      swayEnvelope;
  }

  applySprintCameraBias(pathEase, out);

  const speedFeel = pathEase + accelBlend * 0.4;
  out.fov =
    OPENING_ESTABLISHING_CAMERA_FOV + speedFeel * 2.8 + accelBlend * 6;
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

  const linear = clampOdmProgress(
    (clampOdmProgress(globalProgress) - OPERATION_RAVENNA_GROUND_SPRINT_END) / aerialSpan,
  );

  if (linear <= OPENING_AERIAL_LAUNCH_SCROLL_SHARE) {
    const launchT = linear / Math.max(OPENING_AERIAL_LAUNCH_SCROLL_SHARE, 1e-6);
    return smoothstep(launchT) * OPENING_AERIAL_LAUNCH_PATH_SHARE;
  }

  const swingT =
    (linear - OPENING_AERIAL_LAUNCH_SCROLL_SHARE) /
    Math.max(1 - OPENING_AERIAL_LAUNCH_SCROLL_SHARE, 1e-6);

  return (
    OPENING_AERIAL_LAUNCH_PATH_SHARE +
    smoothstep(swingT) * (1 - OPENING_AERIAL_LAUNCH_PATH_SHARE)
  );
}

/** Tilts the camera to keep rooftops in frame during aerial traversal. */
function applyRooftopReadableCameraBias(
  aerialProgress: number,
  out: MutableOpeningPose,
): void {
  const launchBias = 1 - smoothstep(aerialProgress / OPENING_AERIAL_LAUNCH_PATH_SHARE);
  const lookDown = 3.2 + launchBias * 2.8;

  out.target.y = Math.min(out.target.y, out.position.y - lookDown);
  out.roll *= 0.72;
  out.fov = MathUtils.lerp(out.fov, Math.max(out.fov, 62), 0.35);
}

/** Whether the hero camera is in the static opening frame (no scroll yet). */
export function isStaticOpeningFrame(_globalProgress: number): boolean {
  return false;
}

/** Whether the player is still on the street (sprint / accel — no ODM yet). */
export function isStreetOpeningPhase(globalProgress: number): boolean {
  return globalProgress >= 0 && globalProgress < OPERATION_RAVENNA_GROUND_SPRINT_END;
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

/** Resolves which ODM tuning applies across the aerial rooftops segment. */
export function resolveRooftopOdmTuning(aerialProgress: number) {
  if (aerialProgress < OPENING_FIRST_ODM_LAUNCH_AERIAL_END) {
    return FIRST_ODM_LAUNCH_TUNING;
  }

  return ROOFTOP_ODM_SWING_TUNING;
}

/** Whether the first ODM hook / rooftop launch window is active. */
export function isFirstOdmLaunchPhase(globalProgress: number): boolean {
  const aerialProgress = mapGlobalProgressToAerialOdm(globalProgress);
  return (
    globalProgress >= OPERATION_RAVENNA_GROUND_SPRINT_END &&
    aerialProgress < OPENING_FIRST_ODM_LAUNCH_AERIAL_END
  );
}

/**
 * Resolves the hero camera — street sprint from progress zero, then aerial ODM.
 */
export function resolveHeroCameraPose(
  globalProgress: number,
  out: MutableOpeningPose,
): CameraPose & { roll: number; fov: number; phase: MutableOpeningPose['phase'] } {
  if (isStreetOpeningPhase(globalProgress)) {
    sampleStreetOpeningPose(Math.max(globalProgress, 0), out);

    if (isOdmGearVisible(globalProgress)) {
      const hookAnchor = aerialRooftopsPath[1] ?? aerialRooftopsPath[0];
      setGrappleCableTarget(true, hookAnchor, 'left');
    } else {
      setGrappleCableTarget(false);
    }

    return out;
  }

  const aerialProgress = mapGlobalProgressToAerialOdm(globalProgress);
  const tuning = resolveRooftopOdmTuning(aerialProgress);
  const activeLeg = findActiveOdmLeg(AERIAL_ODM_CAMERA_LEGS, aerialProgress);

  resolveOdmCameraPose(AERIAL_ODM_CAMERA_LEGS, aerialProgress, out, tuning);
  applyRooftopReadableCameraBias(aerialProgress, out);
  setGrappleCableTarget(true, activeLeg.leg.to.position, activeLeg.leg.to.side);
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
