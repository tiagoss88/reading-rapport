import { Capacitor } from '@capacitor/core'

/**
 * Abre o seletor de imagens com suporte real a múltipla seleção.
 *
 * - Nativo (Android/iOS via Capacitor): usa @capacitor/camera Camera.pickImages
 *   que abre o Photo Picker nativo (suporta multi-select de verdade).
 * - Web/PWA: cria um <input type="file" multiple accept="image/*"> programático.
 */
export async function pickImagesMulti(): Promise<File[]> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Camera } = await import('@capacitor/camera')
      const res = await Camera.pickImages({ quality: 90, limit: 0 })
      const files = await Promise.all(
        (res.photos || []).map(async (p, i) => {
          const url = p.webPath || (p as any).path
          if (!url) throw new Error('Foto sem caminho')
          const blob = await (await fetch(url)).blob()
          const ext = p.format || (blob.type.split('/')[1] ?? 'jpg')
          return new File([blob], `foto_${Date.now()}_${i}.${ext}`, {
            type: blob.type || `image/${ext}`,
          })
        })
      )
      return files
    } catch (err) {
      console.error('pickImagesMulti nativo falhou, usando fallback web:', err)
      // cai para o fallback web
    }
  }

  return new Promise<File[]>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.style.display = 'none'
    let resolved = false
    const done = (files: File[]) => {
      if (resolved) return
      resolved = true
      try { document.body.removeChild(input) } catch {}
      resolve(files)
    }
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : []
      done(files)
    }
    // alguns browsers não disparam onchange se o usuário cancelar; resolve vazio ao voltar foco
    const onFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) done([])
      }, 500)
      window.removeEventListener('focus', onFocus)
    }
    window.addEventListener('focus', onFocus)
    document.body.appendChild(input)
    input.click()
  })
}

/**
 * Tira foto única usando a câmera. No nativo abre Camera.getPhoto; no web faz
 * fallback para <input capture="environment">.
 */
export async function takePhotoNative(): Promise<File | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
      const photo = await Camera.getPhoto({
        quality: 90,
        source: CameraSource.Camera,
        resultType: CameraResultType.Uri,
      })
      const url = photo.webPath || (photo as any).path
      if (!url) return null
      const blob = await (await fetch(url)).blob()
      const ext = photo.format || 'jpg'
      return new File([blob], `foto_${Date.now()}.${ext}`, {
        type: blob.type || `image/${ext}`,
      })
    } catch (err) {
      console.error('takePhotoNative falhou:', err)
      return null
    }
  }

  return new Promise<File | null>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    ;(input as any).capture = 'environment'
    input.style.display = 'none'
    let resolved = false
    const done = (f: File | null) => {
      if (resolved) return
      resolved = true
      try { document.body.removeChild(input) } catch {}
      resolve(f)
    }
    input.onchange = () => {
      const f = input.files && input.files[0] ? input.files[0] : null
      done(f)
    }
    const onFocus = () => {
      setTimeout(() => {
        if (!input.files || input.files.length === 0) done(null)
      }, 500)
      window.removeEventListener('focus', onFocus)
    }
    window.addEventListener('focus', onFocus)
    document.body.appendChild(input)
    input.click()
  })
}
