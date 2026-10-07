/**
 * Score Distribution Histogram & Bell Curve Chart
 * 
 * Visualizes the 10-mark score distribution brackets for 33,038 test takers,
 * showing the peak at 40-49 marks and the 50-mark national passing threshold.
 */

import * as d3 from 'd3';
import { formatComma } from '../utils/formatters.js';
import { createTooltip } from '../utils/tooltip.js';

/**
 * Renders the Score Distribution Histogram with bell curve overlay and threshold markers.
 * @param {Object} database - The complete NSCT database JSON object.
 */
export function renderHistogram(database) {
  const container = document.getElementById('histogram-chart');
  if (!container) return;

  container.innerHTML = '';

  const rawData = database.score_distribution_2026 || [];
  const nationalAvg = database.metadata.national_average_score || 46.28;
  const passThreshold = database.metadata.pass_threshold || 50;
  const totalCandidates = database.metadata.total_appeared || 33038;

  // Process distribution data with percentages and cumulative counts
  let runningSum = 0;
  const data = rawData.map((d, index) => {
    runningSum += d.count;
    const lowerBound = parseInt(d.bracket.split('-')[0], 10);
    const isPassing = lowerBound >= passThreshold;
    const percentage = Number(((d.count / totalCandidates) * 100).toFixed(1));
    const isPeak = d.bracket === '40-49';

    return {
      ...d,
      index,
      lowerBound,
      isPassing,
      percentage,
      isPeak,
      cumulativeCount: runningSum,
      cumulativePct: Number(((runningSum / totalCandidates) * 100).toFixed(1)),
      color: isPassing ? '#0E7C7B' : '#EF4444',
    };
  });

  // 1. Metrics summary header bar
  const metricsBar = document.createElement('div');
  metricsBar.className = 'histogram-metrics';
  metricsBar.innerHTML = `
    <div class="histogram-metric-pill">
      <span class="pill-label">National Average</span>
      <span class="pill-value" style="color: #0E7C7B;">${nationalAvg} / 100</span>
    </div>
    <div class="histogram-metric-pill">
      <span class="pill-label">Peak Concentration</span>
      <span class="pill-value" style="color: #EF4444;">40–49 Marks (10,323 • 31.2%)</span>
    </div>
    <div class="histogram-metric-pill">
      <span class="pill-label">Passing Cohort (≥50)</span>
      <span class="pill-value" style="color: #10B981;">12,744 Candidates (38.6%)</span>
    </div>
  `;
  container.appendChild(metricsBar);

  // 2. SVG layout & dimensions
  const width = 960;
  const height = 440;
  const margin = { top: 45, right: 35, bottom: 55, left: 65 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const tooltip = createTooltip(container);

  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'histogram-svg')
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // 3. Scales
  const xScale = d3
    .scaleBand()
    .domain(data.map(d => d.bracket))
    .range([0, innerWidth])
    .padding(0.24);

  const maxCount = d3.max(data, d => d.count) || 10323;
  const yScale = d3
    .scaleLinear()
    .domain([0, maxCount * 1.18]) // Extra headroom for count labels and reference flags
    .range([innerHeight, 0])
    .nice();

  // 4. Horizontal background gridlines
  g.append('g')
    .attr('class', 'chart-grid')
    .call(
      d3
        .axisLeft(yScale)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat('')
    );

  // 5. Y-Axis
  g.append('g')
    .attr('class', 'chart-axis')
    .call(
      d3
        .axisLeft(yScale)
        .ticks(5)
        .tickFormat(d => (d >= 1000 ? `${d / 1000}k` : d))
    );

  // Y-Axis title label
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -innerHeight / 2)
    .attr('y', -48)
    .attr('fill', '#94A3B8')
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-body)')
    .text('Number of Candidates');

  // 6. X-Axis
  const xAxisGroup = g
    .append('g')
    .attr('class', 'chart-axis')
    .attr('transform', `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale));

  xAxisGroup.selectAll('.tick text').attr('dy', '12px');

  // X-Axis title label
  g.append('text')
    .attr('x', innerWidth / 2)
    .attr('y', innerHeight + 42)
    .attr('fill', '#94A3B8')
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-body)')
    .text('Score Bracket (Marks out of 100)');

  // 7. Threshold boundary: line separating Fail (<50) from Pass (≥50)
  // Situated midway between bracket '40-49' (index 4) and '50-59' (index 5)
  const pos40 = xScale('40-49') + xScale.bandwidth();
  const pos50 = xScale('50-59');
  const thresholdX = (pos40 + pos50) / 2;

  // Failing zone background tint
  g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', thresholdX)
    .attr('height', innerHeight)
    .attr('fill', '#EF4444')
    .attr('opacity', 0.03)
    .attr('pointer-events', 'none');

  // Passing zone background tint
  g.append('rect')
    .attr('x', thresholdX)
    .attr('y', 0)
    .attr('width', innerWidth - thresholdX)
    .attr('height', innerHeight)
    .attr('fill', '#0E7C7B')
    .attr('opacity', 0.03)
    .attr('pointer-events', 'none');

  // Vertical threshold divider line
  g.append('line')
    .attr('x1', thresholdX)
    .attr('y1', -15)
    .attr('x2', thresholdX)
    .attr('y2', innerHeight)
    .attr('stroke', '#EF4444')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5 4');

  // Pass Threshold flag label
  const thresholdBadge = g
    .append('g')
    .attr('transform', `translate(${thresholdX}, -20)`)
    .attr('text-anchor', 'middle');

  thresholdBadge
    .append('rect')
    .attr('x', -70)
    .attr('y', -12)
    .attr('width', 140)
    .attr('height', 22)
    .attr('rx', 4)
    .attr('fill', '#FEF2F2')
    .attr('stroke', '#FCA5A5')
    .attr('stroke-width', 1);

  thresholdBadge
    .append('text')
    .attr('y', 3)
    .attr('fill', '#DC2626')
    .attr('font-size', '10px')
    .attr('font-weight', '700')
    .attr('font-family', 'var(--font-mono)')
    .text('PASS LINE: 50 MARKS');

  // National Average indicator line & tag
  // 46.28 is within the 40-49 bracket: offset by (46.28 - 40) / 10 = 0.628 of bracket width
  const avgX = xScale('40-49') + xScale.bandwidth() * 0.628;

  g.append('line')
    .attr('x1', avgX)
    .attr('y1', 15)
    .attr('x2', avgX)
    .attr('y2', innerHeight)
    .attr('stroke', '#0F172A')
    .attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '3 3')
    .attr('opacity', 0.7);

  const avgBadge = g
    .append('g')
    .attr('transform', `translate(${avgX}, 10)`)
    .attr('text-anchor', 'middle');

  avgBadge
    .append('rect')
    .attr('x', -46)
    .attr('y', -11)
    .attr('width', 92)
    .attr('height', 18)
    .attr('rx', 3)
    .attr('fill', '#0F172A');

  avgBadge
    .append('text')
    .attr('y', 2)
    .attr('fill', '#FFFFFF')
    .attr('font-size', '9px')
    .attr('font-weight', '600')
    .attr('font-family', 'var(--font-mono)')
    .text(`Avg: ${nationalAvg}`);

  // 8. Render Histogram Bars
  const barsGroup = g.append('g').attr('class', 'histogram-bars');

  const barGroups = barsGroup
    .selectAll('.bar-group')
    .data(data)
    .join('g')
    .attr('class', 'bar-group')
    .style('cursor', 'pointer');

  // The bar rectangle with animated entrance
  barGroups
    .append('rect')
    .attr('class', d => `hist-bar ${d.isPeak ? 'hist-bar--peak' : ''}`)
    .attr('x', d => xScale(d.bracket))
    .attr('y', innerHeight)
    .attr('width', xScale.bandwidth())
    .attr('height', 0)
    .attr('rx', 4)
    .attr('fill', d => d.color)
    .attr('opacity', d => (d.isPeak ? 1.0 : 0.85))
    .attr('stroke', d => (d.isPeak ? '#B91C1C' : 'transparent'))
    .attr('stroke-width', d => (d.isPeak ? 1.5 : 0))
    .transition()
    .duration(800)
    .delay((_, i) => i * 45)
    .ease(d3.easeCubicOut)
    .attr('y', d => yScale(d.count))
    .attr('height', d => innerHeight - yScale(d.count));

  // Count label above each bar
  barGroups
    .append('text')
    .attr('class', 'bar-label')
    .attr('x', d => xScale(d.bracket) + xScale.bandwidth() / 2)
    .attr('y', innerHeight)
    .attr('text-anchor', 'middle')
    .attr('fill', '#334155')
    .attr('font-size', '10px')
    .attr('font-weight', '600')
    .attr('font-family', 'var(--font-mono)')
    .text(d => (d.count > 100 ? formatComma(d.count) : ''))
    .transition()
    .duration(800)
    .delay((_, i) => i * 45)
    .ease(d3.easeCubicOut)
    .attr('y', d => yScale(d.count) - 7);

  // Peak badge annotation atop the 40-49 bar
  const peakData = data.find(d => d.isPeak);
  if (peakData) {
    const peakX = xScale('40-49') + xScale.bandwidth() / 2;
    const peakY = yScale(peakData.count) - 24;

    const peakTag = g.append('g').attr('transform', `translate(${peakX}, ${peakY})`);

    peakTag
      .append('rect')
      .attr('x', -34)
      .attr('y', -8)
      .attr('width', 68)
      .attr('height', 16)
      .attr('rx', 3)
      .attr('fill', '#EF4444');

    peakTag
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 4)
      .attr('fill', '#FFFFFF')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--font-mono)')
      .text('PEAK 31.2%');
  }

  // 9. Bell Curve Overlay Line
  const lineGenerator = d3
    .line()
    .x(d => xScale(d.bracket) + xScale.bandwidth() / 2)
    .y(d => yScale(d.count))
    .curve(d3.curveMonotoneX);

  const curvePath = g
    .append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#0F172A')
    .attr('stroke-width', 2.5)
    .attr('stroke-linecap', 'round')
    .attr('opacity', 0.8)
    .attr('d', lineGenerator);

  // Animate bell curve drawing using stroke-dasharray
  const pathLength = curvePath.node().getTotalLength();
  curvePath
    .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
    .attr('stroke-dashoffset', pathLength)
    .transition()
    .duration(1100)
    .delay(200)
    .ease(d3.easeCubicOut)
    .attr('stroke-dashoffset', 0);

  // Nodes along the bell curve
  g.selectAll('.curve-node')
    .data(data)
    .join('circle')
    .attr('class', 'curve-node')
    .attr('cx', d => xScale(d.bracket) + xScale.bandwidth() / 2)
    .attr('cy', d => yScale(d.count))
    .attr('r', 3.5)
    .attr('fill', '#FFFFFF')
    .attr('stroke', '#0F172A')
    .attr('stroke-width', 2)
    .attr('opacity', 0)
    .transition()
    .duration(400)
    .delay((_, i) => 300 + i * 50)
    .attr('opacity', 1);

  // 10. Interactive Tooltip & Hover
  barGroups
    .on('mouseenter', function (event, d) {
      d3.select(this)
        .select('.hist-bar')
        .attr('opacity', 1.0)
        .attr('filter', 'drop-shadow(0 3px 8px rgba(0,0,0,0.25))');

      const statusTag = d.isPassing
        ? '<span style="color: #10B981; font-weight: 700;">PASS (≥ 50)</span>'
        : '<span style="color: #EF4444; font-weight: 700;">FAIL (< 50)</span>';

      const tooltipHtml = `
        <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #FFFFFF;">
          Score Bracket: ${d.bracket} Marks
        </div>
        <div style="font-size: 11px; margin-bottom: 8px;">
          Classification: ${statusTag}
        </div>
        <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 12px;">
          <span style="color: #94A3B8;">Candidate Count:</span>
          <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${formatComma(d.count)}</strong>
          
          <span style="color: #94A3B8;">Cohort Share:</span>
          <strong style="font-family: var(--font-mono); color: ${d.color}; text-align: right;">${d.percentage}%</strong>

          <span style="color: #94A3B8;">Cumulative Total:</span>
          <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${formatComma(d.cumulativeCount)} (${d.cumulativePct}%)</strong>
        </div>
        ${d.isPeak ? `
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 11px; color: #FCA5A5; font-weight: 600;">
            ★ Highest volume bracket (31.2% of national cohort)
          </div>
        ` : ''}
      `;

      tooltip.show(tooltipHtml, event);
    })
    .on('mousemove', function (event) {
      tooltip.show(null, event);
    })
    .on('mouseleave', function (_, d) {
      d3.select(this)
        .select('.hist-bar')
        .attr('opacity', d.isPeak ? 1.0 : 0.85)
        .attr('filter', null);

      tooltip.hide();
    });

  // 11. Append insight callout to #histogram-card
  const card = document.getElementById('histogram-card');
  if (card && !card.querySelector('.insight-callout')) {
    const callout = document.createElement('div');
    callout.className = 'insight-callout';
    callout.innerHTML = `
      <p>
        <strong>The Sub-Threshold Clumping:</strong> <strong>31.2%</strong> of all tested graduates (10,323 students) clustered in the 
        <strong>40–49 bracket</strong>, narrowly missing the 50-mark pass benchmark. Combined with the national average of 
        <strong>46.28</strong>, this confirms that the majority of graduates possess basic conceptual awareness but consistently fall short 
        of independent technical competence.
      </p>
    `;
    card.appendChild(callout);
  }
}
