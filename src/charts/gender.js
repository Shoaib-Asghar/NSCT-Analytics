/**
 * Gender Performance & Enrollment Analysis Chart
 * 
 * Visualizes the 2.5% national gender competency gap and the 2:1 enrollment gap
 * across National, Urban, and Rural educational settings using nested D3 scales.
 */

import * as d3 from 'd3';
import { formatComma } from '../utils/formatters.js';
import { createTooltip } from '../utils/tooltip.js';

/**
 * Renders the Gender Analysis grouped bar chart and enrollment volume split.
 * @param {Object} database - The complete NSCT database JSON object.
 */
export function renderGenderChart(database) {
  const container = document.getElementById('gender-comparison-chart');
  if (!container) return;

  container.innerHTML = '';

  const demographics = database.gender_demographics;
  if (!demographics) return;

  // Process data for grouped bar comparison
  const categories = [
    {
      key: 'national',
      label: 'National Baseline',
      femalePass: demographics.national.female.pass_rate,
      femaleTotal: demographics.national.female.total,
      malePass: demographics.national.male.pass_rate,
      maleTotal: demographics.national.male.total,
      gap: demographics.national.pass_rate_gap || 2.5,
    },
    {
      key: 'urban',
      label: 'Urban Centers',
      femalePass: demographics.urban.female.pass_rate,
      femaleTotal: demographics.urban.female.total,
      malePass: demographics.urban.male.pass_rate,
      maleTotal: demographics.urban.male.total,
      gap: Number((demographics.urban.male.pass_rate - demographics.urban.female.pass_rate).toFixed(1)),
    },
    {
      key: 'rural',
      label: 'Rural Areas',
      femalePass: demographics.rural.female.pass_rate,
      femaleTotal: demographics.rural.female.total,
      malePass: demographics.rural.male.pass_rate,
      maleTotal: demographics.rural.male.total,
      gap: Number((demographics.rural.male.pass_rate - demographics.rural.female.pass_rate).toFixed(1)),
    },
  ];

  const totalFemales = demographics.national.female.total; // 11,990
  const totalMales = demographics.national.male.total;     // 21,047
  const grandTotal = totalFemales + totalMales;            // 33,037
  const femaleShare = ((totalFemales / grandTotal) * 100).toFixed(1);
  const maleShare = ((totalMales / grandTotal) * 100).toFixed(1);

  // 1. Enrollment Volume Split Bar (Access vs Capability)
  const volumeHeader = document.createElement('div');
  volumeHeader.className = 'gender-volume-wrap';
  volumeHeader.innerHTML = `
    <div class="volume-header-text">
      <span class="volume-title">Candidate Enrollment Split (Access Disparity)</span>
      <span class="volume-ratio">Ratio: 1.75 Male to 1 Female</span>
    </div>
    <div class="volume-split-bar">
      <div class="volume-segment volume-segment--female" style="width: ${femaleShare}%;">
        <span>Female: ${femaleShare}% (${formatComma(totalFemales)})</span>
      </div>
      <div class="volume-segment volume-segment--male" style="width: ${maleShare}%;">
        <span>Male: ${maleShare}% (${formatComma(totalMales)})</span>
      </div>
    </div>
  `;
  container.appendChild(volumeHeader);

  // 2. Interactive Legend & Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'chart-card__toolbar';
  toolbar.style.marginTop = 'var(--space-4)';
  toolbar.innerHTML = `
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-swatch" style="background: #6366F1;"></span>
        <span class="legend-label">Female Candidates</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" style="background: #0E7C7B;"></span>
        <span class="legend-label">Male Candidates</span>
      </div>
    </div>
    <div class="gender-kpi-badge">
      <span style="color: var(--color-muted);">National Pass Gap:</span>
      <strong style="color: var(--color-heading); font-family: var(--font-mono);"> Just 2.5%</strong>
    </div>
  `;
  container.appendChild(toolbar);

  // 3. SVG Layout & Dimensions
  const width = 960;
  const height = 380;
  const margin = { top: 40, right: 35, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const tooltip = createTooltip(container);

  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'gender-svg')
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // 4. Nested Scales
  // Outer Scale: Positions the 3 groups (National, Urban, Rural)
  const x0 = d3
    .scaleBand()
    .domain(categories.map(d => d.key))
    .range([0, innerWidth])
    .padding(0.28);

  // Inner Scale: Positions the Female and Male bars inside each group
  const x1 = d3
    .scaleBand()
    .domain(['female', 'male'])
    .range([0, x0.bandwidth()])
    .padding(0.12);

  // Color Scale
  const colorScale = d3
    .scaleOrdinal()
    .domain(['female', 'male'])
    .range(['#6366F1', '#0E7C7B']);

  // Y Scale: Percentage (0 to 55%)
  const yScale = d3
    .scaleLinear()
    .domain([0, 52])
    .range([innerHeight, 0])
    .nice();

  // 5. Gridlines
  g.append('g')
    .attr('class', 'chart-grid')
    .call(
      d3
        .axisLeft(yScale)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat('')
    );

  // 6. Y-Axis
  g.append('g')
    .attr('class', 'chart-axis')
    .call(
      d3
        .axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => `${d}%`)
    );

  // Y-Axis title
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -44)
    .attr('fill', '#94A3B8')
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-body)')
    .text('Pass Rate (%)');

  // 7. X-Axis
  const categoryLabels = {
    national: 'National Baseline',
    urban: 'Urban Centers',
    rural: 'Rural Areas',
  };

  const xAxis = g
    .append('g')
    .attr('class', 'chart-axis')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(
      d3
        .axisBottom(x0)
        .tickFormat(key => categoryLabels[key] || key)
    );

  xAxis.selectAll('.tick text')
    .attr('dy', '14px')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .attr('fill', '#0F172A');

  // 8. National Average Pass Rate Reference Line (38.6%)
  const nationalPassRate = database.metadata?.overall_pass_rate || 38.6;
  const passY = yScale(nationalPassRate);
  g.append('line')
    .attr('x1', 0)
    .attr('y1', passY)
    .attr('x2', innerWidth)
    .attr('y2', passY)
    .attr('stroke', '#64748B')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '4 4')
    .attr('opacity', 0.8);

  g.append('text')
    .attr('x', innerWidth)
    .attr('y', passY - 6)
    .attr('text-anchor', 'end')
    .attr('fill', '#64748B')
    .attr('font-size', '10px')
    .attr('font-family', 'var(--font-mono)')
    .attr('font-weight', '700')
    .text(`NATIONAL AVG: ${nationalPassRate}%`);

  // 9. Render Grouped Bars
  const groupSelection = g
    .selectAll('.group-category')
    .data(categories)
    .join('g')
    .attr('class', 'group-category')
    .attr('transform', d => `translate(${x0(d.key)}, 0)`);

  // Transform each category into 2 bar records: female and male
  const barData = categories.flatMap(cat => [
    {
      groupKey: cat.key,
      groupLabel: cat.label,
      gender: 'female',
      genderLabel: 'Female',
      passRate: cat.femalePass,
      candidates: cat.femaleTotal,
      color: '#6366F1',
      gap: cat.gap,
    },
    {
      groupKey: cat.key,
      groupLabel: cat.label,
      gender: 'male',
      genderLabel: 'Male',
      passRate: cat.malePass,
      candidates: cat.maleTotal,
      color: '#0E7C7B',
      gap: cat.gap,
    },
  ]);

  // Bar Rectangles
  const bars = g
    .selectAll('.gender-bar')
    .data(barData)
    .join('rect')
    .attr('class', 'gender-bar')
    .attr('x', d => x0(d.groupKey) + x1(d.gender))
    .attr('y', innerHeight)
    .attr('width', x1.bandwidth())
    .attr('height', 0)
    .attr('rx', 4)
    .attr('fill', d => d.color)
    .style('cursor', 'pointer')
    .transition()
    .duration(750)
    .delay((_, i) => i * 60)
    .ease(d3.easeCubicOut)
    .attr('y', d => yScale(d.passRate))
    .attr('height', d => innerHeight - yScale(d.passRate));

  // Percentage labels placed cleanly inside the top of each bar (zero collision with baseline)
  g.selectAll('.gender-bar-label')
    .data(barData)
    .join('text')
    .attr('class', 'gender-bar-label')
    .attr('x', d => x0(d.groupKey) + x1(d.gender) + x1.bandwidth() / 2)
    .attr('y', innerHeight)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('font-weight', '700')
    .attr('font-family', 'var(--font-mono)')
    .attr('fill', '#FFFFFF')
    .text(d => `${d.passRate}%`)
    .transition()
    .duration(750)
    .delay((_, i) => i * 60)
    .ease(d3.easeCubicOut)
    .attr('y', d => yScale(d.passRate) + 20);

  // Gender Gap badges centered between each pair of bars
  categories.forEach(cat => {
    const groupX = x0(cat.key);
    const midX = groupX + x0.bandwidth() / 2;
    const topY = Math.min(yScale(cat.femalePass), yScale(cat.malePass)) - 26;

    const gapBadge = g
      .append('g')
      .attr('class', 'gender-gap-badge')
      .attr('transform', `translate(${midX}, ${topY})`)
      .attr('text-anchor', 'middle');

    gapBadge
      .append('rect')
      .attr('x', -28)
      .attr('y', -8)
      .attr('width', 56)
      .attr('height', 16)
      .attr('rx', 3)
      .attr('fill', '#F1F5F9')
      .attr('stroke', '#CBD5E1')
      .attr('stroke-width', 1);

    gapBadge
      .append('text')
      .attr('y', 4)
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--font-mono)')
      .attr('fill', '#0F172A')
      .text(`Δ ${cat.gap}%`);
  });

  // 10. Interactive Tooltip Events
  g.selectAll('.gender-bar')
    .on('mouseenter', function (event, d) {
      d3.select(this)
        .attr('opacity', 0.9)
        .attr('filter', 'drop-shadow(0 3px 8px rgba(0,0,0,0.2))');

      const tooltipHtml = `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${d.color};"></span>
          <strong style="color: #FFFFFF; font-size: 13px;">${d.groupLabel} — ${d.genderLabel}</strong>
        </div>
        <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 12px;">
          <span style="color: #94A3B8;">Pass Rate:</span>
          <strong style="font-family: var(--font-mono); color: #10B981; text-align: right;">${d.passRate}%</strong>
          <span style="color: #94A3B8;">Fail Rate:</span>
          <strong style="font-family: var(--font-mono); color: #EF4444; text-align: right;">${(100 - d.passRate).toFixed(1)}%</strong>
          <span style="color: #94A3B8;">Candidates:</span>
          <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${formatComma(d.candidates)}</strong>
          <span style="color: #94A3B8;">Gap to Peer:</span>
          <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${d.gap}%</strong>
        </div>
      `;
      tooltip.show(tooltipHtml, event);
    })
    .on('mousemove', function (event) {
      tooltip.show(null, event);
    })
    .on('mouseleave', function () {
      d3.select(this)
        .attr('opacity', 1.0)
        .attr('filter', null);
      tooltip.hide();
    });
}
