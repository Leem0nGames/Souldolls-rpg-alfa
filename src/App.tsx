import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Engine, EngineStats } from './engine/core/Engine';
import { NPCDialogue } from './engine/entities/NPC';
import { MobileControls } from './ui/MobileControls';
import { GameHUD } from './ui/GameHUD';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const [dialogue, setDialogue] = useState<NPCDialogue | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Instantiate modular Three.js Engine
    const engine = new Engine(containerRef.current);
    engineRef.current = engine;

    engine.onStatsUpdate = (newStats) => {
      setStats(newStats);
    };

    engine.onDialogueChange = (newDialogue) => {
      setDialogue(newDialogue);
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Handlers for mobile touch inputs & combat
  const handleJoystickMove = useCallback((x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.input.setJoystickInput(x, y);
    }
  }, []);

  const handleCameraRotate = useCallback((dx: number, dy: number) => {
    if (engineRef.current) {
      engineRef.current.input.addCameraDelta(dx, dy);
    }
  }, []);

  const handleAttack = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.handlePlayerAttack();
    }
  }, []);

  const handleCastSpell = useCallback((spellId: string) => {
    if (engineRef.current) {
      engineRef.current.handleCastSpell(spellId);
    }
  }, []);

  const handleDodge = useCallback(() => {
    if (engineRef.current) {
      const moveDir = engineRef.current.input.moveVector;
      engineRef.current.player.triggerDodge(
        new THREE.Vector3(moveDir.x, 0, moveDir.y),
        engineRef.current.tpCamera.yaw
      );
    }
  }, []);

  const handleAction = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.handlePlayerAction();
    }
  }, []);

  const handleCloseDialogue = useCallback(() => {
    setDialogue(null);
    if (engineRef.current) {
      engineRef.current.activeDialogue = null;
    }
  }, []);

  const handleAcceptQuest = useCallback((questId: string) => {
    if (engineRef.current) {
      engineRef.current.acceptQuest(questId);
    }
  }, []);

  const handleDeliverQuest = useCallback((questId: string) => {
    if (engineRef.current) {
      engineRef.current.deliverQuest(questId);
    }
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 text-slate-100 select-none touch-none">
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Mobile-First Touch Controls Overlay (Virtual Joystick, Action buttons, Camera swipe) */}
      <MobileControls
        onMove={handleJoystickMove}
        onCameraRotate={handleCameraRotate}
        onAttack={handleAttack}
        onDodge={handleDodge}
        onAction={handleAction}
      />

      {/* Non-occluding Game HUD (Player status, magic hotbar, target frame, coordinates, FPS, dialogue) */}
      <GameHUD
        stats={stats}
        dialogue={dialogue}
        onCloseDialogue={handleCloseDialogue}
        onInteract={handleAction}
        onCastSpell={handleCastSpell}
        onAttack={handleAttack}
        onAcceptQuest={handleAcceptQuest}
        onDeliverQuest={handleDeliverQuest}
      />
    </div>
  );
}
