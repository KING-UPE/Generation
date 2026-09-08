"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NewsletterCardProps {
  className?: string;
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  onSubscribe?: (email: string) => void;
}

export const NewsletterCard = React.forwardRef<HTMLDivElement, NewsletterCardProps>(
  (
    {
      className,
      title = "Want to stay in touch?",
      description = "Join our newsletter to get the latest news, updates and special offers.",
      placeholder = "ENTER YOUR E-MAIL",
      buttonText = "Subscribe",
      onSubscribe,
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [email, setEmail] = useState("");

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let animationFrameId: number;
      let offset = 0;

      const draw = () => {
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#0B0B0B";
        ctx.fillRect(0, 0, width, height);

        // Draw the wave pattern seen in the screenshot
        // This simulates the vertical flowing lines on the right side
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.5;

        const lineCount = 45;
        const spacing = 12;
        const startX = width * 0.4;

        for (let i = 0; i < lineCount; i++) {
          ctx.beginPath();
          const xBase = startX + i * spacing;

          for (let y = 0; y <= height; y += 5) {
            // Create the "S" curve distortion
            const distortion = Math.sin(y * 0.005 + offset + i * 0.1) * 40;
            const x = xBase + distortion + Math.pow(y / height, 2) * 150;

            if (y === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        offset += 0.005;
        animationFrameId = requestAnimationFrame(draw);
      };

      draw();

      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (onSubscribe) onSubscribe(email);
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-[546px] h-[536px] bg-[#0B0B0B] overflow-hidden flex flex-col justify-center px-[60px] font-['Manrope',sans-serif]",
          className,
        )}
      >
        {/* Background Canvas */}
        <canvas
          ref={canvasRef}
          width={546}
          height={536}
          className="absolute inset-0 pointer-events-none"
        />

        {/* Content Overlay */}
        <div className="relative z-10">
          <h2 className="text-white text-[32px] font-bold leading-[1.2] tracking-tight mb-[24px]">
            {title}
          </h2>

          <p className="text-[#A1A1A1] text-[16px] leading-[1.6] font-mono max-w-[400px] mb-[48px]">
            {description}
          </p>

          <form
            onSubmit={handleSubmit}
            className="relative flex items-center w-full max-w-[420px] h-[72px] rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-md p-[6px]"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent border-none outline-none px-[24px] text-white text-[13px] font-bold tracking-[0.1em] placeholder:text-white/40"
              required
            />
            <button
              type="submit"
              className="h-full px-[32px] bg-[#4A4A4A] hover:bg-[#5A5A5A] transition-colors duration-200 rounded-[18px] text-white text-[16px] font-bold"
            >
              {buttonText}
            </button>
          </form>
        </div>

        {/* Bottom Left Accent (Red corner visible in screenshot) */}
        <div className="absolute bottom-0 left-0 w-[40px] h-[40px] bg-[#E11D48] rounded-tr-[40px] opacity-80 blur-[2px]" />
      </div>
    );
  },
);

NewsletterCard.displayName = "NewsletterCard";

export default NewsletterCard;
