/**
 * RubberPuppetWarpEngine.ts
 * 
 * Professional 2D Mesh Deformation Engine (Photoshop Puppet Warp Grade)
 * 
 * Key Features:
 * 1. Dynamic Adaptive Triangulation (Bowyer-Watson Delaunay with incremental refinement)
 * 2. Rubber-like Smooth Deformation (Moving Least Squares - MLS Affine & Similarity Skinning)
 * 3. PNG & SVG Layer Support (Per-triangle affine texture mapping via HTML5 Canvas 2D)
 * 4. Interactive Pin & Point Management with real-time 60fps canvas manipulation
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface TriangleIndices {
  i0: number;
  i1: number;
  i2: number;
}

export interface ControlPin {
  id: string;
  origX: number;
  origY: number;
  currX: number;
  currY: number;
  radius?: number;
  isFixed?: boolean;
}

export interface AffineMatrix {
  a: number; // m00
  b: number; // m10
  c: number; // m01
  d: number; // m11
  e: number; // m02 (dx)
  f: number; // m12 (dy)
}

export interface MeshConfig {
  baseDensity: number;       // Base grid step in pixels (e.g. 24px)
  zoom: number;              // Current zoom factor (e.g. 1.0 to 5.0)
  adaptiveRefinement: boolean; // Automatically subdivide triangles when zoomed in
  elasticity: number;        // MLS alpha factor (1.0 = soft rubber, 2.0 = stiffer rubber)
  wireframeColor: string;    // Color of the rendered mesh wireframe (default vivid green)
  showWireframe: boolean;    // Toggle wireframe rendering
  showVertices: boolean;     // Toggle vertex point rendering
  showPins: boolean;         // Toggle control pins
  seamBleed: number;         // Anti-seam pixel padding (0.3 - 0.7px)
}

export const DEFAULT_MESH_CONFIG: MeshConfig = {
  baseDensity: 28,
  zoom: 1.0,
  adaptiveRefinement: true,
  elasticity: 1.2,
  wireframeColor: '#22c55e', // Vivid Emerald Green
  showWireframe: true,
  showVertices: false,
  showPins: true,
  seamBleed: 0.5
};

// ============================================================================
// 1. BOWYER-WATSON DELAUNAY TRIANGULATION & ADAPTIVE REFINEMENT
// ============================================================================

interface CircumCircle {
  x: number;
  y: number;
  r2: number;
}

export class DelaunayTriangulator {
  /**
   * Computes circumcircle (center and squared radius) for 3 points
   */
  public static circumcircle(p0: Point2D, p1: Point2D, p2: Point2D): CircumCircle {
    const d = 2 * (p0.x * (p1.y - p2.y) + p1.x * (p2.y - p0.y) + p2.x * (p0.y - p1.y));
    if (Math.abs(d) < 1e-9) {
      // Degenerate collinear points: fallback to large bounding circle
      const midX = (p0.x + p1.x + p2.x) / 3;
      const midY = (p0.y + p1.y + p2.y) / 3;
      return { x: midX, y: midY, r2: 1e9 };
    }

    const p0sq = p0.x * p0.x + p0.y * p0.y;
    const p1sq = p1.x * p1.x + p1.y * p1.y;
    const p2sq = p2.x * p2.x + p2.y * p2.y;

    const ux = (p0sq * (p1.y - p2.y) + p1sq * (p2.y - p0.y) + p2sq * (p0.y - p1.y)) / d;
    const uy = (p0sq * (p2.x - p1.x) + p1sq * (p0.x - p2.x) + p2sq * (p1.x - p0.x)) / d;
    const r2 = (p0.x - ux) * (p0.x - ux) + (p0.y - uy) * (p0.y - uy);

    return { x: ux, y: uy, r2 };
  }

  /**
   * Bowyer-Watson Delaunay triangulation on a set of 2D points
   */
  public static triangulate(points: Point2D[]): TriangleIndices[] {
    const n = points.length;
    if (n < 3) return [];

    // Find bounding box to create super-triangle
    let minX = points[0].x;
    let minY = points[0].y;
    let maxX = minX;
    let maxY = minY;

    for (let i = 1; i < n; i++) {
      const p = points[i];
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }

    const dx = maxX - minX;
    const dy = maxY - minY;
    const deltaMax = Math.max(dx, dy) * 2 || 100;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    // Super-triangle vertices placed outside all points
    const pSuper0: Point2D = { x: midX - 20 * deltaMax, y: midY - deltaMax };
    const pSuper1: Point2D = { x: midX, y: midY + 20 * deltaMax };
    const pSuper2: Point2D = { x: midX + 20 * deltaMax, y: midY - deltaMax };

    const allPoints: Point2D[] = [...points, pSuper0, pSuper1, pSuper2];
    const superIdx0 = n;
    const superIdx1 = n + 1;
    const superIdx2 = n + 2;

    // Initialize triangle list with super-triangle
    let triangles: TriangleIndices[] = [{ i0: superIdx0, i1: superIdx1, i2: superIdx2 }];

    // Incremental insertion of points
    for (let pIdx = 0; pIdx < n; pIdx++) {
      const p = allPoints[pIdx];
      const polygonEdges: [number, number][] = [];
      const validTriangles: TriangleIndices[] = [];

      for (let t = 0; t < triangles.length; t++) {
        const tri = triangles[t];
        const cc = this.circumcircle(allPoints[tri.i0], allPoints[tri.i1], allPoints[tri.i2]);
        const distSq = (p.x - cc.x) * (p.x - cc.x) + (p.y - cc.y) * (p.y - cc.y);

        if (distSq <= cc.r2 + 1e-7) {
          // Point is inside circumcircle -> add edges to star-shaped polygon
          polygonEdges.push([tri.i0, tri.i1]);
          polygonEdges.push([tri.i1, tri.i2]);
          polygonEdges.push([tri.i2, tri.i0]);
        } else {
          validTriangles.push(tri);
        }
      }

      // Remove shared edges (edges that appear twice belong to internal shared triangles)
      const uniqueEdges: [number, number][] = [];
      for (let i = 0; i < polygonEdges.length; i++) {
        let isShared = false;
        const e1 = polygonEdges[i];
        for (let j = 0; j < polygonEdges.length; j++) {
          if (i === j) continue;
          const e2 = polygonEdges[j];
          if ((e1[0] === e2[0] && e1[1] === e2[1]) || (e1[0] === e2[1] && e1[1] === e2[0])) {
            isShared = true;
            break;
          }
        }
        if (!isShared) {
          uniqueEdges.push(e1);
        }
      }

      // Re-triangulate cavity with new point
      for (const edge of uniqueEdges) {
        validTriangles.push({ i0: edge[0], i1: edge[1], i2: pIdx });
      }

      triangles = validTriangles;
    }

    // Filter out any triangles that share a vertex with the super-triangle
    const result: TriangleIndices[] = [];
    for (const tri of triangles) {
      if (
        tri.i0 < n &&
        tri.i1 < n &&
        tri.i2 < n
      ) {
        result.push(tri);
      }
    }

    return result;
  }

  /**
   * Computes the signed area of a 2D triangle
   */
  public static triangleArea(p0: Point2D, p1: Point2D, p2: Point2D): number {
    return Math.abs(0.5 * ((p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y)));
  }

  /**
   * Computes max edge length squared of a triangle
   */
  public static maxEdgeLengthSq(p0: Point2D, p1: Point2D, p2: Point2D): number {
    const d0 = (p1.x - p0.x) * (p1.x - p0.x) + (p1.y - p0.y) * (p1.y - p0.y);
    const d1 = (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y);
    const d2 = (p0.x - p2.x) * (p0.x - p2.x) + (p0.y - p2.y) * (p0.y - p2.y);
    return Math.max(d0, d1, d2);
  }
}

