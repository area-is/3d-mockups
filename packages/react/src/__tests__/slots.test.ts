import * as React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { collectSlots, createSlots } from '../slots'
import { SCREEN_REGIONS } from '../core/regions'
import { BOOK_REGIONS } from '../core/objects/book/dimensions'
import { A_FRAME_SIGN_REGIONS } from '../core/objects/a-frame-sign/dimensions'

/*
 * A slot names its region, and slots used to be matched by that name alone:
 * `<AFrameSignMockup.Back>` inside `<BookMockup>` put the sign's content on
 * the book's back cover, silently, because both have a `back`.
 */
const book = createSlots(BOOK_REGIONS)
const sign = createSlots(A_FRAME_SIGN_REGIONS)

describe('collectSlots', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('takes its own slots', () => {
    const slots = collectSlots(React.createElement(book.Back, null, 'blurb'), BOOK_REGIONS)
    expect(slots.back?.children).toBe('blurb')
  })

  it('refuses another mockup’s slot even when the region name matches, and says so', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const slots = collectSlots(React.createElement(sign.Back, null, 'menu'), BOOK_REGIONS)
    expect(slots.back).toBeUndefined()
    expect(warn.mock.calls[0]![0]).toMatch(/<Back> is a slot of another mockup.*<Cover>, <Back>, <Spine>/)
  })

  it('shares slots between mockups with the same regions - every device has one Screen', () => {
    const galaxy = createSlots(SCREEN_REGIONS)
    const iphone = createSlots(SCREEN_REGIONS)
    const slots = collectSlots(React.createElement(galaxy.Screen, null, 'app'), SCREEN_REGIONS)
    expect(slots.screen?.children).toBe('app')
    expect(collectSlots(React.createElement(iphone.Screen, null, 'app'), SCREEN_REGIONS).screen).toBeDefined()
  })
})
