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
      className="touch-control relative bg-[#0B080E] border-2 border-[#8A6A3B] shadow-[4px_4px_0px_#000000] flex items-center justify-center select-none touch-none"
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {/* Outer directional indicators */}
      <div className="absolute inset-2 border border-dashed border-[#6B5C70]" />
      <div className="absolute top-2 w-2 h-2 bg-[#E8B84A]" />
      <div className="absolute bottom-2 w-2 h-2 bg-[#E8B84A]" />
      <div className="absolute left-2 w-2 h-2 bg-[#E8B84A]" />
      <div className="absolute right-2 w-2 h-2 bg-[#E8B84A]" />

      {/* Thumb Knob */}
      <div
        className={`w-12 h-12 bg-[#2A1F2D] border-2 border-[#E8B84A] shadow-[2px_2px_0px_#000000] flex items-center justify-center ${
          active ? 'bg-[#8A6A3B]' : ''
        }`}
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      >
        <div className="w-3 h-3 bg-[#FFF9F0]" />
      </div>
    </div>
  );
};
