export function spawnRipple(event) {
  const host = event.currentTarget
  if (!host) return

  const rect = host.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 1.1
  const x = (event.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2
  const y = (event.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2

  const ripple = document.createElement('span')
  ripple.className = 'ripple'
  ripple.style.width = ripple.style.height = `${size}px`
  ripple.style.left = `${x}px`
  ripple.style.top = `${y}px`

  host.appendChild(ripple)
  ripple.addEventListener('animationend', () => ripple.remove())
}
