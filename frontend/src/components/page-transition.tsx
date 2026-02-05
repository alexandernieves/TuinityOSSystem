'use client';

import { animate } from 'animejs';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

type Props = {
  children: React.ReactNode;
};

export function PageTransition({ children }: Props) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    el.style.opacity = '0.001';

    const animation = animate(el, {
      opacity: [0.001, 1],
      duration: 220,
      easing: 'easeOutQuad',
    });

    return () => {
      try {
        if (
          animation &&
          typeof animation === 'object' &&
          'cancel' in animation &&
          typeof (animation as { cancel?: unknown }).cancel === 'function'
        ) {
          (animation as { cancel: () => void }).cancel();
        }
      } catch {
        // ignore
      }
    };
  }, [pathname]);

  return (
    <div ref={rootRef} key={pathname}>
      {children}
    </div>
  );
}
