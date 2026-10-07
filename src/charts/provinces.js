/**
 * Provincial Breakdown & Regional Disparity Chart
 * 
 * Visualizes the 23.9 percentage point performance gap between Islamabad (52.9%)
 * and Balochistan (29.0%), and the 20K candidate volume concentration in Punjab.
 */

import * as d3 from 'd3';
import { formatComma } from '../utils/formatters.js';
import { createTooltip } from '../utils/tooltip.js';

/**
 * Renders the Provincial Breakdown horizontal bar chart with national baseline comparison.
 * @param {Object} database - The complete NSCT database JSON object.
 */
export function renderProvincialChart(database) {
  const container = document.getElementById('province-chart');
  if (!container) return;

  container.innerHTML = '';

  const rawData = database.provincial_demographics || [];
  if (!rawData.length) return;

  const nationalPassRate = database.metadata?.overall_pass_rate || 38.6;
  const totalCandidatesNationwide = database.metadata?.total_appeared || 33038;

  // Process data with national delta and volume share
  const data = rawData.map(d => {
    const delta = Number((d.pass_rate - nationalPassRate).toFixed(1));
    const volumeShare = Number(((d.candidates / totalCandidatesNationwide) * 100).toFixed(1));
    const isAboveAverage = d.pass_rate >= nationalPassRate;

    return {
      ...d,
      delta,
      volumeShare,
      isAboveAverage,
      color: isAboveAverage ? '#0E7C7B' : '#EF6C57',
    };
  });

  // Sort initially by pass rate descending (highest performing at top)
  data.sort((a, b) => b.pass_rate - a.pass_rate);

  // 1. Metric Summary Header Bar
  const metricsBar = document.createElement('div');
  metricsBar.className = 'provincial-metrics';
  metricsBar.innerHTML = `
    <div class="provincial-metric-pill">
      <span class="pill-label">Top Performing Region</span>
      <span class="pill-value" style="color: #0E7C7B;">Islamabad (ICT) — 52.9% Pass</span>
    </div>
    <div class="provincial-metric-pill">
      <span class="pill-label">Volume Engine</span>
      <span class="pill-value" style="color: #6366F1;">Punjab — 20,217 Candidates (61.2%)</span>
    </div>
    <div class="provincial-metric-pill">
      <span class="pill-label">Most Vulnerable</span>
      <span class="pill-value" style="color: #EF4444;">Balochistan — 29.0% Pass (462 Students)</span>
    </div>
    <div class="provincial-metric-pill">
      <span class="pill-label">Provincial Chasm</span>
      <span class="pill-value" style="color: #0F172A;">23.9% Spread (ICT vs Balochistan)</span>
    </div>
  `;
  container.appendChild(metricsBar);

  // 2. Interactive Toolbar with Sort Toggle
  const toolbar = document.createElement('div');
  toolbar.className = 'chart-card__toolbar';
  toolbar.style.marginTop = 'var(--space-4)';
  toolbar.innerHTML = `
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-swatch" style="background: #0E7C7B;"></span>
        <span class="legend-label">Above National Average (≥ 38.6%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" style="background: #EF6C57;"></span>
        <span class="legend-label">Below National Average (< 38.6%)</span>
      </div>
    </div>
    <div class="toggle-group" id="province-sort-toggle">
      <button class="toggle-btn toggle-btn--active" data-sort="pass_rate">Sort: Pass Rate</button>
      <button class="toggle-btn" data-sort="candidates">Sort: Candidate Volume</button>
    </div>
  `;
  container.appendChild(toolbar);

  // 3. SVG Layout & Dimensions
  const width = 960;
  const height = 450;
  const margin = { top: 40, right: 190, bottom: 45, left: 175 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const tooltip = createTooltip(container);

  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'province-svg')
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // 4. Scales
  const yScale = d3
    .scaleBand()
    .domain(data.map(d => d.province))
    .range([0, innerHeight])
    .padding(0.28);

  const xScale = d3
    .scaleLinear()
    .domain([0, 60]) // 0 to 60% pass rate gives headroom for ICT (52.9%)
    .range([0, innerWidth])
    .nice();

  // 5. Gridlines
  const gridGroup = g
    .append('g')
    .attr('class', 'chart-grid')
    .call(
      d3
        .axisBottom(xScale)
        .ticks(6)
        .tickSize(innerHeight)
        .tickFormat('')
    );

  // 6. X-Axis (Bottom)
  g.append('g')
    .attr('class', 'chart-axis')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(6)
        .tickFormat(d => `${d}%`)
    );

  // X-Axis title
  g.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + 38)
    .attr('fill', '#94A3B8')
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-body)')
    .text('Pass Rate (%)');

  // Candidate column header (top right)
  g.append('text')
    .attr('x', innerWidth + 24)
    .attr('y', -14)
    .attr('fill', '#94A3B8')
    .attr('text-anchor', 'start')
    .attr('font-size', '10px')
    .attr('font-weight', '700')
    .attr('font-family', 'var(--font-mono)')
    .attr('letter-spacing', '0.05em')
    .text('CANDIDATES (% SHARE)');

  // 7. Y-Axis (Province Names)
  const yAxisGroup = g
    .append('g')
    .attr('class', 'chart-axis chart-axis--y')
    .call(d3.axisLeft(yScale));

  yAxisGroup
    .selectAll('.tick text')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('fill', '#0F172A')
    .attr('dx', '-10px');

  // 8. National Average Pass Rate Reference Line (38.6%)
  const nationalX = xScale(nationalPassRate);

  g.append('line')
    .attr('x1', nationalX)
    .attr('y1', -12)
    .attr('x2', nationalX)
    .attr('y2', innerHeight)
    .attr('stroke', '#64748B')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '4 4')
    .attr('opacity', 0.85);

  const nationalTag = g
    .append('g')
    .attr('transform', `translate(${nationalX}, -18)`)
    .attr('text-anchor', 'middle');

  nationalTag
    .append('rect')
    .attr('x', -58)
    .attr('y', -10)
    .attr('width', 116)
    .attr('height', 20)
    .attr('rx', 4)
    .attr('fill', '#F1F5F9')
    .attr('stroke', '#CBD5E1')
    .attr('stroke-width', 1);

  nationalTag
    .append('text')
    .attr('y', 4)
    .attr('fill', '#334155')
    .attr('font-size', '10px')
    .attr('font-weight', '700')
    .attr('font-family', 'var(--font-mono)')
    .text(`NAT'L AVG: ${nationalPassRate}%`);

  // 9. Render Province Horizontal Bars
  const barsGroup = g.append('g').attr('class', 'province-bars');

  const barGroups = barsGroup
    .selectAll('.province-bar-group')
    .data(data, d => d.province)
    .join('g')
    .attr('class', 'province-bar-group')
    .style('cursor', 'pointer');

  // Background full-width track
  barGroups
    .append('rect')
    .attr('class', 'province-bar-track')
    .attr('x', 0)
    .attr('y', d => yScale(d.province))
    .attr('width', innerWidth)
    .attr('height', yScale.bandwidth())
    .attr('rx', 4)
    .attr('fill', '#F1F5F9');

  // Animated colored bar (length = pass rate)
  barGroups
    .append('rect')
    .attr('class', 'province-bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.province))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('rx', 4)
    .attr('fill', d => d.color)
    .transition()
    .duration(800)
    .delay((_, i) => i * 50)
    .ease(d3.easeCubicOut)
    .attr('width', d => xScale(d.pass_rate));

  // Pass Rate % placed inside the left end of the colored bar (isolated from reference line and candidate column)
  barGroups
    .append('text')
    .attr('class', 'province-bar-pct')
    .attr('x', 12)
    .attr('y', d => yScale(d.province) + yScale.bandwidth() / 2 + 4)
    .attr('text-anchor', 'start')
    .attr('fill', '#FFFFFF')
    .attr('font-size', '12px')
    .attr('font-weight', '700')
    .attr('font-family', 'var(--font-mono)')
    .text(d => `${d.pass_rate}% Pass`);

  // Candidate Count placed in dedicated right-hand column (completely separated from bar track)
  barGroups
    .append('text')
    .attr('class', 'province-bar-count')
    .attr('x', innerWidth + 24)
    .attr('y', d => yScale(d.province) + yScale.bandwidth() / 2 + 4)
    .attr('text-anchor', 'start')
    .attr('fill', '#475569')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .attr('font-family', 'var(--font-mono)')
    .text(d => `${formatComma(d.candidates)} (${d.volumeShare}%)`);

  // 10. Interactive Tooltip & Hover
  barGroups
    .on('mouseenter', function (event, d) {
      d3.select(this)
        .select('.province-bar')
        .attr('opacity', 0.9)
        .attr('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))');

      const deltaTag = d.delta >= 0
        ? `<strong style="color: #10B981; font-family: var(--font-mono);">+${d.delta}% above national avg</strong>`
        : `<strong style="color: #EF4444; font-family: var(--font-mono);">${d.delta}% below national avg</strong>`;

      const tooltipHtml = `
        <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #FFFFFF;">
          ${d.province}
        </div>
        <div style="font-size: 11px; margin-bottom: 8px;">
          ${deltaTag}
        </div>
        <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 12px;">
          <span style="color: #94A3B8;">Pass Rate:</span>
          <strong style="font-family: var(--font-mono); color: ${d.color}; text-align: right;">${d.pass_rate}%</strong>
          <span style="color: #94A3B8;">Fail Rate:</span>
          <strong style="font-family: var(--font-mono); color: #EF4444; text-align: right;">${d.fail_rate}%</strong>
          <span style="color: #94A3B8;">Candidates:</span>
          <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${formatComma(d.candidates)}</strong>
          <span style="color: #94A3B8;">National Share:</span>
          <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${d.volumeShare}%</strong>
        </div>
      `;
      tooltip.show(tooltipHtml, event);
    })
    .on('mousemove', function (event) {
      tooltip.show(null, event);
    })
    .on('mouseleave', function () {
      d3.select(this)
        .select('.province-bar')
        .attr('opacity', 1.0)
        .attr('filter', null);
      tooltip.hide();
    });

  // 11. Dynamic Sorting Toggle Handler
  const toggleButtons = container.querySelectorAll('#province-sort-toggle .toggle-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleButtons.forEach(b => b.classList.remove('toggle-btn--active'));
      btn.classList.add('toggle-btn--active');

      const sortType = btn.dataset.sort;
      if (sortType === 'candidates') {
        data.sort((a, b) => b.candidates - a.candidates);
      } else {
        data.sort((a, b) => b.pass_rate - a.pass_rate);
      }

      // Update Y scale domain
      yScale.domain(data.map(d => d.province));

      // Animate Y-Axis transition
      yAxisGroup
        .transition()
        .duration(650)
        .call(d3.axisLeft(yScale));

      yAxisGroup
        .selectAll('.tick text')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .attr('fill', '#0F172A')
        .attr('dx', '-10px');

      // Animate bar groups to their new vertical positions
      barGroups
        .transition()
        .duration(650)
        .attr('transform', 'translate(0, 0)');

      barGroups
        .select('.province-bar-track')
        .transition()
        .duration(650)
        .attr('y', d => yScale(d.province));

      barGroups
        .select('.province-bar')
        .transition()
        .duration(650)
        .attr('y', d => yScale(d.province))
        .attr('width', d => xScale(d.pass_rate));

      barGroups
        .select('.province-bar-pct')
        .transition()
        .duration(650)
        .attr('y', d => yScale(d.province) + yScale.bandwidth() / 2 + 4);

      barGroups
        .select('.province-bar-count')
        .transition()
        .duration(650)
        .attr('y', d => yScale(d.province) + yScale.bandwidth() / 2 + 4);
    });
  });

  // 12. Append insight callout to #province-card if not present
  const card = document.getElementById('province-card');
  if (card && !card.querySelector('.insight-callout')) {
    const callout = document.createElement('div');
    callout.className = 'insight-callout';
    callout.innerHTML = `
      <p>
        <strong>The Center vs. Periphery Chasm:</strong> <strong>Islamabad (ICT)</strong> is the only region in Pakistan where 
        a majority of graduates passed (<strong>52.9%</strong>), benefiting from clustered elite universities and high-speed infrastructure. 
        In stark contrast, <strong>Balochistan (29.0%)</strong> and <strong>Khyber Pakhtunkhwa (30.2%)</strong> suffer from acute peripheral neglect. 
        Meanwhile, <strong>Punjab accounts for 61.2%</strong> of all test takers nationwide, effectively driving Pakistan's national IT volume.
      </p>
    `;
    card.appendChild(callout);
  }
}
