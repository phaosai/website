import { useRef, useEffect, useState, ReactNode, lazy, Suspense, ComponentType } from "react";

interface LazyViewportProps {
  /** Factory function passed to React.lazy — e.g. () => import("./MyComponent") */
  factory: () => Promise<{ default: ComponentType<any> }>;
  /** Props forwarded to the lazy component once loaded */
  componentProps?: Record<string, any>;
  /** Fallback while loading */
  fallback?: ReactNode;
  /** IntersectionObserver rootMargin — how far before the viewport to start loading */
  rootMargin?: string;
  /** Wrapper className for the sentinel div */
  className?: string;
}

/**
 * Defers React.lazy() loading until the sentinel element enters the viewport.
 * Prevents below-fold heavy components from blocking FCP/LCP.
 */
const LazyViewport = ({ factory, componentProps = {}, fallback = null, rootMargin = "200px", className }: LazyViewportProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [Component, setComponent] = useState<ReturnType<typeof lazy> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Create the lazy component and store it — this triggers the dynamic import
          const LazyComp = lazy(factory);
          setComponent(() => LazyComp);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [factory, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {Component ? (
        <Suspense fallback={fallback}>
          <Component {...componentProps} />
        </Suspense>
      ) : (
        fallback
      )}
    </div>
  );
};

export default LazyViewport;