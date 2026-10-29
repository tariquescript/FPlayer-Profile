import * as THREE from 'three';
import { buildFootballPanels } from './footballGeometry.js';
import { BALL_LETTER, FLAG_LETTER } from './wordmarkLetters.js';

/**
 * The small objects placed around the app. Every one is built in code from
 * primitives, lathes and extruded outlines — no model files, no image
 * textures — so a model costs a few kilobytes of JavaScript and nothing on the
 * network.
 *
 * A builder returns:
 *   object   the mesh tree, sized to sit inside a sphere of radius ~1
 *   spinner  the part the runtime turns around Y (defaults to `object`)
 *   motion   { spin, float, hover } — base turn speed, bob height, hover boost
 *   ground   y of the contact shadow, or null for none
 *   update   per-frame hook for anything beyond turning and bobbing
 *   camera   optional: a ready-made camera (the default is a perspective one)
 *   rig      false to skip the entrance pop, bob, spin and pointer tilt
 */

const INK = '#0b0c0e';
const VOLT = '#d4ff3f';
const GOLD = '#f0c24f';

/* ---------------------------------------------------------------- helpers */

function canvasTexture(size, draw, { colorSpace = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  if (colorSpace) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.userData.redraw = () => {
    ctx.clearRect(0, 0, size, size);
    draw(ctx, size);
    texture.needsUpdate = true;
  };
  return texture;
}

/** Display type for numbers and glyphs painted onto textures. */
function setDisplayFont(ctx, px) {
  ctx.font = `800 ${px}px Archivo, "Arial Black", sans-serif`;
  if ('fontStretch' in ctx) ctx.fontStretch = 'expanded';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
}

/** Redraw a texture once the display font is ready, if it was not already. */
function whenFontReady(texture) {
  if (typeof document === 'undefined' || !document.fonts) return;
  if (document.fonts.check('800 40px Archivo')) return;
  document.fonts.load('800 40px Archivo').then(() => texture.userData.redraw?.()).catch(() => {});
}

function roundedRect(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

const gold = (extra = {}) =>
  new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.24, ...extra });

/* ------------------------------------------------------------------- ball */

/** A unit-radius football: 20 hexagon and 12 pentagon panels over a dark core. */
function football({ quality, hex = '#f6f7f9', pent = INK, seam = '#1b1d22' }) {
  const { pentagons, hexagons } = buildFootballPanels({
    radius: 1,
    inset: 0.9,
    subdivisions: quality === 'low' ? 1 : 2,
  });

  const object = new THREE.Group();
  object.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.975, 40, 28),
      new THREE.MeshStandardMaterial({ color: seam, roughness: 0.9 }),
    ),
    new THREE.Mesh(
      hexagons,
      new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.36, clearcoat: 0.7, clearcoatRoughness: 0.25 }),
    ),
    new THREE.Mesh(
      pentagons,
      new THREE.MeshPhysicalMaterial({ color: pent, roughness: 0.42, clearcoat: 0.9, clearcoatRoughness: 0.2 }),
    ),
  );
  return object;
}

/* ----------------------------------------------------------------- trophy */

