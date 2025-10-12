"use client"
import React, { useEffect, useState } from "react";
import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Minus } from "lucide-react";

export default function InteractiveChatBotLauncher({
  onOpenChat,
  position = "bottom-right",
}: {
  onOpenChat?: () => void;
  position?: "bottom-right" | "bottom-left";
}) {
  const [hidden, setHidden] = useState(false);
  const waveCtrl = useAnimation();
  const blinkCtrl = useAnimation();
  const danceCtrl = useAnimation();
  const floatCtrl = useAnimation();
  const prefersReducedMotion = useReducedMotion();
  const isRight = position === "bottom-right";

  useEffect(() => {
    if (prefersReducedMotion || hidden) return;
    floatCtrl.start({ y: [0, -1, 0], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } });
    danceCtrl.start({ rotate: [3, -3, 3], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } });
    waveCtrl.start({ rotate: [20, -20, 20], transition: { repeat: Infinity, duration: 1.8, ease: "easeInOut" } });
    return () => { floatCtrl.stop(); danceCtrl.stop(); waveCtrl.stop(); };
  }, [prefersReducedMotion, hidden, floatCtrl, danceCtrl, waveCtrl]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    blinkCtrl.start({
      opacity: [0, 0, 1, 0],
      transition: { repeat: Infinity, duration: 4, times: [0, 0.88, 0.92, 1] },
    });
    return () => blinkCtrl.stop();
  }, [prefersReducedMotion, blinkCtrl]);

  return (
    <div
      aria-live="polite"
      className={`fixed z-[60] select-none ${isRight ? "right-6" : "left-6"} bottom-6`}
    >
      {/* Pull tab when hidden */}
      <Button
        asChild
        className={`absolute bottom-[120px] h-20 w-6 p-0 rounded-l-2xl rounded-r-sm shadow-lg
        bg-emerald-500/40 hover:bg-emerald-500 text-white transition-colors
        ${isRight ? "-right-1" : "-left-1 rotate-180"}
        ${hidden ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <motion.button
          type="button"
          aria-label={hidden ? "Open chat launcher" : "Hide chat launcher"}
          onClick={() => setHidden((v) => !v)}
          style={{ writingMode: "vertical-rl" }}
        >
          <span className="text-[10px] tracking-wider">AI CHAT</span>
        </motion.button>
      </Button>

      {/* Character wrapper */}
      <motion.div
        initial={false}
        animate={{ x: hidden ? (isRight ? 170 : -170) : 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative"
      >
        {/* Hide button — top right with minus icon */}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={() => setHidden(true)}
          className={`absolute -top-3 right-0 z-50
          h-6 w-6 rounded-full p-0
          ${hidden ? "opacity-0 pointer-events-none" : "opacity-100"} transition-opacity`}
        >
          <Minus className="h-4 w-4" />
        </Button>

        {/* Robot main button */}
        <motion.button
          type="button"
          onClick={() => onOpenChat?.()}
          whileTap={{ scale: 0.98 }}
          className="group relative flex items-end justify-center h-[160px] w-[100px]"
          aria-label="Open chat"
        >
          {/* Ground shadow */}
          <motion.div className="absolute bottom-5 h-2 w-11 rounded-full bg-black/10" animate={floatCtrl} />

          {/* Robot SVG */}
          <motion.svg
            width="160"
            height="160"
            viewBox="0 0 160 160"
            role="img"
            aria-hidden="true"
            className="drop-shadow-xl"
            animate={danceCtrl}
          >
            <defs>
              <linearGradient id="gBody" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#b9f3d5" />
                <stop offset="50%" stopColor="#5eead4" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
              <linearGradient id="gArm" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7de6d0" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
            </defs>

            {/* Antenna */}
            <g transform="translate(80,18)">
              <rect x={-12} y={6} width={24} height={10} rx={5} fill="#7ce3c5" />
              <line x1={0} y1={0} x2={0} y2={6} stroke="#55d3a9" strokeWidth={4} />
              <circle cx={0} cy={-4} r={5} fill="#fdf718" />
            </g>

            {/* Head */}
            <g transform="translate(80,56)">
              <rect x={-44} y={-30} width={88} height={60} rx={28} fill="url(#gBody)" />
              <path d="M30,-18 C40,-24 46,-18 38,-10" fill="#eafff6" opacity="0.85" />
              <circle cx={36} cy={-20} r={4} fill="#eafff6" opacity="0.95" />
              <rect x={-32} y={-14} width={64} height={28} rx={14} fill="#0a1220" />
              <circle cx={-14} cy={0} r={7} fill="#0ea5e9" />
              <circle cx={14} cy={0} r={7} fill="#0ea5e9" />
              <circle cx={-12} cy={-2} r={3} fill="#e2f7ff" />
              <circle cx={16} cy={-2} r={3} fill="#e2f7ff" />
              <motion.rect
                x={-32}
                y={-14}
                width={64}
                height={28}
                rx={14}
                fill="#0a1220"
                initial={{ opacity: 0 }}
                animate={blinkCtrl}
              />
              <path d="M-10,12 Q0,20 10,12" stroke="#16a34a" strokeWidth={4} fill="none" strokeLinecap="round" />
            </g>

            {/* Body */}
            <g transform="translate(80,104)">
              <rect x={-36} y={-22} width={72} height={44} rx={24} fill="url(#gBody)" />
            </g>

            {/* Left arm — anchored */}
            <motion.g transform="translate(44,108)" style={{ originX: 0, originY: 0.5 }} animate={waveCtrl}>
              <rect x={110} y={85} width={35} height={12} rx={10} fill="url(#gArm)" />
            </motion.g>

            {/* Right arm — original */}
            <g transform="translate(112,106)">
              <rect x={-90} y={-10} width={28} height={12} rx={10} fill="url(#gArm)" />
            </g>
          </motion.svg>
        </motion.button>
      </motion.div>
    </div>
  );
}
