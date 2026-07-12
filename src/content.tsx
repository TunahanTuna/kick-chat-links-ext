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

function findSidebarContainer(): HTMLElement | null {
  const svgs = document.querySelectorAll('svg')
  for (let i = 0; i < svgs.length; i++) {
    const svg = svgs[i]
    const iconWrapper = svg.parentElement
    if (!iconWrapper) continue
    
    const container = iconWrapper.parentElement
    if (!container) continue

    // Check if the container has many SVG children (at least 4)
    // The sidebar contains the edit icon, chat, stats, etc.
    const svgsInContainer = container.querySelectorAll(':scope > * > svg, :scope > * > * > svg')
    if (svgsInContainer.length >= 4) {
      const rect = container.getBoundingClientRect()
      // It should be narrow and on the right side of the screen
      if (rect.width > 0 && rect.width < 100 && rect.left > window.innerWidth / 2) {
        return container
      }
    }
  }
  return null
}

const sidebarBtnId = 'kick-chat-links-sidebar-btn'
const tooltipId = 'kick-chat-links-tooltip'

function showTooltip(button: HTMLElement, text: string) {
  if (document.getElementById(tooltipId)) return

  const tooltip = document.createElement('div')
  tooltip.id = tooltipId
  
  // Tooltip container
  tooltip.style.position = 'fixed'
  tooltip.style.backgroundColor = 'white'
  tooltip.style.color = 'black'
  tooltip.style.padding = '6px 10px'
  tooltip.style.borderRadius = '4px'
  tooltip.style.fontSize = '13px'
  tooltip.style.fontWeight = '500'
  tooltip.style.zIndex = '99999'
  tooltip.style.pointerEvents = 'none'
  tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
  tooltip.style.whiteSpace = 'nowrap'
  
  // Text node so we can append arrow separately
  const textNode = document.createElement('span')
  textNode.style.position = 'relative'
  textNode.style.zIndex = '2'
  textNode.textContent = text
  tooltip.appendChild(textNode)

  // Arrow pointing right
  const arrow = document.createElement('div')
  arrow.style.position = 'absolute'
  arrow.style.top = '50%'
  arrow.style.right = '-4px'
  arrow.style.transform = 'translateY(-50%) rotate(45deg)'
  arrow.style.width = '10px'
  arrow.style.height = '10px'
  arrow.style.backgroundColor = 'white'
  arrow.style.zIndex = '1'
  arrow.style.boxShadow = '2px -2px 2px rgba(0,0,0,0.04)' // subtle shadow on the exposed sides

  tooltip.appendChild(arrow)
  document.body.appendChild(tooltip)

  // Position it to the left of the button
  const rect = button.getBoundingClientRect()
  const tooltipRect = tooltip.getBoundingClientRect()
  
  const gap = 12
  const top = rect.top + (rect.height / 2) - (tooltipRect.height / 2)
  const left = rect.left - tooltipRect.width - gap

  tooltip.style.top = `${top}px`
  tooltip.style.left = `${left}px`
}

function hideTooltip() {
  const tooltip = document.getElementById(tooltipId)
  if (tooltip) tooltip.remove()
}

function updateButtonState(btn: HTMLElement, isVisible: boolean) {
  if (isVisible) {
    btn.style.boxShadow = 'inset 0 0 0 1px #53fc18'
    btn.style.borderRadius = '0.375rem'
  } else {
    btn.style.boxShadow = 'none'
  }
}

function injectSidebarButton() {
  if (document.getElementById(sidebarBtnId)) return

  const sidebar = findSidebarContainer()
  if (!sidebar) return

  const existingButtons = Array.from(sidebar.children) as HTMLElement[]
  if (existingButtons.length === 0) return
  
  // Clone the last button as a template
  const templateBtn = existingButtons[existingButtons.length - 1]
  const myBtn = templateBtn.cloneNode(true) as HTMLElement
  myBtn.id = sidebarBtnId
  
  // Replace the SVG with a Link icon
  const svgElement = myBtn.querySelector('svg')
  if (svgElement) {
    const className = svgElement.getAttribute('class') || ''
    svgElement.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="${className}"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>`
  }

  // Handle click
  myBtn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const panel = document.getElementById(containerId)
    if (!panel) return

    const isVisible = panel.style.display !== 'none'
    const newState = !isVisible
    
    panel.style.display = newState ? '' : 'none'
    localStorage.setItem('kick-chat-links-visible', newState.toString())
    
    updateButtonState(myBtn, newState)
  })

  myBtn.addEventListener('mouseenter', () => showTooltip(myBtn, 'Kick Links'))
  myBtn.addEventListener('mouseleave', hideTooltip)
  // Also hide if they click it, or leave it. Usually tooltips hide on click, but keeping it simple is fine.
  myBtn.addEventListener('click', hideTooltip)

  // Set initial state
  const isVisible = localStorage.getItem('kick-chat-links-visible') !== 'false'
  updateButtonState(myBtn, isVisible)

  sidebar.appendChild(myBtn)
}

function mountExtension() {
  // Only run in the dashboard /stream page
  if (window.location.hostname !== 'dashboard.kick.com' || !window.location.pathname.startsWith('/stream')) return
  
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

  // Set initial visibility based on localStorage
  const isVisible = localStorage.getItem('kick-chat-links-visible') !== 'false'
  container.style.display = isVisible ? '' : 'none'

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
  // If we navigated away from dashboard/stream, ensure it's removed
  if (window.location.hostname !== 'dashboard.kick.com' || !window.location.pathname.startsWith('/stream')) {
    const el = document.getElementById(containerId)
    if (el) el.remove()
    return
  }

  if (!document.getElementById(containerId) || !document.getElementById(sidebarBtnId)) {
    if (timeoutId) window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      mountExtension()
      injectSidebarButton()
    }, 500)
  }
})

// Start observing
observer.observe(document.body, { childList: true, subtree: true })

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    mountExtension()
    injectSidebarButton()
  })
} else {
  mountExtension()
  injectSidebarButton()
}
