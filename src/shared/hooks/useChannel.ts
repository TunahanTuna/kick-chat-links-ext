import { useState, useEffect } from 'react'
import type { KickChannel } from '../../types'
import { KickAPIService } from '../../services'

function getNativeUsername(): string {
  try {
    // Attempt 1: Next.js data script (most reliable)
    const script = document.getElementById('__NEXT_DATA__')
    if (script && script.textContent) {
      const data = JSON.parse(script.textContent)
      const username = data?.props?.pageProps?.user?.username || 
                       data?.props?.pageProps?.channel?.slug
      if (username) return username
    }
  } catch (e) {
    // Ignore parse errors
  }

  // Attempt 2: Fallback to reading the "Offline" or "Online" banner text in the preview
  try {
    const xpath = `//*[not(self::script) and not(self::style)]/text()[contains(., 'çevrim dışı') or contains(., 'is offline') or contains(., 'çevrim içi') or contains(., 'is online')]/parent::*`
    const snapshot = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    if (snapshot.snapshotLength > 0) {
      const text = snapshot.snapshotItem(0)?.textContent || ''
      const match = text.match(/^(.+?)\s+(çevrim dışı|is offline|çevrim içi|is online)/i)
      if (match && match[1]) {
        const extracted = match[1].trim()
        if (extracted.length < 50) return extracted
      }
    }
  } catch (e) {
    // Ignore errors
  }

  return ''
}

export function useChannel() {
  const [username, setUsername] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const urlChannel = urlParams.get('channel')
      if (urlChannel) return urlChannel

      const nativeUser = getNativeUsername()
      if (nativeUser && nativeUser.length < 50) return nativeUser
      
      const stored = localStorage.getItem('kick-chat-username') || ''
      if (stored.length < 50) return stored
      
      // If we reach here, local storage had a corrupt/huge value, let's remove it
      localStorage.removeItem('kick-chat-username')
      return ''
    } catch {
      return ''
    }
  })
  const [channel, setChannel] = useState<KickChannel | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasEverConnected, setHasEverConnected] = useState<boolean>(false)

  async function fetchChannel(signal?: AbortSignal) {
    if (!username.trim()) return
    
    setIsLoading(true)
    setErrorMessage(null)
    setChannel(null)
    
    try {
      const data = await KickAPIService.fetchChannel(username.trim(), signal)
      setChannel(data)
      setHasEverConnected(true)
    } catch (error) {
      if ((error as Error).name === 'AbortError') return
      setErrorMessage((error as Error).message || 'Bilinmeyen bir hata oluştu')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    if (username.trim()) {
      void fetchChannel(controller.signal)
    }
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (username.trim()) {
      try {
        localStorage.setItem('kick-chat-username', username.trim())
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [username])

  const disconnect = () => {
    setChannel(null)
    setErrorMessage(null)
  }

  return {
    username,
    setUsername,
    channel,
    setChannel,
    isLoading,
    errorMessage,
    hasEverConnected,
    fetchChannel,
    disconnect
  }
}
