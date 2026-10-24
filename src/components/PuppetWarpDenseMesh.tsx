/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

// Default Photoshop Puppet Warp styling:
// - Dark charcoal/black boundary outline
// - Fine triangulated internal wireframe lines
// - Distinctive purple/magenta starburst spoke lines radiating from each joint pin
const DEFAULT_STROKE = '#1e293b';
const DEFAULT_FILL = 'rgba(255, 255, 255, 0.08)';
const DEFAULT_SPOKE = '#a855f7';

// Active Selected Layer Styling:
// When a point is clicked from the top bar, the ENTIRE warp mesh turns vivid emerald GREEN
// with interactive dragging handles on the outer boundary line to adjust thickness/width.
const GREEN_STROKE = '#22c55e';
const GREEN_INNER_STROKE = '#4ade80';
const GREEN_FILL = 'rgba(34, 197, 94, 0.24)';
const GREEN_SPOKE = '#86efac';

import { BorderDragHandle } from '../types/rig';

export type { BorderDragHandle };

export interface MeshProps {
  isActive?: boolean;
  onBorderDragStart?: (e: React.PointerEvent, handle: BorderDragHandle) => void;
}

// Helper to render interactive glowing green Photoshop-style transform cage and handles
const BorderHandles: React.FC<{
  left: { x: number; y: number };
  right: { x: number; y: number };
  top: { x: number; y: number };
  bottom: { x: number; y: number };
  onDragStart?: (e: React.PointerEvent, handle: BorderDragHandle) => void;
}> = ({ left, right, top, bottom, onDragStart }) => {
  const minX = Math.min(left.x, right.x);
  const maxX = Math.max(left.x, right.x);
  const minY = Math.min(top.y, bottom.y);
  const maxY = Math.max(top.y, bottom.y);
  const width = Math.max(2, maxX - minX);
  const height = Math.max(2, maxY - minY);
  const midX = minX + width / 2;
  const midY = minY + height / 2;

  return (
    <g className="warp-border-handles pointer-events-auto select-none">
      {/* Photoshop style dotted green bounding box - Grabbing anywhere stretches freely */}
      <rect
        x={minX}
        y={minY}
        width={width}
        height={height}
        fill="rgba(34, 197, 94, 0.08)"
        stroke="#22c55e"
        strokeWidth="1.2"
        strokeDasharray="3 2"
        className="cursor-grab active:cursor-grabbing hover:stroke-emerald-300"
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart?.(e, 'all');
        }}
      >
        <title>Grab & Drag: Mota / Cikon (↔) and Lamba / Khato (↕)</title>
      </rect>

      {/* Center Reticle / Hand anchor indicator */}
      <g
        className="cursor-grab active:cursor-grabbing opacity-80 hover:opacity-100 transition-opacity"
        transform={`translate(${midX}, ${midY})`}
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart?.(e, 'all');
        }}
      >
        <circle cx="0" cy="0" r="3.5" fill="#22c55e" stroke="#ffffff" strokeWidth="1" />
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#22c55e" strokeWidth="1" />
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#22c55e" strokeWidth="1" />
      </g>

      {/* 4 Corner Square Handles (Dual resize: both width & height) */}
      <rect
        x={minX - 3.5}
        y={minY - 3.5}
        width="7"
        height="7"
        rx="1"
        fill="#22c55e"
        stroke="#ffffff"
        strokeWidth="1.2"
        className="cursor-nwse-resize hover:scale-130 transition-transform shadow-sm"
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart?.(e, 'top-left');
        }}
      >
        <title>Corner Drag: Reshape Width & Length</title>
      </rect>

      <rect
        x={maxX - 3.5}
        y={minY - 3.5}
        width="7"
        height="7"
        rx="1"
        fill="#22c55e"
        stroke="#ffffff"
        strokeWidth="1.2"
        className="cursor-nesw-resize hover:scale-130 transition-transform shadow-sm"
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart?.(e, 'top-right');
        }}
      >
        <title>Corner Drag: Reshape Width & Length</title>
      </rect>

      <rect
        x={minX - 3.5}
        y={maxY - 3.5}
        width="7"
        height="7"
        rx="1"
        fill="#22c55e"
        stroke="#ffffff"
        strokeWidth="1.2"
        className="cursor-nesw-resize hover:scale-130 transition-transform shadow-sm"
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart?.(e, 'bottom-left');
        }}
      >
        <title>Corner Drag: Reshape Width & Length</title>
      </rect>

      <rect
        x={maxX - 3.5}
        y={maxY - 3.5}
        width="7"
        height="7"
        rx="1"
        fill="#22c55e"
        stroke="#ffffff"
        strokeWidth="1.2"
        className="cursor-nwse-resize hover:scale-130 transition-transform shadow-sm"
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart?.(e, 'bottom-right');
        }}
      >
        <title>Corner Drag: Reshape Width & Length</title>
      </rect>

      {/* 4 Edge Circular Handles (Independent thickness & length) */}
      {/* Left Handle: Mota / Cikon (Width) */}
      <circle
        cx={minX}
        cy={midY}
        r="4.5"
        fill="#22c55e"
        stroke="#ffffff"
        strokeWidth="1.5"
        className="cursor-ew-resize hover:scale-140 transition-transform shadow-md"
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart?.(e, 'left');
        }}
      >
        <title>↔ Drag left/right to adjust thickness (Mota / Cikon)</title>
      </circle>

      {/* Right Handle: Mota / Cikon (Width) */}
      <circle
        cx={maxX}
        cy={midY}
        r="4.5"
        fill="#22c55e"
        stroke="#ffffff"
        strokeWidth="1.5"
        className="cursor-ew-resize hover:scale-140 transition-transform shadow-md"
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart?.(e, 'right');
        }}
      >
        <title>↔ Drag left/right to adjust thickness (Mota / Cikon)</title>
      </circle>

      {/* Top Handle: Lamba / Khato (Height) */}
      <circle
        cx={midX}
        cy={minY}
        r="4.5"
        fill="#22c55e"
        stroke="#ffffff"
        strokeWidth="1.5"
        className="cursor-ns-resize hover:scale-140 transition-transform shadow-md"
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart?.(e, 'top');
        }}
      >
        <title>↕ Drag up/down to adjust length (Lamba / Khato)</title>
      </circle>

      {/* Bottom Handle: Lamba / Khato (Height) */}
      <circle
        cx={midX}
        cy={maxY}
        r="4.5"
        fill="#22c55e"
        stroke="#ffffff"
        strokeWidth="1.5"
        className="cursor-ns-resize hover:scale-140 transition-transform shadow-md"
        onPointerDown={(e) => {
          e.stopPropagation();
          onDragStart?.(e, 'bottom');
        }}
      >
        <title>↕ Drag up/down to adjust length (Lamba / Khato)</title>
      </circle>
    </g>
  );
};

