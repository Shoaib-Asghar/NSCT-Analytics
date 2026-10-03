/*
 * Number and percentage formatters using D3's format system.
 *
 * D3 CONCEPT: d3.format()
 * ========================
 * D3's format function uses a mini-language (based on Python's format spec):
 *
 *   d3.format(',.0f')(33038)    → "33,038"    (comma + 0 decimals)
 *   d3.format('.1f')(46.28)     → "46.3"      (1 decimal)
 *   d3.format('.1%')(0.386)     → "38.6%"     (percentage, 1 decimal)
 *   d3.format('.2s')(33038)     → "33k"       (SI prefix, 2 significant digits)
 *
 * The format string has this structure:
 *   [[fill]align][sign][symbol][0][width][,][.precision][~][type]
 *
 * Most common types:
 *   f = fixed-point       (46.28 → "46.3" with .1f)
 *   d = integer           (33038 → "33038")
 *   , = grouped           (33038 → "33,038")
 *   % = percentage        (0.386 → "38.6%")
 *   s = SI prefix         (33038 → "33k")
 */
import * as d3 from 'd3';

// Format with comma separators, no decimals: 33038 → "33,038"
export const formatComma = d3.format(',.0f');

// Format with 1 decimal place: 46.28 → "46.3"
export const formatDecimal = d3.format('.1f');

// Format with 2 decimal places: 46.28 → "46.28"
export const formatDecimal2 = d3.format('.2f');

// Format as percentage (input is already 0-100, not 0-1): 38.6 → "38.6%"
export const formatPercent = (v) => d3.format('.1f')(v) + '%';

// Format as integer with comma: 33038 → "33,038"
export const formatInteger = d3.format(',d');

// Short format for large numbers: 33038 → "33K"
export const formatShort = (v) => {
  if (v >= 1000) return d3.format('.1f')(v / 1000) + 'K';
  return d3.format(',.0f')(v);
};
