import { useLayoutEffect, useRef } from 'react';

/**
 * One line of text sized to fill its container's width exactly, whatever the
 * text is — the footer wordmark keeps working when the brand name changes.
 */
export default function FitText({ children, className = '', max = 320 }) {
  const boxRef = useRef(null);
  const textRef = useRef(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return undefined;

    const fit = () => {
      text.style.fontSize = '100px';
      const natural = text.scrollWidth;
      if (!natural) return;
      text.style.fontSize = `${Math.min(max, (100 * box.clientWidth) / natural)}px`;
    };

    fit();
    document.fonts?.ready.then(fit).catch(() => {});
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [children, max]);

  return (
    <div ref={boxRef} className="w-full">
      <span ref={textRef} className={`block w-max whitespace-nowrap ${className}`}>
        {children}
      </span>
    </div>
  );
}