// 1. Head Dense Mesh
export const HeadMesh: React.FC<MeshProps> = ({ isActive = false, onBorderDragStart }) => {
  const center = { x: 32, y: 28 };
  const boundaryPts = [
    { x: 32, y: 6 },
    { x: 42, y: 10 },
    { x: 47, y: 19 },
    { x: 46, y: 31 },
    { x: 40, y: 41 },
    { x: 32, y: 46 },
    { x: 24, y: 41 },
    { x: 18, y: 31 },
    { x: 17, y: 19 },
    { x: 22, y: 10 }
  ];

  const neckPts = [
    { x: 25, y: 46 },
    { x: 39, y: 46 },
    { x: 38, y: 58 },
    { x: 25, y: 58 }
  ];

  const strokeColor = isActive ? GREEN_STROKE : DEFAULT_STROKE;
  const innerStroke = isActive ? GREEN_INNER_STROKE : DEFAULT_STROKE;
  const fillColor = isActive ? GREEN_FILL : DEFAULT_FILL;
  const spokeColor = isActive ? GREEN_SPOKE : DEFAULT_SPOKE;

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 62 62">
      {/* Outer Contour Outline (Draggable when active) */}
      <polygon
        points={boundaryPts.map((p) => `${p.x},${p.y}`).join(' ')}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isActive ? '2.4' : '1.4'}
        strokeLinejoin="round"
        className={isActive ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''}
        onPointerDown={(e) => {
          if (isActive) {
            e.stopPropagation();
            onBorderDragStart?.(e, 'all');
          }
        }}
      />
      <polygon
        points={neckPts.map((p) => `${p.x},${p.y}`).join(' ')}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isActive ? '2.2' : '1.4'}
        strokeLinejoin="round"
      />

      {/* Internal Triangulation Ring */}
      {boundaryPts.map((pt, i) => {
        const next = boundaryPts[(i + 1) % boundaryPts.length];
        return (
          <line
            key={`hb-${i}`}
            x1={pt.x}
            y1={pt.y}
            x2={next.x}
            y2={next.y}
            stroke={innerStroke}
            strokeWidth={isActive ? '1.0' : '0.8'}
          />
        );
      })}

      {/* Neck Cross Triangulation */}
      <line x1="25" y1="46" x2="38" y2="58" stroke={innerStroke} strokeWidth="0.8" />
      <line x1="39" y1="46" x2="25" y2="58" stroke={innerStroke} strokeWidth="0.8" />

      {/* Starburst Spoke Lines radiating from Pin 1 */}
      {boundaryPts.map((pt, i) => (
        <line
          key={`spoke-h-${i}`}
          x1={center.x}
          y1={center.y}
          x2={pt.x}
          y2={pt.y}
          stroke={spokeColor}
          strokeWidth={isActive ? '1.3' : '1.1'}
          strokeDasharray={i % 2 === 0 ? 'none' : '3 1.5'}
        />
      ))}
      <line x1={center.x} y1={center.y} x2="32" y2="52" stroke={spokeColor} strokeWidth={isActive ? '1.4' : '1.2'} />

      {/* Pin 1 Anchor Node */}
      <circle
        cx={center.x}
        cy={center.y}
        r={isActive ? '3.5' : '2.5'}
        fill={isActive ? '#22c55e' : '#facc15'}
        stroke="#ffffff"
        strokeWidth="1.2"
      />

      {/* Glowing Border Drag Handles when Active */}
      {isActive && (
        <BorderHandles
          left={{ x: 17, y: 28 }}
          right={{ x: 47, y: 28 }}
          top={{ x: 32, y: 6 }}
          bottom={{ x: 32, y: 58 }}
          onDragStart={onBorderDragStart}
        />
      )}
    </svg>
  );
};

