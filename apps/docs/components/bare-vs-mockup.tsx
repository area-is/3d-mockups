import Link from 'next/link'

/**
 * The `<Object>` vs `<ObjectMockup>` explainer every object page carries.
 *
 * The pair is the first thing a page names and the thing most likely to be
 * misread: `<BookMockup>` looks like a decorated `<Book>`, when in fact one is
 * a DOM element that owns a WebGL canvas and the other is geometry that has to
 * be put inside one. Getting that backwards produces the two failures people
 * actually hit, a bare object rendered outside a canvas and a mockup nested in
 * a canvas it then duplicates, so the answer belongs on the page someone is
 * already reading rather than only in `/docs/composing`.
 *
 * Prose here, code in the pages: the snippet is per-object and belongs in the
 * MDX where it gets the same highlighting as every other example, while the
 * explanation is identical everywhere and would rot in 46 copies.
 */
export function BareVsMockup({
  /** The bare object component, e.g. `IPad`. The mockup name is derived. */
  object,
  /** Registry key for `mockupInfo`, e.g. `ipad`. */
  kind,
  /** The object's primary slot, e.g. `Screen` for a device, `Cover` for a book. */
  slot,
}: {
  object: string
  kind: string
  slot: string
}) {
  const mockup = `${object}Mockup`
  return (
    <>
      <p>
        <strong>
          <code>{`<${mockup}>`}</code> is the whole picture.
        </strong>{' '}
        It renders its own WebGL canvas and everything around the model: the
        lighting rig, the ground shadow, drag-to-orbit controls, and a camera
        already framed on this object. It behaves like any other element in
        your layout, so you give it a size with <code>className</code> or{' '}
        <code>style</code> and drop it into a page.
      </p>
      <p>
        <strong>
          <code>{`<${object}>`}</code> is only the model.
        </strong>{' '}
        It renders geometry into a canvas that already exists, so it has to sit
        inside a <Link href="/docs/api/mockup-canvas">{'<MockupCanvas>'}</Link>{' '}
        or any react-three-fiber <code>{'<Canvas>'}</code> you already have. On
        its own, outside a canvas, it renders nothing. What you get back is the
        rest of the scene: several objects, your own meshes, your own lighting
        and one shared WebGL context instead of one per mockup.
      </p>
      <p>
        <strong>Both take the same object props.</strong> Every prop in the
        table on this page means the same thing on either component, transforms
        (<code>position</code>, <code>rotation</code>, <code>scale</code>)
        included. <code>{`<${mockup}>`}</code> accepts a few more, and they are
        all about the stage rather than the object: <code>float</code>, plus the{' '}
        <code>controls</code>, <code>autoRotate</code>, <code>zoom</code>,{' '}
        <code>fullscreen</code>, <code>shadows</code>, <code>background</code>,{' '}
        <code>camera</code>, <code>className</code> and <code>style</code> props
        it hands to its canvas.
      </p>
      <p>
        <strong>Slots are on both; measuring is not.</strong>{' '}
        <code>{`<${mockup}.${slot}>`}</code> and{' '}
        <code>{`<${object}.${slot}>`}</code> are the same component, as is every
        other slot this object has. The measurement statics{' '}
        <code>{`${mockup}.info()`}</code> and <code>{`${mockup}.regions`}</code>{' '}
        exist only on the mockup; to measure the bare object, call{' '}
        <Link href="/docs/api/mockup-info">
          <code>{`mockupInfo('${kind}')`}</code>
        </Link>
        .
      </p>
    </>
  )
}
