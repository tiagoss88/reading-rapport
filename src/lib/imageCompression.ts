/**
 * Utility functions for image compression
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0.1 to 1.0
  maxSizeKB?: number
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  maxSizeKB: 500
}

/**
 * Compresses an image file while maintaining quality
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - The compressed image file
 */
export async function compressImage(
  file: File, 
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }
    
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = calculateDimensions(
          img.naturalWidth, 
          img.naturalHeight, 
          opts.maxWidth, 
          opts.maxHeight
        )
        
        canvas.width = width
        canvas.height = height
        
        // Draw image with new dimensions
        ctx.drawImage(img, 0, 0, width, height)
        
        // Start with initial quality
        let quality = opts.quality
        let attempts = 0
        const maxAttempts = 5
        
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'))
                return
              }
              
              const sizeKB = blob.size / 1024
              
              // If size is acceptable or we've tried enough times, use current result
              if (sizeKB <= opts.maxSizeKB || attempts >= maxAttempts) {
                const compressedFile = new File([blob], file.name, {
                  type: blob.type,
                  lastModified: Date.now()
                })
                
                console.log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB → ${sizeKB.toFixed(2)}KB`)
                resolve(compressedFile)
                return
              }
              
              // Reduce quality and try again
              attempts++
              quality = Math.max(0.1, quality - 0.1)
              tryCompress()
            },
            'image/jpeg',
            quality
          )
        }
        
        tryCompress()
        
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight
  
  // Scale down if needed
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }
  
  return { width: Math.round(width), height: Math.round(height) }
}

/**
 * Validates if the file is a valid image
 */
export function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/') && file.size > 0
}

/**
 * Gets optimal compression settings based on image size
 */
export function getOptimalCompressionOptions(fileSizeKB: number): CompressionOptions {
  if (fileSizeKB > 2000) {
    // Large images - more aggressive compression
    return {
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 0.7,
      maxSizeKB: 400
    }
  } else if (fileSizeKB > 1000) {
    // Medium images - moderate compression
    return {
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.8,
      maxSizeKB: 500
    }
  } else {
    // Small images - light compression
    return {
      maxWidth: 1920,
      maxHeight: 1920,
      quality: 0.85,
      maxSizeKB: 600
    }
  }
}