// 2. Torso & Pelvis Dense Mesh
export const TorsoMesh: React.FC<MeshProps> = ({ isActive = false, onBorderDragStart }) => {
  const pinChest = { x: 26, y: 24 };
  const pinWaist = { x: 26, y: 85 };

  const chestNodes = [
    { x: 10, y: 4 },
    { x: 26, y: 2 },
    { x: 44, y: 4 },
    { x: 8, y: 24 },
    { x: 26, y: 24 },
    { x: 46, y: 24 },
    { x: 8, y: 46 },
    { x: 26, y: 46 },
    { x: 46, y: 46 },
    { x: 9, y: 68 },
    { x: 26, y: 68 },
    { x: 45, y: 68 }
  ];

  const pelvisNodes = [
    { x: 10, y: 82 },
    { x: 26, y: 82 },
    { x: 43, y: 82 },
    { x: 12, y: 100 },
    { x: 26, y: 101 },
    { x: 40, y: 100 }
  ];

  const strokeColor = isActive ? GREEN_STROKE : DEFAULT_STROKE;
  const innerStroke = isActive ? GREEN_INNER_STROKE : DEFAULT_STROKE;
  const fillColor = isActive ? GREEN_FILL : DEFAULT_FILL;
  const spokeColor = isActive ? GREEN_SPOKE : DEFAULT_SPOKE;

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 50 102">
      {/* Outer Torso Contour */}
      <path
        d="M 10 2 C 22 0 36 0 44 4 C 47 24 47 70 43 83 C 34 85 22 85 10 83 C 7 68 7 24 10 2 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isActive ? '2.5' : '1.4'}
        className={isActive ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''}
        onPointerDown={(e) => {
          if (isActive) {
            e.stopPropagation();
            onBorderDragStart?.(e, 'all');
          }
        }}
      />
      {/* Pelvis Contour */}
      <path
        d="M 9 84 L 42 84 C 44 92 42 100 38 101 C 30 102 22 102 14 101 C 10 99 9 92 9 84 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isActive ? '2.4' : '1.4'}
      />

      {/* Torso Internal Horizontal Rungs & Cross Diagonals */}
      <line x1="8" y1="24" x2="46" y2="24" stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />
      <line x1="8" y1="46" x2="46" y2="46" stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />
      <line x1="9" y1="68" x2="45" y2="68" stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />
      <line x1="10" y1="82" x2="43" y2="82" stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />

      {/* Diagonals */}
      <line x1="10" y1="4" x2="26" y2="24" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="44" y1="4" x2="26" y2="24" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="8" y1="24" x2="26" y2="46" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="46" y1="24" x2="26" y2="46" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="26" y1="24" x2="8" y2="46" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="26" y1="24" x2="46" y2="46" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="8" y1="46" x2="26" y2="68" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="46" y1="46" x2="26" y2="68" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="26" y1="46" x2="9" y2="68" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="26" y1="46" x2="45" y2="68" stroke={innerStroke} strokeWidth="0.75" />

      {/* Pelvis Triangles */}
      <line x1="10" y1="82" x2="26" y2="101" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="43" y1="82" x2="26" y2="101" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="26" y1="82" x2="12" y2="100" stroke={innerStroke} strokeWidth="0.75" />
      <line x1="26" y1="82" x2="40" y2="100" stroke={innerStroke} strokeWidth="0.75" />

      {/* Spoke Lines */}
      {chestNodes.map((pt, i) => (
        <line
          key={`spoke-c-${i}`}
          x1={pinChest.x}
          y1={pinChest.y}
          x2={pt.x}
          y2={pt.y}
          stroke={spokeColor}
          strokeWidth={isActive ? '1.3' : '1.1'}
          strokeDasharray={i % 2 === 0 ? 'none' : '3 1.5'}
        />
      ))}
      {pelvisNodes.map((pt, i) => (
        <line
          key={`spoke-w-${i}`}
          x1={pinWaist.x}
          y1={pinWaist.y}
          x2={pt.x}
          y2={pt.y}
          stroke={spokeColor}
          strokeWidth={isActive ? '1.3' : '1.1'}
        />
      ))}
      <line x1={pinChest.x} y1={pinChest.y} x2={pinWaist.x} y2={pinWaist.y} stroke={spokeColor} strokeWidth={isActive ? '1.6' : '1.4'} />

      <circle cx={pinChest.x} cy={pinChest.y} r={isActive ? '3.5' : '2.5'} fill={isActive ? '#22c55e' : '#facc15'} stroke="#ffffff" strokeWidth="1" />
      <circle cx={pinWaist.x} cy={pinWaist.y} r={isActive ? '3.5' : '2.5'} fill={isActive ? '#22c55e' : '#facc15'} stroke="#ffffff" strokeWidth="1" />

      {/* Glowing Border Drag Handles when Active */}
      {isActive && (
        <BorderHandles
          left={{ x: 8, y: 52 }}
          right={{ x: 46, y: 52 }}
          top={{ x: 26, y: 2 }}
          bottom={{ x: 26, y: 101 }}
          onDragStart={onBorderDragStart}
        />
      )}
    </svg>
  );
};

