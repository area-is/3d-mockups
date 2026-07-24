'use client'

import { PhoneMockup } from 'area-mockups'
import { StrideApp } from '@/components/screens/stride-app'

/**
 * The huge hero phone. The layout box (`.xh-phone`, 128vh) positions the
 * device; the canvas inside it (`.xh-phone-bleed`, ~160vh) bleeds far past
 * the box on every side so the model can never be cut off by the canvas
 * edge — the section's `overflow: clip` does all the visible cropping. The
 * camera distance is scaled to the taller canvas (fov 38 at z 8.25, was
 * z 6.6 at 128vh) so the device still spans ~113vh on screen, taller than
 * any viewport.
 */
export default function HeroPhoneScene() {
  return (
    <PhoneMockup
      variant="s26ultra"
      float
      camera={{ position: [0, 0.1, 8.25], fov: 38 }}
      shadows={false}
      color="#12151c"
      frameColor="#565b64"
      surfaceBackground="#070a0f"
      rotation={[0, -0.3, 0]}
    >
      <StrideApp />
    </PhoneMockup>
  )
}