// ============================================================================
// 2. RUBBER-LIKE SMOOTH DEFORMATION (MOVING LEAST SQUARES / ELASTIC FALLOFF)
// ============================================================================

export class MLSDeformer {
  /**
   * Deforms an array of mesh vertices using Moving Least Squares (MLS) Similarity / Affine algorithm
   * 
   * Given rest pins P and deformed pins Q:
   * Each vertex v experiences rubber-sheet elastic transformation smoothly weighted by distance.
   */
  public static deform(
    restVertices: Point2D[],
    pins: ControlPin[],
    elasticity: number = 1.2
  ): Point2D[] {
    const numPins = pins.length;

    // No pins -> identity
    if (numPins === 0) {
      return restVertices.map((v) => ({ ...v }));
    }

    // Only 1 pin moved -> smooth rubber translation with radial decay
    if (numPins === 1) {
      const pin = pins[0];
      const dx = pin.currX - pin.origX;
      const dy = pin.currY - pin.origY;

      if (Math.abs(dx) < 1e-4 && Math.abs(dy) < 1e-4) {
        return restVertices.map((v) => ({ ...v }));
      }

      // Smooth falloff based on distance to the single pin
      const influenceRadius = 180;
      return restVertices.map((v) => {
        const dist = Math.hypot(v.x - pin.origX, v.y - pin.origY);
        // Smooth cubic hermite falloff
        const t = Math.max(0, Math.min(1, dist / influenceRadius));
        const weight = (1 - t * t) * (1 - t);
        return {
          x: v.x + dx * weight,
          y: v.y + dy * weight
        };
      });
    }

    // 2 or more pins -> Full 2D Moving Least Squares (MLS) Similarity Deformation
    // Reference: "Image Deformation Using Moving Least Squares" (Schaefer et al.)
    const alpha = Math.max(0.5, Math.min(3.0, elasticity));

    return restVertices.map((v) => {
      // 1. Calculate weights w_i = 1 / |p_i - v|^(2*alpha)
      let sumW = 0;
      const w: number[] = new Array(numPins);
      let exactMatchIndex = -1;

      for (let i = 0; i < numPins; i++) {
        const pin = pins[i];
        const distSq = (pin.origX - v.x) * (pin.origX - v.x) + (pin.origY - v.y) * (pin.origY - v.y);

        if (distSq < 1e-6) {
          exactMatchIndex = i;
          break;
        }

        const weight = 1 / Math.pow(distSq, alpha);
        w[i] = weight;
        sumW += weight;
      }

      // If vertex is exactly on a control pin, it maps directly to currX, currY
      if (exactMatchIndex !== -1) {
        return {
          x: pins[exactMatchIndex].currX,
          y: pins[exactMatchIndex].currY
        };
      }

      // 2. Compute weighted centroids p* and q*
      let pStarX = 0;
      let pStarY = 0;
      let qStarX = 0;
      let qStarY = 0;

      for (let i = 0; i < numPins; i++) {
        const weight = w[i] / sumW;
        pStarX += weight * pins[i].origX;
        pStarY += weight * pins[i].origY;
        qStarX += weight * pins[i].currX;
        qStarY += weight * pins[i].currY;
      }

      // 3. Compute relative vectors p_hat_i and q_hat_i
      // and optimal similarity matrix
      let muS = 0;
      for (let i = 0; i < numPins; i++) {
        const pHatX = pins[i].origX - pStarX;
        const pHatY = pins[i].origY - pStarY;
        muS += (w[i] / sumW) * (pHatX * pHatX + pHatY * pHatY);
      }

      if (muS < 1e-8) {
        // Degenerate: fall back to translation by weighted delta
        let avgDx = 0;
        let avgDy = 0;
        for (let i = 0; i < numPins; i++) {
          avgDx += (w[i] / sumW) * (pins[i].currX - pins[i].origX);
          avgDy += (w[i] / sumW) * (pins[i].currY - pins[i].origY);
        }
        return { x: v.x + avgDx, y: v.y + avgDy };
      }

      // Construct deformed position
      const vRelX = v.x - pStarX;
      const vRelY = v.y - pStarY;

      let defX = 0;
      let defY = 0;

      for (let i = 0; i < numPins; i++) {
        const pHatX = pins[i].origX - pStarX;
        const pHatY = pins[i].origY - pStarY;
        const qHatX = pins[i].currX - qStarX;
        const qHatY = pins[i].currY - qStarY;

        // Similarity deformation kernel
        const dot = pHatX * vRelX + pHatY * vRelY;
        const perp = -pHatY * vRelX + pHatX * vRelY;

        const factor = (w[i] / sumW) / muS;
        const termX = factor * (dot * qHatX - perp * qHatY);
        const termY = factor * (dot * qHatY + perp * qHatX);

        defX += termX;
        defY += termY;
      }

      return {
        x: defX + qStarX,
        y: defY + qStarY
      };
    });
  }
}

