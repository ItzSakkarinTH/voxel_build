import { useState, useCallback } from "react"
import HandTracker from "../components/HandTracker"
import VoxelScene from "../components/VoxelScene"
import { isPinching, isFist } from "../utils/gestures"
import type { Landmark } from "./types/hand"

export default function App() {
  const [actions, setActions] = useState<{
    addVoxel: (x: number, y: number, z: number, color?: number) => void
    removeVoxel: (x: number, y: number, z: number) => void
    setCursor: (x: number, y: number, z: number) => void
  } | null>(null)

  const [selectedColor, setSelectedColor] = useState(0x00ffcc)
  const [pinchState, setPinchState] = useState<"none" | "add" | "remove">("none")

  const handleHandMove = useCallback(
    (landmarks: Landmark[]) => {
      if (!actions) return

      const indexTip = landmarks[8]
      const pinchAdd = isPinching(landmarks)
      const fistRemove = isFist(landmarks)

      if (pinchAdd) setPinchState("add")
      else if (fistRemove) setPinchState("remove")
      else setPinchState("none")

      const x = (0.5 - indexTip.x) * 40
      const y = (0.5 - indexTip.y) * 30
      const z = indexTip.z * -50

      actions.setCursor(x, y, z)

      if (pinchAdd) {
        actions.addVoxel(x, y, z, selectedColor)
      } else if (fistRemove) {
        actions.removeVoxel(x, y, z)
      }
    },
    [actions, selectedColor]
  )

  const onReady = useCallback(
    (
      addVoxel: (x: number, y: number, z: number, color?: number) => void,
      removeVoxel: (x: number, y: number, z: number) => void,
      setCursor: (x: number, y: number, z: number) => void
    ) => {
      setActions({ addVoxel, removeVoxel, setCursor })
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
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
        border: "4px solid yellow"
      }}>
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
          <h1 style={{ color: "#00ffcc", margin: "0 0 10px 0", fontSize: "1.6rem" }}>AR CORE ENGINE</h1>
          <p style={{ fontSize: "0.85rem", opacity: 0.7 }}>👌 PINCH to PLACE | ✊ FIST to REMOVE</p>

          <div style={{
            marginTop: "20px",
            padding: "12px",
            textAlign: "center",
            fontWeight: 800,
            background: pinchState === "add" ? "#00ffcc33" : (pinchState === "remove" ? "#ff333333" : "rgba(255,255,255,0.05)"),
            borderRadius: "15px",
            color: pinchState === "add" ? "#00ffcc" : (pinchState === "remove" ? "#ff3333" : "#666"),
            border: `1px solid ${pinchState === "none" ? "transparent" : (pinchState === "add" ? "#00ffcc" : "#ff3333")}`
          }}>
            {pinchState === "none" ? "READY / SCANNING" : `ACTIVE: ${pinchState.toUpperCase()}`}
          </div>

          {!actions && (
            <div style={{ color: "#ffcc00", marginTop: "15px", fontSize: "0.8rem", animation: "pulse 1s infinite" }}>
              INITIALIZING 3D ENGINE...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
