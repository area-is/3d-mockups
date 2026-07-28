import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { Logo } from '@/components/logo'

/** Shared options for the Fumadocs layouts under /docs. */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Logo size={26} style={{ flexShrink: 0 }} />
          area-3d-mockups
        </>
      ),
    },
    githubUrl: 'https://github.com/subwaymatch/area-mockups',
    links: [
      { text: 'Home', url: '/' },
      { text: 'Demos', url: '/demos' },
    ],
  }
}
