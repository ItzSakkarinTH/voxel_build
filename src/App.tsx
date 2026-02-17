import { useState, useCallback, useRef } from "react"
import HandTracker from "../components/HandTracker"
import VoxelScene from "../components/VoxelScene"
import { isPinching, isOpenHand } from "../utils/gestures"
import type { Landmark } from "./types/hand"

export default function App() {
  const [actions, setActions] = useState<{
    addVoxel: (x: number, y: number, z: number, color?: number) => void
    removeVoxel: (x: number, y: number, z: number) => void
    setCursor: (x: number, y: number, z: number) => void
    rotateScene: (dx: number, dy: number) => void
  } | null>(null)

  const [selectedColor, setSelectedColor] = useState(0x00ffcc)
  const [pinchState, setPinchState] = useState<"none" | "add" | "remove">("none")

  // Ref to track last hand position for rotation
  const lastRotPos = useRef<{ x: number, y: number } | null>(null)

  const handleHandMove = useCallback(
    (hands: Landmark[][]) => {
      if (!actions) return

      // --- 1. DRAWING HAND (Primary Hand - Hand 0) ---
      const hand1 = hands[0]
      const indexTip = hand1[8]
      const pinchAdd = isPinching(hand1)
      const openRemove = isOpenHand(hand1)

      const x = (0.5 - indexTip.x) * 40
      const y = (0.5 - indexTip.y) * 30
      const z = indexTip.z * -50

      actions.setCursor(x, y, z)

      if (pinchAdd) {
        setPinchState("add")
        actions.addVoxel(x, y, z, selectedColor)
      } else if (openRemove) {
        setPinchState("remove")
        actions.removeVoxel(x, y, z)
      } else {
        setPinchState("none")
      }

      // --- 2. ROTATION HAND (Secondary Hand - Hand 1) ---
      if (hands.length > 1) {
        const hand2 = hands[1]
        // Rotation happens if hand 2 is a "fist" or just moving
        // Let's use simple movement of hand 2's palm/wrist (Landmark 0)
        const rotPos = { x: hand2[0].x, y: hand2[0].y }

        if (lastRotPos.current) {
          const dx = (rotPos.x - lastRotPos.current.x) * 5
          const dy = (rotPos.y - lastRotPos.current.y) * 5
          actions.rotateScene(dx, dy)
        }
        lastRotPos.current = rotPos
      } else {
        lastRotPos.current = null
      }
    },
    [actions, selectedColor]
  )

  const onReady = useCallback(
    (
      addVoxel: (x: number, y: number, z: number, color?: number) => void,
      removeVoxel: (x: number, y: number, z: number) => void,
      setCursor: (x: number, y: number, z: number) => void,
      rotateScene: (dx: number, dy: number) => void
    ) => {
      setActions({ addVoxel, removeVoxel, setCursor, rotateScene })
    },
    []
  )

  return (
    <div style={{ position: "fixed", inset: 0, width: "100%", height: "100%", background: "#000" }}>
      {/* CAMERA (Bottom) */}
      <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        <HandTracker
          onHandMove={handleHandMove}
          onColorSelect={setSelectedColor}
          selectedColor={selectedColor}
          fullScreen={true}
        />
      </div>

      {/* 3D OVERLAY (Above Camera) */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>
        <VoxelScene onReady={onReady} />
      </div>

      {/* HUD (Top) */}
      <div style={{ position: "absolute", top: 40, left: 40, zIndex: 100, pointerEvents: "none" }}>
        <div style={{
          backgroundColor: "rgba(0,0,0,0.85)",
          padding: "24px",
          borderRadius: "24px",
          border: "2px solid #00ffcc",
          color: "#fff",
          minWidth: "300px",
          backdropFilter: "blur(15px)"
        }}>
          <h1 style={{ color: "#00ffcc", margin: "0 0 10px 0", fontSize: "1.6rem" }}>AR MULTI-CORE</h1>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>RH: 👌 DRAW | 🖐️ ERASE</p>
          <p style={{ fontSize: "0.8rem", opacity: 0.7 }}>LH: ✋ MOVE TO ROTATE WORLD</p>

          <div style={{
            marginTop: "20px",
            padding: "12px",
            textAlign: "center",
            fontWeight: 800,
            background: pinchState === "add" ? "#00ffcc33" : (pinchState === "remove" ? "#ff333333" : "rgba(255,255,255,0.05)"),
            borderRadius: "15px",
            color: pinchState === "add" ? "#00ffcc" : (pinchState === "remove" ? "#ff3333" : "#666")
          }}>
            {pinchState === "none" ? "SCANNING HANDS" : `SYSTEM: ${pinchState.toUpperCase()}`}
          </div>
        </div>
      </div>
    </div>
  )
}
