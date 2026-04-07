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

    // Check if this is a relative path (not base64 or absolute URL)
    if (!src.startsWith('data:') && !src.startsWith('http') && !src.startsWith('file://')) {
      // It's a relative path, load through main process
      loadImageThroughMainProcess(src)
      return
    }

    // It's already a full URL or base64, load directly
    const image = new Image()
    image.crossOrigin = "anonymous" // Handle potential CORS issues
    image.onload = () => {
      cache.set(src, image)
      setImg(image)
    }
    image.onerror = (err) => {
      console.error('[useImage] Failed to load image directly:', src, err)
      setImg(null)
    }
    image.src = src
  }, [src])

  // Method to load images through main process for relative paths
  async function loadImageThroughMainProcess(relativePath: string) {
    if (window.electronAPI) {
      try {
        console.log('[useImage] Loading image through main process:', relativePath)
        const imageData = await window.electronAPI.getImageAsBase64(relativePath)
        if (imageData) {
          const img = new Image()
          img.onload = () => {
            cache.set(relativePath, img)
            setImg(img)
          }
          img.onerror = (err) => {
            console.error('[useImage] Failed to load base64 image:', err)
            setImg(null)
          }
          img.src = imageData
        } else {
          console.log('[useImage] No image data returned from main process for:', relativePath)
          setImg(null)
        }
      } catch (err) {
        console.error('[useImage] Failed to load through main process:', err)
        setImg(null)
      }
    }
  }

  return img
}