// ============================================================================
// 3. PER-TRIANGLE AFFINE TEXTURE MAPPER & CANVAS RENDERER
// ============================================================================

export class TriangleTextureRenderer {
  /**
   * Solves the 2D affine transformation matrix mapping triangle (u0, u1, u2) -> (x0, x1, x2)
   */
  public static solveAffineMatrix(
    u0: Point2D,
    u1: Point2D,
    u2: Point2D,
    x0: Point2D,
    x1: Point2D,
    x2: Point2D
  ): AffineMatrix | null {
    // Determinant of source triangle matrix
    const denom = u0.x * (u1.y - u2.y) - u1.x * (u0.y - u2.y) + u2.x * (u0.y - u1.y);
    if (Math.abs(denom) < 1e-8) {
      return null; // Degenerate UV triangle
    }

    const invDenom = 1 / denom;

    const a =
      (x0.x * (u1.y - u2.y) - x1.x * (u0.y - u2.y) + x2.x * (u0.y - u1.y)) * invDenom;
    const b =
      (x0.y * (u1.y - u2.y) - x1.y * (u0.y - u2.y) + x2.y * (u0.y - u1.y)) * invDenom;
    const c =
      (x0.x * (u2.x - u1.x) + x1.x * (u0.x - u2.x) - x2.x * (u0.x - u1.x)) * invDenom;
    const d =
      (x0.y * (u2.x - u1.x) + x1.y * (u0.x - u2.x) - x2.y * (u0.x - u1.x)) * invDenom;
    const e =
      (x0.x * (u1.x * u2.y - u2.x * u1.y) -
        x1.x * (u0.x * u2.y - u2.x * u0.y) +
        x2.x * (u0.x * u1.y - u1.x * u0.y)) *
      invDenom;
    const f =
      (x0.y * (u1.x * u2.y - u2.x * u1.y) -
        x1.y * (u0.x * u2.y - u2.x * u0.y) +
        x2.y * (u0.x * u1.y - u1.x * u0.y)) *
      invDenom;

    return { a, b, c, d, e, f };
  }

