import { Html, Line } from '@react-three/drei';
import { useMemo } from 'react';
import type { CatmullRomCurve3, Vector3 } from 'three';

import { CAMERA_PATHS } from '@/data/cameraPaths';
import {
  CAMERA_PATH_SEGMENT_COLORS,
  CAMERA_PATH_SEGMENT_TARGET_COLORS,
  type CameraPathSegmentId,
} from '@/constants/cameraPathEditorColors';
import type { CameraPathEditorSpline } from '@/types/cameraPathEditor';
import { resolveCameraPathEditorSplines, sampleCatmullRomPolyline } from '@/cinematic/camera/cameraPathEditor';

type CameraPathEditorHelpersProps = {
  visible: boolean;
};

type PathSplineHelperProps = {
  points: Vector3[];
  curve: CatmullRomCurve3;
  color: string;
  sphereRadius?: number;
  showPointLabels?: boolean;
};

/**
 * Renders control-point spheres and a sampled spline line for one camera path.
 */
function PathSplineHelper({
  points,
  curve,
  color,
  sphereRadius = 0.11,
  showPointLabels = false,
}: PathSplineHelperProps) {
  const polyline = useMemo(() => sampleCatmullRomPolyline(curve), [curve]);

  return (
    <group>
      <Line points={polyline} color={color} lineWidth={1.6} />

      {points.map((point, index) => (
        <mesh key={`${index}-${point.x}-${point.y}-${point.z}`} position={point}>
          <sphereGeometry args={[sphereRadius, 14, 14]} />
          <meshBasicMaterial color={color} />
          {showPointLabels ? (
            <Html
              center
              distanceFactor={10}
              style={{
                color: '#f9f8f3',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: 10,
                fontWeight: 700,
                textShadow: '0 0 8px rgba(0,0,0,0.7)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}>
              {index + 1}
            </Html>
          ) : null}
        </mesh>
      ))}
    </group>
  );
}

type SegmentPathHelpersProps = {
  segment: CameraPathEditorSpline;
  segmentId: CameraPathSegmentId;
};

/** Renders position and lookAt splines for a single timeline segment. */
function SegmentPathHelpers({ segment, segmentId }: SegmentPathHelpersProps) {
  const positionColor = CAMERA_PATH_SEGMENT_COLORS[segmentId];
  const targetColor = CAMERA_PATH_SEGMENT_TARGET_COLORS[segmentId];
  const labelAnchor = segment.positionPoints[0];

  return (
    <group name={`camera-path-${segment.id}`}>
      <PathSplineHelper
        points={segment.positionPoints}
        curve={segment.positionCurve}
        color={positionColor}
        sphereRadius={0.12}
        showPointLabels
      />
      <PathSplineHelper
        points={segment.targetPoints}
        curve={segment.targetCurve}
        color={targetColor}
        sphereRadius={0.09}
      />
      {labelAnchor ? (
        <Html
          position={[labelAnchor.x, labelAnchor.y + 0.55, labelAnchor.z]}
          center
          distanceFactor={12}
          style={{
            color: positionColor,
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            textShadow: '0 0 10px rgba(0, 0, 0, 0.9)',
            pointerEvents: 'none',
            userSelect: 'none',
          }}>
          {segment.id}
        </Html>
      ) : null}
    </group>
  );
}

/**
 * Development-only 3D camera path helpers: colored splines, numbered points, segment labels (H key).
 */
export function CameraPathEditorHelpers({ visible }: CameraPathEditorHelpersProps) {
  const segments = useMemo(() => resolveCameraPathEditorSplines(CAMERA_PATHS), []);

  if (!__DEV__ || !visible) {
    return null;
  }

  return (
    <group name="camera-path-editor">
      {segments.map((segment) => (
        <SegmentPathHelpers
          key={segment.id}
          segment={segment}
          segmentId={(segment.id in CAMERA_PATH_SEGMENT_COLORS
            ? segment.id
            : 'rooftops') as CameraPathSegmentId}
        />
      ))}
    </group>
  );
}
