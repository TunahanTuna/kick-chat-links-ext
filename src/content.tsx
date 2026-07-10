import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './shared/contexts'
import './index.css'

const containerId = 'kick-chat-links-extension-root'

function findPanelByTitle(title: string): HTMLElement | null {
  // Find all elements containing the text
  const xpath = `//text()[contains(., '${title}')]/parent::*`
  const snapshot = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
  
  if (snapshot.snapshotLength === 0) return null

  // Take the first match
  const element = snapshot.snapshotItem(0) as HTMLElement
  
  // Traverse up to find the panel container.
  // The panel container is usually a direct child of the main grid.
  // We can identify the main grid because it has multiple panel children and display: grid/flex.
  let current = element
  while (current && current.parentElement && current.tagName !== 'BODY') {
    const parent = current.parentElement
    const parentStyle = window.getComputedStyle(parent)
    
    // Check if the parent is the main layout container (grid or flex)
    // Kick's dashboard has a main grid with gap
    if (
      (parentStyle.display === 'grid' || parentStyle.display === 'flex') && 
      parent.children.length >= 3 && // Should have multiple columns/panels
      current.tagName === 'DIV' // The panel itself is a div
    ) {
      // Return the panel itself (not the grid)
      return current
    }
    
    current = parent
  }
  
  return null
}

function mountExtension() {
  if (document.getElementById(containerId)) return

  // 1. Try to find the "Sohbet" (Chat) panel
  let targetPanel = findPanelByTitle('Sohbet')
  
  // 2. Fallback: Try "Denetim Eylemleri"
  if (!targetPanel) {
    targetPanel = findPanelByTitle('Denetim Eylemleri')
  }

  // 3. Fallback: Try "Etkinlik Akışı"
  if (!targetPanel) {
    targetPanel = findPanelByTitle('Etkinlik Akışı')
  }

  if (!targetPanel || !targetPanel.parentElement) {
    // If we still can't find it, we shouldn't mount as floating anymore. 
    // Just retry later.
    return
  }

  const container = document.createElement('div')
  container.id = containerId
  
  // We want to integrate directly into the grid. 
  // We copy the classes of the targetPanel to blend in perfectly.
  container.className = targetPanel.className || 'flex flex-col rounded-md bg-[#1B1E21]'
  container.style.cssText = targetPanel.style.cssText
  container.style.minHeight = '300px'
  // Remove any specific height constraints that might have been copied
  container.style.height = 'auto'

  // Insert our panel right before the target panel!
  // If target is "Yayın bilgisi", it will be placed above it.
  targetPanel.parentElement.insertBefore(container, targetPanel)

  createRoot(container).render(
    <StrictMode>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </StrictMode>,
  )
}

let timeoutId: number | null = null

// Use MutationObserver with debouncing so we don't kill performance
const observer = new MutationObserver(() => {
  if (!document.getElementById(containerId)) {
    if (timeoutId) window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      mountExtension()
    }, 500)
  }
})

// Start observing
observer.observe(document.body, { childList: true, subtree: true })

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountExtension)
} else {
  mountExtension()
}