function trophy({ quality }) {
  const segments = quality === 'low' ? 40 : 64;
  // Outline of the cup, stem and foot, from the floor up and back down the
  // inside of the bowl, turned on a lathe.
  const profile = [
    [0.0, -1.0], [0.5, -1.0], [0.5, -0.9], [0.44, -0.86], [0.36, -0.8], [0.3, -0.74],
    [0.15, -0.68], [0.1, -0.58], [0.085, -0.44], [0.15, -0.34], [0.085, -0.24], [0.08, -0.12],
    [0.14, -0.04], [0.34, 0.05], [0.5, 0.2], [0.58, 0.4], [0.62, 0.64], [0.64, 0.84],
    [0.67, 0.9], [0.63, 0.92], [0.585, 0.85], [0.55, 0.62], [0.45, 0.34], [0.24, 0.15], [0.0, 0.11],
  ].map(([x, y]) => new THREE.Vector2(x, y));

  const metal = gold();
  const object = new THREE.Group();
  object.add(new THREE.Mesh(new THREE.LatheGeometry(profile, segments), metal));

  const handleGeometry = new THREE.TorusGeometry(0.25, 0.042, 12, 40, Math.PI);
  for (const side of [1, -1]) {
    const handle = new THREE.Mesh(handleGeometry, metal);
    handle.position.set(0.6 * side, 0.5, 0);
    handle.rotation.z = -side * (Math.PI / 2);
    object.add(handle);
  }

  // A black plinth with a small engraved plate.
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.34, 1.15),
    new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.35, metalness: 0.2 }),
  );
  plinth.position.y = -1.17;
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.12, 0.02), gold({ roughness: 0.32 }));
  plate.position.set(0, -1.17, 0.58);
  object.add(plinth, plate);

  object.position.y = 0.2;
  object.scale.setScalar(0.88);

  return {
    object,
    motion: { spin: 0.45, float: 0.05, hover: 2.2 },
    ground: -0.97,
  };
}

/* ------------------------------------------------------------------ coins */

function coins({ quality }) {
  const segments = quality === 'low' ? 40 : 64;
  const radius = 0.6;
  const thickness = 0.11;

  // Milled edge: fine vertical ridges as a bump map wrapped round the rim.
  const ridges = canvasTexture(
    64,
    (ctx, size) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#fff';
      for (let x = 0; x < size; x += 8) ctx.fillRect(x, 0, 4, size);
    },
    { colorSpace: false },
  );
  ridges.wrapS = THREE.RepeatWrapping;
  ridges.repeat.set(28, 1);

  // Raised rim and euro sign on each face; the back is drawn mirrored so the
  // sign reads correctly when the coin turns round.
  const face = (mirror) =>
    canvasTexture(
      256,
      (ctx, size) => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, size, size);
        ctx.translate(size / 2, size / 2);
        ctx.rotate(-Math.PI / 2);
        if (mirror) ctx.scale(-1, 1);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        setDisplayFont(ctx, size * 0.5);
        ctx.fillText('€', 0, size * 0.02);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      },
      { colorSpace: false },
    );
  const front = face(false);
  const back = face(true);
  whenFontReady(front);
  whenFontReady(back);

  const geometry = new THREE.CylinderGeometry(radius, radius, thickness, segments, 1);
  const edge = gold({ bumpMap: ridges, bumpScale: 1.2 });
  const plain = gold({ roughness: 0.3 });
  const materials = [edge, gold({ bumpMap: front, bumpScale: 3 }), gold({ bumpMap: back, bumpScale: 3 })];

  const object = new THREE.Group();

  // A small, slightly untidy stack.
  const stack = new THREE.Group();
  const offsets = [[0, 0], [0.04, -0.03], [-0.03, 0.02], [0.02, 0.04]];
  offsets.forEach(([x, z], index) => {
    const coin = new THREE.Mesh(geometry, [edge, plain, plain]);
    coin.position.set(x, -0.82 + index * (thickness + 0.004), z);
    coin.rotation.y = index * 0.7;
    stack.add(coin);
  });
  stack.position.set(-0.25, 0, 0.1);
  object.add(stack);

  // One coin stands on its edge above the stack and spins.
  const spinner = new THREE.Group();
  const hero = new THREE.Mesh(geometry, materials);
  hero.rotation.x = Math.PI / 2;
  spinner.add(hero);
  spinner.position.set(0.32, 0.12, 0);
  object.add(spinner);

  return {
    object,
    spinner,
    motion: { spin: 1.1, float: 0.06, hover: 3 },
    ground: -0.9,
    update: ({ time }) => {
      spinner.position.y = 0.12 + Math.sin(time * 1.6) * 0.06;
    },
  };
}

/* ----------------------------------------------------------------- jersey */

