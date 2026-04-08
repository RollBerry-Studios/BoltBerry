import { useState, useEffect } from 'react'

const cache = new Map<string, HTMLImageElement>()

export function useImage(src: string | null): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(
    src ? (cache.get(src) ?? null) : null
  )

  useEffect(() => {
    if (!src) {
      setImg(null)
      return
    }

    if (cache.has(src)) {
      setImg(cache.get(src)!)
      return
    }

    let cancelled = false

    if (!src.startsWith('data:') && !src.startsWith('http') && !src.startsWith('file://')) {
      window.electronAPI?.getImageAsBase64(src).then((imageData) => {
        if (cancelled) return
        if (!imageData) {
          setImg(null)
          return
        }
        const image = new Image()
        image.onload = () => {
          if (cancelled) return
          cache.set(src, image)
          setImg(image)
        }
        image.onerror = () => {
          if (cancelled) setImg(null)
        }
        image.src = imageData
      }).catch(() => {
        if (!cancelled) setImg(null)
      })
    } else {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        if (cancelled) return
        cache.set(src, image)
        setImg(image)
      }
      image.onerror = () => {
        if (cancelled) setImg(null)
      }
      image.src = src
    }

    return () => {
      cancelled = true
    }
  }, [src])

  return img
}