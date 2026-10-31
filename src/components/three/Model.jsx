import { useEffect, useRef, useState } from 'react';
import { useWebglReady } from '../../hooks/useWebglReady.js';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { onKick } from './bus.js';

/*
 * Models are built one at a time, each in an idle moment, so setting up a few
 * never lands in a single long frame. One on screen jumps the queue.
 */
const queue = [];
let pumping = false;

const whenIdle = (callback) =>
  typeof requestIdleCallback === 'function' ? requestIdleCallback(callback, { timeout: 600 }) : setTimeout(callback, 60);

function pump() {
  if (pumping || !queue.length) return;
  pumping = true;
  whenIdle(() => {
    const urgent = queue.findIndex((job) => job.urgent());
    const [job] = queue.splice(urgent === -1 ? 0 : urgent, 1);
    // A model that never reports ready must not hold up the rest.
    Promise.race([job?.run(), new Promise((resolve) => setTimeout(resolve, 4_000))])
      .catch(() => {})
      .finally(() => {
        pumping = false;
        pump();
      });
  });
}

function schedule(job) {
  queue.push(job);
  pump();
  return () => {
    const index = queue.indexOf(job);
    if (index !== -1) queue.splice(index, 1);
  };
}

/**
 * A slot for one small 3D model.
 *
 * Nothing heavy happens until it has to: the WebGL runtime (and three.js with
 * it) is imported only once the browser is idle and the device looks capable.
 * The model is built while its slot is still a screen or so away, so it is
 * ready before it scrolls in, and it only draws while actually on screen.
 * Until it is ready the slot is an empty, fixed-size box, so the layout never
 * shifts; on devices that skip WebGL the `fallback` is shown instead.
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
    let inView = false;
    let controller = null;
    let cancelMount = null;

    // A fresh canvas per mount: each model draws into its own.
    const canvas = document.createElement('canvas');
    canvas.className = 'absolute inset-0 h-full w-full';
    host.appendChild(canvas);

    const mount = () =>
      import('./runtime.js').then(({ mountModel }) => {
        if (disposed) return undefined;
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
        // The next model waits until this one has drawn its first frame.
        return controller.ready;
      });

    // Build once the slot is within a screen or so of the viewport…
    const near = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        near.disconnect();
        cancelMount = schedule({ run: mount, urgent: () => inView });
      },
      { rootMargin: '100% 0px' },
    );
    near.observe(host);

    // …but only draw while it is actually on screen.
    const visible = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      controller?.setVisible(inView);
    });
    visible.observe(host);

    const hoverTarget = host.closest('[data-model-host]') ?? host;
    const enter = () => controller?.setHover(true);
    const leave = () => controller?.setHover(false);
    hoverTarget.addEventListener('pointerenter', enter);
    hoverTarget.addEventListener('pointerleave', leave);

    const unsubscribe = reactive ? onKick((amount) => controller?.kick(amount)) : null;

    return () => {
      disposed = true;
      near.disconnect();
      visible.disconnect();
      cancelMount?.();
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
