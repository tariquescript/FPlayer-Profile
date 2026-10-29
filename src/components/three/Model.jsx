import { useEffect, useRef, useState } from 'react';
import { useWebglReady } from '../../hooks/useWebglReady.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { onKick } from './bus.js';

/**
 * A slot for one small 3D model.
 *
 * Nothing heavy happens until it has to: the WebGL runtime (and three.js with
 * it) is imported only once the browser is idle, the device looks capable and
 * the slot is within reach of the viewport. Until then the slot is an empty,
 * fixed-size box, so the layout never shifts; on devices that skip WebGL the
 * `fallback` is shown instead.
 *
 * The caller positions the slot (absolute or relative) and sizes it.
 *
 * Hovering the nearest `[data-model-host]` spins the model faster; `reactive`
 * models hop when the page calls kickModels(); `busy` spins them like a loader.
 * `drive` is a ref the page can write to every frame (the kicked ball's spin);
 * the model reads it as it draws. `onShown` fires once the first frame is up.
 */
export default function Model({
  kind,
  options = null,
  className = '',
  style,
  busy = false,
  reactive = false,
  fallback = null,
  drive = null,
  onShown,
}) {
  const tier = useWebglReady();
  const reducedMotion = useReducedMotion();
  const hostRef = useRef(null);
  const controllerRef = useRef(null);
  const busyRef = useRef(busy);
  const onShownRef = useRef(onShown);
  const [shown, setShown] = useState(false);
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    onShownRef.current = onShown;
  }, [onShown]);

  useEffect(() => {
    busyRef.current = busy;
    controllerRef.current?.setBusy(busy);
  }, [busy]);

  useEffect(() => {
    const host = hostRef.current;
    if (!tier || !host) return undefined;

    let disposed = false;
    let loading = false;
    let inView = false;
    let controller = null;

    // A fresh canvas per mount: a disposed renderer leaves its context lost,
    // and a lost context cannot be reused.
    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 h-full w-full';
    host.appendChild(canvas);

    const mount = () => {
      loading = true;
      import('./runtime.js')
        .then(({ mountModel }) => {
          if (disposed) return;
          controller = mountModel(canvas, {
            kind,
            quality: tier,
            reducedMotion,
            options: JSON.parse(optionsKey),
            drive,
            onReady: () => {
              if (disposed) return;
              setShown(true);
              onShownRef.current?.();
            },
          });
          controllerRef.current = controller;
          controller.setBusy(busyRef.current);
          controller.setVisible(inView);
        })
        .catch(() => {});
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (controller) controller.setVisible(inView);
        else if (inView && !loading) mount();
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(host);

    const hoverTarget = host.closest('[data-model-host]') ?? host;
    const enter = () => controller?.setHover(true);
    const leave = () => controller?.setHover(false);
    hoverTarget.addEventListener('pointerenter', enter);
    hoverTarget.addEventListener('pointerleave', leave);

    const unsubscribe = reactive ? onKick((amount) => controller?.kick(amount)) : null;

    return () => {
      disposed = true;
      observer.disconnect();
      hoverTarget.removeEventListener('pointerenter', enter);
      hoverTarget.removeEventListener('pointerleave', leave);
      unsubscribe?.();
      controller?.dispose();
      controllerRef.current = null;
      canvas.remove();
    };
  }, [tier, kind, optionsKey, reducedMotion, reactive, drive]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      data-shown={shown || undefined}
      style={style}
      className={`pointer-events-none [&>canvas]:opacity-0 [&>canvas]:transition-opacity [&>canvas]:duration-700 data-shown:[&>canvas]:opacity-100 ${className}`}
    >
      {tier === false && fallback}
    </div>
  );
}