  /**
   * Renders the deformed mesh with per-triangle texture mapping onto HTML5 Canvas
   */
  public static renderMesh(
    ctx: CanvasRenderingContext2D,
    imageSource: CanvasImageSource,
    restVertices: Point2D[],
    deformedVertices: Point2D[],
    triangles: TriangleIndices[],
    config: MeshConfig
  ): void {
    const bleed = config.seamBleed ?? 0.5;

    // Draw textured triangles
    for (let t = 0; t < triangles.length; t++) {
      const tri = triangles[t];
      const u0 = restVertices[tri.i0];
      const u1 = restVertices[tri.i1];
      const u2 = restVertices[tri.i2];

      const x0 = deformedVertices[tri.i0];
      const x1 = deformedVertices[tri.i1];
      const x2 = deformedVertices[tri.i2];

      if (!u0 || !u1 || !u2 || !x0 || !x1 || !x2) continue;

      const matrix = this.solveAffineMatrix(u0, u1, u2, x0, x1, x2);
      if (!matrix) continue;

      ctx.save();

      // Clip path to deformed triangle with microscopic seam bleeding expansion
      ctx.beginPath();
      if (bleed > 0) {
        // Expand outward from triangle centroid to eliminate hairline seams
        const cx = (x0.x + x1.x + x2.x) / 3;
        const cy = (x0.y + x1.y + x2.y) / 3;

        const expand = (p: Point2D) => {
          const vx = p.x - cx;
          const vy = p.y - cy;
          const len = Math.hypot(vx, vy) || 1;
          return {
            x: p.x + (vx / len) * bleed,
            y: p.y + (vy / len) * bleed
          };
        };

        const e0 = expand(x0);
        const e1 = expand(x1);
        const e2 = expand(x2);

        ctx.moveTo(e0.x, e0.y);
        ctx.lineTo(e1.x, e1.y);
        ctx.lineTo(e2.x, e2.y);
      } else {
        ctx.moveTo(x0.x, x0.y);
        ctx.lineTo(x1.x, x1.y);
        ctx.lineTo(x2.x, x2.y);
      }
      ctx.closePath();
      ctx.clip();

      // Apply affine transform matrix
      ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);

      // Draw the original texture
      ctx.drawImage(imageSource, 0, 0);

      ctx.restore();
    }

