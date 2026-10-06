/**
 * ============================================================================
 * ASSESSMENT FUNNEL CHART (src/charts/funnel.js)
 * ============================================================================
 *
 * Visualizes the 4-stage candidate attrition lifecycle:
 * Uploaded (57,241) → Sign-Ups (46,155) → Registered (40,784) → Appeared (33,038)
 *
 * D3.JS CONCEPTS TAUGHT IN THIS MODULE:
 * -------------------------------------
 * 1. SVG COORDINATE SYSTEM:
 *    SVGs use an (x, y) grid with (0,0) at the TOP-LEFT corner.
 *    Positive X moves right; positive Y moves DOWN.
 *
 * 2. SCALES (d3.scaleLinear & d3.scaleBand):
 *    - d3.scaleLinear(): Maps continuous data values (e.g. 0 to 57,241 candidates)
 *      to pixel lengths (e.g. 0 to 520px).
 *    - d3.scaleBand(): Divides a continuous pixel range into discrete ordinal bands,
 *      ideal for categorical items (our 4 funnel stages) with built-in padding.
 *
 * 3. THE MARGIN CONVENTION:
 *    A standard D3 pattern: define outer width/height and inner margins
 *    { top, right, bottom, left }, then translate an inner <g> element by
 *    (left, top). All child elements are positioned relative to this inner canvas.
 *
 * 4. METHOD CHAINING & DATA JOIN:
 *    d3.select().selectAll().data().join() binds our data array to SVG DOM nodes.
 *
 * 5. TRANSITIONS (d3.transition):
 *    Smoothly interpolates SVG attributes (like bar width from 0 to target)
 *    using easing functions (d3.easeCubicOut) for professional animation.
 * ============================================================================
 */

import * as d3 from 'd3';
import { formatComma } from '../utils/formatters.js';
import { createTooltip } from '../utils/tooltip.js';

/**
 * Renders the assessment funnel chart into the #funnel-chart container.
 * @param {Object} database - The complete NSCT database JSON object.
 */
