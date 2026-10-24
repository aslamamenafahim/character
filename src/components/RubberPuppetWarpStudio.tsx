import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RubberPuppetWarpEngine,
  ControlPin,
  MeshConfig,
  DEFAULT_MESH_CONFIG
} from '../utils/RubberPuppetWarpEngine';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Upload,
  Download,
  Grid,
  Lock,
  Move,
  PlusCircle,
  Trash2,
  Sliders,
  Sparkles,
  Maximize2
} from 'lucide-react';

interface RubberPuppetWarpStudioProps {
  onClose?: () => void;
  onApplyLayer?: (snapshotUrl: string, layerName: string) => void;
  initialLayerName?: string;
}

// Preset vector limb SVGs for instant testing
const PRESET_SVGS: Record<string, { name: string; svg: string; width: number; height: number }> = {
  arm: {
    name: 'Character Arm / Limb',
    width: 240,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 480" width="240" height="480">
      <defs>
        <linearGradient id="armGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f59e0b" />
          <stop offset="50%" stop-color="#d97706" />
          <stop offset="100%" stop-color="#b45309" />
        </linearGradient>
        <radialGradient id="jointGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fbbf24" />
          <stop offset="100%" stop-color="#92400e" />
        </radialGradient>
      </defs>
      <!-- Shoulder Joint -->
      <circle cx="120" cy="70" r="42" fill="url(#jointGrad)" stroke="#78350f" stroke-width="5" />
      <!-- Upper Arm -->
      <path d="M 85,85 C 75,160 80,210 92,250 L 148,250 C 160,210 165,160 155,85 Z" fill="url(#armGrad)" stroke="#78350f" stroke-width="4" />
      <!-- Elbow Joint -->
      <circle cx="120" cy="250" r="34" fill="url(#jointGrad)" stroke="#78350f" stroke-width="4" />
      <!-- Forearm -->
      <path d="M 94,260 C 88,320 90,370 100,410 L 140,410 C 150,370 152,320 146,260 Z" fill="url(#armGrad)" stroke="#78350f" stroke-width="4" />
      <!-- Wrist / Hand -->
      <circle cx="120" cy="415" r="26" fill="url(#jointGrad)" stroke="#78350f" stroke-width="4" />
      <path d="M 102,425 C 100,450 110,465 120,465 C 130,465 140,450 138,425 Z" fill="#b45309" stroke="#78350f" stroke-width="3" />
    </svg>`
  },
  leg: {
    name: 'Character Leg / Calf',
    width: 240,
    height: 520,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 520" width="240" height="520">
      <defs>
        <linearGradient id="legGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#3b82f6" />
          <stop offset="50%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
        <radialGradient id="kneeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#60a5fa" />
          <stop offset="100%" stop-color="#1e40af" />
        </radialGradient>
      </defs>
      <!-- Hip Socket -->
      <circle cx="120" cy="65" r="44" fill="url(#kneeGrad)" stroke="#1e3a8a" stroke-width="5" />
      <!-- Thigh -->
      <path d="M 82,80 C 72,170 76,240 90,280 L 150,280 C 164,240 168,170 158,80 Z" fill="url(#legGrad)" stroke="#1e3a8a" stroke-width="4" />
      <!-- Knee Joint -->
      <circle cx="120" cy="285" r="36" fill="url(#kneeGrad)" stroke="#1e3a8a" stroke-width="5" />
      <!-- Calf -->
      <path d="M 92,295 C 84,360 88,420 102,455 L 138,455 C 152,420 156,360 148,295 Z" fill="url(#legGrad)" stroke="#1e3a8a" stroke-width="4" />
      <!-- Ankle & Foot -->
      <circle cx="120" cy="460" r="24" fill="url(#kneeGrad)" stroke="#1e3a8a" stroke-width="4" />
      <path d="M 98,470 C 85,485 70,495 70,505 C 70,515 155,515 155,505 C 155,495 142,485 142,470 Z" fill="#1e40af" stroke="#1e3a8a" stroke-width="4" />
    </svg>`
  },
  torso: {
    name: 'Character Torso & Chest',
    width: 320,
    height: 480,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 480" width="320" height="480">
      <defs>
        <linearGradient id="torsoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#10b981" />
          <stop offset="60%" stop-color="#059669" />
          <stop offset="100%" stop-color="#047857" />
        </linearGradient>
      </defs>
      <!-- Torso Body -->
      <path d="M 90,50 C 120,35 200,35 230,50 C 265,95 270,170 245,260 C 225,335 235,390 220,440 C 190,460 130,460 100,440 C 85,390 95,335 75,260 C 50,170 55,95 90,50 Z" 
            fill="url(#torsoGrad)" stroke="#064e3b" stroke-width="6" />
      <!-- Chest Muscle contours -->
      <path d="M 105,120 Q 160,150 215,120" fill="none" stroke="#34d399" stroke-width="4" stroke-linecap="round" />
      <line x1="160" y1="125" x2="160" y2="280" stroke="#064e3b" stroke-width="3" stroke-linecap="round" />
      <path d="M 120,200 Q 160,215 200,200" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" />
      <path d="M 125,270 Q 160,285 195,270" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" />
    </svg>`
  },
  head: {
    name: 'Character Head & Face',
    width: 300,
    height: 400,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="300" height="400">
      <defs>
        <radialGradient id="faceGrad" cx="50%" cy="40%" r="55%">
          <stop offset="0%" stop-color="#fde047" />
          <stop offset="70%" stop-color="#eab308" />
          <stop offset="100%" stop-color="#ca8a04" />
        </radialGradient>
      </defs>
      <!-- Head / Face Silhouette -->
      <path d="M 80,100 C 80,30 220,30 220,100 C 245,160 235,260 190,340 C 170,370 130,370 110,340 C 65,260 55,160 80,100 Z"
            fill="url(#faceGrad)" stroke="#854d0e" stroke-width="6" />
      <!-- Stylized Eyes -->
      <ellipse cx="115" cy="180" rx="18" ry="12" fill="#ffffff" stroke="#854d0e" stroke-width="3" />
      <circle cx="118" cy="180" r="7" fill="#1f2937" />
      <ellipse cx="185" cy="180" rx="18" ry="12" fill="#ffffff" stroke="#854d0e" stroke-width="3" />
      <circle cx="182" cy="180" r="7" fill="#1f2937" />
      <!-- Smile -->
      <path d="M 125,260 Q 150,290 175,260" fill="none" stroke="#854d0e" stroke-width="5" stroke-linecap="round" />
    </svg>`
  }
};

