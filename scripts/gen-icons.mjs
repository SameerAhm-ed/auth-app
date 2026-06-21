// One-time PWA icon generation from the brand hexagon mark.
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const BRAND = '#3f3f46'
const LOGO = 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'

// size = logo box size on a 512 canvas; sw = stroke width (in 24-unit logo coords)
const svg = (logoSize, sw) => {
  const scale = logoSize / 24
  const t = (512 - logoSize) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BRAND}"/>
  <g transform="translate(${t},${t}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">
    <path d="${LOGO}"/>
  </g>
</svg>`
}

const any = Buffer.from(svg(300, 1.6))
const maskable = Buffer.from(svg(230, 1.8)) // smaller → inside the maskable safe zone

await mkdir('public/icons', { recursive: true })
await sharp(any).resize(512, 512).png().toFile('public/icons/icon-512.png')
await sharp(any).resize(192, 192).png().toFile('public/icons/icon-192.png')
await sharp(any).resize(180, 180).png().toFile('public/icons/apple-touch-icon.png')
await sharp(maskable).resize(512, 512).png().toFile('public/icons/icon-maskable-512.png')

console.log('Icons generated in public/icons/')
