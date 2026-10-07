/**
 * Urban vs Rural Geographic Divide Analysis Chart
 * 
 * Visualizes the 15.1% geographic disparity between Urban centers and Rural areas
 * through stacked pass/fail proportions and a 4-way cross-demographic breakdown.
 */

import * as d3 from 'd3';
import { formatComma } from '../utils/formatters.js';
import { createTooltip } from '../utils/tooltip.js';

/**
 * Renders the Urban vs Rural geographic analysis chart.
 * @param {Object} database - The complete NSCT database JSON object.
 */
export function renderGeographyChart(database) {
  const container = document.getElementById('geography-chart');
  if (!container) return;

  container.innerHTML = '';

  const demographics = database.gender_demographics;
  if (!demographics) return;

  // Compute aggregated Urban & Rural metrics
  const urbanFemale = demographics.urban.female;
  const urbanMale = demographics.urban.male;
  const ruralFemale = demographics.rural.female;
  const ruralMale = demographics.rural.male;

  const urbanTotal = urbanFemale.total + urbanMale.total; // 23,443
  const urbanPassed = Math.round((urbanFemale.total * urbanFemale.pass_rate + urbanMale.total * urbanMale.pass_rate) / 100); // 10,072
  const urbanPassRate = Number(((urbanPassed / urbanTotal) * 100).toFixed(1)); // 43.0%
  const urbanFailRate = Number((100 - urbanPassRate).toFixed(1)); // 57.0%

  const ruralTotal = ruralFemale.total + ruralMale.total; // 9,594
  const ruralPassed = Math.round((ruralFemale.total * ruralFemale.pass_rate + ruralMale.total * ruralMale.pass_rate) / 100); // 2,677
  const ruralPassRate = Number(((ruralPassed / ruralTotal) * 100).toFixed(1)); // 27.9%
  const ruralFailRate = Number((100 - ruralPassRate).toFixed(1)); // 72.1%

  const geoAdvantage = Number((urbanPassRate - ruralPassRate).toFixed(1)); // 15.1%

  // 1. Metric summary header pills
  const metricsBar = document.createElement('div');
  metricsBar.className = 'geography-metrics';
  metricsBar.innerHTML = `
    <div class="geography-metric-pill">
      <span class="pill-label">Urban Pass Rate</span>
      <span class="pill-value" style="color: #0E7C7B;">${urbanPassRate}% (${formatComma(urbanPassed)} / ${formatComma(urbanTotal)})</span>
    </div>
    <div class="geography-metric-pill">
      <span class="pill-label">Rural Pass Rate</span>
      <span class="pill-value" style="color: #EF4444;">${ruralPassRate}% (${formatComma(ruralPassed)} / ${formatComma(ruralTotal)})</span>
    </div>
    <div class="geography-metric-pill">
      <span class="pill-label">Geographic Divide</span>
      <span class="pill-value" style="color: #0F172A;">+${geoAdvantage}% Urban Advantage</span>
    </div>
  `;
  container.appendChild(metricsBar);

  // 2. 4-Way Cross Breakdown Data
  const fourWayData = [
    {
      segment: 'Urban Male',
      geography: 'Urban',
      gender: 'Male',
      passRate: urbanMale.pass_rate,
      candidates: urbanMale.total,
      color: '#0E7C7B',
    },
    {
      segment: 'Urban Female',
      geography: 'Urban',
      gender: 'Female',
      passRate: urbanFemale.pass_rate,
      candidates: urbanFemale.total,
      color: '#6366F1',
    },
    {
      segment: 'Rural Male',
      geography: 'Rural',
      gender: 'Male',
      passRate: ruralMale.pass_rate,
      candidates: ruralMale.total,
      color: '#14B8A6',
    },
    {
      segment: 'Rural Female',
      geography: 'Rural',
      gender: 'Female',
      passRate: ruralFemale.pass_rate,
      candidates: ruralFemale.total,
      color: '#A855F7',
    },
  ];

  // 3. SVG Layout & Dimensions
  const width = 960;
  const height = 340;
  const margin = { top: 30, right: 140, bottom: 45, left: 140 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const tooltip = createTooltip(container);

  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'geography-svg')
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // 4. Scales
  const yScale = d3
    .scaleBand()
    .domain(fourWayData.map(d => d.segment))
    .range([0, innerHeight])
    .padding(0.32);

  const xScale = d3
    .scaleLinear()
    .domain([0, 50])
    .range([0, innerWidth]);

  // 5. Gridlines
  g.append('g')
    .attr('class', 'chart-grid')
    .call(
      d3
        .axisBottom(xScale)
        .ticks(5)
        .tickSize(innerHeight)
        .tickFormat('')
    )
    .attr('transform', 'translate(0, 0)');

  // 6. X-Axis (Bottom)
  g.append('g')
    .attr('class', 'chart-axis')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(5)
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

  // 7. Y-Axis (Segment Labels)
  const yAxis = g
    .append('g')
    .attr('class', 'chart-axis')
    .call(d3.axisLeft(yScale));

  yAxis.selectAll('.tick text')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('fill', '#0F172A')
    .attr('dx', '-8px');

  // 8. National Average Pass Rate Reference Line (38.6%)
  const nationalPassRate = database.metadata?.overall_pass_rate || 38.6;
  const threshX = xScale(nationalPassRate);
  g.append('line')
    .attr('x1', threshX)
    .attr('y1', -10)
    .attr('x2', threshX)
    .attr('y2', innerHeight)
    .attr('stroke', '#64748B')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '4 4')
    .attr('opacity', 0.8);

  g.append('text')
    .attr('x', threshX)
    .attr('y', -16)
    .attr('text-anchor', 'middle')
    .attr('fill', '#64748B')
    .attr('font-size', '10px')
    .attr('font-weight', '700')
    .attr('font-family', 'var(--font-mono)')
    .text(`NAT'L AVG: ${nationalPassRate}%`);

  // 9. Horizontal Bars
  const barGroups = g
    .selectAll('.geo-bar-group')
    .data(fourWayData)
    .join('g')
    .attr('class', 'geo-bar-group')
    .style('cursor', 'pointer');

  // Bar background track
  barGroups
    .append('rect')
    .attr('x', 0)
    .attr('y', d => yScale(d.segment))
    .attr('width', innerWidth)
    .attr('height', yScale.bandwidth())
    .attr('rx', 4)
    .attr('fill', '#F1F5F9');

  // Animated foreground bar
  barGroups
    .append('rect')
    .attr('class', 'geo-bar')
    .attr('x', 0)
    .attr('y', d => yScale(d.segment))
    .attr('width', 0)
    .attr('height', yScale.bandwidth())
    .attr('rx', 4)
    .attr('fill', d => d.color)
    .transition()
    .duration(800)
    .delay((_, i) => i * 80)
    .ease(d3.easeCubicOut)
    .attr('width', d => xScale(d.passRate));

  // Pass Rate % placed cleanly inside the right end of the colored bar
  barGroups
    .append('text')
    .attr('class', 'geo-bar-pct')
    .attr('x', d => xScale(d.passRate) - 12)
    .attr('y', d => yScale(d.segment) + yScale.bandwidth() / 2 + 4)
    .attr('text-anchor', 'end')
    .attr('fill', '#FFFFFF')
    .attr('font-size', '12px')
    .attr('font-weight', '700')
    .attr('font-family', 'var(--font-mono)')
    .text(d => `${d.passRate}%`);

  // Candidate count right-aligned at the end of the track
  barGroups
    .append('text')
    .attr('class', 'geo-bar-count')
    .attr('x', innerWidth - 12)
    .attr('y', d => yScale(d.segment) + yScale.bandwidth() / 2 + 4)
    .attr('text-anchor', 'end')
    .attr('fill', '#64748B')
    .attr('font-size', '11px')
    .attr('font-weight', '500')
    .attr('font-family', 'var(--font-mono)')
    .text(d => `${formatComma(d.candidates)} candidates`);

  // 10. Interactive Tooltip & Hover
  barGroups
    .on('mouseenter', function (event, d) {
      d3.select(this)
        .select('.geo-bar')
        .attr('opacity', 0.9)
        .attr('filter', 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))');

      const tooltipHtml = `
        <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #FFFFFF;">
          ${d.segment}
        </div>
        <div style="color: #94A3B8; font-size: 11px; margin-bottom: 8px;">
          ${d.geography} Center • ${d.gender} Cohort
        </div>
        <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 12px;">
          <span style="color: #94A3B8;">Pass Rate:</span>
          <strong style="font-family: var(--font-mono); color: #10B981; text-align: right;">${d.passRate}%</strong>
          <span style="color: #94A3B8;">Fail Rate:</span>
          <strong style="font-family: var(--font-mono); color: #EF4444; text-align: right;">${(100 - d.passRate).toFixed(1)}%</strong>
          <span style="color: #94A3B8;">Candidates:</span>
          <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${formatComma(d.candidates)}</strong>
        </div>
      `;
      tooltip.show(tooltipHtml, event);
    })
    .on('mousemove', function (event) {
      tooltip.show(null, event);
    })
    .on('mouseleave', function () {
      d3.select(this)
        .select('.geo-bar')
        .attr('opacity', 1.0)
        .attr('filter', null);
      tooltip.hide();
    });

  // 11. Append insight callout to #geography-card if not present
  const geoCard = document.getElementById('geography-card');
  if (geoCard && !geoCard.querySelector('.insight-callout')) {
    const callout = document.createElement('div');
    callout.className = 'insight-callout';
    callout.innerHTML = `
      <p>
        <strong>Geography Overrides Gender:</strong> An <strong>Urban Female graduate (40.5%)</strong> is significantly more 
        likely to pass the NSCT than a <strong>Rural Male graduate (28.7%)</strong>—a massive <strong>11.8 percentage point gap</strong>. 
        Across all metrics, candidate location (internet availability, university faculty depth, and urban lab facilities) is the 
        overwhelming determinant of technical competency in Pakistan.
      </p>
    `;
    geoCard.appendChild(callout);
  }
}
