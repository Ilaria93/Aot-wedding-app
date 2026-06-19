import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Object3D,
  Vector3,
} from 'three';

import type { GearHandleSide } from '@/cinematic/odm/GearHandle';
import {
  ODM_CABLE_ACCEL_SWAY,
  ODM_CABLE_BASE_LENGTH,
  ODM_CABLE_SPEED_STRETCH,
  ODM_HANDLE_OFFSET,
  odmGearTheme,
} from '@/constants/odmGear';
import { cameraMotionState } from '@/cinematic/camera/cameraMotion';

type TensionCableProps = {
  side: GearHandleSide;
};

const sideSign: Record<GearHandleSide, number> = {
  left: -1,
  right: 1,
};

const SEGMENT_COUNT = 4;

function resolveForwardSlackCable(
  sign: number,
  scratch: {
    origin: Vector3;
    control: Vector3;
    mid: Vector3;
    tip: Vector3;
  },
): Vector3[] {
  const length =
    ODM_CABLE_BASE_LENGTH + cameraMotionState.speed * ODM_CABLE_SPEED_STRETCH;
  const lateralSway = cameraMotionState.acceleration.x * ODM_CABLE_ACCEL_SWAY * -sign;
  const verticalSway = cameraMotionState.acceleration.y * ODM_CABLE_ACCEL_SWAY * 0.6;

  scratch.origin.set(
    sign * ODM_HANDLE_OFFSET.x,
    ODM_HANDLE_OFFSET.y + 0.04,
    ODM_HANDLE_OFFSET.z,
  );
  scratch.control.set(
    scratch.origin.x + lateralSway * 0.35,
    scratch.origin.y + verticalSway * 0.25,
    scratch.origin.z - length * 0.35,
  );
  scratch.mid.set(
    scratch.origin.x + lateralSway * 0.75,
    scratch.origin.y + verticalSway * 0.55 - 0.04,
    scratch.origin.z - length * 0.62,
  );
  scratch.tip.set(
    scratch.origin.x + lateralSway,
    scratch.origin.y + verticalSway - 0.07,
    scratch.origin.z - length,
  );

  return [scratch.origin, scratch.control, scratch.mid, scratch.tip];
}

function resolveGrappleCable(
  sign: number,
  rig: Object3D,
  scratch: {
    origin: Vector3;
    control: Vector3;
    mid: Vector3;
    tip: Vector3;
    worldAnchor: Vector3;
  },
): Vector3[] {
  scratch.origin.set(
    sign * ODM_HANDLE_OFFSET.x,
    ODM_HANDLE_OFFSET.y + 0.04,
    ODM_HANDLE_OFFSET.z,
  );
  scratch.worldAnchor.copy(cameraMotionState.grappleAnchor);
  rig.worldToLocal(scratch.worldAnchor);

  scratch.mid
    .addVectors(scratch.origin, scratch.worldAnchor)
    .multiplyScalar(0.5);
  scratch.mid.y -= scratch.origin.distanceTo(scratch.worldAnchor) * 0.08;

  scratch.control
    .addVectors(scratch.origin, scratch.mid)
    .multiplyScalar(0.5);
  scratch.tip.copy(scratch.worldAnchor);

  return [scratch.origin, scratch.control, scratch.mid, scratch.tip];
}

/**
 * ODM steel tether — aims at the active lateral grapple anchor when hooked.
 */
export function TensionCable({ side }: TensionCableProps) {
  const sign = sideSign[side];
  const scratch = useMemo(
    () => ({
      origin: new Vector3(),
      control: new Vector3(),
      mid: new Vector3(),
      tip: new Vector3(),
      worldAnchor: new Vector3(),
    }),
    [],
  );

  const lineObject = useMemo(() => {
    const positions = new Float32Array(SEGMENT_COUNT * 3);
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    const material = new LineBasicMaterial({
      color: odmGearTheme.cableSteel,
      transparent: true,
      opacity: 0.88,
    });
    return new Line(geometry, material);
  }, []);

  useFrame(() => {
    const positions = lineObject.geometry.getAttribute('position') as BufferAttribute;
    const rig = lineObject.parent;
    const isActiveCable =
      cameraMotionState.grappleActive && cameraMotionState.grappleSide === side;
    const material = lineObject.material as LineBasicMaterial;

    material.opacity = isActiveCable ? 0.92 : 0.42;

    const curvePoints =
      isActiveCable && rig
        ? resolveGrappleCable(sign, rig, scratch)
        : resolveForwardSlackCable(sign, scratch);

    for (let index = 0; index < SEGMENT_COUNT; index += 1) {
      positions.setXYZ(
        index,
        curvePoints[index].x,
        curvePoints[index].y,
        curvePoints[index].z,
      );
    }
    positions.needsUpdate = true;
  });

  return <primitive object={lineObject} renderOrder={5} />;
}
