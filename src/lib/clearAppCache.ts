export async function clearAppCache(): Promise<void> {
  const errors: string[] = []

  // Limpar localStorage e sessionStorage
  try {
    localStorage.clear()
  } catch (e) {
    errors.push('localStorage')
  }

  try {
    sessionStorage.clear()
  } catch (e) {
    errors.push('sessionStorage')
  }

  // Limpar cache do Service Worker
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
    } catch (e) {
      errors.push('cache API')
    }
  }

  // Desregistrar service workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((reg) => reg.unregister()))
    } catch (e) {
      errors.push('service worker')
    }
  }

  // Limpar IndexedDB
  if ('indexedDB' in window) {
    try {
      const databases = await indexedDB.databases?.() ?? []
      await Promise.all(
        databases.map((db) => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const req = indexedDB.deleteDatabase(db.name!)
              req.onsuccess = () => resolve()
              req.onerror = () => reject(req.error)
              req.onblocked = () => reject(new Error('blocked'))
            })
          }
          return Promise.resolve()
        })
      )
    } catch (e) {
      errors.push('indexedDB')
    }
  }

  if (errors.length > 0) {
    throw new Error(`Não foi possível limpar: ${errors.join(', ')}`)
  }
}