// 3. Upper Arm Dense Mesh (Shoulder to Elbow)
export const UpperArmMesh: React.FC<MeshProps & { pinNumber?: number }> = ({
  isActive = false,
  onBorderDragStart
}) => {
  const pin = { x: 12, y: 10 };
  const rungs = [
    { l: { x: 3, y: 6 }, r: { x: 21, y: 6 } },
    { l: { x: 3, y: 20 }, r: { x: 21, y: 20 } },
    { l: { x: 4, y: 34 }, r: { x: 20, y: 34 } },
    { l: { x: 4, y: 48 }, r: { x: 20, y: 48 } },
    { l: { x: 5, y: 62 }, r: { x: 19, y: 62 } }
  ];

  const strokeColor = isActive ? GREEN_STROKE : DEFAULT_STROKE;
  const innerStroke = isActive ? GREEN_INNER_STROKE : DEFAULT_STROKE;
  const fillColor = isActive ? GREEN_FILL : DEFAULT_FILL;
  const spokeColor = isActive ? GREEN_SPOKE : DEFAULT_SPOKE;

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 24 64">
      <path
        d="M 3 14 C 3 4 21 4 21 14 L 19 62 L 5 62 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isActive ? '2.4' : '1.4'}
        className={isActive ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''}
        onPointerDown={(e) => {
          if (isActive) {
            e.stopPropagation();
            onBorderDragStart?.(e, 'all');
          }
        }}
      />

      {rungs.map((r, i) => (
        <React.Fragment key={`u-arm-${i}`}>
          <line x1={r.l.x} y1={r.l.y} x2={r.r.x} y2={r.r.y} stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />
          {i < rungs.length - 1 && (
            <>
              <line x1={r.l.x} y1={r.l.y} x2={rungs[i + 1].r.x} y2={rungs[i + 1].r.y} stroke={innerStroke} strokeWidth="0.75" />
              <line x1={r.r.x} y1={r.r.y} x2={rungs[i + 1].l.x} y2={rungs[i + 1].l.y} stroke={innerStroke} strokeWidth="0.75" />
            </>
          )}
        </React.Fragment>
      ))}

      <line x1={pin.x} y1={pin.y} x2="3" y2="6" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="21" y2="6" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="3" y2="20" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="21" y2="20" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="12" y2="34" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />

      <circle cx={pin.x} cy={pin.y} r={isActive ? '3.5' : '2.5'} fill={isActive ? '#22c55e' : '#facc15'} stroke="#ffffff" strokeWidth="1" />

      {isActive && (
        <BorderHandles
          left={{ x: 3, y: 34 }}
          right={{ x: 21, y: 34 }}
          top={{ x: 12, y: 4 }}
          bottom={{ x: 12, y: 62 }}
          onDragStart={onBorderDragStart}
        />
      )}
    </svg>
  );
};

