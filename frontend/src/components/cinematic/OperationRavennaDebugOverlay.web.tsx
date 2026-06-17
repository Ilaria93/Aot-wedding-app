import { useEffect, useState, type RefObject } from 'react';
import { createElement, type CSSProperties } from 'react';

import { aotTheme } from '@/constants/aotTheme';
import { OPERATION_RAVENNA_TIMELINE } from '@/constants/operationRavennaTimeline';
import type { CinematicCameraDebugSnapshot } from '@/types/cinematicDebug';
import { formatDebugNumber, formatDebugVector3 } from '@/utils/cinematicDebugFormat';
import { resolveSceneTimelineState } from '@/utils/sceneTimeline';

type OperationRavennaDebugOverlayProps = {
  visible: boolean;
  progressRef: RefObject<number>;
  cameraDebugRef: RefObject<CinematicCameraDebugSnapshot>;
};

type DebugSnapshot = {
  globalProgress: number;
  sceneId: string;
  localProgress: number;
  camera: CinematicCameraDebugSnapshot;
};

const panelStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 20,
  minWidth: 240,
  maxWidth: 320,
  padding: '12px 14px',
  borderRadius: 8,
  border: `1px solid ${aotTheme.bronze}`,
  backgroundColor: 'rgba(10, 12, 11, 0.88)',
  color: 'rgba(249, 248, 243, 0.92)',
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 11,
  lineHeight: 1.5,
  pointerEvents: 'none',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
};

const titleStyle: CSSProperties = {
  margin: '0 0 8px',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: aotTheme.bronze,
};

const rowStyle: CSSProperties = {
  margin: '0 0 4px',
};

const labelStyle: CSSProperties = {
  color: 'rgba(184, 138, 82, 0.9)',
};

function renderRow(label: string, value: string) {
  return createElement(
    'p',
    { style: rowStyle },
    createElement('span', { style: labelStyle }, `${label}: `),
    value,
  );
}

/**
 * Development overlay for Operation Ravenna scroll progress, scene and camera state (web only).
 */
export function OperationRavennaDebugOverlay({
  visible,
  progressRef,
  cameraDebugRef,
}: OperationRavennaDebugOverlayProps) {
  const [snapshot, setSnapshot] = useState<DebugSnapshot>(() => {
    const globalProgress = progressRef.current ?? 0;
    const sceneState = resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, globalProgress);

    return {
      globalProgress,
      sceneId: sceneState.sceneId,
      localProgress: sceneState.localProgress,
      camera: cameraDebugRef.current ?? {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
      },
    };
  });

  useEffect(() => {
    if (!__DEV__ || !visible) {
      return undefined;
    }

    let frameId = 0;

    const tick = () => {
      const globalProgress = progressRef.current ?? 0;
      const sceneState = resolveSceneTimelineState(OPERATION_RAVENNA_TIMELINE, globalProgress);
      const camera = cameraDebugRef.current ?? {
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
      };

      setSnapshot({
        globalProgress,
        sceneId: sceneState.sceneId,
        localProgress: sceneState.localProgress,
        camera: {
          position: [...camera.position],
          rotation: [...camera.rotation],
        },
      });

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [visible, progressRef, cameraDebugRef]);

  if (!__DEV__ || !visible) {
    return null;
  }

  return createElement(
    'aside',
    {
      'aria-label': 'Operation Ravenna debug overlay',
      style: panelStyle,
    },
    createElement('p', { style: titleStyle }, 'Operation Ravenna · Debug'),
    renderRow('Global', formatDebugNumber(snapshot.globalProgress, 4)),
    renderRow('Scene', snapshot.sceneId),
    renderRow('Local', formatDebugNumber(snapshot.localProgress, 4)),
    renderRow('Cam pos', formatDebugVector3(snapshot.camera.position)),
    renderRow('Cam rot', formatDebugVector3(snapshot.camera.rotation)),
    createElement(
      'p',
      { style: { ...rowStyle, marginTop: 8, color: 'rgba(249, 248, 243, 0.55)' } },
      'Press D to hide · H path helpers',
    ),
  );
}
