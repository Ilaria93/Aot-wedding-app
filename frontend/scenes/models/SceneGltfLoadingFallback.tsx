import { aotTheme } from '@/constants/aotTheme';

type SceneGltfLoadingFallbackProps = {
  label?: string;
};

/**
 * Lightweight placeholder shown while a scene GLTF is suspended in React.
 */
export function SceneGltfLoadingFallback({ label = 'loading' }: SceneGltfLoadingFallbackProps) {
  return (
    <group name={`gltf-loading-${label}`}>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
        <meshStandardMaterial
          color={aotTheme.militaryGreen}
          emissive={aotTheme.bronze}
          emissiveIntensity={0.2}
          wireframe
          transparent
          opacity={0.55}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <ringGeometry args={[0.7, 0.95, 32]} />
        <meshBasicMaterial color={aotTheme.bronze} transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