// 4. Forearm & Hand Dense Mesh (Elbow to Hand)
export const ForearmMesh: React.FC<MeshProps & { elbowPin?: number; wristPin?: number }> = ({
  isActive = false,
  onBorderDragStart
}) => {
  const pinElbow = { x: 12, y: 8 };
  const pinWrist = { x: 12, y: 50 };

  const rungs = [
    { l: { x: 4, y: 6 }, r: { x: 20, y: 6 } },
    { l: { x: 4, y: 18 }, r: { x: 20, y: 18 } },
    { l: { x: 5, y: 30 }, r: { x: 19, y: 30 } },
    { l: { x: 5, y: 42 }, r: { x: 19, y: 42 } },
    { l: { x: 6, y: 52 }, r: { x: 18, y: 52 } }
  ];

  const strokeColor = isActive ? GREEN_STROKE : DEFAULT_STROKE;
  const innerStroke = isActive ? GREEN_INNER_STROKE : DEFAULT_STROKE;
  const fillColor = isActive ? GREEN_FILL : DEFAULT_FILL;
  const spokeColor = isActive ? GREEN_SPOKE : DEFAULT_SPOKE;

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 24 74">
      <path
        d="M 4 12 C 4 3 20 3 20 12 L 18 48 Q 20 54 18 64 C 16 72 8 72 6 64 Q 4 54 6 48 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isActive ? '2.4' : '1.4'}
        className={isActive ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''}
        onPointerDown={(e) => {
          if (isActive) {
            e.stopPropagation();
            onBorderDragStart?.(e, 'all');
          }
        }}
      />

      {rungs.map((r, i) => (
        <React.Fragment key={`fa-r-${i}`}>
          <line x1={r.l.x} y1={r.l.y} x2={r.r.x} y2={r.r.y} stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />
          {i < rungs.length - 1 && (
            <>
              <line x1={r.l.x} y1={r.l.y} x2={rungs[i + 1].r.x} y2={rungs[i + 1].r.y} stroke={innerStroke} strokeWidth="0.75" />
              <line x1={r.r.x} y1={r.r.y} x2={rungs[i + 1].l.x} y2={rungs[i + 1].l.y} stroke={innerStroke} strokeWidth="0.75" />
            </>
          )}
        </React.Fragment>
      ))}

      <line x1="6" y1="52" x2="12" y2="70" stroke={innerStroke} strokeWidth="0.8" />
      <line x1="18" y1="52" x2="12" y2="70" stroke={innerStroke} strokeWidth="0.8" />
      <line x1="9" y1="52" x2="9" y2="68" stroke={innerStroke} strokeWidth="0.7" />
      <line x1="15" y1="52" x2="15" y2="68" stroke={innerStroke} strokeWidth="0.7" />

      <line x1={pinElbow.x} y1={pinElbow.y} x2="4" y2="6" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pinElbow.x} y1={pinElbow.y} x2="20" y2="6" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pinElbow.x} y1={pinElbow.y} x2="4" y2="18" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pinElbow.x} y1={pinElbow.y} x2="20" y2="18" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pinElbow.x} y1={pinElbow.y} x2="12" y2="30" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />

      <line x1={pinWrist.x} y1={pinWrist.y} x2="5" y2="42" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pinWrist.x} y1={pinWrist.y} x2="19" y2="42" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pinWrist.x} y1={pinWrist.y} x2="6" y2="52" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pinWrist.x} y1={pinWrist.y} x2="18" y2="52" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pinWrist.x} y1={pinWrist.y} x2="12" y2="70" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />

      <circle cx={pinElbow.x} cy={pinElbow.y} r={isActive ? '3.5' : '2.5'} fill={isActive ? '#22c55e' : '#facc15'} stroke="#ffffff" strokeWidth="1" />
      <circle cx={pinWrist.x} cy={pinWrist.y} r={isActive ? '3.5' : '2.5'} fill={isActive ? '#22c55e' : '#facc15'} stroke="#ffffff" strokeWidth="1" />

      {isActive && (
        <BorderHandles
          left={{ x: 4, y: 38 }}
          right={{ x: 20, y: 38 }}
          top={{ x: 12, y: 4 }}
          bottom={{ x: 12, y: 70 }}
          onDragStart={onBorderDragStart}
        />
      )}
    </svg>
  );
};

