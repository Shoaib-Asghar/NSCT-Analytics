/**
 * University Rankings Chart Module
 * 
 * Visualizes the Top 20 Universities by Pass Rate with interactive
 * sector filtering (All, Public, Private) and national baseline comparison.
 */

import * as d3 from 'd3';
import { formatComma } from '../utils/formatters.js';
import { createTooltip } from '../utils/tooltip.js';

/**
 * Renders the Top 20 Universities horizontal bar chart.
 * @param {Array<Object>} universities - Array of university performance records.
 * @param {Object} database - The complete NSCT database JSON object.
 */
export function renderUniversityRankingChart(universities, database) {
  const container = document.getElementById('uni-ranking-chart');
  if (!container || !universities || !universities.length) return;

  container.innerHTML = '';

  const nationalPassRate = database?.metadata?.overall_pass_rate || 38.6;
  const tooltip = createTooltip(container);

  // 1. Metric Summary Pills Header
  const metricsBar = document.createElement('div');
  metricsBar.className = 'uni-metrics-bar';
  metricsBar.innerHTML = `
    <div class="uni-metric-pill">
      <span class="pill-label">#1 Public Sector</span>
      <span class="pill-value" style="color: #0E7C7B;">ITU Punjab — 90.4% Pass (Avg 60.9)</span>
    </div>
    <div class="uni-metric-pill">
      <span class="pill-label">#1 Private Sector</span>
      <span class="pill-value" style="color: #6366F1;">Habib University — 96.5% Pass (Avg 65.3)</span>
    </div>
    <div class="uni-metric-pill">
      <span class="pill-label">High-Volume Leaders</span>
      <span class="pill-value" style="color: #0F172A;">FAST-NUCES (89.5%, 579 st.) & NED (84.2%, 429 st.)</span>
    </div>
    <div class="uni-metric-pill">
      <span class="pill-label">National Baseline</span>
      <span class="pill-value" style="color: #64748B;">38.6% Overall Pass Rate</span>
    </div>
  `;
  container.appendChild(metricsBar);

  // 2. Chart Legend
  const legend = document.createElement('div');
  legend.className = 'chart-legend';
  legend.style.margin = 'var(--space-3) 0 var(--space-4) 0';
  legend.innerHTML = `
    <div class="legend-item">
      <span class="legend-swatch" style="background: #0E7C7B;"></span>
      <span class="legend-label">Public Sector HEI</span>
    </div>
    <div class="legend-item">
      <span class="legend-swatch" style="background: #6366F1;"></span>
      <span class="legend-label">Private Sector HEI</span>
    </div>
    <div class="legend-item" style="margin-left: auto;">
      <span style="font-size: 11px; color: var(--color-muted); font-family: var(--font-mono);">
        Showing Top 20 ranked by Pass Rate
      </span>
    </div>
  `;
  container.appendChild(legend);

  // 3. SVG Layout Dimensions
  const width = 960;
  const height = 700;
  const margin = { top: 35, right: 210, bottom: 45, left: 195 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'uni-svg')
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // 4. Scales
  const xScale = d3
    .scaleLinear()
    .domain([0, 100])
    .range([0, innerWidth]);

  const yScale = d3
    .scaleBand()
    .range([0, innerHeight])
    .padding(0.24);

  // 5. Gridlines
  g.append('g')
    .attr('class', 'chart-grid')
    .call(
      d3
        .axisBottom(xScale)
        .ticks(10)
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
        .ticks(10)
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
    .text('Candidate Pass Rate (%)');

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
    .text('COHORT • AVG SCORE');

  // 7. Y-Axis Group
  const yAxisGroup = g.append('g').attr('class', 'chart-axis chart-axis--y');

  // 8. National Average Reference Line (38.6%)
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
    .attr('x', -56)
    .attr('y', -10)
    .attr('width', 112)
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

  // 9. Bars Container
  const barsGroup = g.append('g').attr('class', 'uni-bars');

  /**
   * Updates chart data based on active sector filter ('all', 'public', 'private').
   * Uses official HEC report benchmarks (cohort >= 50) and enriches with detailed metrics.
   * @param {string} sector - Active sector filter.
   */
  function updateData(sector = 'all') {
    let topList = [];
    if (sector === 'public') {
      topList = database?.top_20_public_sector_2026 || [];
    } else if (sector === 'private') {
      topList = database?.top_20_private_sector_2026 || [];
    } else {
      topList = database?.top_20_universities_2026 || [];
    }

    // Enrich topList with full metrics from universities dataset
    const top20 = topList.map(item => {
      const match = universities.find(u => {
        const uName = u.name.toLowerCase();
        const iName = item.name.toLowerCase();
        return uName.includes(iName) || iName.includes(uName);
      });

      return {
        ...match,
        name: item.name,
        short_name: match?.short_name || item.name,
        pass_percentage: item.pass_percentage,
        sector: item.sector || match?.sector || (sector === 'all' ? 'public' : sector),
        total_appeared: match?.total_appeared || 0,
        avg_score: match?.avg_score || 0,
        students_passed: match?.students_passed || Math.round(((match?.total_appeared || 0) * item.pass_percentage) / 100),
        female: match?.female || 0,
        male: match?.male || 0,
        min_score: match?.min_score || 0,
        max_score: match?.max_score || 0,
      };
    });

    // Update Y scale
    yScale.domain(top20.map(d => d.name));

    // Update Y axis
    yAxisGroup
      .transition()
      .duration(600)
      .call(
        d3.axisLeft(yScale).tickFormat(name => {
          const match = top20.find(u => u.name === name);
          return match?.short_name || name;
        })
      );

    yAxisGroup
      .selectAll('.tick text')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#0F172A')
      .attr('dx', '-10px');

    // Data join with key function
    const groups = barsGroup
      .selectAll('.uni-bar-group')
      .data(top20, d => d.name);

    // Exit
    groups
      .exit()
      .transition()
      .duration(400)
      .style('opacity', 0)
      .remove();

    // Enter
    const enterGroups = groups
      .enter()
      .append('g')
      .attr('class', 'uni-bar-group')
      .style('cursor', 'pointer')
      .style('opacity', 0);

    // Background track
    enterGroups
      .append('rect')
      .attr('class', 'uni-bar-track')
      .attr('x', 0)
      .attr('y', d => yScale(d.name))
      .attr('width', innerWidth)
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('fill', '#F1F5F9');

    // Colored bar
    enterGroups
      .append('rect')
      .attr('class', 'uni-bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.name))
      .attr('width', 0)
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('fill', d => (d.sector === 'public' ? '#0E7C7B' : '#6366F1'));

    // In-bar pass percentage
    enterGroups
      .append('text')
      .attr('class', 'uni-bar-pct')
      .attr('x', 10)
      .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'start')
      .attr('fill', '#FFFFFF')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--font-mono)');

    // Dedicated right column stats
    enterGroups
      .append('text')
      .attr('class', 'uni-bar-meta')
      .attr('x', innerWidth + 24)
      .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'start')
      .attr('fill', '#475569')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('font-family', 'var(--font-mono)');

    // Merge enter + update
    const merged = enterGroups.merge(groups);

    merged
      .transition()
      .duration(600)
      .style('opacity', 1);

    merged
      .select('.uni-bar-track')
      .transition()
      .duration(600)
      .attr('y', d => yScale(d.name))
      .attr('height', yScale.bandwidth());

    merged
      .select('.uni-bar')
      .transition()
      .duration(600)
      .attr('y', d => yScale(d.name))
      .attr('height', yScale.bandwidth())
      .attr('fill', d => (d.sector === 'public' ? '#0E7C7B' : '#6366F1'))
      .attr('width', d => xScale(d.pass_percentage));

    merged
      .select('.uni-bar-pct')
      .transition()
      .duration(600)
      .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2 + 4)
      .text(d => `${d.pass_percentage}% Pass`);

    merged
      .select('.uni-bar-meta')
      .transition()
      .duration(600)
      .attr('y', d => yScale(d.name) + yScale.bandwidth() / 2 + 4)
      .text(d => `${formatComma(d.total_appeared)} st. • Avg ${d.avg_score}`);

    // Tooltip bindings
    merged
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .select('.uni-bar')
          .attr('opacity', 0.88);

        const sectorBadge = d.sector === 'public'
          ? '<span style="background: rgba(14, 124, 123, 0.2); color: #10B981; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px;">PUBLIC</span>'
          : '<span style="background: rgba(99, 102, 241, 0.2); color: #818CF8; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px;">PRIVATE</span>';

        const tooltipHtml = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <strong style="color: #FFFFFF; font-size: 13px;">${d.name}</strong>
            ${sectorBadge}
          </div>
          <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 12px;">
            <span style="color: #94A3B8;">Pass Rate:</span>
            <strong style="font-family: var(--font-mono); color: #10B981; text-align: right;">${d.pass_percentage}%</strong>

            <span style="color: #94A3B8;">Passed / Appeared:</span>
            <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${formatComma(d.students_passed)} / ${formatComma(d.total_appeared)}</strong>

            <span style="color: #94A3B8;">Gender Split:</span>
            <span style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${d.female} F • ${d.male} M</span>

            <span style="color: #94A3B8;">Average Score:</span>
            <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${d.avg_score} / 100</strong>

            <span style="color: #94A3B8;">Score Range:</span>
            <span style="font-family: var(--font-mono); color: #94A3B8; text-align: right;">${d.min_score} – ${d.max_score}</span>
          </div>
        `;
        tooltip.show(tooltipHtml, event);
      })
      .on('mousemove', function (event) {
        tooltip.show(null, event);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .select('.uni-bar')
          .attr('opacity', 1.0);
        tooltip.hide();
      });
  }

  // 10. Initial Render
  updateData('all');

  // 11. Wire Sector Toggle Buttons
  const toggleButtons = document.querySelectorAll('#sector-toggle .toggle-btn');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleButtons.forEach(b => b.classList.remove('toggle-btn--active'));
      btn.classList.add('toggle-btn--active');
      const sector = btn.dataset.sector;
      updateData(sector);
    });
  });

  // 12. Contextual Insight Callout
  const card = document.getElementById('uni-ranking-card');
  if (card && !card.querySelector('.insight-callout')) {
    const callout = document.createElement('div');
    callout.className = 'insight-callout';
    callout.innerHTML = `
      <p>
        <strong>The Scale vs. Selectivity Dynamic:</strong> While boutique private institutions like <strong>IBA (100%)</strong> 
        and <strong>Habib University (96.5%)</strong> achieved near-perfect pass rates with selective cohorts (17–58 students), 
        large-scale computing universities demonstrated remarkable cohort strength. 
        Most notably, <strong>FAST-NUCES</strong> appeared <strong>579 candidates</strong> and achieved an <strong>89% pass rate (518 passed)</strong>, 
        and <strong>NED UET</strong> appeared <strong>429 candidates</strong> with an <strong>84% pass rate (361 passed)</strong> — proving 
        that institutional scale can co-exist with top-tier technical rigor.
      </p>
    `;
    card.appendChild(callout);
  }
}
