import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { buildFootballPanels } from './footballGeometry.js';

/**
 * The hero object: a slowly turning football lit like a studio product shot,
 * inside a drifting field of particles.
 *
 * Everything is generated in code — no textures, no model files — and the loop
 * is suspended whenever the canvas leaves the viewport or the tab is hidden, so
 * an idle page costs no frames.
 */
export default function FootballScene({ className = '', reducedMotion = false, quality = 'high' }) {
  const hostRef = useRef(null);

  useEffect(() => {
    const low = quality === 'low';
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.25, 5.6);

    const renderer = new THREE.WebGLRenderer({
      antialias: !low,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    // setSize(..., false) below sizes only the drawing buffer (width x DPR);
    // without an explicit CSS size a 2x phone would lay the canvas out at double
    // width and push the page sideways.
    Object.assign(renderer.domElement.style, { display: 'block', width: '100%', height: '100%' });

    /* ------------------------------------------------------------- ball */

    const ball = new THREE.Group();
    const { pentagons, hexagons } = buildFootballPanels({ radius: 1.5, inset: 0.9, subdivisions: low ? 1 : 2 });

    const leather = (color, extra = {}) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.42,
        metalness: 0.05,
        clearcoat: 0.65,
        clearcoatRoughness: 0.3,
        sheen: 0.4,
        sheenColor: new THREE.Color('#8ea3c4'),
        ...extra,
      });

    const hexMesh = new THREE.Mesh(hexagons, leather('#eef3fa'));
    const pentMesh = new THREE.Mesh(pentagons, leather('#0b1220', { roughness: 0.5, clearcoat: 0.8 }));

    // Fills the seams so the gaps between panels read as dark stitching.
    const coreGeometry = new THREE.SphereGeometry(1.47, low ? 32 : 48, low ? 20 : 32);
    const core = new THREE.Mesh(
      coreGeometry,
      new THREE.MeshStandardMaterial({ color: '#05070d', roughness: 0.9, metalness: 0 }),
    );

    ball.add(core, hexMesh, pentMesh);
    ball.rotation.set(0.35, 0.6, 0.12);
    scene.add(ball);

    /* --------------------------------------------------- orbiting halo */

    const haloGeometry = new THREE.TorusGeometry(2.3, 0.008, 8, 220);
    const halo = new THREE.Mesh(
      haloGeometry,
      new THREE.MeshBasicMaterial({ color: '#34d399', transparent: true, opacity: 0.5 }),
    );
    halo.rotation.set(Math.PI / 2.35, 0, 0.35);
    scene.add(halo);

    const halo2Geometry = new THREE.TorusGeometry(2.75, 0.005, 8, 220);
    const halo2 = new THREE.Mesh(
      halo2Geometry,
      new THREE.MeshBasicMaterial({ color: '#a78bfa', transparent: true, opacity: 0.32 }),
    );
    halo2.rotation.set(Math.PI / 1.9, 0.4, -0.2);
    scene.add(halo2);

    /* ---------------------------------------------------------- specks */

    const COUNT = low ? 170 : 420;
    const speckPositions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i += 1) {
      const radius = 3.2 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      speckPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      speckPositions[i * 3 + 1] = radius * Math.cos(phi) * 0.55;
      speckPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) - 2;
    }
    const speckGeometry = new THREE.BufferGeometry();
    speckGeometry.setAttribute('position', new THREE.BufferAttribute(speckPositions, 3));
    const speckMaterial = new THREE.PointsMaterial({
      color: '#9fdcc4',
      size: 0.035,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const specks = new THREE.Points(speckGeometry, speckMaterial);
    scene.add(specks);

    /* ---------------------------------------------------------- lights */

    const key = new THREE.DirectionalLight('#ffffff', 3.1);
    key.position.set(4, 5, 6);

    const rim = new THREE.DirectionalLight('#34d399', 2.6);
    rim.position.set(-5, 1.5, -3);

    const fill = new THREE.DirectionalLight('#8b5cf6', 1.7);
    fill.position.set(2, -4, -4);

    const ambient = new THREE.HemisphereLight('#cfe4ff', '#05070d', 0.75);
    scene.add(key, rim, fill, ambient);

    /* ------------------------------------------------------------- loop */

    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const onPointerMove = (event) => {
      const bounds = host.getBoundingClientRect();
      target.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      target.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    if (!reducedMotion) window.addEventListener('pointermove', onPointerMove, { passive: true });

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight, false);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let frame = 0;
    let running = false;
    const clock = new THREE.Clock();

    const tick = () => {
      if (!running) return;
      frame = requestAnimationFrame(tick);
      const elapsed = clock.getElapsedTime();
      const delta = Math.min(clock.getDelta(), 0.05);

      ball.rotation.y += delta * 0.28;
      ball.rotation.x = 0.32 + Math.sin(elapsed * 0.4) * 0.06;
      ball.position.y = Math.sin(elapsed * 0.7) * 0.09;

      halo.rotation.z += delta * 0.12;
      halo2.rotation.z -= delta * 0.08;
      specks.rotation.y += delta * 0.02;

      // Ease the camera towards the pointer for a gentle parallax.
      pointer.x += (target.x - pointer.x) * 0.045;
      pointer.y += (target.y - pointer.y) * 0.045;
      camera.position.x = pointer.x * 0.55;
      camera.position.y = 0.25 - pointer.y * 0.35;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    const start = () => {
      if (running || reducedMotion) return;
      running = true;
      clock.getDelta();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    // Only animate while the canvas is actually on screen and the tab is active.
    const visibility = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0.05 },
    );
    visibility.observe(host);

    const onVisibilityChange = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibilityChange);

    const onContextLost = (event) => {
      event.preventDefault();
      stop();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    if (reducedMotion) renderer.render(scene, camera);

    return () => {
      stop();
      visibility.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);

      [pentagons, hexagons, coreGeometry, haloGeometry, halo2Geometry, speckGeometry].forEach((geometry) =>
        geometry.dispose(),
      );
      [hexMesh.material, pentMesh.material, core.material, halo.material, halo2.material, speckMaterial].forEach(
        (material) => material.dispose(),
      );
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [reducedMotion, quality]);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}