// 5. Thigh Dense Mesh (Hip to Knee)
export const ThighMesh: React.FC<MeshProps & { pinNumber?: number }> = ({
  isActive = false,
  onBorderDragStart
}) => {
  const pin = { x: 13, y: 10 };
  const rungs = [
    { l: { x: 3, y: 6 }, r: { x: 23, y: 6 } },
    { l: { x: 3, y: 22 }, r: { x: 23, y: 22 } },
    { l: { x: 4, y: 40 }, r: { x: 22, y: 40 } },
    { l: { x: 4, y: 56 }, r: { x: 22, y: 56 } },
    { l: { x: 5, y: 74 }, r: { x: 21, y: 74 } }
  ];

  const strokeColor = isActive ? GREEN_STROKE : DEFAULT_STROKE;
  const innerStroke = isActive ? GREEN_INNER_STROKE : DEFAULT_STROKE;
  const fillColor = isActive ? GREEN_FILL : DEFAULT_FILL;
  const spokeColor = isActive ? GREEN_SPOKE : DEFAULT_SPOKE;

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 26 76">
      <path
        d="M 3 14 C 3 3 23 3 23 14 L 21 74 L 5 74 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isActive ? '2.4' : '1.4'}
        className={isActive ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''}
        onPointerDown={(e) => {
          if (isActive) {
            e.stopPropagation();
            onBorderDragStart?.(e, 'all');
          }
        }}
      />

      {rungs.map((r, i) => (
        <React.Fragment key={`thigh-r-${i}`}>
          <line x1={r.l.x} y1={r.l.y} x2={r.r.x} y2={r.r.y} stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />
          {i < rungs.length - 1 && (
            <>
              <line x1={r.l.x} y1={r.l.y} x2={rungs[i + 1].r.x} y2={rungs[i + 1].r.y} stroke={innerStroke} strokeWidth="0.75" />
              <line x1={r.r.x} y1={r.r.y} x2={rungs[i + 1].l.x} y2={rungs[i + 1].l.y} stroke={innerStroke} strokeWidth="0.75" />
            </>
          )}
        </React.Fragment>
      ))}

      <line x1={pin.x} y1={pin.y} x2="3" y2="6" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="23" y2="6" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="3" y2="22" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="23" y2="22" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="13" y2="40" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />

      <circle cx={pin.x} cy={pin.y} r={isActive ? '3.5' : '2.5'} fill={isActive ? '#22c55e' : '#facc15'} stroke="#ffffff" strokeWidth="1" />

      {isActive && (
        <BorderHandles
          left={{ x: 3, y: 40 }}
          right={{ x: 23, y: 40 }}
          top={{ x: 13, y: 4 }}
          bottom={{ x: 13, y: 74 }}
          onDragStart={onBorderDragStart}
        />
      )}
    </svg>
  );
};

