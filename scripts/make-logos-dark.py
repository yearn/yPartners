#!/usr/bin/env python3
"""Convert every SVG in public/partner-logos/ to a monochrome dark (#161818)
version written into public/partner-logos-dark/.

We do NOT swap fill/stroke colours (that fails on the raster PNG embedded in
trueo-logo.svg and is fragile across hundreds of flat colours in Curve.svg).
Instead we wrap all rendered content in a group carrying an feColorMatrix
filter that maps every pixel to #161818 while preserving its alpha. This
uniformly handles vector fills, strokes, inline styles and raster images.

#161818 matches cap.svg, the logo that is already monochrome dark in the set.
"""
import re
import sys
import xml.dom.minidom
from pathlib import Path

# #161818 -> normalised 0..1
R, G, B = (c / 255 for c in (0x16, 0x18, 0x18))

FILTER = (
    '  <defs>\n'
    f'    <filter id="mono-dark" color-interpolation-filters="sRGB">\n'
    f'      <feColorMatrix type="matrix" '
    f'values="0 0 0 0 {R:.5f} 0 0 0 0 {G:.5f} 0 0 0 0 {B:.5f} 0 0 0 1 0"/>\n'
    '    </filter>\n'
    '  </defs>\n'
    '  <g filter="url(#mono-dark)">\n'
)

MARKER = '<!-- make-logos-dark:monochrome -->\n'

SRC = Path('public/partner-logos')
DST = Path('public/partner-logos-dark')


def convert(text: str, name: str) -> str:
    # Inject the marker + filter defs + opening group right after root <svg ...>.
    text, n = re.subn(r'(<svg\b[^>]*>)', r'\1\n' + MARKER + FILTER, text, count=1)
    if n != 1:
        raise ValueError(f'{name}: could not find root <svg> opening tag')

    # Close the group just before the final </svg>.
    idx = text.rfind('</svg>')
    if idx == -1:
        raise ValueError(f'{name}: could not find closing </svg>')
    text = text[:idx] + '  </g>\n' + text[idx:]
    return text


def main() -> int:
    DST.mkdir(parents=True, exist_ok=True)
    files = sorted(SRC.glob('*.svg'))
    if not files:
        print(f'no SVGs found in {SRC}', file=sys.stderr)
        return 1

    ok = 0
    for f in files:
        original = f.read_text(encoding='utf-8')
        converted = convert(original, f.name)

        # Validate well-formedness.
        try:
            xml.dom.minidom.parseString(converted)
        except Exception as e:  # noqa: BLE001
            print(f'  ✗ {f.name}: produced invalid XML ({e})', file=sys.stderr)
            return 1

        (DST / f.name).write_text(converted, encoding='utf-8')
        ok += 1
        print(f'  ✓ {f.name}')

    print(f'\n{ok}/{len(files)} logos written to {DST}/')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
