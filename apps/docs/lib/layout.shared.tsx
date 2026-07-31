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
          <span
            style={{
              fontSize: 11,
              letterSpacing: '0.14em',
              color: 'var(--color-fd-muted-foreground)',
              border: '1px solid var(--color-fd-border)',
              borderRadius: 6,
              padding: '1px 7px',
              marginLeft: 2,
            }}
          >
            DOCS
          </span>
        </>
      ),
    },
    githubUrl: 'https://github.com/area-is/3d-mockups',
    links: [
      { text: 'Home', url: '/' },
      { text: 'Demos', url: '/demos' },
    ],
  }
}
