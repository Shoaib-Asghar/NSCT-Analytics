/**
 * Tooltip Helper Utility
 * 
 * Creates a reusable, performant tooltip inside any chart container.
 * 
 */

export function createTooltip(container) {
  let tooltip = container.querySelector('.chart-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    container.appendChild(tooltip);
  }

  return {
    /**
     * Show and position the tooltip near the cursor.
     * @param {string} html - HTML markup for tooltip contents.
     * @param {MouseEvent} event - Native mouse event for cursor positioning.
     */
    show(html, event) {
      tooltip.innerHTML = html;
      tooltip.classList.add('chart-tooltip--visible');

      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Measure tooltip dimensions to keep it within the container boundary
      const tooltipRect = tooltip.getBoundingClientRect();

      // If cursor is near right edge, flip tooltip to the left of cursor
      let posX = x + 16;
      if (posX + tooltipRect.width > rect.width - 12) {
        posX = x - tooltipRect.width - 16;
      }
      if (posX < 8) posX = 8;

      // Keep vertical position centered around cursor, bounded within container
      let posY = y - tooltipRect.height / 2;
      if (posY < 8) posY = 8;
      if (posY + tooltipRect.height > rect.height - 8) {
        posY = rect.height - tooltipRect.height - 8;
      }

      tooltip.style.left = `${posX}px`;
      tooltip.style.top = `${posY}px`;
    },

    /**
     * Hide the tooltip.
     */
    hide() {
      tooltip.classList.remove('chart-tooltip--visible');
    }
  };
}
