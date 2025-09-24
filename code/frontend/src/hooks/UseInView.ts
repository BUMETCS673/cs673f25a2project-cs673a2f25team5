import { useEffect, useRef, useState } from "react";

export function useInView(lazyLoad = true, threshold = 0.1) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInView, setInView] = useState(!lazyLoad);

  useEffect(() => {
    if (!lazyLoad || !containerRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold },
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [lazyLoad, threshold]);

  return { containerRef, isInView };
}
