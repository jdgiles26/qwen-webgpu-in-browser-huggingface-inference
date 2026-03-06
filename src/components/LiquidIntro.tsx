/**
 * Liquid effect adapted from https://www.framer.com/@kevin-levron/
 */
import { useEffect, useRef, useCallback, useState } from "react";
import LiquidBackground from "../utils/liquid1.min.js";

type LiquidApp = ReturnType<typeof LiquidBackground>;

interface LiquidIntroProps {
  onEnter: () => void;
}

export function LiquidIntro({ onEnter }: LiquidIntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<LiquidApp | null>(null);
  const [fading, setFading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let disposed = false;

    async function init() {
      if (disposed || !canvasRef.current) return;

      const app = LiquidBackground(canvasRef.current);
      appRef.current = app;

      app.loadImage("/liquid-dark.webp");
      app.liquidPlane.material.metalness = 0.94;
      app.liquidPlane.material.roughness = 0.22;
      app.liquidPlane.uniforms.displacementScale.value = 6.8;
      app.setRain(false);

      setTimeout(() => {
        if (!disposed) setReady(true);
      }, 300);
    }

    init();

    return () => {
      disposed = true;
      if (appRef.current) {
        appRef.current.dispose();
        appRef.current = null;
      }
    };
  }, []);

  const handleClick = useCallback(() => {
    if (fading) return;
    setFading(true);
    setTimeout(() => {
      if (appRef.current) {
        appRef.current.dispose();
        appRef.current = null;
      }
      onEnter();
    }, 600);
  }, [fading, onEnter]);

  return (
    <div className="absolute inset-0 z-30 cursor-pointer overflow-hidden" onClick={handleClick}>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        style={{ filter: "saturate(1.28) brightness(1.06) contrast(1.04)" }}
      />

      <div className="liquid-intro-overlay absolute inset-0" />
      <div className="liquid-intro-vignette absolute inset-0" />

      <div
        className={`absolute inset-0 bg-[#ecf9ff] transition-opacity duration-600 pointer-events-none ${
          fading ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
