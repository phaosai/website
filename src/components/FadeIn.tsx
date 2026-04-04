import { useRef, useEffect, useState, ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  style?: React.CSSProperties;
  /** Additional props forwarded to the wrapper element */
  [key: string]: any;
}

/**
 * Lightweight viewport-triggered fade-in using IntersectionObserver + CSS.
 * Replaces framer-motion whileInView to eliminate the FM bundle from the critical path.
 */
const FadeIn = ({
  children,
  className = "",
  as: Tag = "div",
  delay = 0,
  direction = "up",
  style,
  ...rest
}: FadeInProps) => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const translate =
    direction === "up"
      ? "translateY(30px)"
      : direction === "left"
      ? "translateX(-30px)"
      : direction === "right"
      ? "translateX(30px)"
      : "none";

  const Component = Tag as any;

  return (
    <Component
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : translate,
        transition: `opacity 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s, transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94) ${delay}s`,
        willChange: visible ? "auto" : "opacity, transform",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default FadeIn;
