import { useRef, ReactNode, useCallback, useEffect, useState } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "span";
}

/**
 * Magnetic hover effect using pure CSS transforms — no framer-motion dependency.
 * Tier 5a: respects prefers-reduced-motion (no transforms applied) and
 * coarse-pointer (touch) devices (no hover state).
 */
const MagneticButton = ({ children, className = "", as: Tag = "div" }: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const update = () => setEnabled(!reduced.matches && !coarse.matches);
    update();
    reduced.addEventListener?.("change", update);
    coarse.addEventListener?.("change", update);
    return () => {
      reduced.removeEventListener?.("change", update);
      coarse.removeEventListener?.("change", update);
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(-20, Math.min(20, (e.clientX - cx) * 0.25));
    const dy = Math.max(-20, Math.min(20, (e.clientY - cy) * 0.25));
    ref.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  }, [enabled]);

  const handleMouseLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = "translate3d(0, 0, 0)";
    }
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        display: "inline-block",
        willChange: enabled ? "transform" : undefined,
        transition: enabled ? "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : undefined,
      }}
      onMouseMove={enabled ? handleMouseMove : undefined}
      onMouseLeave={enabled ? handleMouseLeave : undefined}
      data-interactive
    >
      {children}
    </Tag>
  );
};

export default MagneticButton;
