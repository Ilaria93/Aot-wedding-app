import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Box3, MathUtils, Mesh, Vector3, type Group, type Object3D } from 'three';
import { SkeletonUtils } from 'three-stdlib';

import {
  BULL_TERRIER_TITAN_GLB,
  BULL_TERRIER_TITAN_PLACEMENT,
  type BullTerrierTitanPlacement,
} from '@/constants/titanCorridorTitan';
import {
  clampHeadTrackingAngles,
  computeBreathingScale,
  computeUniformScaleForHeight,
  findChestNode,
  findHeadNode,
  resolveIdleAnimationName,
  resolveTitanGroundY,
} from '@/utils/titanCorridorTitan';

type BullTerrierTitanProps = {
  /** When false, skips per-frame motion while keeping the mesh culled by distance. */
  active?: boolean;
  placement?: BullTerrierTitanPlacement;
};

function cloneTitanScene(source: Object3D): Object3D {
  const clone = SkeletonUtils.clone(source);
  clone.traverse((child) => {
    if (child instanceof Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.frustumCulled = true;
    }
  });
  return clone;
}

/**
 * Colossal Bull Terrier titan — idle GLB animation, breathing and subtle head tracking.
 * Environmental obstacle beside the titan-corridor flight path (~50 m tall).
 */
export function BullTerrierTitan({
  active = true,
  placement = BULL_TERRIER_TITAN_PLACEMENT,
}: BullTerrierTitanProps) {
  const rootRef = useRef<Group>(null);
  const headRef = useRef<Object3D | null>(null);
  const chestRef = useRef<Object3D | null>(null);
  const chestBaseYRef = useRef(0);
  const headYawRef = useRef(0);
  const headPitchRef = useRef(0);
  const breathPhase = useMemo(() => placement.rotationY * 1.7, [placement.rotationY]);

  const { scene, animations } = useGLTF(BULL_TERRIER_TITAN_GLB);
  const clonedScene = useMemo(() => cloneTitanScene(scene), [scene]);
  const { actions, names } = useAnimations(animations, rootRef);

  const { uniformScale, rootY } = useMemo(() => {
    const bounds = new Box3().setFromObject(clonedScene);
    const nativeHeight = bounds.max.y - bounds.min.y;
    const scale = computeUniformScaleForHeight(nativeHeight, placement.targetHeightMeters);
    const groundY = resolveTitanGroundY(bounds.min.y, scale, placement.position[1]);

    return { uniformScale: scale, rootY: groundY };
  }, [clonedScene, placement.position, placement.targetHeightMeters]);

  useLayoutEffect(() => {
    headRef.current = findHeadNode(clonedScene);
    chestRef.current = findChestNode(clonedScene) ?? headRef.current?.parent ?? null;
    chestBaseYRef.current = chestRef.current?.position.y ?? 0;
  }, [clonedScene]);

  useEffect(() => {
    const idleClip = resolveIdleAnimationName(names);
    if (!idleClip) {
      return undefined;
    }

    const action = actions[idleClip];
    action?.reset().fadeIn(0.35).play();

    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, names]);

  useFrame((state, delta) => {
    if (!active) {
      return;
    }

    const elapsed = state.clock.elapsedTime;
    const chest = chestRef.current;
    const head = headRef.current;

    if (chest) {
      const breathLift = (computeBreathingScale(elapsed, breathPhase) - 1) * 0.35;
      chest.position.y = chestBaseYRef.current + breathLift;
    }

    if (!head) {
      return;
    }

    head.getWorldPosition(_headWorld);
    const cameraPosition = state.camera.position;
    const dx = cameraPosition.x - _headWorld.x;
    const dy = cameraPosition.y - _headWorld.y;
    const dz = cameraPosition.z - _headWorld.z;
    const horizontalDistance = Math.hypot(dx, dz);
    const targetAngles = clampHeadTrackingAngles(
      Math.atan2(dx, dz),
      Math.atan2(dy, horizontalDistance),
    );

    const blend = Math.min(1, delta * 1.8);
    headYawRef.current = MathUtils.lerp(headYawRef.current, targetAngles.yaw, blend);
    headPitchRef.current = MathUtils.lerp(headPitchRef.current, targetAngles.pitch, blend);
    head.rotation.y = headYawRef.current;
    head.rotation.x = -headPitchRef.current;
  }, -1);

  return (
    <group
      ref={rootRef}
      name="bull-terrier-titan"
      position={[placement.position[0], rootY, placement.position[2]]}
      rotation={[0, placement.rotationY, 0]}
      scale={uniformScale}>
      <primitive object={clonedScene} />
    </group>
  );
}

const _headWorld = new Vector3();

useGLTF.preload(BULL_TERRIER_TITAN_GLB);
