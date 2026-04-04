import { useRef, ReactNode, useCallback } from "react";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "span";
}

/**
 * Magnetic hover effect using pure CSS transforms — no framer-motion dependency.
 */
const MagneticButton = ({ children, className = "", as: Tag = "div" }: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = Math.max(-20, Math.min(20, (e.clientX - cx) * 0.25));
    const dy = Math.max(-20, Math.min(20, (e.clientY - cy) * 0.25));
    ref.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (ref.current) {
      ref.current.style.transform = "translate3d(0, 0, 0)";
    }
  }, []);

  return (
    <Tag
      ref={ref as any}
      className={className}
      style={{ display: "inline-block", willChange: "transform", transition: "transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-interactive
    >
      {children}
    </Tag>
  );
};

export default MagneticButton;
