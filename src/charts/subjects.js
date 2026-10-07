/**
 * Subject Proficiency Breakdown Chart Module
 * 
 * Visualizes candidate competency across 10 IT core domains, benchmarked
 * against the 46.3% national average score and colored by HEC's official 3-tier domains.
 */

import * as d3 from 'd3';
import { createTooltip } from '../utils/tooltip.js';

/**
 * Domain categorization and curriculum diagnostic metadata matching Page 18 of HEC Report.
 */
const DOMAIN_METADATA = {
  'Operating System': {
    category: 'Deep Tech (Weakness)',
    tier: 'low',
    color: '#EF4444',
    icon: '⚙️',
    diagnostic: 'Critical deficit in low-level memory management, process concurrency, and kernel scheduling.'
  },
  'Computer Networks & Cloud': {
    category: 'Deep Tech (Weakness)',
    tier: 'low',
    color: '#EF4444',
    icon: '🌐',
    diagnostic: 'Gaps in OSI layer routing, socket programming, and cloud infrastructure architectures.'
  },
  'Data Structures & Algorithms': {
    category: 'Deep Tech (Weakness)',
    tier: 'low',
    color: '#EF4444',
    icon: '🧮',
    diagnostic: 'Deficits in algorithmic complexity (Big-O), tree traversals, and dynamic programming optimization.'
  },
  'Database': {
    category: 'Core Computing',
    tier: 'mid',
    color: '#3B82F6',
    icon: '🗄️',
    diagnostic: 'Moderate proficiency in normalization and basic SQL; challenges in indexing and ACID transaction locks.'
  },
  'Cyber Security': {
    category: 'Core Computing',
    tier: 'mid',
    color: '#3B82F6',
    icon: '🛡️',
    diagnostic: 'Basic cryptographic knowledge present; practical vulnerability assessment and secure coding need strengthening.'
  },
  'Programming': {
    category: 'Core Computing',
    tier: 'mid',
    color: '#3B82F6',
    icon: '💻',
    diagnostic: 'Solid baseline syntax understanding; challenges emerge in modular design and edge-case handling.'
  },
  'Problem Solving / Analytics': {
    category: 'Core Computing',
    tier: 'mid',
    color: '#3B82F6',
    icon: '🔍',
    diagnostic: 'Near national average in constrained scenarios; struggles with multi-variable logical synthesis.'
  },
  'Software Engineering': {
    category: 'Applied Tech (Strength)',
    tier: 'high',
    color: '#10B981',
    icon: '📐',
    diagnostic: 'Above national average; familiar with SDLC models, testing frameworks, and version control workflows.'
  },
  'AI / Machine Learning': {
    category: 'Applied Tech (Strength)',
    tier: 'high',
    color: '#10B981',
    icon: '🤖',
    diagnostic: 'Strong student interest and model awareness; gaps in mathematical optimization under the hood.'
  },
  'Web Development Basics': {
    category: 'Applied Tech (Strength)',
    tier: 'high',
    color: '#10B981',
    icon: '🌐',
    diagnostic: 'Highest national proficiency; strong familiarity with HTML/CSS, DOM manipulation, and modern web scripting.'
  }
};

/**
 * Renders the Subject-wise Proficiency horizontal bar chart.
 * @param {Object} database - The complete NSCT database JSON object.
 */