function jersey({ quality, options }) {
  const number = String(options?.number ?? '10').slice(0, 2);
  const base = options?.color ?? VOLT;
  const ink = options?.ink ?? INK;

  const outline = new THREE.Shape();
  outline.moveTo(-0.24, 1.0);
  outline.quadraticCurveTo(0, 0.8, 0.24, 1.0);
  outline.lineTo(0.56, 0.92);
  outline.lineTo(1.0, 0.56);
  outline.lineTo(0.8, 0.28);
  outline.lineTo(0.6, 0.44);
  outline.lineTo(0.6, -0.98);
  outline.quadraticCurveTo(0, -1.04, -0.6, -0.98);
  outline.lineTo(-0.6, 0.44);
  outline.lineTo(-0.8, 0.28);
  outline.lineTo(-1.0, 0.56);
  outline.lineTo(-0.56, 0.92);
  outline.lineTo(-0.24, 1.0);

  const depth = 0.16;
  const bevel = 0.06;
  const shirtGeometry = new THREE.ExtrudeGeometry(outline, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: 0.045,
    bevelSegments: quality === 'low' ? 3 : 6,
    curveSegments: 16,
  });
  shirtGeometry.translate(0, 0, -depth / 2);
  const front = depth / 2 + bevel;

  const fabric = new THREE.MeshPhysicalMaterial({
    color: base,
    roughness: 0.62,
    sheen: 1,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color('#ffffff'),
  });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: ink, roughness: 0.55 });

  const object = new THREE.Group();
  object.add(new THREE.Mesh(shirtGeometry, fabric));

  // Collar band and sleeve cuffs in the trim colour.
  const collarCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.25, 0.99, 0),
    new THREE.Vector3(0, 0.79, 0),
    new THREE.Vector3(0.25, 0.99, 0),
  );
  for (const z of [front - 0.01, -front + 0.01]) {
    const collar = new THREE.Mesh(new THREE.TubeGeometry(collarCurve, 24, 0.035, 8), trimMaterial);
    collar.position.z = z;
    object.add(collar);
  }
  for (const side of [1, -1]) {
    const start = new THREE.Vector2(1.0 * side, 0.56);
    const end = new THREE.Vector2(0.8 * side, 0.28);
    const length = start.distanceTo(end);
    const cuff = new THREE.Mesh(new THREE.BoxGeometry(length + 0.04, 0.07, front * 2 + 0.02), trimMaterial);
    const inward = new THREE.Vector2(-0.045 * side, 0.03);
    cuff.position.set((start.x + end.x) / 2 + inward.x, (start.y + end.y) / 2 + inward.y, 0);
    cuff.rotation.z = Math.atan2(end.y - start.y, end.x - start.x);
    object.add(cuff);
  }

  // The number, painted on both sides.
  const numberTexture = canvasTexture(256, (ctx, size) => {
    ctx.fillStyle = ink;
    setDisplayFont(ctx, number.length > 1 ? size * 0.62 : size * 0.74);
    ctx.fillText(number, size / 2, size * 0.54);
  });
  whenFontReady(numberTexture);
  const numberMaterial = new THREE.MeshStandardMaterial({
    map: numberTexture,
    transparent: true,
    roughness: 0.6,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const numberGeometry = new THREE.PlaneGeometry(0.9, 0.9);
  for (const side of [1, -1]) {
    const plane = new THREE.Mesh(numberGeometry, numberMaterial);
    plane.position.set(0, -0.06, side * (front + 0.002));
    if (side < 0) plane.rotation.y = Math.PI;
    object.add(plane);
  }

  object.scale.setScalar(0.92);
  let swayPhase = 0;

  return {
    object,
    motion: { spin: 0, float: 0.06, hover: 0 },
    ground: -1.1,
    // A shirt reads best from the front: it sways rather than spins, so the
    // number never turns edge-on, and sways wider and quicker on hover.
    update: ({ dt, hover }) => {
      // Phase is accumulated, so speeding up on hover never jumps the angle.
      swayPhase += dt * (0.9 + hover * 1.4);
      object.rotation.y = Math.sin(swayPhase) * (0.5 + hover * 0.35);
    },
  };
}

/* ------------------------------------------------------------ corner flag */

function flag({ options }) {
  const [primary = VOLT, secondary = INK] = options?.colors ?? [];

  const object = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 2.1, 16),
    new THREE.MeshStandardMaterial({ color: '#f5f6f8', roughness: 0.35 }),
  );
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 12),
    new THREE.MeshStandardMaterial({ color: '#f5f6f8', roughness: 0.35 }),
  );
  cap.position.y = 1.07;
  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.2, 0.06, 32),
    new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.5 }),
  );
  foot.position.y = -1.05;
  object.add(pole, cap, foot);

  const width = 0.95;
  const height = 0.66;
  const clothGeometry = new THREE.PlaneGeometry(width, height, 20, 10);
  clothGeometry.translate(width / 2, 0, 0);
  const rest = clothGeometry.attributes.position.array.slice();

  const pattern = canvasTexture(128, (ctx, size) => {
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = secondary;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(size, size);
    ctx.lineTo(0, size);
    ctx.closePath();
    ctx.fill();
  });
  const cloth = new THREE.Mesh(
    clothGeometry,
    new THREE.MeshStandardMaterial({ map: pattern, roughness: 0.75, side: THREE.DoubleSide }),
  );
  cloth.position.set(0.02, 0.72, 0);
  object.add(cloth);

  object.position.x = -0.35;

  const position = clothGeometry.attributes.position;
  return {
    object,
    motion: { spin: 0, float: 0, hover: 0 },
    ground: -1.08,
    update: ({ time, hover }) => {
      const strength = 1 + hover * 0.8;
      for (let i = 0; i < position.count; i += 1) {
        const x = rest[i * 3];
        const y = rest[i * 3 + 1];
        const reach = x / width;
        position.array[i * 3 + 2] =
          Math.sin(x * 6 - time * 4.2 * strength) * 0.09 * reach + Math.sin(y * 4 + time * 2.4) * 0.03 * reach;
      }
      position.needsUpdate = true;
      clothGeometry.computeVertexNormals();
      object.rotation.y = Math.sin(time * 0.5) * 0.45 - 0.3;
    },
  };
}

