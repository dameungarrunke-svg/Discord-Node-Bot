// @ts-ignore
import GifEncoder from "gif-encoder-2";

const WIDTH = 400;
const HEIGHT = 44;
const FRAME_COUNT = 30;
const FRAME_DELAY = 40;

const BG_R = 0x2b, BG_G = 0x2d, BG_B = 0x31;
const BAR_R = 0x3c, BAR_G = 0x3e, BAR_B = 0x44;

const BARS = [
  { x: 0, y: 6,  w: 380, h: 12 },
  { x: 0, y: 24, w: 230, h: 12 },
];

function createFrame(shimmerX: number): number[] {
  const pixels: number[] = [];

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      let r = BG_R, g = BG_G, b = BG_B;

      for (const bar of BARS) {
        if (x >= bar.x && x < bar.x + bar.w && y >= bar.y && y < bar.y + bar.h) {
          r = BAR_R; g = BAR_G; b = BAR_B;

          const dist = x - shimmerX;
          if (dist > -100 && dist < 100) {
            const t = 1 - Math.abs(dist) / 100;
            const boost = Math.round(t * t * 90);
            r = Math.min(255, r + boost);
            g = Math.min(255, g + boost);
            b = Math.min(255, b + boost);
          }
          break;
        }
      }

      pixels.push(r, g, b, 255);
    }
  }

  return pixels;
}

let _cache: Buffer | null = null;

export async function getShimmerGif(): Promise<Buffer> {
  if (_cache) return _cache;

  _cache = await new Promise<Buffer>((resolve, reject) => {
    const encoder = new GifEncoder(WIDTH, HEIGHT);
    const readable = encoder.createReadStream();
    const chunks: Buffer[] = [];

    readable.on("data", (chunk: Buffer) => chunks.push(chunk));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);

    encoder.setDelay(FRAME_DELAY);
    encoder.setRepeat(0);
    encoder.start();

    for (let f = 0; f < FRAME_COUNT; f++) {
      const shimmerX = -100 + (f / FRAME_COUNT) * (WIDTH + 200);
      encoder.addFrame(createFrame(shimmerX));
    }

    encoder.finish();
  });

  return _cache;
}
