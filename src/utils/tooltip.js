/**
 * Tooltip Helper Utility
 * 
 * Creates a reusable, performant tooltip inside any chart container.
 * 
 */

let globalTooltip = null;

function getTooltipElement() {
  if (!globalTooltip || !document.body.contains(globalTooltip)) {
    document.querySelectorAll('.chart-tooltip').forEach(el => el.remove());

    globalTooltip = document.createElement('div');
    globalTooltip.className = 'chart-tooltip';
    document.body.appendChild(globalTooltip);
  }
  return globalTooltip;
}

export function createTooltip(container) {
  const tooltip = getTooltipElement();

  return {
    /**
     * Show and position the tooltip near the cursor.
     * @param {string|null} html - HTML markup for tooltip contents. If null/undefined, existing HTML is preserved (used on mousemove).
     * @param {MouseEvent} event - Native mouse event for cursor positioning.
     */
    show(html, event) {
      if (!event) return;

      // Only update markup when new content is provided (preserves content during mousemove)
      if (html !== null && html !== undefined && html !== '') {
        tooltip.innerHTML = html;
      }

      tooltip.classList.add('chart-tooltip--visible');

      // Measure tooltip dimensions for collision clamping
      const tipWidth = tooltip.offsetWidth || 240;
      const tipHeight = tooltip.offsetHeight || 100;
      const pad = 12;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Horizontal positioning: default to right of cursor (+16px)
      let posX = event.clientX + 16;
      // If overflowing right edge of viewport, flip to left of cursor
      if (posX + tipWidth > viewportWidth - pad) {
        posX = event.clientX - tipWidth - 16;
      }
      // Keep within left viewport edge
      if (posX < pad) {
        posX = pad;
      }

      // Vertical positioning: center vertically around cursor
      let posY = event.clientY - tipHeight / 2;
      // If overflowing bottom edge of viewport, clamp to bottom
      if (posY + tipHeight > viewportHeight - pad) {
        posY = viewportHeight - tipHeight - pad;
      }
      // If overflowing top edge of viewport, clamp to top
      if (posY < pad) {
        posY = pad;
      }

      tooltip.style.transform = `translate3d(${Math.round(posX)}px, ${Math.round(posY)}px, 0)`;
    },

    /**
     * Hide the tooltip.
     */
    hide() {
      tooltip.classList.remove('chart-tooltip--visible');
    }
  };
}
