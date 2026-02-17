import { useEffect, useRef, useState } from "react"
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"
import type { Landmark } from "../src/types/hand"

type Props = {
  onHandMove: (landmarks: Landmark[]) => void
  onColorSelect: (color: number) => void
  selectedColor: number
  fullScreen?: boolean
}

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

const COLORS = [
  { name: "Cyan", value: 0x00ffcc, hex: "#00ffcc" },
  { name: "Pink", value: 0xff0077, hex: "#ff0077" },
  { name: "Yellow", value: 0xffdd00, hex: "#ffdd00" },
  { name: "Purple", value: 0x9900ff, hex: "#9900ff" },
  { name: "Orange", value: 0xff6600, hex: "#ff6600" },
  { name: "White", value: 0xffffff, hex: "#ffffff" },
  { name: "Red", value: 0xff3333, hex: "#ff3333" },
  { name: "Green", value: 0x33ff33, hex: "#33ff33" }
]

export default function HandTracker({ onHandMove, onColorSelect, selectedColor, fullScreen }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const handLandmarkerRef = useRef<HandLandmarker | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const sparksRef = useRef<Spark[]>([])

  const propsRef = useRef({ onHandMove, onColorSelect, selectedColor })
  useEffect(() => {
    propsRef.current = { onHandMove, onColorSelect, selectedColor }
  }, [onHandMove, onColorSelect, selectedColor])

  useEffect(() => {
    let active = true
    const initializeHandLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
        )
        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        })

        if (!active) {
          handLandmarker.close()
          return
        }
        handLandmarkerRef.current = handLandmarker

        if (videoRef.current && canvasRef.current) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user"
            }
          })
          videoRef.current.srcObject = stream

          await new Promise((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                if (videoRef.current && canvasRef.current) {
                  videoRef.current.width = videoRef.current.videoWidth
                  videoRef.current.height = videoRef.current.videoHeight
                  canvasRef.current.width = videoRef.current.videoWidth
                  canvasRef.current.height = videoRef.current.videoHeight
                }
                resolve(true)
              }
            }
          })

          await videoRef.current.play()
          if (active) setIsLoaded(true)

          const ctx = canvasRef.current.getContext("2d")

          const updateSparks = (ctx: CanvasRenderingContext2D) => {
            const sparks = sparksRef.current
            for (let i = sparks.length - 1; i >= 0; i--) {
              const s = sparks[i]
              s.x += s.vx
              s.y += s.vy
              s.life -= 0.03

              if (s.life <= 0) {
                sparks.splice(i, 1)
                continue
              }

              ctx.beginPath()
              ctx.moveTo(s.x, s.y)
              ctx.lineTo(s.x - s.vx * 3, s.y - s.vy * 3)
              ctx.strokeStyle = s.color
              ctx.globalAlpha = s.life
              ctx.lineWidth = 2
              ctx.stroke()
            }
            ctx.globalAlpha = 1
          }

          const emitSparks = (x: number, y: number, color: string, count: number = 3) => {
            for (let i = 0; i < count; i++) {
              sparksRef.current.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.5) * 12,
                life: 1.0,
                color
              })
            }
          }

          const detectHands = async () => {
            if (!active) return

            if (
              handLandmarkerRef.current &&
              videoRef.current &&
              videoRef.current.readyState >= 2 &&
              !videoRef.current.paused &&
              !videoRef.current.ended &&
              ctx &&
              canvasRef.current
            ) {
              try {
                const startTimeMs = performance.now()
                const results = await handLandmarkerRef.current.detectForVideo(
                  videoRef.current,
                  startTimeMs
                )

                ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
                updateSparks(ctx)

                // UI buttons
                const btnSize = 60
                const padding = 25
                const startX = canvasRef.current.width - btnSize - padding
                const currentSelected = propsRef.current.selectedColor

                COLORS.forEach((color, i) => {
                  if (!canvasRef.current) return
                  const y = padding + i * (btnSize + 15)
                  let isHovering = false
                  if (results.landmarks.length > 0) {
                    const finger = results.landmarks[0][8]
                    const fx = (1 - finger.x) * canvasRef.current.width
                    const fy = finger.y * canvasRef.current.height
                    if (fx > startX && fx < startX + btnSize && fy > y && fy < y + btnSize) {
                      isHovering = true
                      propsRef.current.onColorSelect(color.value)
                    }
                  }

                  ctx.beginPath()
                  ctx.roundRect(startX, y, btnSize, btnSize, 15)
                  ctx.fillStyle = color.hex
                  ctx.shadowBlur = isHovering ? 20 : 0
                  ctx.shadowColor = color.hex
                  ctx.fill()
                  ctx.strokeStyle = (currentSelected === color.value) ? "#fff" : "rgba(255,255,255,0.4)"
                  ctx.lineWidth = 3
                  ctx.stroke()
                  ctx.shadowBlur = 0
                })

                if (results.landmarks.length > 0) {
                  const landmarks = results.landmarks[0]
                  propsRef.current.onHandMove(landmarks)

                  const index = landmarks[8]
                  const thumb = landmarks[4]
                  const fingerPos = {
                    x: (1 - index.x) * canvasRef.current.width,
                    y: index.y * canvasRef.current.height
                  }
                  const thumbPos = {
                    x: (1 - thumb.x) * canvasRef.current.width,
                    y: thumb.y * canvasRef.current.height
                  }

                  const dist = Math.hypot(index.x - thumb.x, index.y - thumb.y)

                  // Open hand detection: fingers extended (tip.y < base.y)
                  const isOpenHandState = landmarks[8].y < landmarks[5].y &&
                    landmarks[12].y < landmarks[9].y &&
                    landmarks[16].y < landmarks[13].y &&
                    landmarks[20].y < landmarks[17].y

                  const selColorHex = `#${propsRef.current.selectedColor.toString(16).padStart(6, "0")}`

                  if (dist < 0.1) {
                    emitSparks(fingerPos.x, fingerPos.y, selColorHex, 5)
                    emitSparks(thumbPos.x, thumbPos.y, selColorHex, 3)
                    // Mix in white sparks
                    if (Math.random() > 0.5) {
                      emitSparks(fingerPos.x, fingerPos.y, "#ffffff", 2)
                    }
                  }
                  if (isOpenHandState && dist >= 0.1) {
                    // Open hand effect: more sparks from all finger tips (using middle finger pos as center)
                    emitSparks(fingerPos.x, fingerPos.y, "#ff3333", 4)
                    const mPos = {
                      x: (1 - landmarks[12].x) * canvasRef.current!.width,
                      y: landmarks[12].y * canvasRef.current!.height
                    }
                    emitSparks(mPos.x, mPos.y, "#ff3333", 4)
                    emitSparks(fingerPos.x, fingerPos.y, "#ffffff", 2)
                  }

                  // Constant pulse
                  if (Math.random() > 0.6) {
                    emitSparks(fingerPos.x, fingerPos.y, "#ffffff", 1)
                  }

                }
              } catch {
                // ignore
              }
            }
            requestAnimationFrame(detectHands)
          }
          detectHands()
        }
      } catch (err) {
        console.error("Init error:", err)
      }
    }

    initializeHandLandmarker()

    return () => {
      active = false
      if (handLandmarkerRef.current) handLandmarkerRef.current.close()
    }
  }, [fullScreen])

  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#000" }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)"
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none"
        }}
      />
      {!isLoaded && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00ffcc",
          background: "#000",
          fontSize: "1.2rem",
          fontWeight: "bold",
          letterSpacing: "2px"
        }}>
          SYSTEM INITIALIZING...
        </div>
      )}
    </div>
  )
}
