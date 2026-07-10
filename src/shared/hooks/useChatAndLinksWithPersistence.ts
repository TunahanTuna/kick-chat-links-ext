import { useState, useEffect, useRef, useCallback } from 'react'
import type { ChatMessage, LinkStat, KickChannel } from '../../types'
import { PusherService } from '../../services'
import { extractUrls, normalizeUrl, safeHostname, loadStoredLinks, addOrUpdateStoredLink, storedLinksToLinkStats, removeStoredLink, clearStoredLinks } from '../utils'

export function useChatAndLinksWithPersistence(channel: KickChannel | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [linkMap, setLinkMap] = useState<Record<string, LinkStat>>({})
  const [dismissedMap, setDismissedMap] = useState<Record<string, LinkStat>>({})
  const pusherServiceRef = useRef<PusherService | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const dismissedRef = useRef<Record<string, LinkStat>>({})

  useEffect(() => {
    dismissedRef.current = dismissedMap
  }, [dismissedMap])

  useEffect(() => {
    const streamerSlug = channel?.slug || null
    const storedLinks = loadStoredLinks(streamerSlug)
    const initialLinkMap = storedLinksToLinkStats(storedLinks)
    setLinkMap(initialLinkMap)
    setDismissedMap({})
    dismissedRef.current = {}
  }, [channel?.slug])

  const handleMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message])

    const urls = extractUrls(message.message)
    if (urls.length === 0) return

    const streamerSlug = channel?.slug || null

    setLinkMap((prev) => {
      const next = { ...prev }

      for (const rawUrl of urls) {
        const normalized = normalizeUrl(rawUrl)
        if (!normalized) continue

        if (dismissedRef.current[normalized]) {
          setDismissedMap((d) => {
            const existing = d[normalized]
            if (!existing) return d
            return {
              ...d,
              [normalized]: {
                ...existing,
                count: existing.count + 1,
                lastAt: message.createdAt || new Date().toISOString(),
                lastSender: message.username,
              },
            }
          })
          continue
        }

        const hostname = safeHostname(normalized)
        const exist = next[normalized]
        let updatedLinkStat: LinkStat

        if (exist) {
          updatedLinkStat = {
            ...exist,
            count: exist.count + 1,
            lastAt: message.createdAt || new Date().toISOString(),
            lastSender: message.username,
          }
        } else {
          updatedLinkStat = {
            url: normalized,
            hostname,
            count: 1,
            lastAt: message.createdAt || new Date().toISOString(),
            lastSender: message.username,
          }
        }

        next[normalized] = updatedLinkStat
        addOrUpdateStoredLink(streamerSlug, updatedLinkStat)
      }

      return next
    })
  }, [channel?.slug])

  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }

    const chatroomId = Number((channel as any)?.chatroom?.id)
    if (!channel || !chatroomId) {
      setMessages([])
      return
    }

    try {
      if (!pusherServiceRef.current) {
        pusherServiceRef.current = new PusherService()
      }

      unsubscribeRef.current = pusherServiceRef.current.subscribeToChat(chatroomId, handleMessage)

      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
          unsubscribeRef.current = null
        }
      }
    } catch (err) {
      console.error('Chat connection error:', err)
    }
  }, [channel, handleMessage])

  const clearData = useCallback(() => {
    setMessages([])
    const streamerSlug = channel?.slug || null
    const storedLinks = loadStoredLinks(streamerSlug)
    const persistedLinkMap = storedLinksToLinkStats(storedLinks)
    setLinkMap(persistedLinkMap)
  }, [channel?.slug])

  const removeLink = useCallback((urlToRemove: string) => {
    const streamerSlug = channel?.slug || null
    if (!streamerSlug) return

    setLinkMap((prev) => {
      const dismissed = prev[urlToRemove]
      if (dismissed) {
        setDismissedMap((d) => ({ ...d, [urlToRemove]: dismissed }))
        dismissedRef.current = { ...dismissedRef.current, [urlToRemove]: dismissed }
      }
      const next = { ...prev }
      delete next[urlToRemove]
      return next
    })

    removeStoredLink(streamerSlug, urlToRemove)
  }, [channel?.slug])

  const clearAllLinks = useCallback(() => {
    const streamerSlug = channel?.slug || null
    setLinkMap({})
    setDismissedMap({})
    dismissedRef.current = {}
    if (streamerSlug) {
      clearStoredLinks(streamerSlug)
    }
  }, [channel?.slug])

  return {
    messages,
    linkMap,
    dismissedMap,
    clearData,
    clearAllLinks,
    removeLink,
  }
}