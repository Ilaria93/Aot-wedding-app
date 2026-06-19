import { useEffect } from 'react';

import { preloadModelsForScrollProgress } from '@/scenes/models/modelPreload';

/**
 * Warms GLTF caches for upcoming Operation Ravenna scenes based on scroll progress.
 */
export function useLazyModelPreload(progress: number): void {
  useEffect(() => {
    preloadModelsForScrollProgress(progress);
  }, [progress]);
}