/* ------------------------------------------------- flag on a letter "I" */

/* The flag that flies from the "I" of the footer wordmark; see wordmarkLetters.js. */
function flagLetter({ options }) {
  const { width, capHeight, stemRight, margin } = FLAG_LETTER;
  const camera = new THREE.OrthographicCamera(0, width, capHeight + margin, -margin, -10, 10);
  camera.position.z = 5;

  const clothWidth = 0.34;
  const clothHeight = 0.27;
  const geometry = new THREE.PlaneGeometry(clothWidth, clothHeight, 18, 10);
  geometry.translate(clothWidth / 2, 0, 0);
  const rest = geometry.attributes.position.array.slice();
  const position = geometry.attributes.position;

  const cloth = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color: options?.color ?? VOLT, roughness: 0.62, side: THREE.DoubleSide }),
  );
  cloth.position.x = stemRight - 0.004;

  const object = new THREE.Group();
  object.add(cloth);

  const top = capHeight - clothHeight / 2;
  const bottom = clothHeight / 2;

  return {
    object,
    camera,
    rig: false,
    ground: null,
    motion: { spin: 0, float: 0, hover: 0 },
    update: ({ time, hover, spawn }) => {
      // Run up the pole on arrival, then fly.
      const raised = 1 - (1 - spawn) ** 3;
      cloth.position.y = bottom + (top - bottom) * raised;

      const pace = 1 + hover * 1.2;
      for (let i = 0; i < position.count; i += 1) {
        const x = rest[i * 3];
        const y = rest[i * 3 + 1];
        const reach = x / clothWidth;
        const wave = Math.sin(x * 22 - time * 5.5 * pace) * 0.035 * reach;
        position.array[i * 3 + 1] = y - reach * reach * 0.03 + Math.sin(x * 14 - time * 4 * pace) * 0.01 * reach;
        position.array[i * 3 + 2] = wave + Math.sin(y * 16 + time * 3) * 0.008 * reach;
      }
      position.needsUpdate = true;
      geometry.computeVertexNormals();
      // The cloth swings about the pole, which foreshortens it as it flaps.
      cloth.rotation.y = -0.35 + Math.sin(time * 1.3 * pace) * 0.28;
    },
  };
}

