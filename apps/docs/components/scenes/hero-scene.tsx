'use client'

import { GalaxyMockup } from 'area-mockups'
import { MusicPlayer } from '../screens/music-player'

export default function HeroScene() {
  return (
    <GalaxyMockup
      float
      color="#15171d"
      frameColor="#4d5260"
      surfaceBackground="#05060a"
      rotation={[0, -0.32, 0]}
    >
      <MusicPlayer />
    </GalaxyMockup>
  )
}
