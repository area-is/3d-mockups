'use client'

import dynamic from 'next/dynamic'

// WebGL only exists in the browser, so skip SSR for the carousel scene.
const CarouselScene = dynamic(() => import('./scenes/carousel-scene'), {
  ssr: false,
  loading: () => (
    <div className="carousel-stage">
      <div className="carousel-loading">Warming up the GPU…</div>
    </div>
  ),
})

export function HeroCarousel() {
  return <CarouselScene />
}
