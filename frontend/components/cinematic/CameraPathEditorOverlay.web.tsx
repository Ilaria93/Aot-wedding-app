import { useEffect, useState, type RefObject } from 'react';
import { createElement, type CSSProperties } from 'react';

import { aotTheme } from '@/constants/aotTheme';
import {
  CAMERA_PATH_SEGMENT_COLORS,
  type CameraPathSegmentId,
} from '@/constants/cameraPathEditorColors';
import type { CinematicCameraDebugSnapshot } from '@/types/cinematicDebug';
import { formatDebugNumber, formatDebugVector3 } from '@/utils/cinematicDebugFormat';
import { resolveCurrentCameraPathSegment } from '@/utils/cameraPathEditor';

type CameraPathEditorOverlayProps = {
  visible: boolean;
  progressRef: RefObject<number>;
  cameraDebugRef: RefObject<CinematicCameraDebugSnapshot>;
};

type HudSnapshot = {
  globalProgress: number;
  segmentName: string;
  localProgress: number;
  cameraPosition: [number, number, number];
};

const panelStyle: CSSProperties = {
  position: 'absolute',
  left: 12,
  bottom: 12,
  zIndex: 19,
  width: 320,
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${aotTheme.bronze}`,
  backgroundColor: 'rgba(10, 12, 11, 0.88)',
  color: 'rgba(249, 248, 243, 0.92)',
  fontFamily: '"Courier New", Courier, monospace',
  fontSize: 11,
  lineHeight: 1.45,
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

const segmentListStyle: CSSProperties = {
  margin: '8px 0 0',
  padding: 0,
  listStyle: 'none',
};

function renderSegmentRow(segmentId: CameraPathSegmentId, activeSegment: string) {
  const isActive = segmentId === activeSegment;
  return createElement(
    'li',
    {
      key: segmentId,
      style: {
        color: isActive ? CAMERA_PATH_SEGMENT_COLORS[segmentId] : 'rgba(249, 248, 243, 0.55)',
        fontWeight: isActive ? 700 : 500,
      },
    },
    `${isActive ? '▸ ' : '  '}${segmentId}`,
  );
}

/**
 * Development HUD for the camera path editor (toggle with H, web only).
 */
export function CameraPathEditorOverlay({
  visible,
  progressRef,
  cameraDebugRef,
}: CameraPathEditorOverlayProps) {
  const [snapshot, setSnapshot] = useState<HudSnapshot>(() => {
    const globalProgress = progressRef.current ?? 0;
    const segment = resolveCurrentCameraPathSegment(globalProgress);
    const camera = cameraDebugRef.current;

    return {
      globalProgress,
      segmentName: segment.segmentName,
      localProgress: segment.localProgress,
      cameraPosition: camera?.position ?? [0, 0, 0],
    };
  });

  useEffect(() => {
    if (!__DEV__ || !visible) {
      return undefined;
    }

    let frameId = 0;

    const tick = () => {
      const globalProgress = progressRef.current ?? 0;
      const segment = resolveCurrentCameraPathSegment(globalProgress);
      const camera = cameraDebugRef.current;

      setSnapshot({
        globalProgress,
        segmentName: segment.segmentName,
        localProgress: segment.localProgress,
        cameraPosition: camera?.position ?? [0, 0, 0],
      });

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [cameraDebugRef, progressRef, visible]);

  if (!__DEV__ || !visible) {
    return null;
  }

  const segmentIds = Object.keys(CAMERA_PATH_SEGMENT_COLORS) as CameraPathSegmentId[];

  return createElement(
    'aside',
    {
      'aria-label': 'Camera path editor overlay',
      style: panelStyle,
    },
    createElement('p', { style: titleStyle }, 'Camera Path Editor · H'),
    createElement('p', { style: { margin: '0 0 4px' } }, `globalProgress: ${formatDebugNumber(snapshot.globalProgress, 4)}`),
    createElement('p', { style: { margin: '0 0 4px' } }, `segment: ${snapshot.segmentName}`),
    createElement('p', { style: { margin: '0 0 4px' } }, `localProgress: ${formatDebugNumber(snapshot.localProgress, 4)}`),
    createElement(
      'p',
      { style: { margin: '0 0 4px' } },
      `cameraPosition: ${formatDebugVector3(snapshot.cameraPosition)}`,
    ),
    createElement(
      'ul',
      { style: segmentListStyle },
      segmentIds.map((segmentId) => renderSegmentRow(segmentId, snapshot.segmentName)),
    ),
  );
}
