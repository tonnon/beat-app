import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';

export function useRouteFadeIn<TElement extends HTMLElement>() {
  const location = useLocation();
  const elementRef = useRef<TElement>(null);

  useLayoutEffect(() => {
    const node = elementRef.current;
    if (!node) {
      return undefined;
    }

    gsap.set(node, { autoAlpha: 0 });

    const animation = gsap.to(node, {
      autoAlpha: 1,
      duration: 0.7,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    return () => {
      animation.kill();
    };
  }, [location.pathname]);

  return elementRef;
}

export default useRouteFadeIn;
export interface UseFadeInOptions {
  readonly duration?: number;
  readonly hiddenAlpha?: number;
  readonly visibleAlpha?: number;
  readonly ease?: string;
}

export function useFadeIn<TElement extends HTMLElement>(
  isVisible: boolean,
  { duration = 0.24, hiddenAlpha = 0, visibleAlpha = 1, ease = 'power2.out' }: UseFadeInOptions = {},
) {
  const elementRef = useRef<TElement>(null);

  useLayoutEffect(() => {
    const node = elementRef.current;
    if (!node) {
      return undefined;
    }

    gsap.set(node, { autoAlpha: isVisible ? visibleAlpha : hiddenAlpha });

    return () => {
      gsap.killTweensOf(node);
      if (!isVisible) {
        gsap.set(node, { autoAlpha: hiddenAlpha });
      }
    };
  }, [hiddenAlpha, isVisible, visibleAlpha]);

  useLayoutEffect(() => {
    const node = elementRef.current;
    if (!node) {
      return undefined;
    }

    const animation = gsap.to(node, {
      autoAlpha: isVisible ? visibleAlpha : hiddenAlpha,
      duration,
      ease,
      overwrite: 'auto',
    });

    return () => {
      animation.kill();
    };
  }, [isVisible, duration, ease, hiddenAlpha, visibleAlpha]);

  return elementRef;
}