export const RubberPuppetWarpStudio: React.FC<RubberPuppetWarpStudioProps> = ({
  onClose,
  onApplyLayer,
  initialLayerName = 'arm'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<RubberPuppetWarpEngine | null>(null);

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState<'move' | 'add_pin' | 'toggle_lock' | 'delete_pin'>('move');

  // Warp / Sculpt Mode Toggle: ON (high-density rubber mesh & pins) vs OFF (Normal / Locked custom pose)
  const [isSculptMode, setIsSculptMode] = useState<boolean>(true);

  // Engine configuration states
  const [config, setConfig] = useState<MeshConfig>(DEFAULT_MESH_CONFIG);
  const [currentPreset, setCurrentPreset] = useState<string>(
    PRESET_SVGS[initialLayerName] ? initialLayerName : 'arm'
  );

  // UI Stats
  const [meshStats, setMeshStats] = useState<{
    vertexCount: number;
    triangleCount: number;
    pinCount: number;
    zoom: number;
  }>({
    vertexCount: 0,
    triangleCount: 0,
    pinCount: 0,
    zoom: 1.0
  });

  // Pin Dragging state
  const isDraggingPinRef = useRef<boolean>(false);
  const activeDragPinIdRef = useRef<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<ControlPin | null>(null);

  // Canvas Pan & Zoom view offset
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Status message
  const [statusNotice, setStatusNotice] = useState<string>(
    'Adaptive Delaunay Mesh active. Click to drag pins or zoom in to refine density.'
  );

  // Toggle Sculpt Mode ON / OFF
  const handleToggleSculptMode = () => {
    setIsSculptMode((prev) => {
      const nextVal = !prev;
      if (engineRef.current) {
        engineRef.current.setConfig({
          showWireframe: nextVal,
          showPins: nextVal
        });
      }
      if (nextVal) {
        setStatusNotice('⚡ Warp / Sculpt Mode ON: High-density rubber mesh & dynamic pins active.');
      } else {
        setStatusNotice('🔒 Warp / Sculpt Mode OFF: Layer locked permanently into current custom pose.');
        setSelectedPin(null);
      }
      return nextVal;
    });
  };

  // Initialize engine once
  useEffect(() => {
    const engine = new RubberPuppetWarpEngine({
      ...DEFAULT_MESH_CONFIG,
      wireframeColor: '#22c55e', // Photoshop vivid emerald green
      showWireframe: isSculptMode,
      showPins: isSculptMode,
      adaptiveRefinement: true
    });
    engineRef.current = engine;

    // Load initial layer preset
    const preset = PRESET_SVGS[currentPreset] || PRESET_SVGS.arm;
    engine.loadFromSvg(preset.svg, preset.width, preset.height).then(() => {
      // Add default natural pins along the limb
      if (currentPreset === 'arm') {
        engine.addPin(120, 70, 'shoulder');
        engine.addPin(120, 250, 'elbow');
        engine.addPin(120, 420, 'wrist');
      } else if (currentPreset === 'leg') {
        engine.addPin(120, 65, 'hip');
        engine.addPin(120, 285, 'knee');
        engine.addPin(120, 480, 'ankle');
      } else if (currentPreset === 'torso') {
        engine.addPin(160, 60, 'neck');
        engine.addPin(160, 220, 'chest');
        engine.addPin(160, 440, 'pelvis');
      } else if (currentPreset === 'head') {
        engine.addPin(150, 80, 'crown');
        engine.addPin(115, 180, 'left_eye');
        engine.addPin(185, 180, 'right_eye');
        engine.addPin(150, 320, 'chin');
      }
      setMeshStats(engine.getStats());
      renderCanvas();
    });
  }, []);

  // Update canvas render
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = engine.getDimensions();
    if (width === 0 || height === 0) return;

    // Clear background with subtle graphic grid
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Center content in canvas with zoom and pan
    const centerX = canvas.width / 2 + panOffset.x;
    const centerY = canvas.height / 2 + panOffset.y;
    const zoom = config.zoom;

    ctx.translate(centerX, centerY);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    // Render deformed textured mesh and pins (or clean locked pose)
    engine.render(ctx);

    // If in Default / Normal Mode (Sculpt Mode OFF): Draw standard bounding box layout
    if (!isSculptMode) {
      const bounds = engine.getDeformedBounds();
      ctx.save();
      ctx.strokeStyle = '#38bdf8'; // Cyan / Sky blue boundary
      ctx.lineWidth = 1.5 / zoom;
      ctx.setLineDash([5 / zoom, 4 / zoom]);
      ctx.strokeRect(bounds.minX, bounds.minY, bounds.width, bounds.height);
      ctx.setLineDash([]);

      // Draw 8 transform handle points
      const handleSize = 7 / zoom;
      const handlePoints = [
        { x: bounds.minX, y: bounds.minY },
        { x: bounds.minX + bounds.width / 2, y: bounds.minY },
        { x: bounds.maxX, y: bounds.minY },
        { x: bounds.maxX, y: bounds.minY + bounds.height / 2 },
        { x: bounds.maxX, y: bounds.maxY },
        { x: bounds.minX + bounds.width / 2, y: bounds.maxY },
        { x: bounds.minX, y: bounds.maxY },
        { x: bounds.minX, y: bounds.minY + bounds.height / 2 }
      ];

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5 / zoom;
      for (const hp of handlePoints) {
        ctx.fillRect(hp.x - handleSize / 2, hp.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(hp.x - handleSize / 2, hp.y - handleSize / 2, handleSize, handleSize);
      }

      // Standard box tag badge
      const badgeW = 150 / zoom;
      const badgeH = 18 / zoom;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(bounds.minX + (bounds.width - badgeW) / 2, bounds.minY - 22 / zoom, badgeW, badgeH);
      ctx.fillStyle = '#38bdf8';
      ctx.font = `bold ${10 / zoom}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('STANDARD BOX LAYOUT', bounds.minX + bounds.width / 2, bounds.minY - 13 / zoom);

      ctx.restore();
    }

    // Highlight selected pin if in Sculpt Mode
    if (isSculptMode && selectedPin) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8'; // Cyan ring
      ctx.lineWidth = 2.5 / zoom;
      ctx.beginPath();
      ctx.arc(selectedPin.currX, selectedPin.currY, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();

    // Update stats
    setMeshStats(engine.getStats());
  }, [config.zoom, panOffset, selectedPin, isSculptMode]);

  // Request Animation Frame loop for silky 60fps rendering
  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderCanvas();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderCanvas]);

  // Handle Preset Switching
  const handleSelectPreset = async (key: string) => {
    const preset = PRESET_SVGS[key];
    const engine = engineRef.current;
    if (!preset || !engine) return;

    setCurrentPreset(key);
    engine.clearPins();
    await engine.loadFromSvg(preset.svg, preset.width, preset.height);

    if (key === 'arm') {
      engine.addPin(120, 70, 'shoulder');
      engine.addPin(120, 250, 'elbow');
      engine.addPin(120, 420, 'wrist');
    } else if (key === 'leg') {
      engine.addPin(120, 65, 'hip');
      engine.addPin(120, 285, 'knee');
      engine.addPin(120, 480, 'ankle');
    } else if (key === 'torso') {
      engine.addPin(160, 60, 'neck');
      engine.addPin(160, 220, 'chest');
      engine.addPin(160, 440, 'pelvis');
    } else if (key === 'head') {
      engine.addPin(150, 80, 'crown');
      engine.addPin(115, 180, 'left_eye');
      engine.addPin(185, 180, 'right_eye');
      engine.addPin(150, 320, 'chin');
    }

    setPanOffset({ x: 0, y: 0 });
    setSelectedPin(null);
    setStatusNotice(`Loaded preset: ${preset.name}. Rubber mesh ready!`);
  };

  // Handle Custom PNG or SVG file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const engine = engineRef.current;
    if (!file || !engine) return;

    const reader = new FileReader();

    if (file.type.includes('svg')) {
      reader.onload = async (event) => {
        const svgContent = event.target?.result as string;
        engine.clearPins();
        await engine.loadFromSvg(svgContent, 360, 480);
        setCurrentPreset('custom_svg');
        // When a character layer is uploaded, load normally with standard box layout without distortion!
        setIsSculptMode(false);
        engine.setConfig({ showWireframe: false, showPins: false });
        setStatusNotice(`Loaded custom SVG: ${file.name} in Normal Mode. Toggle Warp / Sculpt Mode ON to deform.`);
        setPanOffset({ x: 0, y: 0 });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          engine.clearPins();
          await engine.loadFromImage(img);
          setCurrentPreset('custom_png');
          // When a character layer is uploaded, load normally with standard box layout without distortion!
          setIsSculptMode(false);
          engine.setConfig({ showWireframe: false, showPins: false });
          setStatusNotice(`Loaded custom PNG: ${file.name} (${img.width}x${img.height}) in Normal Mode. Toggle Warp / Sculpt Mode ON to deform.`);
          setPanOffset({ x: 0, y: 0 });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert client mouse coordinates to local layer coordinates
  const clientToLayerCoords = (clientX: number, clientY: number): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return null;

    const rect = canvas.getBoundingClientRect();
    const mouseCanvasX = clientX - rect.left;
    const mouseCanvasY = clientY - rect.top;

    const { width, height } = engine.getDimensions();
    const centerX = canvas.width / 2 + panOffset.x;
    const centerY = canvas.height / 2 + panOffset.y;
    const zoom = config.zoom;

    // Reverse transformations:
    // mouseCanvas = center + zoom * (layer - dim/2)
    const layerX = (mouseCanvasX - centerX) / zoom + width / 2;
    const layerY = (mouseCanvasY - centerY) / zoom + height / 2;

    return { x: layerX, y: layerY };
  };

  // Canvas Mouse Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    if (!engine) return;

    // Middle click or Spacebar/drag -> Pan canvas
    if (e.button === 1 || e.shiftKey) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      return;
    }

    // When in Default / Normal Mode (Sculpt Mode OFF): Pose is locked; allow panning canvas
    if (!isSculptMode) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      setStatusNotice('Normal Mode: Pose is locked. Click "Turn Sculpt Mode ON" to edit pins and deform mesh.');
      return;
    }

    const coords = clientToLayerCoords(e.clientX, e.clientY);
    if (!coords) return;

    const hitPin = engine.getPinAt(coords.x, coords.y, 16 / config.zoom);

    if (activeTool === 'add_pin') {
      // Spawn new pin dynamically at clicked point
      const newPin = engine.addPin(coords.x, coords.y);
      setSelectedPin(newPin);
      setStatusNotice(`Spawned Pin at (${Math.round(coords.x)}, ${Math.round(coords.y)}). Mesh refined.`);
      return;
    }

    if (hitPin) {
      if (activeTool === 'delete_pin') {
        engine.removePin(hitPin.id);
        setSelectedPin(null);
        setStatusNotice(`Deleted pin ${hitPin.id}`);
        return;
      }

      if (activeTool === 'toggle_lock') {
        const isFixed = engine.togglePinFixed(hitPin.id);
        setSelectedPin({ ...hitPin, isFixed });
        setStatusNotice(isFixed ? `Locked anchor pin (Fixed).` : `Unlocked pin (Elastic rubber).`);
        return;
      }

      // 'move' tool: start dragging pin
      isDraggingPinRef.current = true;
      activeDragPinIdRef.current = hitPin.id;
      setSelectedPin(hitPin);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      // Clicked on empty space: deselect pin
      setSelectedPin(null);

      // If clicked on artwork in 'move' mode, auto-add pin if none exist nearby
      if (activeTool === 'move') {
        const { width, height } = engine.getDimensions();
        if (coords.x >= 0 && coords.x <= width && coords.y >= 0 && coords.y <= height) {
          const newPin = engine.addPin(coords.x, coords.y);
          isDraggingPinRef.current = true;
          activeDragPinIdRef.current = newPin.id;
          setSelectedPin(newPin);
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setStatusNotice(`Spawned & grabbed new Pin at (${Math.round(coords.x)}, ${Math.round(coords.y)}).`);
        }
      }
    }
  };

  // Canvas Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Pan mode
    if (isPanningRef.current) {
      setPanOffset({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
      return;
    }

    // Pin Dragging mode
    if (isDraggingPinRef.current && activeDragPinIdRef.current) {
      const engine = engineRef.current;
      if (!engine) return;

      const coords = clientToLayerCoords(e.clientX, e.clientY);
      if (!coords) return;

      engine.movePin(activeDragPinIdRef.current, coords.x, coords.y);
      const updated = engine.getPins().find((p) => p.id === activeDragPinIdRef.current);
      if (updated) setSelectedPin({ ...updated });
    }
  };

  // Canvas Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
    }
    if (isDraggingPinRef.current) {
      isDraggingPinRef.current = false;
      activeDragPinIdRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Mouse Wheel Zoom: dynamically triggers adaptive Delaunay subdivision
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    handleSetZoom(Math.max(0.5, Math.min(4.0, Number((config.zoom * zoomDelta).toFixed(2)))));
  };

  // Set Zoom with Adaptive Delaunay Refinement
  const handleSetZoom = (newZoom: number) => {
    const clamped = Math.max(0.5, Math.min(4.0, Number(newZoom.toFixed(2))));
    setConfig((prev) => {
      const next = { ...prev, zoom: clamped };
      if (engineRef.current) {
        engineRef.current.setConfig(next);
      }
      return next;
    });
    setStatusNotice(
      `Zoom ${clamped}x: ${
        clamped > 1.2 ? 'Dynamic adaptive Delaunay refinement triggered finer triangles.' : 'Standard density.'
      }`
    );
  };

  // Toggle Wireframe
  const handleToggleWireframe = () => {
    const nextVal = !config.showWireframe;
    setConfig((prev) => {
      const next = { ...prev, showWireframe: nextVal };
      if (engineRef.current) engineRef.current.setConfig(next);
      return next;
    });
  };

  // Toggle Adaptive Refinement
  const handleToggleAdaptive = () => {
    const nextVal = !config.adaptiveRefinement;
    setConfig((prev) => {
      const next = { ...prev, adaptiveRefinement: nextVal };
      if (engineRef.current) engineRef.current.setConfig(next);
      return next;
    });
    setStatusNotice(
      nextVal
        ? 'Adaptive Refinement ON: Triangles auto-subdivide on zoom.'
        : 'Adaptive Refinement OFF: Static triangulation.'
    );
  };

  // Reset Deformation
  const handleReset = () => {
    if (engineRef.current) {
      engineRef.current.resetDeformation();
      setSelectedPin(null);
      setStatusNotice('Deformation reset to rest pose.');
    }
  };

  // Clear All Pins
  const handleClearPins = () => {
    if (engineRef.current) {
      engineRef.current.clearPins();
      setSelectedPin(null);
      setStatusNotice('All pins cleared. Click anywhere on the mesh to add pins.');
    }
  };

  // Export deformed snapshot
  const handleExportSnapshot = () => {
    if (!engineRef.current) return;
    const url = engineRef.current.exportSnapshot();
    if (!url) return;

    if (onApplyLayer) {
      onApplyLayer(url, currentPreset);
    }

    // Also download PNG file
    const a = document.createElement('a');
    a.href = url;
    a.download = `puppet_warp_${currentPreset}_${Date.now()}.png`;
    a.click();
    setStatusNotice('Exported deformed PNG layer successfully!');
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full w-full bg-slate-950 text-slate-100 select-none overflow-hidden font-sans"
    >
      {/* Top Header / Control Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 gap-2 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide flex items-center gap-2">
              Rubber Puppet Warp Engine
              <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                Photoshop FX
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Delaunay Triangulation &bull; Adaptive Refinement &bull; Moving Least Squares (MLS)
            </p>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <span className="text-[11px] text-slate-400 px-1.5 font-medium">Layer:</span>
          {Object.entries(PRESET_SVGS).map(([key, item]) => (
            <button
              key={key}
              onClick={() => handleSelectPreset(key)}
              className={`px-2.5 py-1 text-xs rounded font-medium transition-all ${
                currentPreset === key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              {item.name.split(' ')[1] || item.name}
            </button>
          ))}
          <label className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 cursor-pointer transition-colors">
            <Upload className="w-3 h-3 text-emerald-400" />
            <span>Upload PNG/SVG</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>

        {/* Master Warp / Sculpt Mode Toggle Button */}
        <div className="flex items-center">
          <button
            onClick={handleToggleSculptMode}
            className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
              isSculptMode
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600'
            }`}
            title={
              isSculptMode
                ? 'Sculpt Mode is ON: Click to switch OFF and lock layer into custom pose'
                : 'Normal Mode is ON: Click to switch Sculpt Mode ON and edit pins/mesh'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSculptMode ? 'bg-slate-950 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span>
              Warp / Sculpt Mode:{' '}
              <span className={isSculptMode ? 'font-black tracking-wider uppercase' : 'font-normal opacity-80'}>
                {isSculptMode ? 'ON (Active)' : 'OFF (Locked)'}
              </span>
            </span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            title="Reset deformation to rest pose"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Pose</span>
          </button>
          <button
            onClick={handleExportSnapshot}
            className="flex items-center gap-1.5 px-3 py-1 text-xs rounded font-medium bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors"
            title="Export high-resolution deformed PNG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors ml-1"
              title="Close Studio"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Body: Toolbar + Interactive Canvas + Right Sidebar */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Floating Interactive Tool Palette */}
        <div
          className={`absolute left-3 top-3 z-20 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70 shadow-2xl transition-opacity ${
            !isSculptMode ? 'opacity-40 pointer-events-none' : 'opacity-100'
          }`}
          title={!isSculptMode ? 'Switch Sculpt Mode ON to use deformation tools' : undefined}
        >
          <button
            onClick={() => setActiveTool('move')}
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${
              activeTool === 'move'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Move & Deform Pin (Click and drag pins with rubber elasticity)"
          >
            <Move className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('add_pin')}
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${
              activeTool === 'add_pin'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Add Pin Tool (Click anywhere inside or on border to spawn control point)"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('toggle_lock')}
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${
              activeTool === 'toggle_lock'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Lock / Anchor Pin (Toggle fixed point so it doesn't move)"
          >
            <Lock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActiveTool('delete_pin')}
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${
              activeTool === 'delete_pin'
                ? 'bg-red-500 text-white shadow-md font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Delete Pin (Click pin to remove)"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <div className="h-px bg-slate-700/60 my-1" />

          {/* Wireframe Toggle */}
          <button
            onClick={handleToggleWireframe}
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${
              config.showWireframe
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
            title="Toggle Green Delaunay Mesh Wireframe"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Clear Pins */}
          <button
            onClick={handleClearPins}
            className="p-2 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:text-amber-300 transition-colors"
            title="Clear all control pins"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center Canvas Area */}
        <div className="flex-1 relative flex items-center justify-center bg-slate-950/80 overflow-hidden cursor-crosshair">
          {/* Subtle Canvas Blueprint Grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, #334155 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          {/* Floating Mode Status Banner at Top-Center */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md shadow-2xl text-xs border border-slate-700/80 bg-slate-900/90 pointer-events-auto">
            {isSculptMode ? (
              <div className="flex items-center gap-2 text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold text-white">Sculpt Mode Active:</span>
                <span className="text-slate-300">Delaunay rubber mesh live. Drag pins or click to deform.</span>
                <button
                  onClick={handleToggleSculptMode}
                  className="ml-2 px-2.5 py-0.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-sm"
                >
                  Lock Pose
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sky-300">
                <Lock className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-semibold text-white">Normal Mode:</span>
                <span className="text-slate-300">Standard box layout (Pose locked, 0 distortion).</span>
                <button
                  onClick={handleToggleSculptMode}
                  className="ml-2 px-2.5 py-0.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-all shadow-sm"
                >
                  Turn Sculpt Mode ON
                </button>
              </div>
            )}
          </div>

          <canvas
            ref={canvasRef}
            width={900}
            height={650}
            className="touch-none shadow-2xl rounded-lg border border-slate-800/80"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          />

          {/* Floating Zoom & Density Overlay (Bottom-Left) */}
          <div className="absolute left-3 bottom-3 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/70 shadow-lg text-xs">
            <button
              onClick={() => handleSetZoom(config.zoom - 0.25)}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-emerald-400 w-12 text-center font-semibold">
              {Math.round(config.zoom * 100)}%
            </span>
            <button
              onClick={() => handleSetZoom(config.zoom + 0.25)}
              className="p-1 hover:bg-slate-800 rounded text-slate-300 transition-colors"
              title="Zoom in (Dynamically refines mesh density!)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <button
              onClick={() => {
                handleSetZoom(1.0);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              title="Reset view 100%"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Floating Live Telemetry Badge (Bottom-Right) */}
          <div className="absolute right-3 bottom-3 z-20 flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-lg text-[11px] text-slate-300 font-mono">
            <div>
              <span className="text-slate-500">Triangles:</span>{' '}
              <span className="text-emerald-400 font-bold">{meshStats.triangleCount}</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div>
              <span className="text-slate-500">Vertices:</span>{' '}
              <span className="text-sky-400 font-bold">{meshStats.vertexCount}</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div>
              <span className="text-slate-500">Pins:</span>{' '}
              <span className="text-amber-400 font-bold">{meshStats.pinCount}</span>
            </div>
          </div>
        </div>

        {/* Right Settings & Tuning Drawer */}
        <div className="w-72 bg-slate-900/95 border-l border-slate-800 flex flex-col shrink-0 text-xs overflow-y-auto">
          <div className="p-3 border-b border-slate-800 font-medium text-slate-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rubber & Mesh Controls</span>
          </div>

          <div className="p-3.5 space-y-4">
            {/* Mode Explanation & Status Card */}
            <div
              className={`p-2.5 rounded-lg border text-[11px] leading-relaxed transition-all ${
                isSculptMode
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-sky-950/40 border-sky-500/40 text-sky-200'
              }`}
            >
              <div className="font-semibold flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  {isSculptMode ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sculpt Mode: Active</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-sky-400" />
                      <span>Normal Mode: Locked Pose</span>
                    </>
                  )}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-mono uppercase bg-slate-900/60 border border-slate-700">
                  {isSculptMode ? 'Editable' : 'Locked'}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-300">
                {isSculptMode
                  ? 'High-density adaptive rubber mesh & pins enabled. Drag pins, curve limbs, or click anywhere to spawn new joints. Switch OFF to lock pose.'
                  : 'Pristine un-distorted artwork in standard box layout. When you switch Warp/Sculpt Mode OFF, your custom pose stays locked here.'}
              </p>
              <button
                onClick={handleToggleSculptMode}
                className={`mt-2 w-full py-1.5 rounded font-bold text-xs shadow-md transition-all ${
                  isSculptMode
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
                }`}
              >
                {isSculptMode ? '🔒 Lock Current Pose (Turn OFF)' : '⚡ Turn Sculpt Mode ON'}
              </button>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-medium">Rubber Elasticity:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {config.elasticity.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="2.5"
                step="0.1"
                value={config.elasticity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setConfig((prev) => {
                    const next = { ...prev, elasticity: val };
                    if (engineRef.current) engineRef.current.setConfig(next);
                    return next;
                  });
                }}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Soft Rubber</span>
                <span>Stiff Skin</span>
              </div>
            </div>

            {/* Base Mesh Density */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-medium">Mesh Density:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {config.baseDensity}px
                </span>
              </div>
              <input
                type="range"
                min="14"
                max="40"
                step="2"
                value={config.baseDensity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setConfig((prev) => {
                    const next = { ...prev, baseDensity: val };
                    if (engineRef.current) engineRef.current.setConfig(next);
                    return next;
                  });
                }}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Ultra Fine</span>
                <span>Coarse</span>
              </div>
            </div>

            {/* Adaptive Refinement Toggle */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="flex items-center justify-between cursor-pointer text-slate-300">
                <span>Adaptive Refinement:</span>
                <input
                  type="checkbox"
                  checked={config.adaptiveRefinement}
                  onChange={handleToggleAdaptive}
                  className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                When enabled, zooming in dynamically injects Delaunay Steiner points, creating finer
                triangles for precision joint bending.
              </p>
            </div>

            {/* Anti-Seam Bleeding */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center text-slate-300">
                <span>Seam Bleed:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {config.seamBleed.toFixed(1)}px
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.2"
                step="0.1"
                value={config.seamBleed}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setConfig((prev) => {
                    const next = { ...prev, seamBleed: val };
                    if (engineRef.current) engineRef.current.setConfig(next);
                    return next;
                  });
                }}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
              <p className="text-[10px] text-slate-400">
                Prevents hairline sub-pixel gaps between clipped triangles.
              </p>
            </div>

            {/* Selected Pin Details */}
            <div className="pt-3 border-t border-slate-800 space-y-1.5">
              <span className="text-[11px] font-medium text-slate-300">Selected Pin:</span>
              {selectedPin ? (
                <div className="p-2 rounded bg-slate-800/80 border border-slate-700 text-[11px] space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ID:</span>
                    <span className="text-emerald-400 truncate max-w-[120px]">{selectedPin.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Position:</span>
                    <span>
                      ({Math.round(selectedPin.currX)}, {Math.round(selectedPin.currY)})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className={selectedPin.isFixed ? 'text-amber-400' : 'text-emerald-400'}>
                      {selectedPin.isFixed ? '🔒 Fixed Anchor' : '⚡ Elastic Rubber'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded bg-slate-800/40 text-[11px] text-slate-400 italic">
                  Click any pin to inspect or lock.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status bar */}
      <div className="px-4 py-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium truncate">{statusNotice}</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400">
          <span>Shift + Drag / Middle Click: Pan</span>
          <span>Wheel: Dynamic Zoom Refinement</span>
        </div>
      </div>
    </div>
  );
};
