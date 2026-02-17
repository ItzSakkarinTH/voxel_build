import type { Landmark } from "../src/types/hand"

export function isPinching(landmarks: Landmark[]): boolean {
  const thumb = landmarks[4]
  const index = landmarks[8]

  const dist = Math.hypot(
    thumb.x - index.x,
    thumb.y - index.y
  )

  return dist < 0.08
}

export function isFist(landmarks: Landmark[]): boolean {
  // Check if finger tips (8, 12, 16, 20) are below their mid-joints (6, 10, 14, 18)
  // In MediaPipe y increases downwards, so tip.y > joint.y means the finger is curled
  const isIndexCurled = landmarks[8].y > landmarks[6].y
  const isMiddleCurled = landmarks[12].y > landmarks[10].y
  const isRingCurled = landmarks[16].y > landmarks[14].y
  const isPinkyCurled = landmarks[20].y > landmarks[18].y

  // For a fist, most fingers should be curled
  return isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled
}

