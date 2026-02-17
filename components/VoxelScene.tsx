import { useEffect, useRef } from "react"
import { createVoxelScene } from "../hooks/useVoxel"

type Props = {
  onReady: (
    addVoxel: (x: number, y: number, z: number, color?: number) => void,
    removeVoxel: (x: number, y: number, z: number) => void,
    setCursor: (x: number, y: number, z: number) => void,
    rotateScene: (dx: number, dy: number) => void
  ) => void
}

export default function VoxelScene({ onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      // Clear any existing content (important for Hot Module Replacement)
      containerRef.current.innerHTML = ""

      const actions = createVoxelScene(containerRef.current)
      onReady(actions.addVoxel, actions.removeVoxel, actions.setCursor, actions.rotateScene)
    }
  }, [onReady])

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        background: "transparent"
      }}
    />
  )
}
