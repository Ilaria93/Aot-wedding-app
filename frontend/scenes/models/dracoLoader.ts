import { useGLTF } from '@react-three/drei';

/** Google CDN path used by drei for Draco-compressed GLTF assets. */
export const DRACO_DECODER_PATH =
  'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

let isDecoderPathConfigured = false;

/** Configures the global Draco decoder path once before any GLTF load. */
export function configureDracoDecoderPath(path = DRACO_DECODER_PATH): void {
  if (isDecoderPathConfigured) {
    return;
  }

  useGLTF.setDecoderPath(path);
  isDecoderPathConfigured = true;
}

configureDracoDecoderPath();