// 6. Calf Dense Mesh (Knee to Foot)
export const CalfMesh: React.FC<MeshProps & { pinNumber?: number }> = ({
  isActive = false,
  onBorderDragStart
}) => {
  const pin = { x: 13, y: 8 };
  const rungs = [
    { l: { x: 4, y: 6 }, r: { x: 22, y: 6 } },
    { l: { x: 4, y: 22 }, r: { x: 22, y: 22 } },
    { l: { x: 5, y: 40 }, r: { x: 21, y: 40 } },
    { l: { x: 5, y: 58 }, r: { x: 21, y: 58 } },
    { l: { x: 6, y: 74 }, r: { x: 20, y: 74 } }
  ];

  const strokeColor = isActive ? GREEN_STROKE : DEFAULT_STROKE;
  const innerStroke = isActive ? GREEN_INNER_STROKE : DEFAULT_STROKE;
  const fillColor = isActive ? GREEN_FILL : DEFAULT_FILL;
  const spokeColor = isActive ? GREEN_SPOKE : DEFAULT_SPOKE;

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 26 85">
      <path
        d="M 4 12 C 4 3 22 3 22 12 L 20 74 L 6 74 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isActive ? '2.4' : '1.4'}
        className={isActive ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''}
        onPointerDown={(e) => {
          if (isActive) {
            e.stopPropagation();
            onBorderDragStart?.(e, 'all');
          }
        }}
      />

      {rungs.map((r, i) => (
        <React.Fragment key={`calf-r-${i}`}>
          <line x1={r.l.x} y1={r.l.y} x2={r.r.x} y2={r.r.y} stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />
          {i < rungs.length - 1 && (
            <>
              <line x1={r.l.x} y1={r.l.y} x2={rungs[i + 1].r.x} y2={rungs[i + 1].r.y} stroke={innerStroke} strokeWidth="0.75" />
              <line x1={r.r.x} y1={r.r.y} x2={rungs[i + 1].l.x} y2={rungs[i + 1].l.y} stroke={innerStroke} strokeWidth="0.75" />
            </>
          )}
        </React.Fragment>
      ))}

      <line x1={pin.x} y1={pin.y} x2="4" y2="6" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="22" y2="6" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="4" y2="22" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="22" y2="22" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="13" y2="40" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />

      <circle cx={pin.x} cy={pin.y} r={isActive ? '3.5' : '2.5'} fill={isActive ? '#22c55e' : '#facc15'} stroke="#ffffff" strokeWidth="1" />

      {isActive && (
        <BorderHandles
          left={{ x: 4, y: 44 }}
          right={{ x: 22, y: 44 }}
          top={{ x: 13, y: 4 }}
          bottom={{ x: 13, y: 74 }}
          onDragStart={onBorderDragStart}
        />
      )}
    </svg>
  );
};

// 7. Foot Dense Mesh
export const FootMesh: React.FC<MeshProps & { pinNumber?: number }> = ({
  isActive = false,
  onBorderDragStart
}) => {
  const pin = { x: 16, y: 8 };

  const strokeColor = isActive ? GREEN_STROKE : DEFAULT_STROKE;
  const innerStroke = isActive ? GREEN_INNER_STROKE : DEFAULT_STROKE;
  const fillColor = isActive ? GREEN_FILL : DEFAULT_FILL;
  const spokeColor = isActive ? GREEN_SPOKE : DEFAULT_SPOKE;

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-40 overflow-visible" viewBox="0 0 46 22">
      <path
        d="M 6 14 L 11 5 L 20 5 L 25 8 L 40 11 C 45 12 45 16 41 16 L 6 16 Z"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isActive ? '2.4' : '1.4'}
        className={isActive ? 'pointer-events-auto cursor-grab active:cursor-grabbing' : ''}
        onPointerDown={(e) => {
          if (isActive) {
            e.stopPropagation();
            onBorderDragStart?.(e, 'all');
          }
        }}
      />
      <line x1="11" y1="5" x2="20" y2="16" stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />
      <line x1="20" y1="5" x2="30" y2="16" stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />
      <line x1="25" y1="8" x2="40" y2="16" stroke={innerStroke} strokeWidth={isActive ? '1.0' : '0.8'} />
      <line x1="6" y1="14" x2="41" y2="14" stroke={innerStroke} strokeWidth="0.75" />

      <line x1={pin.x} y1={pin.y} x2="11" y2="5" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="20" y2="5" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="6" y2="16" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="25" y2="16" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />
      <line x1={pin.x} y1={pin.y} x2="40" y2="14" stroke={spokeColor} strokeWidth={isActive ? '1.3' : '1.1'} />

      <circle cx={pin.x} cy={pin.y} r={isActive ? '3.5' : '2.5'} fill={isActive ? '#22c55e' : '#facc15'} stroke="#ffffff" strokeWidth="1" />

      {isActive && (
        <BorderHandles
          left={{ x: 6, y: 12 }}
          right={{ x: 41, y: 12 }}
          top={{ x: 22, y: 5 }}
          bottom={{ x: 22, y: 16 }}
          onDragStart={onBorderDragStart}
        />
      )}
    </svg>
  );
};