/* ------------------------------------------------------- the match ball */

/*
 * Graphics painted onto the ball by the GPU: three tapered, wavy swooshes
 * that wrap the sphere like a modern match ball's print, each edged with a
 * navy hairline. Computed from the direction of each point from the centre,
 * so they flow across panel seams with no texture and no UV seams.
 */
const MATCH_BALL_PAINT = /* glsl */ `
  varying vec3 vBallDir;
  uniform vec3 uSwooshA;
  uniform vec3 uSwooshB;
  uniform vec3 uSwooshC;
  uniform vec3 uHairline;

  // Distance from a wavy great circle about axis n, and the swoosh's half-width there.
  vec2 swoosh(vec3 d, vec3 n, float width, float phase, float wave) {
    n = normalize(n);
    vec3 t1 = normalize(cross(n, abs(n.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 t2 = cross(n, t1);
    float theta = atan(dot(d, t2), dot(d, t1));
    float offset = abs(dot(d, n) - wave * sin(theta * 3.0 + phase));
    float taper = pow(0.5 + 0.5 * sin(theta * 2.0 + phase * 1.7), 1.4);
    return vec2(offset, width * taper);
  }

  vec3 paintSwoosh(vec3 base, vec2 s, vec3 colour) {
    float body = 1.0 - smoothstep(s.y - 0.01, s.y, s.x);
    float edge = (1.0 - smoothstep(s.y + 0.012, s.y + 0.02, s.x)) * step(0.025, s.y);
    // A fine pinstripe running alongside, a step out from the edge.
    float stripe = smoothstep(s.y + 0.042, s.y + 0.048, s.x) * (1.0 - smoothstep(s.y + 0.056, s.y + 0.062, s.x)) * step(0.06, s.y);
    base = mix(base, colour, stripe * 0.9);
    base = mix(base, uHairline, edge);
    return mix(base, colour, body);
  }

  vec3 paintBall(vec3 d, vec3 base) {
    base = paintSwoosh(base, swoosh(d, vec3(-0.45, 0.2, 1.0), 0.2, 4.2, 0.1), uSwooshC);
    base = paintSwoosh(base, swoosh(d, vec3(1.0, -0.3, 0.55), 0.21, 2.1, 0.13), uSwooshB);
    base = paintSwoosh(base, swoosh(d, vec3(0.35, 1.0, 0.15), 0.25, 0.0, 0.11), uSwooshA);
    return base;
  }
`;

