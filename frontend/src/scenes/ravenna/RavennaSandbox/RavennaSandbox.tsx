import { RAVENNA_SANDBOX_PLACEMENTS } from '@/scenes/ravenna/RavennaSandbox/ravennaSandboxLayout';
import { RavennaBuilding } from '@/scenes/ravenna/RavennaBuilding';

/**
 * Temporary modular Ravenna sandbox — six `house_small` instances along the opening street.
 */
export function RavennaSandbox() {
  return (
    <group name="ravenna-sandbox">
      {RAVENNA_SANDBOX_PLACEMENTS.map((placement) => (
        <RavennaBuilding
          key={`${placement.position.join('-')}-${placement.rotation[1]}`}
          position={placement.position}
          rotation={placement.rotation}
          scale={placement.scale}
        />
      ))}
    </group>
  );
}
