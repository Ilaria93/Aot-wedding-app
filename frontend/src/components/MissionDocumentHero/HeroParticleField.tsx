import { useEffect, useRef } from 'react';

type Petal = {
  x: number;
  y: number;
  size: number;
  speed: number;
  swayAmplitude: number;
  swayPhase: number;
  swaySpeed: number;
  spin: number;
  angle: number;
  colour: string;
  alpha: number;
};

/** Sunset petal colours lifted from the wedding artwork. */
const PETAL_COLOURS = [
  '#b0322a',
  '#d9603e',
  '#f4b183',
  '#e8a0bf',
  '#f4d06a',
  '#c25a4a',
  '#db7fb0',
] as const;

function createPetal(width: number, height: number, startAbove: boolean): Petal {
  const size = 5 + Math.random() * 9;
  return {
    x: Math.random() * width,
    y: startAbove ? -size - Math.random() * height : Math.random() * height,
    size,
    speed: 14 + Math.random() * 26,
    swayAmplitude: 8 + Math.random() * 26,
    swayPhase: Math.random() * Math.PI * 2,
    swaySpeed: 0.4 + Math.random() * 0.7,
    spin: (Math.random() - 0.5) * 1.4,
    angle: Math.random() * Math.PI * 2,
    colour: PETAL_COLOURS[Math.floor(Math.random() * PETAL_COLOURS.length)],
    alpha: 0.55 + Math.random() * 0.4,
  };
}

/** Petals drifting down over the sunset hero. Respects prefers-reduced-motion. */
export function HeroParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let petals: Petal[] = [];
    let rafId = 0;
    let lastFrame = 0;
    let width = 0;
    let height = 0;

    function resize() {
      const rect = container!.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      const count = Math.max(22, Math.min(48, Math.round((width * height) / 22_000)));
      petals = Array.from({ length: count }, () => createPetal(width, height, false));
    }

    function drawPetal(petal: Petal) {
      const swayX = Math.sin(petal.swayPhase) * petal.swayAmplitude;
      ctx!.save();
      ctx!.translate(petal.x + swayX, petal.y);
      ctx!.rotate(petal.angle);
      ctx!.globalAlpha = petal.alpha;
      ctx!.fillStyle = petal.colour;
      // Teardrop petal: two mirrored curves meeting at tip and base.
      ctx!.beginPath();
      ctx!.moveTo(0, -petal.size);
      ctx!.bezierCurveTo(petal.size * 0.8, -petal.size * 0.4, petal.size * 0.6, petal.size * 0.7, 0, petal.size);
      ctx!.bezierCurveTo(-petal.size * 0.6, petal.size * 0.7, -petal.size * 0.8, -petal.size * 0.4, 0, -petal.size);
      ctx!.fill();
      ctx!.restore();
    }

    function frame(now: number) {
      const deltaSeconds = lastFrame === 0 ? 0.016 : Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      ctx!.clearRect(0, 0, width, height);

      for (const petal of petals) {
        petal.y += petal.speed * deltaSeconds;
        petal.swayPhase += petal.swaySpeed * deltaSeconds;
        petal.angle += petal.spin * deltaSeconds;

        if (petal.y - petal.size > height) {
          Object.assign(petal, createPetal(width, height, true));
          petal.y = -petal.size;
        }

        drawPetal(petal);
      }

      rafId = requestAnimationFrame(frame);
    }

    function renderStill() {
      ctx!.clearRect(0, 0, width, height);
      for (const petal of petals) {
        drawPetal(petal);
      }
    }

    function start() {
      cancelAnimationFrame(rafId);
      if (reduceMotion.matches) {
        renderStill();
        return;
      }
      lastFrame = 0;
      rafId = requestAnimationFrame(frame);
    }

    resize();
    seed();
    start();

    const handleResize = () => {
      resize();
      seed();
      start();
    };
    window.addEventListener('resize', handleResize);
    reduceMotion.addEventListener('change', start);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      reduceMotion.removeEventListener('change', start);
    };
  }, []);

  return <canvas ref={canvasRef} className="mission-hero__particles" aria-hidden />;
}
