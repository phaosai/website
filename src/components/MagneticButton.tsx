import { useRef, ReactNode, useCallback } from "react";
import { motion, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "span";
}

const MagneticButton = ({ children, className = "", as = "div" }: MagneticButtonProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const x = useSpring(0, { stiffness: 300, damping: 20 });
  const y = useSpring(0, { stiffness: 300, damping: 20 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(-20, Math.min(20, (e.clientX - cx) * 0.25));
      const dy = Math.max(-20, Math.min(20, (e.clientY - cy) * 0.25));
      x.set(dx);
      y.set(dy);
    },
    [x, y]
  );

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  const Tag = motion[as] as typeof motion.div;

  return (
    <Tag
      ref={ref}
      className={className}
      style={{ x, y, willChange: "transform", display: "inline-block" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      data-interactive
    >
      {children}
    </Tag>
  );
};

export default MagneticButton;
