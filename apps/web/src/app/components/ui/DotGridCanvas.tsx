"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DotGridCanvasProps = {
  className?: string;
  densityDivisor?: number;
  maxNodes?: number;
  fps?: number;
  maxDistance?: number;
  nodeRadius?: number;
  nodeAlpha?: number;
  lineAlpha?: number;
  lineWidth?: number;
};

export default function DotGridCanvas({
  className = "absolute inset-0 h-full w-full",
  densityDivisor = 34000,
  maxNodes = 24,
  fps = 30,
  maxDistance = 85,
  nodeRadius = 1.6,
  nodeAlpha = 0.5,
  lineAlpha = 0.22,
  lineWidth = 0.65,
}: DotGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const visibleRef = useRef(true);
  const lastFrameRef = useRef(0);
  const nodesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number }>>([]);
  const [staticMode, setStaticMode] = useState(false);

  useEffect(() => {
    const evaluateMode = () => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const lowMemory =
        typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number" &&
        ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
      const lowCpu = typeof navigator.hardwareConcurrency === "number" && navigator.hardwareConcurrency <= 4;
      const smallViewport = window.innerWidth < 768;

      setStaticMode(reducedMotion || coarsePointer || lowMemory || lowCpu || smallViewport);
    };

    evaluateMode();

    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarseMq = window.matchMedia("(pointer: coarse)");
    const onMediaChange = () => evaluateMode();

    reducedMq.addEventListener("change", onMediaChange);
    coarseMq.addEventListener("change", onMediaChange);
    window.addEventListener("resize", evaluateMode);

    return () => {
      reducedMq.removeEventListener("change", onMediaChange);
      coarseMq.removeEventListener("change", onMediaChange);
      window.removeEventListener("resize", evaluateMode);
    };
  }, []);

  const initNodes = useCallback(
    (w: number, h: number) => {
      const count = Math.min(Math.floor((w * h) / densityDivisor), maxNodes);
      nodesRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
      }));
    },
    [densityDivisor, maxNodes]
  );

  useEffect(() => {
    if (staticMode) return;

    const cvs = canvasRef.current;
    if (!cvs) return;

    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    let running = true;
    const frameGap = 1000 / Math.max(1, fps);
    let w = (cvs.width = cvs.offsetWidth);
    let h = (cvs.height = cvs.offsetHeight);

    initNodes(w, h);

    const onResize = () => {
      w = cvs.width = cvs.offsetWidth;
      h = cvs.height = cvs.offsetHeight;
      initNodes(w, h);
    };

    const maxDist2 = maxDistance * maxDistance;

    const draw = (ts: number) => {
      if (!running || !visibleRef.current) {
        animRef.current = 0;
        return;
      }
      animRef.current = requestAnimationFrame(draw);
      if (ts - lastFrameRef.current < frameGap) return;
      lastFrameRef.current = ts;

      ctx.clearRect(0, 0, w, h);
      const nodes = nodesRef.current;

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < maxDist2) {
            const alpha = (1 - Math.sqrt(dist2) / maxDistance) * lineAlpha;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(84,91,255,${alpha})`;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(84,91,255,${nodeAlpha})`;
        ctx.fill();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const isVisible = Boolean(entry?.isIntersecting);
        visibleRef.current = isVisible;

        if (!isVisible) {
          if (animRef.current !== 0) {
            cancelAnimationFrame(animRef.current);
            animRef.current = 0;
          }
          return;
        }

        if (animRef.current === 0) {
          animRef.current = requestAnimationFrame(draw);
        }
      },
      { threshold: 0.01 }
    );

    observer.observe(cvs);

    window.addEventListener("resize", onResize);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [fps, initNodes, lineAlpha, lineWidth, maxDistance, nodeAlpha, nodeRadius, staticMode]);

  if (staticMode) {
    return (
      <div
        className={className}
        style={{
          backgroundImage: "radial-gradient(circle, rgba(84,91,255,0.18) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.45,
        }}
      />
    );
  }

  return <canvas ref={canvasRef} className={className} />;
}
