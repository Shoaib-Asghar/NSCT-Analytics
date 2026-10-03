/*
 * Color palette constants for D3 charts.
 * 
 * WHY A SEPARATE FILE?
 * ====================
 * D3 sets colors via JavaScript (.attr('fill', color)), not CSS.
 * SVG attributes like `fill` and `stroke` are set in JS when D3 creates elements.
 * 
 * We COULD use CSS classes on SVG elements and style them in style.css,
 * but D3's data-driven approach often needs colors computed from data
 * (e.g., "if pass rate > 50, use green, else red"). That logic lives in JS,
 * so the color values need to be accessible in JS.
 *
 * We keep them in one file so:
 * 1. All chart colors are centralized (change once, applies everywhere)
 * 2. They match the CSS variables in style.css (single source of truth)
 */

export const COLORS = {
  // Brand
  primary:      '#0E7C7B',
  primaryDark:  '#065F5E',
  primaryLight: '#D1FAF5',
  primaryBg:    '#F0FDFA',

  // Data palette (for multi-series charts)
  data: ['#0E7C7B', '#6366F1', '#EF6C57', '#F59E0B', '#10B981'],

  // Semantic
  pass:    '#10B981',
  fail:    '#EF4444',
  warning: '#F59E0B',

  // Grays (for axes, labels, backgrounds)
  text:       '#334155',
  heading:    '#0F172A',
  muted:      '#94A3B8',
  border:     '#E2E8F0',
  cardBg:     '#FFFFFF',
  pageBg:     '#F0F2F5',

  // Grade colors (for the donut chart)
  grades: {
    F: '#EF4444',   // Red — fail
    D: '#F59E0B',   // Amber — barely passing
    C: '#3B82F6',   // Blue — acceptable
    B: '#8B5CF6',   // Purple — good
    A: '#10B981',   // Green — excellent
  },
};

/*
 * D3 CONCEPT: Ordinal Color Scales
 * =================================
 * D3 has built-in color scales like d3.schemeCategory10.
 * But those are generic palettes. For a professional dashboard,
 * we use our own curated palette that matches our design system.
 *
 * We'll use these colors with d3.scaleOrdinal():
 *   const colorScale = d3.scaleOrdinal()
 *     .domain(['Male', 'Female'])
 *     .range([COLORS.data[0], COLORS.data[1]]);
 *
 *   colorScale('Male')   → '#0E7C7B'
 *   colorScale('Female') → '#6366F1'
 */
