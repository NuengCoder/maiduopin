#!/usr/bin/env node
/**
 * Generates the placeholder cover art used by the mini program.
 *
 * Why: the previous build pointed every product at `picsum.photos`, which
 * returned a random photo per seed. That made images slow to appear (one
 * network round-trip per tile, 4 tiles per product) and made the artwork
 * unrelated to the product itself.
 *
 * The covers below are deterministic gradients encoded as base64 PNG data
 * URIs, so they render instantly, work offline, need no CDN domain
 * whitelisting, and carry a fixed colour per category. The product emoji
 * rendered on top of each cover is what makes the artwork readable.
 *
 * Usage:
 *   node scripts/gen-covers.js          # rewrite miniprogram/mock/covers.ts
 *   node scripts/gen-covers.js --check  # exit 1 if the file is out of date
 */

const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

// 16x16 is enough for a smooth gradient once the image component scales it up,
// and keeps every data URI around 600 bytes so list payloads stay small.
const SIZE = Number(process.env.COVER_SIZE) || 16
const OUT_FILE =
  process.env.COVER_OUT || path.join(__dirname, '..', 'miniprogram', 'mock', 'covers.ts')

/** from / to are the gradient stops, glow is the highlight tint. */
const TONES = {
  c1: { from: '#FFE7C9', to: '#FFB067', glow: '#FFF6E8' },
  c2: { from: '#E6EAFF', to: '#A5B4FF', glow: '#F5F7FF' },
  c3: { from: '#DEEFFF', to: '#8CC6F6', glow: '#F0F9FF' },
  c4: { from: '#FFE2EE', to: '#FFA6C6', glow: '#FFF4F9' },
  c5: { from: '#EAF3E7', to: '#B0D5A9', glow: '#F7FBF5' },
  c6: { from: '#FFF3D8', to: '#FFD688', glow: '#FFFCF2' },
  c7: { from: '#E0F6F0', to: '#90DAC5', glow: '#F3FDFA' },
  c8: { from: '#F4E8DC', to: '#D0AA87', glow: '#FDF6EF' },
  'banner-fresh': { from: '#FFD9A6', to: '#FF7E4F', glow: '#FFF0DC' },
  'banner-digital': { from: '#CFE4FF', to: '#5E9BEF', glow: '#EAF4FF' },
  'banner-home': { from: '#E8E2FF', to: '#9B7CF6', glow: '#F6F2FF' },
}

const VARIANTS = 3

const hexToRgb = (hex) => {
  const value = hex.replace('#', '')
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ]
}

const lerp = (a, b, t) => a + (b - a) * t
const clamp = (value) => (value < 0 ? 0 : value > 255 ? 255 : Math.round(value))

// --- minimal PNG encoder (RGBA, 8 bit, no dependencies) --------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
})()

const crc32 = (buffer) => {
  let crc = -1
  for (let i = 0; i < buffer.length; i += 1) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ -1) >>> 0
}

const chunk = (type, data) => {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([length, body, crc])
}

const encodePng = (width, height, pixels) => {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: truecolour + alpha
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // adaptive filtering
  ihdr[12] = 0 // no interlace

  // Filter type 1 ("Sub") keeps the data URIs ~4x smaller than unfiltered
  // rows, which matters because these strings ship inside the app package.
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1)
    raw[rowStart] = 1
    for (let i = 0; i < stride; i += 1) {
      const value = pixels[y * stride + i]
      const left = i >= 4 ? pixels[y * stride + i - 4] : 0
      raw[rowStart + 1 + i] = (value - left) & 0xff
    }
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// --- gradient painting -----------------------------------------------------

const paint = (tone, variant) => {
  const { from, to, glow } = TONES[tone]
  const [fr, fg, fb] = hexToRgb(from)
  const [tr, tg, tb] = hexToRgb(to)
  const [gr, gg, gb] = hexToRgb(glow)

  // Each variant rotates the gradient and moves the highlight so the three
  // gallery images of one product do not look identical.
  const angle = (variant * 2 * Math.PI) / VARIANTS + Math.PI / 5
  const dirX = Math.cos(angle)
  const dirY = Math.sin(angle)
  const glowX = 0.24 + 0.52 * variant * 0.5
  const glowY = 0.22 + 0.4 * (variant % 2)

  const pixels = Buffer.alloc(SIZE * SIZE * 4)
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      const nx = x / (SIZE - 1)
      const ny = y / (SIZE - 1)
      const t = Math.min(1, Math.max(0, 0.5 + (nx - 0.5) * dirX + (ny - 0.5) * dirY))
      const ease = t * t * (3 - 2 * t)

      let r = lerp(fr, tr, ease)
      let g = lerp(fg, tg, ease)
      let b = lerp(fb, tb, ease)

      // soft radial highlight
      const dx = nx - glowX
      const dy = ny - glowY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const light = Math.max(0, 1 - dist / 0.75) ** 2 * 0.42
      r = lerp(r, gr, light)
      g = lerp(g, gg, light)
      b = lerp(b, gb, light)

      // gentle corner vignette keeps tiles from looking flat
      const vx = Math.abs(nx - 0.5) * 2
      const vy = Math.abs(ny - 0.5) * 2
      const vignette = Math.max(0, Math.sqrt(vx * vx + vy * vy) - 0.75) * 0.12
      r *= 1 - vignette
      g *= 1 - vignette
      b *= 1 - vignette

      const offset = (y * SIZE + x) * 4
      pixels[offset] = clamp(r)
      pixels[offset + 1] = clamp(g)
      pixels[offset + 2] = clamp(b)
      pixels[offset + 3] = 255
    }
  }

  return encodePng(SIZE, SIZE, pixels)
}

const build = () => {
  const entries = []
  for (const tone of Object.keys(TONES)) {
    const variants = tone.startsWith('banner-') ? 1 : VARIANTS
    for (let variant = 1; variant <= variants; variant += 1) {
      const key = variants === 1 ? tone : `${tone}-${variant}`
      const base64 = paint(tone, variant).toString('base64')
      entries.push(`  '${key}':\n    'data:image/png;base64,${base64}',`)
    }
  }

  return `/**
 * AUTO-GENERATED FILE - do not edit by hand.
 * Regenerate with: npm run covers   (node scripts/gen-covers.js)
 *
 * Deterministic ${SIZE}x${SIZE} gradient covers rendered as base64 PNG data
 * URIs. They replace the old random \`picsum.photos\` seeds so product artwork
 * is instant, offline and consistent between sessions.
 */
export const COVERS: Record<string, string> = {
${entries.join('\n')}
}

export const COVER_TONES = [
${Object.keys(TONES)
  .filter((tone) => !tone.startsWith('banner-'))
  .map((tone) => `  '${tone}',`)
  .join('\n')}
] as const
`
}

const output = build()
const check = process.argv.includes('--check')

if (check) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : ''
  if (current !== output) {
    console.error('covers.ts is out of date - run: node scripts/gen-covers.js')
    process.exit(1)
  }
  console.log('covers.ts is up to date.')
  process.exit(0)
}

fs.writeFileSync(OUT_FILE, output)
const kb = (Buffer.byteLength(output) / 1024).toFixed(1)
console.log(`Wrote ${path.relative(process.cwd(), OUT_FILE)} (${Object.keys(TONES).length} tones, ${kb} KB).`)
