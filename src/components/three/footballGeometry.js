import * as THREE from 'three';

/**
 * Builds a real football: a truncated icosahedron, 12 pentagons and 20
 * hexagons, each panel inset and inflated onto a sphere so the seams read as
 * stitching. Generated at runtime, so the hero costs no model download.
 */

const PHI = (1 + Math.sqrt(5)) / 2;

function icosahedron() {
  const vertices = [];
  for (const sign1 of [1, -1]) {
    for (const sign2 of [1, -1]) {
      vertices.push(new THREE.Vector3(0, sign1, sign2 * PHI));
      vertices.push(new THREE.Vector3(sign1, sign2 * PHI, 0));
      vertices.push(new THREE.Vector3(sign1 * PHI, 0, sign2));
    }
  }

  // Edge length of this construction is exactly 2, so neighbours are the pairs
  // whose squared distance is 4.
  const edges = [];
  const neighbours = vertices.map(() => []);
  for (let i = 0; i < vertices.length; i += 1) {
    for (let j = i + 1; j < vertices.length; j += 1) {
      if (Math.abs(vertices[i].distanceToSquared(vertices[j]) - 4) < 1e-6) {
        edges.push([i, j]);
        neighbours[i].push(j);
        neighbours[j].push(i);
      }
    }
  }

  const faces = [];
  for (let i = 0; i < vertices.length; i += 1) {
    for (const j of neighbours[i]) {
      if (j < i) continue;
      for (const k of neighbours[j]) {
        if (k < j || !neighbours[i].includes(k)) continue;
        faces.push([i, j, k]);
      }
    }
  }

  return { vertices, edges, faces, neighbours };
}

/** Point one third of the way from `a` towards `b` — a truncation corner. */
const cut = (a, b, t) => a.clone().lerp(b, t);

/** Orders a face's corners into a proper ring so fan triangulation works. */
function sortRing(points) {
  const centre = points
    .reduce((sum, point) => sum.add(point), new THREE.Vector3())
    .divideScalar(points.length);

  const normal = centre.clone().normalize();
  const xAxis = points[0].clone().sub(centre).normalize();
  const yAxis = new THREE.Vector3().crossVectors(normal, xAxis).normalize();

  return points
    .map((point) => {
      const offset = point.clone().sub(centre);
      return { point, angle: Math.atan2(offset.dot(yAxis), offset.dot(xAxis)) };
    })
    .sort((a, b) => a.angle - b.angle)
    .map((entry) => entry.point);
}

/** Fan-triangulates a ring, subdivides, and projects everything onto the sphere. */
function panelGeometry(ring, { radius, inset, subdivisions }) {
  const centre = ring
    .reduce((sum, point) => sum.add(point), new THREE.Vector3())
    .divideScalar(ring.length);

  const corners = ring.map((point) => centre.clone().lerp(point, inset));
  const positions = [];
  const project = (vector) => vector.clone().normalize().multiplyScalar(radius);

  const emit = (a, b, c, depth) => {
    if (depth === 0) {
      [a, b, c].forEach((vertex) => positions.push(vertex.x, vertex.y, vertex.z));
      return;
    }
    const ab = project(a.clone().add(b).multiplyScalar(0.5));
    const bc = project(b.clone().add(c).multiplyScalar(0.5));
    const ca = project(c.clone().add(a).multiplyScalar(0.5));
    emit(a, ab, ca, depth - 1);
    emit(ab, b, bc, depth - 1);
    emit(ca, bc, c, depth - 1);
    emit(ab, bc, ca, depth - 1);
  };

  const hub = project(centre);
  for (let i = 0; i < corners.length; i += 1) {
    emit(hub, project(corners[i]), project(corners[(i + 1) % corners.length]), subdivisions);
  }

  const geometry = new THREE.BufferGeometry();
  const array = new Float32Array(positions);
  geometry.setAttribute('position', new THREE.BufferAttribute(array, 3));

  // On a sphere the surface normal is the normalised position — exact, and far
  // cheaper than computing them from the triangles.
  const normals = new Float32Array(array.length);
  for (let i = 0; i < array.length; i += 3) {
    const length = Math.hypot(array[i], array[i + 1], array[i + 2]) || 1;
    normals[i] = array[i] / length;
    normals[i + 1] = array[i + 1] / length;
    normals[i + 2] = array[i + 2] / length;
  }
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geometry;
}

/**
 * Returns merged geometry for the pentagon and hexagon panel sets, ready to be
 * paired with a dark and a light material.
 */
export function buildFootballPanels({ radius = 1, inset = 0.9, subdivisions = 2 } = {}) {
  const { vertices, faces, neighbours } = icosahedron();
  const pentagons = [];
  const hexagons = [];

  // One pentagon per icosahedron vertex: the near cut on each incident edge.
  vertices.forEach((vertex, index) => {
    const ring = neighbours[index].map((other) => cut(vertex, vertices[other], 1 / 3));
    pentagons.push(sortRing(ring));
  });

  // One hexagon per icosahedron face: both cuts on each of its three edges.
  faces.forEach(([a, b, c]) => {
    const ring = [];
    [[a, b], [b, c], [c, a]].forEach(([from, to]) => {
      ring.push(cut(vertices[from], vertices[to], 1 / 3));
      ring.push(cut(vertices[from], vertices[to], 2 / 3));
    });
    hexagons.push(sortRing(ring));
  });

  const merge = (rings) => {
    const parts = rings.map((ring) => panelGeometry(ring, { radius, inset, subdivisions }));
    const total = parts.reduce((sum, part) => sum + part.getAttribute('position').count, 0);

    const positions = new Float32Array(total * 3);
    const normals = new Float32Array(total * 3);
    let offset = 0;

    parts.forEach((part) => {
      positions.set(part.getAttribute('position').array, offset);
      normals.set(part.getAttribute('normal').array, offset);
      offset += part.getAttribute('position').array.length;
      part.dispose();
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geometry.computeBoundingSphere();
    return geometry;
  };

  return { pentagons: merge(pentagons), hexagons: merge(hexagons) };
}
