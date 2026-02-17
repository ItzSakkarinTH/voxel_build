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

export function isOpenHand(landmarks: Landmark[]): boolean {
  // Check if finger tips (8, 12, 16, 20) are well above their base joints (5, 9, 13, 17)
  // In MediaPipe y increases downwards, so tip.y < base.y means the finger is extended
  const isIndexExtended = landmarks[8].y < landmarks[5].y
  const isMiddleExtended = landmarks[12].y < landmarks[9].y
  const isRingExtended = landmarks[16].y < landmarks[13].y
  const isPinkyExtended = landmarks[20].y < landmarks[17].y

  // The thumb tip (4) should also be relatively far from the index base (5)
  const thumbTip = landmarks[4]
  const indexBase = landmarks[5]
  const thumbDistance = Math.hypot(thumbTip.x - indexBase.x, thumbTip.y - indexBase.y)
  const isThumbExtended = thumbDistance > 0.1

  return isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended && isThumbExtended
}

