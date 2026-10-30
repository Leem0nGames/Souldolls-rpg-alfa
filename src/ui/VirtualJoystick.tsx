import React, { useRef, useState, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (x: number, y: number) => void;
  size?: number;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({ onMove, size = 130 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const touchIdRef = useRef<number | null>(null);

  const radius = size / 2;
  const maxDistance = radius * 0.7;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    setActive(true);
    updateKnob(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchIdRef.current) {
        updateKnob(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touchIdRef.current = null;
        setActive(false);
        setKnobPos({ x: 0, y: 0 });
        onMove(0, 0);
        break;
      }
    }
  };

  const updateKnob = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + radius;
      const centerY = rect.top + radius;

      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > maxDistance) {
        dx = (dx / dist) * maxDistance;
        dy = (dy / dist) * maxDistance;
      }

      setKnobPos({ x: dx, y: dy });

      // Normalized coordinates: x from -1 (left) to 1 (right), y from -1 (down) to 1 (up)
      const normX = dx / maxDistance;
      const normY = -dy / maxDistance;
      onMove(normX, normY);
    },
    [maxDistance, onMove, radius]
  );

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="touch-control relative bg-[#0B080E] border-2 border-[#8A6A3B] shadow-[6px_6px_0px_#000000] flex items-center justify-center select-none touch-none"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Decorative Corners for Joystick Base */}
      <div className="absolute -top-1 -left-1 w-3 h-3 bg-[#8A6A3B]" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#8A6A3B]" />
      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#8A6A3B]" />
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#8A6A3B]" />

      {/* Outer directional indicators */}
      <div className="absolute inset-3 border-2 border-dashed border-[#3D3242] rounded-full opacity-40" />
      
      {/* Compass markers */}
      <div className="absolute top-2 w-3 h-1.5 bg-[#E8B84A] shadow-[1px_1px_0px_#000]" />
      <div className="absolute bottom-2 w-3 h-1.5 bg-[#E8B84A] shadow-[1px_1px_0px_#000]" />
      <div className="absolute left-2 w-1.5 h-3 bg-[#E8B84A] shadow-[1px_1px_0px_#000]" />
      <div className="absolute right-2 w-1.5 h-3 bg-[#E8B84A] shadow-[1px_1px_0px_#000]" />

      {/* Thumb Knob */}
      <div
        className={`w-14 h-14 bg-[#2A1F2D] border-2 border-[#E8B84A] shadow-[3px_3px_0px_#000000] flex items-center justify-center transition-transform duration-75 ${
          active ? 'scale-110' : ''
        }`}
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="absolute inset-0 border border-[#FFF9F0] opacity-20" />
        <div className={`w-4 h-4 bg-[#E8B84A] rotate-45 ${active ? 'bg-[#5FE3D2] animate-pulse' : ''}`} />
      </div>
    </div>
  );
};
