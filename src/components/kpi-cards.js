/*
 * ============================================================================
 * KPI CARDS COMPONENT (kpi-cards.js)
 * ============================================================================
 *
 * This component renders the high-level summary cards at the top of the page.
 *
 * D3 CONCEPTS TAUGHT HERE:
 * ------------------------
 * 1. d3.select(selector) — selects a single DOM container
 * 2. .selectAll(selector) — prepares a virtual selection for data binding
 * 3. .data(array) — binds an array of data objects to the selection
 * 4. .join('div') — creates <div> elements for incoming data (enter phase),
 *                   updates existing ones, and removes extra elements
 * 5. d3.format(specifier) — formats raw numbers into human-readable strings
 *
 * ============================================================================
 */

import * as d3 from 'd3';

/**
 * Renders the KPI cards into the #kpi-grid container.
 * @param {Object} database - The complete NSCT database JSON object.
 */
export function renderKPICards(database) {
  // 1. Prepare the data array for the 5 summary metrics
  const kpiData = [
    {
      label: 'Total Candidates',
      value: database.metadata.total_appeared,
      format: ',',            // Formats 33038 -> "33,038"
      trend: '250% from 2024',
      trendType: 'up',
    },
    {
      label: 'National Average',
      value: database.metadata.national_average_score,
      format: '.2f',          // Formats 46.28 -> "46.28"
      suffix: ' / 100',
      trend: 'Out of 100 marks',
      trendType: 'neutral',
    },
    {
      label: 'Pass Rate',
      value: database.metadata.overall_pass_rate,
      format: '.1f',          // Formats 38.6 -> "38.6"
      suffix: '%',
      trend: '61.4% failed',
      trendType: 'down',
    },
    {
      label: 'Grade A Students',
      value: 125,
      format: ',',            // Formats 125 -> "125"
      trend: 'Top 0.4%',
      trendType: 'up',
    },
    {
      label: 'Universities',
      value: 154,
      format: ',',            // Formats 154 -> "154"
      trend: 'Across Pakistan',
      trendType: 'neutral',
    },
  ];

  const container = document.getElementById('kpi-grid');
  if (!container) return;

  /*
   * D3 DATA-JOIN PATTERN:
   * ---------------------
   * 1. select(container): target the wrapper div in index.html
   * 2. selectAll('.kpi-card'): find any existing card elements (initially empty)
   * 3. data(kpiData): bind our 5-element array to the selection
   * 4. join('div'): creates 5 <div> elements automatically
   * 5. attr('class', 'kpi-card'): assign the CSS class for styling
   * 6. html(d => ...): populate each card using the bound data object 'd'
   */
  d3.select(container)
    .selectAll('.kpi-card')
    .data(kpiData)
    .join('div')
    .attr('class', 'kpi-card')
    .html((d) => {
      const formattedValue = d3.format(d.format)(d.value);
      const suffix = d.suffix || '';
      return `
        <div class="kpi-card__label">${d.label}</div>
        <div class="kpi-card__value">${formattedValue}${suffix}</div>
        <span class="kpi-card__trend kpi-card__trend--${d.trendType}">
          ${d.trendType === 'up' ? '↑' : d.trendType === 'down' ? '↓' : '•'} ${d.trend}
        </span>
      `;
    });
}