export function renderSubjectProficiencyChart(database) {
  const container = document.getElementById('subject-chart');
  if (!container || !database || !database.subject_proficiency) return;

  container.innerHTML = '';

  const rawData = database.subject_proficiency;
  const nationalAvg = database.metadata?.national_average_score || 46.28;
  const tooltip = createTooltip(container);

  let currentSort = 'asc'; // 'asc' (lowest first to highlight weaknesses), 'desc', or 'tier'

  // 1. Metric Summary Pills Header
  const metricsBar = document.createElement('div');
  metricsBar.className = 'subject-metrics-bar';
  metricsBar.innerHTML = `
    <div class="subject-metric-pill">
      <span class="pill-label">Lowest Subject</span>
      <span class="pill-value" style="color: #DC2626;">Operating Systems — 33.8% (-12.5% vs avg)</span>
    </div>
    <div class="subject-metric-pill">
      <span class="pill-label">Core Systems Deficit</span>
      <span class="pill-value" style="color: #EA580C;">Networks (39.4%) & DSA (39.5%) lag below 40%</span>
    </div>
    <div class="subject-metric-pill">
      <span class="pill-label">Highest Subject</span>
      <span class="pill-value" style="color: #059669;">Web Development — 54.1% (+7.8% vs avg)</span>
    </div>
    <div class="subject-metric-pill">
      <span class="pill-label">National Benchmark</span>
      <span class="pill-value" style="color: #475569;">46.3% National Mean Score</span>
    </div>
  `;
  container.appendChild(metricsBar);

  // 2. Interactive Toolbar (Legend & Sort Controls matching HEC Report Page 18)
  const toolbar = document.createElement('div');
  toolbar.className = 'chart-card__toolbar';
  toolbar.style.margin = 'var(--space-4) 0 var(--space-3) 0';
  toolbar.innerHTML = `
    <div class="chart-legend" style="margin: 0;">
      <div class="legend-item">
        <span class="legend-swatch" style="background: #EF4444;"></span>
        <span class="legend-label">Deep Tech Deficit (&lt;40%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" style="background: #3B82F6;"></span>
        <span class="legend-label">Core Computing (40–49%)</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch" style="background: #10B981;"></span>
        <span class="legend-label">Applied Strengths (≥50%)</span>
      </div>
    </div>
    <div class="toggle-group" id="subject-sort-toggle">
      <button class="toggle-btn toggle-btn--active" data-sort="asc">Lowest First (Weakness)</button>
      <button class="toggle-btn" data-sort="desc">Highest First</button>
      <button class="toggle-btn" data-sort="tier">By HEC Domain Tier</button>
    </div>
  `;
  container.appendChild(toolbar);

  // 3. SVG Layout Dimensions
  const width = 960;
  const height = 540;
  const margin = { top: 30, right: 180, bottom: 45, left: 240 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'chart-svg');

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Scales
  const xScale = d3
    .scaleLinear()
    .domain([0, 60]) // 0 to 60% exactly as in HEC Report Page 18
    .range([0, innerWidth]);

  const yScale = d3
    .scaleBand()
    .range([0, innerHeight])
    .padding(0.28);

  // Grid lines
  const gridGroup = g.append('g').attr('class', 'grid-group');

  // Axes groups
  const xAxisGroup = g
    .append('g')
    .attr('class', 'axis axis--x')
    .attr('transform', `translate(0, ${innerHeight})`);

  const yAxisGroup = g.append('g').attr('class', 'axis axis--y');

  // Visual layers
  const tracksGroup = g.append('g').attr('class', 'tracks-layer');
  const barsGroup = g.append('g').attr('class', 'bars-layer');
  const labelsGroup = g.append('g').attr('class', 'labels-layer');
  const referenceGroup = g.append('g').attr('class', 'reference-layer');

  /**
   * Sorts data according to active sort mode.
   */
  function getSortedData() {
    const data = [...rawData];
    if (currentSort === 'asc') {
      return data.sort((a, b) => a.avg_proficiency - b.avg_proficiency);
    }
    if (currentSort === 'desc') {
      return data.sort((a, b) => b.avg_proficiency - a.avg_proficiency);
    }
    // Tier sort (Low -> Mid -> High)
    const tierOrder = { low: 1, mid: 2, high: 3 };
    return data.sort((a, b) => {
      const orderA = tierOrder[a.tier] || 2;
      const orderB = tierOrder[b.tier] || 2;
      return orderA - orderB || a.avg_proficiency - b.avg_proficiency;
    });
  }

  /**
   * Updates chart rendering with smooth transitions.
   */
  function updateChart(animate = true) {
    const data = getSortedData();
    const t = svg.transition().duration(animate ? 600 : 0).ease(d3.easeCubicOut);

    yScale.domain(data.map(d => d.subject));

    // 1. Grid Lines
    gridGroup
      .call(
        d3.axisBottom(xScale)
          .tickValues([10, 20, 30, 40, 50, 60])
          .tickSize(-innerHeight)
          .tickFormat('')
      )
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line')
        .attr('stroke', '#E2E8F0')
        .attr('stroke-dasharray', '3,3')
      );

    // 2. X-Axis (0, 10, 20, 30, 40, 50, 60)
    xAxisGroup
      .transition(t)
      .call(
        d3.axisBottom(xScale)
          .tickValues([0, 10, 20, 30, 40, 50, 60])
          .tickFormat(d => `${d}%`)
      )
      .call(g => g.select('.domain').attr('stroke', '#CBD5E1'))
      .call(g => g.selectAll('.tick text')
        .attr('font-family', 'var(--font-mono)')
        .attr('font-size', '11px')
        .attr('fill', 'var(--color-muted)')
      );

    // 3. Y-Axis
    yAxisGroup
      .transition(t)
      .call(d3.axisLeft(yScale).tickSize(0).tickPadding(12))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text')
        .attr('font-family', 'var(--font-body)')
        .attr('font-size', '12.5px')
        .attr('font-weight', '600')
        .attr('fill', 'var(--color-heading)')
      );

    // 4. Background Track Bars
    const tracks = tracksGroup
      .selectAll('.track-bar')
      .data(data, d => d.subject);

    tracks.join(
      enter => enter
        .append('rect')
        .attr('class', 'track-bar')
        .attr('x', 0)
        .attr('y', d => yScale(d.subject))
        .attr('width', xScale(60))
        .attr('height', yScale.bandwidth())
        .attr('rx', 4)
        .attr('fill', '#F8FAFC'),
      update => update
        .transition(t)
        .attr('y', d => yScale(d.subject))
        .attr('width', xScale(60))
        .attr('height', yScale.bandwidth()),
      exit => exit.remove()
    );

    // 5. Data Bars (Matching HEC Page 18 Colors)
    const bars = barsGroup
      .selectAll('.subject-bar')
      .data(data, d => d.subject);

    bars.join(
      enter => enter
        .append('rect')
        .attr('class', 'subject-bar')
        .attr('x', 0)
        .attr('y', d => yScale(d.subject))
        .attr('height', yScale.bandwidth())
        .attr('width', 0)
        .attr('rx', 4)
        .attr('fill', d => DOMAIN_METADATA[d.subject]?.color || '#3B82F6')
        .attr('cursor', 'pointer')
        .call(enter => enter
          .transition(t)
          .attr('width', d => Math.max(2, xScale(d.avg_proficiency)))
        ),
      update => update
        .call(update => update
          .transition(t)
          .attr('y', d => yScale(d.subject))
          .attr('height', yScale.bandwidth())
          .attr('width', d => Math.max(2, xScale(d.avg_proficiency)))
          .attr('fill', d => DOMAIN_METADATA[d.subject]?.color || '#3B82F6')
        ),
      exit => exit
        .transition(t)
        .attr('width', 0)
        .remove()
    );

    // 6. Right Value Labels & Difference vs National Mean (46.3%)
    const labels = labelsGroup
      .selectAll('.label-row')
      .data(data, d => d.subject);

    const labelsEnter = labels
      .enter()
      .append('g')
      .attr('class', 'label-row')
      .attr('transform', d => `translate(${xScale(d.avg_proficiency) + 8}, ${yScale(d.subject) + yScale.bandwidth() / 2 + 4})`)
      .style('opacity', 0);

    labelsEnter
      .append('text')
      .attr('class', 'val-score')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('fill', 'var(--color-heading)')
      .text(d => `${d.avg_proficiency.toFixed(1)}%`);

    labelsEnter
      .append('text')
      .attr('class', 'val-diff')
      .attr('x', 48)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10.5px')
      .attr('font-weight', '600')
      .attr('fill', d => d.avg_proficiency >= nationalAvg ? '#059669' : '#DC2626')
      .text(d => {
        const diff = (d.avg_proficiency - nationalAvg).toFixed(1);
        return d.avg_proficiency >= nationalAvg ? `(+${diff}%)` : `(${diff}%)`;
      });

    labels
      .merge(labelsEnter)
      .transition(t)
      .style('opacity', 1)
      .attr('transform', d => `translate(${xScale(d.avg_proficiency) + 8}, ${yScale(d.subject) + yScale.bandwidth() / 2 + 4})`);

    labels.exit().transition(t).style('opacity', 0).remove();

    // 7. Interactive Hover Effects
    barsGroup
      .selectAll('.subject-bar')
      .on('mouseenter', (event, d) => {
        barsGroup.selectAll('.subject-bar')
          .transition().duration(150)
          .attr('opacity', b => b.subject === d.subject ? 1 : 0.35);

        const meta = DOMAIN_METADATA[d.subject] || {};
        const diff = (d.avg_proficiency - nationalAvg).toFixed(1);
        const diffText = d.avg_proficiency >= nationalAvg
          ? `<span style="color: #059669; font-weight: 700;">+${diff}% above national average (46.3%)</span>`
          : `<span style="color: #DC2626; font-weight: 700;">${diff}% below national average (46.3%)</span>`;

        tooltip.show(`
          <div class="tooltip-title">${meta.icon || '📌'} ${d.subject}</div>
          <div class="tooltip-field">
            <span class="tooltip-label">HEC Domain Group</span>
            <span class="tooltip-value">${meta.category || 'Core'}</span>
          </div>
          <div class="tooltip-field">
            <span class="tooltip-label">Average Proficiency</span>
            <span class="tooltip-value" style="font-weight: 700; color: ${meta.color || '#3B82F6'};">${d.avg_proficiency.toFixed(1)}%</span>
          </div>
          <div class="tooltip-field">
            <span class="tooltip-label">Relative to National Mean</span>
            <span class="tooltip-value">${diffText}</span>
          </div>
          <div class="tooltip-divider"></div>
          <div style="font-size: 11.5px; line-height: 1.5; color: var(--color-text);">
            <strong>Curriculum Diagnostic:</strong> ${meta.diagnostic || 'General computational capability assessed.'}
          </div>
        `, event);
      })
      .on('mousemove', event => tooltip.move(event))
      .on('mouseleave', () => {
        barsGroup.selectAll('.subject-bar')
          .transition().duration(150)
          .attr('opacity', 1);
        tooltip.hide();
      });

    // 8. National Mean Reference Line (46.28%)
    referenceGroup.selectAll('*').remove();

    const xNat = xScale(nationalAvg);
    referenceGroup
      .append('line')
      .attr('x1', xNat)
      .attr('x2', xNat)
      .attr('y1', -10)
      .attr('y2', innerHeight)
      .attr('stroke', '#64748B')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4');

    referenceGroup
      .append('rect')
      .attr('x', xNat - 65)
      .attr('y', -24)
      .attr('width', 130)
      .attr('height', 18)
      .attr('rx', 4)
      .attr('fill', '#F1F5F9')
      .attr('stroke', '#CBD5E1')
      .attr('stroke-width', 1);

    referenceGroup
      .append('text')
      .attr('x', xNat)
      .attr('y', -11)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#475569')
      .text(`National Mean (${nationalAvg.toFixed(1)}%)`);
  }

  // Bind Sort Toggle Buttons
  container.querySelectorAll('#subject-sort-toggle .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#subject-sort-toggle .toggle-btn').forEach(b => b.classList.remove('toggle-btn--active'));
      btn.classList.add('toggle-btn--active');
      currentSort = btn.dataset.sort;
      updateChart(true);
    });
  });

  // Initial render
  updateChart(false);

  // 4. Executive Insight Callout below the chart matching HEC Page 18
  const callout = document.createElement('div');
  callout.className = 'insight-callout';
  callout.innerHTML = `
    <p>
      <strong>The Systems Engineering Deficit (HEC Report Page 18):</strong> The data highlights a stark divide across domains. 
      Students perform relatively well in applied, high-level domains such as <strong>Web Development Basics (54.1%)</strong>, 
      <strong>AI / Machine Learning (50.8%)</strong>, and <strong>Software Engineering (50.0%)</strong>. 
      However, low-level computational foundations suffer severe deficits: <strong>Operating Systems (33.8%)</strong>, 
      <strong>Computer Networks & Cloud (39.4%)</strong>, and <strong>Data Structures & Algorithms (39.5%)</strong> fall well below the national average. 
      This structural divergence accounts for why employers find ample frontend applicants but face severe domestic shortages in systems, backend, and infrastructure engineering.
    </p>
  `;
  container.appendChild(callout);
}
