import React, { useRef } from 'react';
import { VirtualJoystick } from './VirtualJoystick';
import { Sword, Wind, Sparkles } from 'lucide-react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onCameraRotate: (dx: number, dy: number) => void;
  onAttack: () => void;
  onDodge: () => void;
  onAction: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onMove,
  onCameraRotate,
  onAttack,
  onDodge,
  onAction,
}) => {
  const cameraTouchRef = useRef<{ id: number; lastX: number; lastY: number } | null>(null);

  const handleCameraTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.touch-button')) return;
    if (cameraTouchRef.current !== null) return;

    const touch = e.changedTouches[0];
    cameraTouchRef.current = {
      id: touch.identifier,
      lastX: touch.clientX,
      lastY: touch.clientY,
    };
  };

  const handleCameraTouchMove = (e: React.TouchEvent) => {
    if (!cameraTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === cameraTouchRef.current.id) {
        const dx = touch.clientX - cameraTouchRef.current.lastX;
        const dy = touch.clientY - cameraTouchRef.current.lastY;
        cameraTouchRef.current.lastX = touch.clientX;
        cameraTouchRef.current.lastY = touch.clientY;

        onCameraRotate(dx, dy);
        break;
      }
    }
  };

  const handleCameraTouchEnd = (e: React.TouchEvent) => {
    if (!cameraTouchRef.current) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === cameraTouchRef.current.id) {
        cameraTouchRef.current = null;
        break;
      }
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
      {/* Right-half touch zone for camera orbit */}
      <div
        onTouchStart={handleCameraTouchStart}
        onTouchMove={handleCameraTouchMove}
        onTouchEnd={handleCameraTouchEnd}
        onTouchCancel={handleCameraTouchEnd}
        className="pointer-events-auto absolute right-0 top-0 bottom-0 w-1/2 touch-none z-10"
      />

      {/* Bottom-Left: Virtual Joystick */}
      <div className="pointer-events-auto absolute bottom-8 left-8 z-20">
        <VirtualJoystick onMove={onMove} size={130} />
      </div>

      {/* Bottom-Right: Action Buttons Cluster */}
      <div className="pointer-events-auto absolute bottom-8 right-8 flex items-end gap-3 z-20">
        {/* Dodge / Roll Button */}
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            onDodge();
          }}
          onClick={onDodge}
          className="touch-button touch-control w-14 h-14 bg-[#1B2A2A] border-2 border-[#32A89D] text-[#85EADD] shadow-[4px_4px_0px_#000000] flex items-center justify-center cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none relative"
          title="Dodge (Shift)"
        >
          <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#85EADD]" />
          <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-[#85EADD]" />
          <Wind className="w-6 h-6" />
        </button>

        {/* Action / Interact Button */}
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            onAction();
          }}
          onClick={onAction}
          className="touch-button touch-control w-14 h-14 bg-[#3B2B1A] border-2 border-[#A67F46] text-[#F4D073] shadow-[4px_4px_0px_#000000] flex items-center justify-center cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none mb-10 relative"
          title="Action (E)"
        >
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#F4D073]" />
          <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-[#F4D073]" />
          <Sparkles className="w-6 h-6" />
        </button>

        {/* Primary Attack Button */}
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            onAttack();
          }}
          onClick={onAttack}
          className="touch-button touch-control w-20 h-20 bg-[#4A0B18] border-2 border-[#C2234B] text-[#FFF9F0] shadow-[6px_6px_0px_#000000] flex items-center justify-center cursor-pointer active:translate-x-1 active:translate-y-1 active:shadow-none relative group"
          title="Attack (Space)"
        >
          {/* Decorative Corners */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#FF8FB8]" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FF8FB8]" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#FF8FB8]" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#FF8FB8]" />
          <Sword className="w-10 h-10 text-[#FF8FB8] group-active:scale-90 transition-transform" />
        </button>
      </div>
    </div>
  );
};