function paintedPanels(material) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uSwooshA: { value: new THREE.Color('#c6f22c') },
      uSwooshB: { value: new THREE.Color('#ff4438') },
      uSwooshC: { value: new THREE.Color('#2a63ff') },
      uHairline: { value: new THREE.Color('#0f1a3a') },
    });
    shader.vertexShader = `varying vec3 vBallDir;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n  vBallDir = normalize(position);',
    );
    shader.fragmentShader = `${MATCH_BALL_PAINT}\n${shader.fragmentShader}`.replace(
      '#include <color_fragment>',
      '#include <color_fragment>\n  diffuseColor.rgb = paintBall(normalize(vBallDir), diffuseColor.rgb);',
    );
  };
  // Every painted panel shares one compiled program.
  material.customProgramCacheKey = () => 'match-ball-paint';
  return material;
}

/** A modern match ball: pearl-white panels, fine seams, printed swooshes. */
function matchFootball({ quality }) {
  const { pentagons, hexagons } = buildFootballPanels({
    radius: 1,
    inset: 0.95,
    subdivisions: quality === 'low' ? 2 : 3,
  });
  const pearl = (color) =>
    paintedPanels(
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        iridescence: 0.3,
        iridescenceIOR: 1.35,
      }),
    );

  const object = new THREE.Group();
  object.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.985, 48, 32),
      new THREE.MeshStandardMaterial({ color: '#aeb5c0', roughness: 0.8 }),
    ),
    new THREE.Mesh(hexagons, pearl('#f7f8fb')),
    new THREE.Mesh(pentagons, pearl('#eceff5')),
  );
  return object;
}

/*
 * The ball that is kicked across the hero. The page moves its little canvas
 * around and writes the rolling speed into `drive.spin` (radians a second);
 * this scene only turns the ball to match, so the roll always agrees with the
 * travel. An orthographic camera frames the ball edge to edge, resting on the
 * canvas's bottom edge.
 */
function matchBall({ quality }) {
  const camera = new THREE.OrthographicCamera(-1.06, 1.06, 1.1, -1.02, -10, 10);
  camera.position.z = 5;

  const ball = matchFootball({ quality });
  const tilt = new THREE.Group();
  tilt.rotation.set(0.5, 0.35, 0);
  tilt.add(ball);

  const object = new THREE.Group();
  object.add(tilt);

  return {
    object,
    camera,
    rig: false,
    ground: null,
    motion: { spin: 0, float: 0, hover: 0 },
    update: ({ dt, busy, drive }) => {
      const spin = (drive?.spin ?? 0.6) + busy * 9;
      // Clockwise when travelling right, as a rolling ball turns.
      object.rotation.z -= spin * dt;
      ball.rotation.y += (0.25 + busy * 2) * dt;
    },
  };
}

/* ------------------------------------------------- football as a letter "O" */

/*
 * The "O" of the footer wordmark. An orthographic camera keeps it a perfect
 * circle exactly the height of the type; it rolls along, spins up under the
 * pointer, and rolls in fast when the wordmark first appears.
 */
function ballLetter({ quality, options }) {
  const { width, bottom, diameter, margin } = BALL_LETTER;
  const camera = new THREE.OrthographicCamera(0, width, bottom + diameter + margin, bottom - margin, -10, 10);
  camera.position.z = 5;

  const radius = diameter / 2;
  const ball = football({
    quality,
    hex: options?.hex ?? '#17191d',
    pent: options?.pent ?? VOLT,
    seam: '#050607',
  });
  ball.scale.setScalar(radius);

  // Tilted so the panel pattern reads in three dimensions as it rolls.
  const tilt = new THREE.Group();
  tilt.rotation.set(0.45, 0.3, 0);
  tilt.add(ball);

  const object = new THREE.Group();
  object.position.set(width / 2, bottom + radius, 0);
  object.add(tilt);

  return {
    object,
    camera,
    rig: false,
    ground: null,
    motion: { spin: 0, float: 0, hover: 0 },
    update: ({ dt, hover, spawn }) => {
      const speed = 1.1 + hover * 4.5 + (1 - spawn) * 9;
      // Rolling to the right turns it clockwise about the view axis.
      object.rotation.z -= speed * dt;
      ball.rotation.y += speed * 0.35 * dt;
    },
  };
}

/* --------------------------------------------------------------- red card */

function card() {
  const geometry = new THREE.ExtrudeGeometry(roundedRect(0.66, 0.96, 0.07), {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geometry.center();

  const object = new THREE.Group();
  object.add(
    new THREE.Mesh(
      geometry,
      new THREE.MeshPhysicalMaterial({ color: '#e5262f', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 }),
    ),
  );
  object.scale.setScalar(1.35);

  return {
    object,
    motion: { spin: 1.0, float: 0.08, hover: 3 },
    ground: -0.95,
    update: ({ time }) => {
      object.rotation.z = Math.sin(time * 1.1) * 0.18;
    },
  };
}

export const BUILDERS = { matchBall, ballLetter, trophy, coins, jersey, flag, flagLetter, card };
