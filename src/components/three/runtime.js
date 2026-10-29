import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BUILDERS } from './models.js';

/**
 * Renders one small model into one canvas.
 *
 * Each model gets its own little canvas in the page flow rather than sharing a
 * full-screen overlay: it scrolls with its card perfectly, needs no z-index
 * juggling, and its drawing buffer is a few hundred pixels square, which keeps
 * antialiasing cheap.
 *
 * Every visible model is driven from one shared animation frame. A model that
 * leaves the viewport drops out of it, and when none are visible the loop
 * stops entirely — an idle page draws nothing.
 */

const active = new Set();
let frame = 0;

function loop(now) {
  frame = active.size ? requestAnimationFrame(loop) : 0;
  active.forEach((model) => model.step(now));
}

function wake() {
  if (!frame && active.size) frame = requestAnimationFrame(loop);
}

/* The pointer, normalised to -1…1 across the window, shared by every model. */
const pointer = { x: 0, y: 0 };
let pointerBound = false;
function trackPointer() {
  if (pointerBound) return;
  pointerBound = true;
  window.addEventListener(
    'pointermove',
    (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    },
    { passive: true },
  );
}

/* A soft blurred disc that grounds each object on the page. */
let shadowTexture = null;
function contactShadow() {
  if (!shadowTexture) {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(11,12,14,0.55)');
    gradient.addColorStop(0.45, 'rgba(11,12,14,0.22)');
    gradient.addColorStop(1, 'rgba(11,12,14,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    shadowTexture = new THREE.CanvasTexture(canvas);
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false }),
  );
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

const easeOutBack = (t) => {
  const c = 1.5;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
};
const approach = (current, target, rate, dt) => current + (target - current) * (1 - Math.exp(-rate * dt));

function disposeTree(root) {
  root.traverse((node) => {
    if (!node.isMesh) return;
    node.geometry?.dispose();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => {
      if (!material) return;
      Object.values(material).forEach((value) => {
        if (value?.isTexture && value !== shadowTexture) value.dispose();
      });
      material.dispose();
    });
  });
}