    // Optional Wireframe overlay
    if (config.showWireframe) {
      ctx.save();
      ctx.strokeStyle = config.wireframeColor || '#22c55e';
      ctx.lineWidth = 1.0;
      ctx.globalAlpha = 0.75;

      ctx.beginPath();
      for (const tri of triangles) {
        const x0 = deformedVertices[tri.i0];
        const x1 = deformedVertices[tri.i1];
        const x2 = deformedVertices[tri.i2];
        if (!x0 || !x1 || !x2) continue;

        ctx.moveTo(x0.x, x0.y);
        ctx.lineTo(x1.x, x1.y);
        ctx.lineTo(x2.x, x2.y);
        ctx.lineTo(x0.x, x0.y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Optional Mesh Vertices overlay
    if (config.showVertices) {
      ctx.save();
      ctx.fillStyle = '#10b981';
      for (const v of deformedVertices) {
        ctx.beginPath();
        ctx.arc(v.x, v.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

// ============================================================================
// 4. ALPHA SILHOUETTE & CONTOUR BOUNDARY EXTRACTOR
// ============================================================================

export class AlphaBoundaryExtractor {
  /**
   * Scans image alpha data to produce a tight bounding box, boundary contour,
   * and interior points so the mesh wraps tightly around the character limb.
   */
  public static extractMeshPoints(
    canvas: HTMLCanvasElement,
    step: number = 24,
    alphaThreshold: number = 20
  ): { points: Point2D[]; width: number; height: number; bounds: { minX: number; minY: number; maxX: number; maxY: number } } {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { points: [], width, height, bounds: { minX: 0, minY: 0, maxX: width, maxY: height } };

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let hasPixels = false;

    // 1. Find tight bounding box
    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4 + 3;
        if (data[idx] > alphaThreshold) {
          hasPixels = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasPixels) {
      minX = 0;
      minY = 0;
      maxX = width;
      maxY = height;
    } else {
      // Add small safety margin
      minX = Math.max(0, minX - 4);
      minY = Math.max(0, minY - 4);
      maxX = Math.min(width, maxX + 4);
      maxY = Math.min(height, maxY + 4);
    }

    const points: Point2D[] = [];
    const pointSet = new Set<string>();

    const addPoint = (x: number, y: number) => {
      const key = `${Math.round(x)}_${Math.round(y)}`;
      if (!pointSet.has(key)) {
        pointSet.add(key);
        points.push({ x, y });
      }
    };

    // 2. Sample boundary and interior points
    const actualStep = Math.max(12, step);

    for (let y = minY; y <= maxY; y += actualStep) {
      for (let x = minX; x <= maxX; x += actualStep) {
        const sampleX = Math.min(width - 1, Math.max(0, Math.floor(x)));
        const sampleY = Math.min(height - 1, Math.max(0, Math.floor(y)));
        const alpha = data[(sampleY * width + sampleX) * 4 + 3];

        if (alpha > alphaThreshold) {
          // Check if near silhouette edge (detect boundary)
          const leftAlpha = sampleX >= actualStep ? data[(sampleY * width + (sampleX - actualStep)) * 4 + 3] : 0;
          const rightAlpha = sampleX + actualStep < width ? data[(sampleY * width + (sampleX + actualStep)) * 4 + 3] : 0;
          const topAlpha = sampleY >= actualStep ? data[((sampleY - actualStep) * width + sampleX) * 4 + 3] : 0;
          const bottomAlpha = sampleY + actualStep < height ? data[((sampleY + actualStep) * width + sampleX) * 4 + 3] : 0;

          const isBoundary = leftAlpha <= alphaThreshold || rightAlpha <= alphaThreshold ||
                             topAlpha <= alphaThreshold || bottomAlpha <= alphaThreshold;

          // Add interior or boundary point
          addPoint(x, y);

          // Add extra boundary resolution
          if (isBoundary) {
            addPoint(x + actualStep * 0.5, y);
            addPoint(x, y + actualStep * 0.5);
          }
        }
      }
    }

    // Always include bounding box corners if point count is small
    if (points.length < 8) {
      addPoint(minX, minY);
      addPoint(maxX, minY);
      addPoint(maxX, maxY);
      addPoint(minX, maxY);
      addPoint((minX + maxX) / 2, (minY + maxY) / 2);
    }

    return {
      points,
      width,
      height,
      bounds: { minX, minY, maxX, maxY }
    };
  }
}

// ============================================================================
// 5. MAIN COMPLETE RUBBER PUPPET WARP ENGINE
// ============================================================================

export class RubberPuppetWarpEngine {
  private basePoints: Point2D[] = [];
  private restVertices: Point2D[] = [];
  private deformedVertices: Point2D[] = [];
  private triangles: TriangleIndices[] = [];
  private pins: ControlPin[] = [];
  private config: MeshConfig;

  private textureSource: HTMLCanvasElement | HTMLImageElement | null = null;
  private width: number = 0;
  private height: number = 0;

  constructor(config: Partial<MeshConfig> = {}) {
    this.config = { ...DEFAULT_MESH_CONFIG, ...config };
  }

  /**
   * Initializes the engine with an arbitrary PNG image or rendered SVG canvas
   */
  public async loadFromImage(image: HTMLImageElement | HTMLCanvasElement): Promise<void> {
    this.width = image.width;
    this.height = image.height;

    // Convert to canvas if image element to allow pixel extraction
    let canvas: HTMLCanvasElement;
    if (image instanceof HTMLCanvasElement) {
      canvas = image;
    } else {
      canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);
    }

    this.textureSource = canvas;
    this.rebuildMesh();
  }

  /**
   * Loads an arbitrary SVG vector string, rasterizing it at crisp resolution
   */
  public async loadFromSvg(svgString: string, targetWidth: number = 400, targetHeight: number = 600): Promise<void> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        URL.revokeObjectURL(url);

        this.width = targetWidth;
        this.height = targetHeight;
        this.textureSource = canvas;
        this.rebuildMesh();
        resolve();
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };

      img.src = url;
    });
  }

  /**
   * Rebuilds triangulation based on current configuration and zoom level
   * (Adaptive Delaunay Refinement)
   */
  public rebuildMesh(): void {
    if (!this.textureSource || !(this.textureSource instanceof HTMLCanvasElement)) {
      return;
    }

    // Step calculation: denser when zoomed in or when adaptiveRefinement is enabled
    const zoom = Math.max(0.5, this.config.zoom || 1.0);
    let step = this.config.baseDensity;

    if (this.config.adaptiveRefinement) {
      // Subdivide as zoom increases:
      // At zoom 1x: step ~ 28px
      // At zoom 2x: step ~ 18px
      // At zoom 3x+: step ~ 12px
      step = Math.max(10, Math.round(this.config.baseDensity / Math.sqrt(zoom)));
    }

    // 1. Extract alpha silhouette points
    const { points } = AlphaBoundaryExtractor.extractMeshPoints(this.textureSource, step);
    this.basePoints = points;

    // 2. Ensure all control pins are incorporated into the point set
    const allPoints: Point2D[] = [...this.basePoints];
    for (const pin of this.pins) {
      allPoints.push({ x: pin.origX, y: pin.origY });
    }

    // 3. Bowyer-Watson Delaunay Triangulation
    let triList = DelaunayTriangulator.triangulate(allPoints);

    // 4. Adaptive Delaunay Sub-division:
    // If any triangle's area or edge length exceeds threshold, subdivide by centroid
    if (this.config.adaptiveRefinement) {
      const maxArea = (step * step * 1.8) / (zoom * zoom);
      const refinedPoints = [...allPoints];
      let needsRefinement = true;
      let iterations = 0;

      while (needsRefinement && iterations < 2) {
        needsRefinement = false;
        iterations++;
        const newCentroids: Point2D[] = [];

        for (const tri of triList) {
          const p0 = refinedPoints[tri.i0];
          const p1 = refinedPoints[tri.i1];
          const p2 = refinedPoints[tri.i2];
          if (!p0 || !p1 || !p2) continue;

          const area = DelaunayTriangulator.triangleArea(p0, p1, p2);
          if (area > maxArea) {
            newCentroids.push({
              x: (p0.x + p1.x + p2.x) / 3,
              y: (p0.y + p1.y + p2.y) / 3
            });
            needsRefinement = true;
          }
        }

        if (newCentroids.length > 0) {
          refinedPoints.push(...newCentroids);
          triList = DelaunayTriangulator.triangulate(refinedPoints);
        }
      }

      this.restVertices = refinedPoints;
      this.triangles = triList;
    } else {
      this.restVertices = allPoints;
      this.triangles = triList;
    }

    // Recompute deformed positions with current pins
    this.updateDeformation();
  }

  /**
   * Recalculates deformed vertex positions using MLS rubber skinning
   */
  public updateDeformation(): void {
    if (this.restVertices.length === 0) return;

    this.deformedVertices = MLSDeformer.deform(
      this.restVertices,
      this.pins,
      this.config.elasticity
    );
  }

  /**
   * Spawns a new control pin at (x, y)
   */
  public addPin(x: number, y: number, id?: string): ControlPin {
    const pinId = id || `pin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newPin: ControlPin = {
      id: pinId,
      origX: x,
      origY: y,
      currX: x,
      currY: y,
      isFixed: false
    };

    this.pins.push(newPin);

    // Re-insert pin into triangulation and re-run MLS
    this.rebuildMesh();
    return newPin;
  }

  /**
   * Removes a control pin by ID
   */
  public removePin(pinId: string): boolean {
    const initialLen = this.pins.length;
    this.pins = this.pins.filter((p) => p.id !== pinId);
    if (this.pins.length !== initialLen) {
      this.rebuildMesh();
      return true;
    }
    return false;
  }

  /**
   * Updates a pin's current deformed position (e.g. while dragging)
   */
  public movePin(pinId: string, currX: number, currY: number): void {
    const pin = this.pins.find((p) => p.id === pinId);
    if (!pin || pin.isFixed) return;

    pin.currX = currX;
    pin.currY = currY;

    // Fast-path: only recalculate MLS deformation without re-triangulating!
    this.updateDeformation();
  }

  /**
   * Toggles fixed/anchor status of a pin
   */
  public togglePinFixed(pinId: string): boolean {
    const pin = this.pins.find((p) => p.id === pinId);
    if (pin) {
      pin.isFixed = !pin.isFixed;
      return pin.isFixed;
    }
    return false;
  }

  /**
   * Resets all pins to their rest positions
   */
  public resetDeformation(): void {
    for (const pin of this.pins) {
      pin.currX = pin.origX;
      pin.currY = pin.origY;
    }
    this.updateDeformation();
  }

  /**
   * Clears all pins
   */
  public clearPins(): void {
    this.pins = [];
    this.rebuildMesh();
  }

  /**
   * Updates configuration (e.g., zoom, density, elasticity)
   */
  public setConfig(newConfig: Partial<MeshConfig>): void {
    const prevZoom = this.config.zoom;
    const prevDensity = this.config.baseDensity;
    const prevAdaptive = this.config.adaptiveRefinement;
    const prevElasticity = this.config.elasticity;

    this.config = { ...this.config, ...newConfig };

    // Rebuild mesh if triangulation-affecting parameters changed
    if (
      this.config.zoom !== prevZoom ||
      this.config.baseDensity !== prevDensity ||
      this.config.adaptiveRefinement !== prevAdaptive
    ) {
      this.rebuildMesh();
    } else if (this.config.elasticity !== prevElasticity) {
      this.updateDeformation();
    }
  }

  public getConfig(): MeshConfig {
    return { ...this.config };
  }

  public getPins(): ControlPin[] {
    return this.pins;
  }

  public getPinAt(x: number, y: number, hitRadius: number = 14): ControlPin | null {
    for (let i = this.pins.length - 1; i >= 0; i--) {
      const pin = this.pins[i];
      const dist = Math.hypot(pin.currX - x, pin.currY - y);
      if (dist <= hitRadius) {
        return pin;
      }
    }
    return null;
  }

  public getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  public getStats(): { vertexCount: number; triangleCount: number; pinCount: number; zoom: number } {
    return {
      vertexCount: this.restVertices.length,
      triangleCount: this.triangles.length,
      pinCount: this.pins.length,
      zoom: this.config.zoom
    };
  }

  /**
   * Checks whether any pins have moved from their rest position
   */
  public isDeformed(): boolean {
    if (this.pins.length === 0) return false;
    for (const pin of this.pins) {
      if (Math.abs(pin.currX - pin.origX) > 0.1 || Math.abs(pin.currY - pin.origY) > 0.1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculates current bounding box of the layer (deformed or rest)
   */
  public getDeformedBounds(): { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number } {
    if (this.deformedVertices.length === 0) {
      return { minX: 0, minY: 0, maxX: this.width, maxY: this.height, width: this.width, height: this.height };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const v of this.deformedVertices) {
      if (v.x < minX) minX = v.x;
      if (v.y < minY) minY = v.y;
      if (v.x > maxX) maxX = v.x;
      if (v.y > maxY) maxY = v.y;
    }

    if (minX === Infinity) {
      minX = 0; minY = 0; maxX = this.width; maxY = this.height;
    }

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }

  /**
   * Primary Render Method: Draws deformed textured mesh and pins on target canvas
   */
  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.textureSource || this.restVertices.length === 0) return;

    // Fast-path: if completely un-deformed and wireframe is hidden, draw original image directly
    // This guarantees 100% pixel fidelity with zero distortion in Default/Normal Mode!
    if (!this.isDeformed() && !this.config.showWireframe && !this.config.showVertices) {
      ctx.drawImage(this.textureSource, 0, 0);
    } else {
      // 1. Render deformed textured mesh via affine triangle rasterization
      TriangleTextureRenderer.renderMesh(
        ctx,
        this.textureSource,
        this.restVertices,
        this.deformedVertices,
        this.triangles,
        this.config
      );
    }

    // 2. Render control pins (Pushpin / Puppet styling)
    if (this.config.showPins) {
      this.renderPins(ctx);
    }
  }

  /**
   * Renders high-visibility Puppet Warp pushpins
   */
  private renderPins(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const pin of this.pins) {
      const { currX, currY, isFixed } = pin;

      // Outer glow / shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;

      // Outer ring
      ctx.beginPath();
      ctx.arc(currX, currY, 9, 0, Math.PI * 2);
      ctx.fillStyle = isFixed ? '#ef4444' : '#10b981'; // Red if fixed anchor, green if rubber pin
      ctx.fill();

      // Inner pushpin center
      ctx.shadowColor = 'transparent';
      ctx.beginPath();
      ctx.arc(currX, currY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Pin core dot
      ctx.beginPath();
      ctx.arc(currX, currY, 2, 0, Math.PI * 2);
      ctx.fillStyle = isFixed ? '#7f1d1d' : '#047857';
      ctx.fill();

      // Anchor lock indicator
      if (isFixed) {
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('🔒', currX + 6, currY - 6);
      }
    }
    ctx.restore();
  }

  /**
   * Exports high-resolution deformed snapshot as PNG Data URL
   */
  public exportSnapshot(): string | null {
    if (!this.textureSource) return null;
    const offscreen = document.createElement('canvas');
    offscreen.width = this.width;
    offscreen.height = this.height;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return null;

    // Render without wireframe and pins for clean export
    const originalConfig = { ...this.config };
    this.config.showWireframe = false;
    this.config.showPins = false;
    this.config.showVertices = false;

    this.render(offCtx);

    this.config = originalConfig;
    return offscreen.toDataURL('image/png');
  }
}
