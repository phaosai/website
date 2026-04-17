import { motion, useReducedMotion } from "framer-motion";

interface KineticTextProps {
  children: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span";
  delay?: number;
}

const KineticText = ({ children, className = "", as: Tag = "span", delay = 0 }: KineticTextProps) => {
  const prefersReducedMotion = useReducedMotion();
  const words = children.split(" ");

  // Tier 5a: respect prefers-reduced-motion — render plain text, no per-char animation
  if (prefersReducedMotion) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Tag className={className}>
      {words.map((word, wIdx) => (
        <span key={wIdx} className="inline-block">
          {word.split("").map((char, cIdx) => (
            <motion.span
              key={`${wIdx}-${cIdx}`}
              className="inline-block"
              initial={{ opacity: 0, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{
                duration: 0.4,
                delay: delay + (wIdx * word.length + cIdx) * 0.02,
                ease: "easeOut",
              }}
              style={{ willChange: "opacity, filter" }}
            >
              {char}
            </motion.span>
          ))}
          {wIdx < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
};

export default KineticText;
