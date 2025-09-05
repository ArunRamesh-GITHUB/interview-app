/**
 * Utility functions for working with CSS custom properties (tokens)
 */

/**
 * Read a CSS custom property value from the document root
 * @param property - CSS custom property name (with or without --)
 * @returns The computed value of the CSS custom property
 */
export function readCssVar(property: string): string {
  const prop = property.startsWith('--') ? property : `--${property}`
  return getComputedStyle(document.documentElement).getPropertyValue(prop).trim()
}

/**
 * Set a CSS custom property on the document root
 * @param property - CSS custom property name (with or without --)
 * @param value - Value to set
 */
export function setCssVar(property: string, value: string): void {
  const prop = property.startsWith('--') ? property : `--${property}`
  document.documentElement.style.setProperty(prop, value)
}

/**
 * Snap a percentage value to the nearest 5%
 * Useful for progress bars and similar components per design system rules
 * @param percentage - Percentage value to snap (0-100)
 * @returns Snapped percentage value
 */
export function snapTo5(percentage: number): number {
  return Math.round(percentage / 5) * 5
}

/**
 * Format a number for display using tabular numerals
 * Ensures consistent spacing in stat displays
 * @param value - Number to format
 * @param options - Intl.NumberFormat options
 * @returns Formatted string with tabular numerals
 */
export function formatTabularNumber(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    ...options,
  }).format(value)
}

/**
 * Get the appropriate contrast text color (primary or secondary) based on background
 * @param backgroundColor - Background color to test against
 * @returns 'primary' or 'secondary' text color variant
 */
export function getContrastTextColor(backgroundColor: string): 'primary' | 'secondary' {
  // This is a simplified implementation
  // In a real app, you might use a color contrast library
  const darkColors = ['dark', 'primary', 'secondary']
  const isDark = darkColors.some(color => backgroundColor.includes(color))
  return isDark ? 'primary' : 'secondary'
}

/**
 * Create a CSS transition string using design system timing
 * @param properties - CSS properties to transition
 * @param duration - Duration token name (instant, fast, standard, slow)
 * @param easing - Easing token name (in-out, decelerate, accelerate)
 * @returns CSS transition string
 */
export function createTransition(
  properties: string[],
  duration: 'instant' | 'fast' | 'standard' | 'slow' = 'fast',
  easing: 'in-out' | 'decelerate' | 'accelerate' = 'in-out'
): string {
  const durationVar = `var(--duration-${duration})`
  const easingVar = `var(--ease-${easing})`
  
  return properties
    .map(prop => `${prop} ${durationVar} ${easingVar}`)
    .join(', ')
}

/**
 * Get chart color by index, cycling through the design system chart palette
 * @param index - Index of the data series (0-based)
 * @returns CSS custom property name for chart color
 */
export function getChartColor(index: number): string {
  const colors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)', 
    'var(--color-chart-3)',
    'var(--color-chart-4)'
  ]
  return colors[index % colors.length]
}

/**
 * Calculate the appropriate icon size based on component size
 * @param componentSize - Size variant (xs, sm, md, lg, xl)
 * @returns Icon size in pixels
 */
export function getIconSize(componentSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl'): number {
  const sizes = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32
  }
  return sizes[componentSize]
}

/**
 * Generate focus ring styles using design system tokens
 * @returns CSS-in-JS object for focus ring styles
 */
export function getFocusRingStyles() {
  return {
    outline: 'var(--focus-outline-width) solid var(--focus-outline-color)',
    outlineOffset: '2px',
    borderRadius: 'var(--focus-outline-radius)'
  }
}