export function renderFunnelChart(database) {
  const container = document.getElementById('funnel-chart');
  if (!container) return;

  // 1. Clear any existing content to prevent duplicate charts on re-render
  container.innerHTML = '';

  // 2. Prepare structured funnel data
  const stages = [
    {
      id: 'uploaded',
      index: 0,
      name: 'Initial Pool Uploaded',
      description: 'Submitted by 154 universities',
      count: database.metadata.total_candidates_uploaded || 57241,
      pctInitial: 100,
      convFromPrev: 100,
      dropCount: 11086,
      dropPct: 19.4,
      dropReason: 'Never created portal credentials or initiated profile',
      color: '#0E7C7B', // Primary deep teal
    },
    {
      id: 'signups',
      index: 1,
      name: 'Portal Sign-Ups',
      description: 'Students who created accounts',
      count: database.metadata.total_sign_ups || 46155,
      pctInitial: 80.6,
      convFromPrev: 80.6,
      dropCount: 5371,
      dropPct: 11.6,
      dropReason: 'Incomplete registration, unverified credentials, or dropped out',
      color: '#138E8D',
    },
    {
      id: 'registered',
      index: 2,
      name: 'Verified & Registered',
      description: 'Assigned roll numbers & test centers',
      count: database.metadata.total_registered || 40784,
      pctInitial: 71.3,
      convFromPrev: 88.4,
      dropCount: 7746,
      dropPct: 19.0,
      dropReason: 'Registered candidates who were absent on test day (no-shows)',
      color: '#1CA39E',
    },
    {
      id: 'appeared',
      index: 3,
      name: 'Actually Appeared',
      description: 'Sat for the national 100-mark test',
      count: database.metadata.total_appeared || 33038,
      pctInitial: 57.7,
      convFromPrev: 81.0,
      dropCount: 0,
      dropPct: 0,
      dropReason: null,
      color: '#26B5AF',
    },
  ];

  // 3. Setup dimensions and responsive viewBox
  // Using viewBox allows the SVG to automatically scale smoothly across screen sizes
  const width = 960;
  const height = 400;
  const margin = { top: 25, right: 180, bottom: 25, left: 240 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // 4. Initialize tooltip handler
  const tooltip = createTooltip(container);

  // 5. Create SVG canvas
  const svg = d3
    .select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'funnel-svg')
    .style('width', '100%')
    .style('height', 'auto')
    .style('display', 'block');

  // SVG Defs: Linear gradient for modern visual depth
  const defs = svg.append('defs');
  
  stages.forEach((stage, i) => {
    const gradient = defs
      .append('linearGradient')
      .attr('id', `funnel-gradient-${i}`)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', stage.color)
      .attr('stop-opacity', 0.9);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', stage.color)
      .attr('stop-opacity', 1.0);
  });

  // Main container group translated by margins (D3 Margin Convention)
  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // 6. Scales
  // xScale: Candidate count (0 to 57,241) -> pixel length (0 to innerWidth)
  const maxCount = stages[0].count;
  const xScale = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([0, innerWidth]);

  // yScale: 4 bands for 4 stages
  const yScale = d3
    .scaleBand()
    .domain(stages.map((_, i) => i))
    .range([0, innerHeight])
    .padding(0.48);

  const barHeight = yScale.bandwidth();

  // 7. Render Drop-off / Attrition Connectors between stages
  // These visual indicators sit between stage (i) and stage (i + 1)
  const dropoffGroup = g.append('g').attr('class', 'funnel-dropoffs');

  for (let i = 0; i < stages.length - 1; i++) {
    const current = stages[i];
    const yTop = yScale(i) + barHeight;
    const yBottom = yScale(i + 1);
    const midY = (yTop + yBottom) / 2;

    const currentX = xScale(current.count);
    const nextX = xScale(stages[i + 1].count);
    const midX = (currentX + nextX) / 2;

    // Subtle connecting polygon showing the funnel tapering
    const taperPoints = [
      [0, yTop],
      [currentX, yTop],
      [nextX, yBottom],
      [0, yBottom],
    ]
      .map(p => p.join(','))
      .join(' ');

    dropoffGroup
      .append('polygon')
      .attr('points', taperPoints)
      .attr('fill', '#0E7C7B')
      .attr('opacity', 0.05);

    // Attrition label container
    const dropLabel = dropoffGroup
      .append('g')
      .attr('class', 'funnel-drop-indicator')
      .attr('transform', `translate(${Math.max(midX + 16, 240)}, ${midY})`);

    // Downward arrow icon
    dropLabel
      .append('text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('fill', '#EF4444')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--font-mono)')
      .text(`↓ -${formatComma(current.dropCount)} (-${current.dropPct}%)`);

    dropLabel
      .append('text')
      .attr('x', 145)
      .attr('y', 4)
      .attr('fill', '#94A3B8')
      .attr('font-size', '10px')
      .attr('font-family', 'var(--font-body)')
      .text(current.id === 'uploaded' ? 'Never signed up' : current.id === 'signups' ? 'Incomplete registration' : 'Absent on test day');
  }

  // 8. Render Funnel Stage Rows
  const stageGroups = g
    .selectAll('.funnel-stage')
    .data(stages)
    .join('g')
    .attr('class', 'funnel-stage')
    .attr('transform', (_, i) => `translate(0, ${yScale(i)})`)
    .style('cursor', 'pointer');

  // Background track (showing full 100% capacity in light gray)
  stageGroups
    .append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', innerWidth)
    .attr('height', barHeight)
    .attr('rx', 6)
    .attr('fill', '#F1F5F9')
    .attr('stroke', '#E2E8F0')
    .attr('stroke-width', 1);

  // Animated Foreground Bar
  stageGroups
    .append('rect')
    .attr('class', 'funnel-bar')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 0) // Start at width 0 for transition animation
    .attr('height', barHeight)
    .attr('rx', 6)
    .attr('fill', (_, i) => `url(#funnel-gradient-${i})`)
    .transition()
    .duration(850)
    .delay((_, i) => i * 140) // Staggered entrance
    .ease(d3.easeCubicOut)
    .attr('width', d => xScale(d.count));

  // Left Label: Stage Name & Subtitle
  const labelGroup = stageGroups
    .append('g')
    .attr('transform', 'translate(-16, 0)')
    .attr('text-anchor', 'end');

  labelGroup
    .append('text')
    .attr('x', 0)
    .attr('y', barHeight / 2 - 4)
    .attr('fill', '#0F172A')
    .attr('font-family', 'var(--font-body)')
    .attr('font-size', '13px')
    .attr('font-weight', '600')
    .text(d => d.name);

  labelGroup
    .append('text')
    .attr('x', 0)
    .attr('y', barHeight / 2 + 13)
    .attr('fill', '#94A3B8')
    .attr('font-family', 'var(--font-body)')
    .attr('font-size', '11px')
    .text(d => d.description);

  // Right Value & Percentage Badge
  const valueGroup = stageGroups
    .append('g')
    .attr('class', 'funnel-value-group')
    .attr('transform', d => `translate(${xScale(d.count) + 12}, 0)`);

  // Candidate Count
  valueGroup
    .append('text')
    .attr('x', 0)
    .attr('y', barHeight / 2 + 5)
    .attr('fill', '#0F172A')
    .attr('font-family', 'var(--font-mono)')
    .attr('font-size', '14px')
    .attr('font-weight', '700')
    .text(d => formatComma(d.count));

  // Retention % Badge (from 57,241 initial)
  valueGroup
    .append('text')
    .attr('x', 82)
    .attr('y', barHeight / 2 + 5)
    .attr('fill', '#0E7C7B')
    .attr('font-family', 'var(--font-mono)')
    .attr('font-size', '12px')
    .attr('font-weight', '600')
    .text(d => `(${d.pctInitial}%)`);

  // 9. Interactive Hover & Tooltip Events
  stageGroups
    .on('mouseenter', function (event, d) {
      d3.select(this)
        .select('.funnel-bar')
        .attr('filter', 'drop-shadow(0 2px 8px rgba(14, 124, 123, 0.35))')
        .attr('opacity', 0.95);

      const tooltipHtml = `
        <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px; color: #FFFFFF;">
          ${d.name}
        </div>
        <div style="color: #94A3B8; font-size: 11px; margin-bottom: 8px;">
          ${d.description}
        </div>
        <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 12px;">
          <span style="color: #94A3B8;">Candidate Count:</span>
          <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${formatComma(d.count)}</strong>
          
          <span style="color: #94A3B8;">Pool Retention:</span>
          <strong style="font-family: var(--font-mono); color: #14B8A6; text-align: right;">${d.pctInitial}%</strong>

          <span style="color: #94A3B8;">Step Conversion:</span>
          <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${d.convFromPrev}%</strong>
          
          ${d.dropCount > 0 ? `
            <span style="color: #EF4444;">Lost At This Step:</span>
            <strong style="font-family: var(--font-mono); color: #EF4444; text-align: right;">-${formatComma(d.dropCount)} (-${d.dropPct}%)</strong>
          ` : ''}
        </div>
        ${d.dropReason ? `
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 11px; color: #FCA5A5;">
            ⚠ ${d.dropReason}
          </div>
        ` : ''}
      `;

      tooltip.show(tooltipHtml, event);
    })
    .on('mousemove', function (event) {
      tooltip.show(null, event); // Updates position while preserving HTML
    })
    .on('mouseleave', function () {
      d3.select(this)
        .select('.funnel-bar')
        .attr('filter', null)
        .attr('opacity', 1.0);

      tooltip.hide();
    });

  // 10. Append contextual insight callout if not present
  const funnelCard = document.getElementById('funnel-card');
  if (funnelCard && !funnelCard.querySelector('.insight-callout')) {
    const callout = document.createElement('div');
    callout.className = 'insight-callout';
    callout.innerHTML = `
      <p>
        <strong>42.3% Candidate Drop-Off:</strong> Of the <strong>57,241</strong> students nominated by Pakistani universities, 
        over <strong>24,200</strong> never completed testing. 11,086 never created an account, and 7,746 registered students were 
        absent on test day — pinpointing major administrative friction and student hesitation before evaluation even begins.
      </p>
    `;
    funnelCard.appendChild(callout);
  }
}