export function mountModel(canvas, { kind, quality = 'high', reducedMotion = false, options = null, drive = null, onReady }) {
  const build = BUILDERS[kind];
  if (!build) throw new Error(`Unknown model "${kind}"`);

  const low = quality === 'low';
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    // Tiny scenes: never wake a discrete GPU (and stall the page) for them.
    powerPreference: 'low-power',
  });
  renderer.debug.checkShaderErrors = import.meta.env.DEV;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.5 : 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();

  // A neutral studio environment for reflections — it is what makes the gold
  // read as metal — plus a key light for a crisp highlight.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();
  scene.environment = environment;
  scene.environmentIntensity = 0.95;

  const key = new THREE.DirectionalLight('#ffffff', 1.6);
  key.position.set(3, 5, 4);
  const rim = new THREE.DirectionalLight('#e8ffb0', 1.1);
  rim.position.set(-4, 2, -3);
  scene.add(key, rim);

  const model = build({ quality, options });
  const motion = { spin: 0.5, float: 0.06, hover: 2, ...model.motion };
  const spinner = model.spinner ?? model.object;

  // rig: entrance scale, bob, hop and pointer tilt — the object itself only turns.
  const rig = new THREE.Group();
  rig.add(model.object);
  scene.add(rig);

  let shadow = null;
  if (model.ground !== null && model.ground !== undefined) {
    shadow = contactShadow();
    shadow.position.y = model.ground;
    scene.add(shadow);
  }

  const camera = model.camera ?? new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  if (!model.camera) {
    camera.position.set(0, 0.35, 4.6);
    camera.lookAt(0, -0.05, 0);
  }
  const rigged = model.rig !== false;
  // Rigged models arrive with a quarter-turn flourish.
  if (rigged) spinner.rotation.y = reducedMotion ? 0.4 : -1.4;

  const state = {
    ready: false,
    visible: false,
    disposed: false,
    time: 0,
    last: 0,
    spawn: reducedMotion ? 1 : 0,
    hover: 0,
    hoverTarget: 0,
    busy: 0,
    busyTarget: 0,
    energy: reducedMotion ? 0 : 5,
    hop: 0,
    hopVelocity: 0,
    tiltX: 0,
    tiltZ: 0,
  };

  const render = () => renderer.render(scene, camera);

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    if (camera.isPerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    if (state.ready && (reducedMotion || !active.has(controller))) render();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  const step = (now) => {
    const dt = state.last ? Math.min((now - state.last) / 1000, 0.05) : 1 / 60;
    state.last = now;
    state.time += dt;

    state.spawn = Math.min(1, state.spawn + dt / 0.9);
    state.hover = approach(state.hover, state.hoverTarget, 6, dt);
    state.busy = approach(state.busy, state.busyTarget, 4, dt);
    state.energy *= Math.exp(-dt * 2.2);

    // A kick sends the object up; gravity and a soft bounce bring it back.
    if (state.hop > 0 || state.hopVelocity > 0) {
      state.hopVelocity -= 9 * dt;
      state.hop += state.hopVelocity * dt;
      if (state.hop <= 0) {
        state.hop = 0;
        state.hopVelocity = Math.abs(state.hopVelocity) > 0.8 ? -state.hopVelocity * 0.32 : 0;
      }
    }

    const bob = Math.sin(state.time * 1.7) * motion.float;
    if (rigged) {
      const speed = motion.spin + state.hover * motion.hover + state.energy + state.busy * 7;
      spinner.rotation.y += speed * dt;

      rig.position.y = bob + state.hop;
      rig.scale.setScalar(Math.max(0.0001, easeOutBack(state.spawn)));

      state.tiltX = approach(state.tiltX, pointer.y * 0.16, 3, dt);
      state.tiltZ = approach(state.tiltZ, -pointer.x * 0.1, 3, dt);
      rig.rotation.x = state.tiltX;
      rig.rotation.z = state.tiltZ;
    }

    model.update?.({ time: state.time, dt, hover: state.hover, busy: state.busy, spawn: state.spawn, drive: drive?.current });

    if (shadow) {
      // The higher the object floats, the smaller and fainter its shadow.
      const lift = Math.min(Math.max(0, rig.position.y + motion.float) * 1.6, 1);
      const size = 1.5 * (1 - lift * 0.3) * Math.min(1, state.spawn * 1.4);
      shadow.scale.set(size, size, 1);
      shadow.material.opacity = state.spawn * (1 - lift * 0.45);
    }

    render();
  };

  const syncLoop = () => {
    const run = state.ready && state.visible && !state.disposed && !reducedMotion;
    if (run && !active.has(controller)) {
      state.last = 0;
      active.add(controller);
      wake();
    } else if (!run) {
      active.delete(controller);
    }
  };

  const controller = {
    step,
    setVisible(visible) {
      state.visible = visible;
      syncLoop();
    },
    setHover(hovering) {
      state.hoverTarget = hovering ? 1 : 0;
    },
    setBusy(busy) {
      state.busyTarget = busy ? 1 : 0;
    },
    kick(amount = 1) {
      if (reducedMotion) return;
      state.energy = Math.min(state.energy + 2.2 * amount, 12);
      if (state.hop < 0.05) state.hopVelocity = Math.max(state.hopVelocity, 1.6 * amount);
      else state.hopVelocity += 0.4 * amount;
    },
    dispose() {
      state.disposed = true;
      active.delete(controller);
      resizeObserver.disconnect();
      disposeTree(scene);
      environment.dispose();
      renderer.dispose();
      // Release the context now rather than whenever the canvas is collected,
      // so moving between pages never piles up live WebGL contexts.
      renderer.forceContextLoss();
    },
  };

  trackPointer();

  // Compile shaders off the main thread where the browser supports it, so the
  // first frame never stalls scrolling.
  renderer
    .compileAsync(scene, camera)
    .catch(() => {})
    .then(() => {
      if (state.disposed) return;
      state.ready = true;
      // With reduced motion this first frame is the only one, until a resize.
      step(performance.now());
      onReady?.();
      syncLoop();
    });

  return controller;
}
