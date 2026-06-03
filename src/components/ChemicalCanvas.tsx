"use client";

import React, { useEffect, useRef } from "react";

export default function ChemicalCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      label?: string;
    }> = [];

    // Chemical elements to scatter
    const elements = ["C", "H", "O", "N", "OH", "CH3", "NH2"];

    // Initialize particles
    const particleCount = Math.min(60, Math.floor((width * height) / 25000));
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1.5,
        label: Math.random() > 0.75 ? elements[Math.floor(Math.random() * elements.length)] : undefined,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Draw frame
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Check if dark mode is active
      const isDark = document.documentElement.classList.contains("dark");
      
      // Node and line color schemes
      const nodeColor = isDark ? "rgba(167, 139, 250, 0.4)" : "rgba(109, 40, 217, 0.2)";
      const labelColor = isDark ? "rgba(167, 139, 250, 0.7)" : "rgba(109, 40, 217, 0.5)";
      const lineColor = isDark ? "rgba(139, 92, 246, 0.12)" : "rgba(109, 40, 217, 0.06)";

      // Draw connection lines
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.strokeStyle = lineColor;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes and atomic labels
      particles.forEach((p) => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = nodeColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        if (p.label) {
          ctx.font = "10px Outfit, Inter, sans-serif";
          ctx.fillStyle = labelColor;
          ctx.fillText(p.label, p.x + 8, p.y + 4);
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}
