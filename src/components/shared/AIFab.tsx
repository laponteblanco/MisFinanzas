"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

import { Mic } from "lucide-react";

interface AIFabProps {
  onClick: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  hidden?: boolean;
  title?: string;
  dataTour?: string;
  isDictating?: boolean;
}

const TAU = Math.PI * 2;

export function AIFab({ onClick, onLongPress, disabled, hidden, title, dataTour, isDictating }: AIFabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const animRef   = useRef<number>(0);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    isLongPressTriggered.current = false;
    if (onLongPress) {
      pressTimer.current = setTimeout(() => {
        isLongPressTriggered.current = true;
        onLongPress();
      }, 600); // 600ms for long press
    }
  };

  const handlePointerUpOrLeave = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
      if (isLongPressTriggered.current) {
          e.preventDefault();
          return;
      }
      onClick();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const button = buttonRef.current;
    if (!canvas || !button) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const DPR  = Math.min(window.devicePixelRatio || 1, 2);
    const SIZE = 90; // slightly larger for JARVIS HUD details
    canvas.width        = SIZE * DPR;
    canvas.height       = SIZE * DPR;
    canvas.style.width  = SIZE + "px";
    canvas.style.height = SIZE + "px";
    ctx.scale(DPR, DPR);

    const cx = SIZE / 2, cy = SIZE / 2;

    /* ── Holographic 3D Data Nodes (Jarvis atoms) ── */
    const N = 40; // fewer but more complex nodes (crosshairs, hex vertices)
    const nodes = Array.from({ length: N }, (_, i) => {
      const angle = Math.random() * TAU;
      const pitch = (Math.random() - 0.5) * Math.PI;
      const r = 18 + Math.random() * 12;
      return {
        x: Math.cos(angle) * Math.cos(pitch),
        y: Math.sin(pitch),
        z: Math.sin(angle) * Math.cos(pitch),
        scale: r,
        pulseOff: Math.random() * TAU,
        isOrange: Math.random() < 0.2, // Jarvis signature orange telemetry accents
      };
    });

    let rotY = 0, rotX = 0;
    let t = 0, lastTs = 0;

    // Interactive mouse rotation speeds
    let targetSpeedY = 0.4;
    let targetSpeedX = 0.15;
    let currentSpeedY = 0.4;
    let currentSpeedX = 0.15;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width - 0.5;
      const my = (e.clientY - rect.top) / rect.height - 0.5;
      targetSpeedY = 0.4 + mx * 4;
      targetSpeedX = 0.15 + my * 4;
    };

    const handleMouseLeave = () => {
      targetSpeedY = 0.4;
      targetSpeedX = 0.15;
    };

    button.addEventListener("mousemove", handleMouseMove);
    button.addEventListener("mouseleave", handleMouseLeave);

    /* ── Main draw loop ── */
    function draw(ts: number) {
      if (!ctx) return;
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      t += dt;

      currentSpeedY += (targetSpeedY - currentSpeedY) * 0.1;
      currentSpeedX += (targetSpeedX - currentSpeedX) * 0.1;

      rotY += dt * currentSpeedY;
      rotX += dt * currentSpeedX;

      ctx.clearRect(0, 0, SIZE, SIZE);

      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

      // Jarvis dynamic breathing scale
      const breathe = 1 + 0.04 * Math.sin(t * 1.5);
      
      // Cybernetic colors
      const colorCyan = "rgba(0, 245, 255, 0.85)";
      const colorOrange = "rgba(255, 110, 0, 0.85)";

      /* ── 1. Outer JARVIS HUD Rings ── */
      ctx.save();
      // Outer compass/telemetry dashed ring
      ctx.beginPath();
      ctx.arc(cx, cy, 38 * breathe, 0, TAU);
      ctx.strokeStyle = "rgba(0, 245, 255, 0.18)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 12]);
      ctx.stroke();

      // Middle spin ring with degree ticks
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.8);
      ctx.beginPath();
      ctx.arc(0, 0, 34 * breathe, 0, Math.PI * 1.6); // arc gap
      ctx.strokeStyle = "rgba(0, 245, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Mini tick marks
      for (let d = 0; d < 8; d++) {
        ctx.rotate(TAU / 8);
        ctx.beginPath();
        ctx.moveTo(31 * breathe, 0);
        ctx.lineTo(34 * breathe, 0);
        ctx.strokeStyle = colorCyan;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Opposite rotating orange alert sub-ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-t * 1.2);
      ctx.beginPath();
      ctx.arc(0, 0, 31 * breathe, 0, Math.PI * 0.4);
      ctx.strokeStyle = "rgba(255, 110, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.restore();

      /* ── 2. 3D Holographic Data Matrix (Front/Back sorted) ── */
      const proj = nodes.map(n => {
        const rx = n.x * n.scale * breathe;
        const ry = n.y * n.scale * breathe;
        const rz = n.z * n.scale * breathe;

        const x1 = rx * cosY + rz * sinY;
        const z1 = -rx * sinY + rz * cosY;
        const y1 = ry * cosX - z1 * sinX;
        const z2 = ry * sinX + z1 * cosX;

        const FOV = 180;
        const persp = FOV / (FOV + z2);

        return {
          sx: cx + x1 * persp,
          sy: cy + y1 * persp,
          z: z2,
          isOrange: n.isOrange,
          pulse: 1 + 0.3 * Math.sin(t * 4 + n.pulseOff),
        };
      });

      proj.sort((a, b) => a.z - b.z);

      proj.forEach(p => {
        const depthAlpha = Math.max(0.15, (p.z + 30) / 60);
        const col = p.isOrange ? colorOrange : colorCyan;

        ctx.save();
        ctx.globalAlpha = depthAlpha * 0.8;

        // Draw HUD atom crosshairs or dot matrices
        if (p.isOrange) {
          // Diagnostic orange cross
          ctx.beginPath();
          ctx.moveTo(p.sx - 3, p.sy); ctx.lineTo(p.sx + 3, p.sy);
          ctx.moveTo(p.sx, p.sy - 3); ctx.lineTo(p.sx, p.sy + 3);
          ctx.strokeStyle = col;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Circular telemetry node
          ctx.beginPath();
          ctx.arc(p.sx, p.sy, 2 * p.pulse, 0, TAU);
          ctx.fillStyle = col;
          ctx.fill();

          // Diagnostic outer scope ring
          if (p.pulse > 1.15) {
            ctx.beginPath();
            ctx.arc(p.sx, p.sy, 4.5 * p.pulse, 0, TAU);
            ctx.strokeStyle = "rgba(0, 245, 255, 0.4)";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
        ctx.restore();
      });

      /* ── 3. Central Arc Reactor Core ── */
      ctx.save();
      ctx.translate(cx, cy);

      // Reactor outer pulsing core
      const coreR = 12 * breathe;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "rgba(0, 245, 255, 0.85)";

      // Arc reactor segments (triangular structure)
      ctx.rotate(t * 0.5);
      for (let s = 0; s < 3; s++) {
        ctx.rotate(TAU / 3);
        ctx.beginPath();
        ctx.arc(0, 0, coreR, -0.3, 0.3);
        ctx.strokeStyle = colorCyan;
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }

      // Reactor center hub
      ctx.beginPath();
      ctx.arc(0, 0, 5 * breathe, 0, TAU);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.strokeStyle = colorCyan;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();

      /* ── 4. Glowing HUD Target Corner brackets ── */
      ctx.save();
      const cornerD = 23 * breathe;
      const cornerL = 5;
      ctx.strokeStyle = "rgba(0, 245, 255, 0.6)";
      ctx.lineWidth = 1.5;

      // Top Left
      ctx.beginPath();
      ctx.moveTo(cx - cornerD + cornerL, cy - cornerD);
      ctx.lineTo(cx - cornerD, cy - cornerD);
      ctx.lineTo(cx - cornerD, cy - cornerD + cornerL);
      ctx.stroke();

      // Top Right
      ctx.beginPath();
      ctx.moveTo(cx + cornerD - cornerL, cy - cornerD);
      ctx.lineTo(cx + cornerD, cy - cornerD);
      ctx.lineTo(cx + cornerD, cy - cornerD + cornerL);
      ctx.stroke();

      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(cx - cornerD + cornerL, cy + cornerD);
      ctx.lineTo(cx - cornerD, cy + cornerD);
      ctx.lineTo(cx - cornerD, cy + cornerD - cornerL);
      ctx.stroke();

      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(cx + cornerD - cornerL, cy + cornerD);
      ctx.lineTo(cx + cornerD, cy + cornerD);
      ctx.lineTo(cx + cornerD, cy + cornerD - cornerL);
      ctx.stroke();

      ctx.restore();

      /* ── 5. Plus Icon or Mic HUD overlay ── */
      const plusAlpha = 0.85 + 0.15 * Math.sin(t * 3);
      
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(0, 245, 255, 0.9)";
      ctx.globalAlpha = plusAlpha;

      if (!isDictating) {
          const armL = 8.5;
          const armW = 2.5;
          // Draw cyber plus
          ctx.fillRect(cx - armL, cy - armW / 2, armL * 2, armW);
          ctx.fillRect(cx - armW / 2, cy - armL, armW, armL * 2);
      }
      ctx.restore();

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      button.removeEventListener("mousemove", handleMouseMove);
      button.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  if (hidden) return null;

  return (
    <button
      ref={buttonRef}
      id="ai-fab"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUpOrLeave}
      onPointerLeave={handlePointerUpOrLeave}
      disabled={disabled}
      data-tour={dataTour}
      title={title}
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      className={cn(
        "ai-orb-fab flex items-center justify-center",
        "fixed bottom-[4.5rem] right-6 md:bottom-10 md:right-10 z-[600]",
        "cursor-pointer select-none border-none outline-none bg-transparent p-0",
        disabled && "opacity-40 cursor-not-allowed grayscale"
      )}
    >
      <canvas ref={canvasRef} className="block rounded-full absolute inset-0 w-full h-full" />
      {isDictating && (
         <div className="absolute inset-0 flex items-center justify-center z-10 text-white drop-shadow-[0_0_10px_rgba(0,245,255,0.8)] pointer-events-none">
             <Mic size={32} className="animate-pulse" />
         </div>
      )}
    </button>
  );
}


