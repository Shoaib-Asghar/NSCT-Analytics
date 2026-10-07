/**
 * Cognitive Tier Performance Chart Module
 * 
 * Visualizes candidate performance across Bloom's Taxonomy cognitive tiers:
 * Tier 1 (Understanding: 49.5%), Tier 2 (Application: 45.1%), and Tier 3 (Analysis: 44.8%),
 * and the official Page 20 Rote-to-Reasoning cognitive drop-off gaps across 10 HEIs.
 */

import * as d3 from 'd3';
import { createTooltip } from '../utils/tooltip.js';

/**
 * Renders the Cognitive Tier Performance component and institutional gap chart.
 * @param {Object} database - The complete NSCT database JSON object.
 */
export function renderCognitiveChart(database) {
  const container = document.getElementById('cognitive-chart');
  if (!container || !database || !database.cognitive_tiers) return;

  container.innerHTML = '';

  const tiersData = database.cognitive_tiers;
  const gapInstitutions = database.proficiency_gap_institutions || [];
  const tooltip = createTooltip(container);

  let currentView = 'tiers'; // 'tiers' (National Tiers) | 'institutions' (Rote vs Analysis Gap)

  // 1. National Cognitive Tiers Visual Cards (3-Step Hierarchy matching Page 19)
  const cardsWrap = document.createElement('div');
  cardsWrap.className = 'cognitive-cards-grid';
  cardsWrap.innerHTML = `
    <div class="cognitive-card-item">
      <div class="cog-header">
        <span class="cog-badge cog-badge--tier1">Tier 1</span>
        <span class="cog-drop-tag cog-drop-tag--baseline">Baseline Tier</span>
      </div>
      <div class="cog-title">Understanding</div>
      <div class="cog-score" style="color: #2563EB;">49.5%</div>
      <div class="cog-track">
        <div class="cog-fill" style="width: 49.5%; background-color: #2563EB;"></div>
      </div>
      <p class="cog-desc">Tested basic recall, syntax recognition, language keywords, and foundational definitions.</p>
    </div>

    <div class="cognitive-card-item">
      <div class="cog-header">
        <span class="cog-badge cog-badge--tier2">Tier 2</span>
        <span class="cog-drop-tag cog-drop-tag--drop">▼ -4.4% Drop</span>
      </div>
      <div class="cog-title">Application</div>
      <div class="cog-score" style="color: #059669;">45.1%</div>
      <div class="cog-track">
        <div class="cog-fill" style="width: 45.1%; background-color: #059669;"></div>
      </div>
      <p class="cog-desc">Applying known algorithmic rules and standard procedures to specific, constrained problems.</p>
    </div>

    <div class="cognitive-card-item">
      <div class="cog-header">
        <span class="cog-badge cog-badge--tier3">Tier 3</span>
        <span class="cog-drop-tag cog-drop-tag--drop">▼ -4.7% Cumulative Drop</span>
      </div>
      <div class="cog-title">Analysis</div>
      <div class="cog-score" style="color: #7C3AED;">44.8%</div>
      <div class="cog-track">
        <div class="cog-fill" style="width: 44.8%; background-color: #7C3AED;"></div>
      </div>
      <p class="cog-desc">Highest cognitive tier: complex architecture, multi-step debugging, and trade-off evaluation.</p>
    </div>
  `;
  container.appendChild(cardsWrap);

  // 2. Interactive View Switcher Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'chart-card__toolbar';
  toolbar.style.margin = 'var(--space-6) 0 var(--space-4) 0';
  toolbar.innerHTML = `
    <div>
      <div style="font-weight: 600; font-size: 14px; color: var(--color-heading);">
        Cognitive Decay & Institutional Gap Analysis
      </div>
      <div style="font-size: 12px; color: var(--color-muted); margin-top: 2px;">
        Explore national cognitive decay across Bloom's Taxonomy tiers or inspect universities with the highest drop-off
      </div>
    </div>
    <div class="toggle-group" id="cog-view-toggle">
      <button class="toggle-btn toggle-btn--active" data-view="tiers">National Decay Curve</button>
      <button class="toggle-btn" data-view="institutions">Rote Memorization Alert (10 HEIs)</button>
    </div>
  `;
  container.appendChild(toolbar);

  // 3. Chart SVG Container
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'cognitive-chart-area';
  container.appendChild(chartWrapper);

  // Dimensions
  const width = 960;
  const height = 440;
  const margin = { top: 35, right: 140, bottom: 45, left: 240 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select(chartWrapper)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'chart-svg');

  const g = svg
    .append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  /**
   * Renders View 1: National Decay Ladder Chart matching Page 19.
   */
  function renderTiersView() {
    g.selectAll('*').remove();

    const data = [
      { name: 'Tier 1: Understanding', score: 49.5, drop: 0, desc: 'Syntax & Recall', color: '#2563EB' },
      { name: 'Tier 2: Application', score: 45.1, drop: -4.4, desc: 'Rule Execution', color: '#059669' },
      { name: 'Tier 3: Analysis', score: 44.8, drop: -4.7, desc: 'System Architecture & Debugging', color: '#7C3AED' }
    ];

    const yScale = d3
      .scaleBand()
      .domain(data.map(d => d.name))
      .range([0, innerHeight])
      .padding(0.35);

    const xScale = d3
      .scaleLinear()
      .domain([0, 60])
      .range([0, innerWidth]);

    // Grid lines
    g.append('g')
      .call(d3.axisBottom(xScale).tickValues([10, 20, 30, 40, 50, 60]).tickSize(innerHeight).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#E2E8F0').attr('stroke-dasharray', '3,3'));

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).tickValues([0, 10, 20, 30, 40, 50, 60]).tickFormat(d => `${d}%`))
      .call(g => g.select('.domain').attr('stroke', '#CBD5E1'))
      .call(g => g.selectAll('.tick text').attr('font-family', 'var(--font-mono)').attr('fill', 'var(--color-muted)'));

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).tickSize(0).tickPadding(16))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text')
        .attr('font-family', 'var(--font-heading)')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('fill', 'var(--color-heading)')
      );

    // Background track
    g.selectAll('.track')
      .data(data)
      .join('rect')
      .attr('class', 'track')
      .attr('x', 0)
      .attr('y', d => yScale(d.name))
      .attr('width', xScale(60))
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('fill', '#F8FAFC');

    // Data bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.name))
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('fill', d => d.color)
      .attr('width', 0)
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr('width', d => xScale(d.score));

    // Data Labels & Drop Badges
    const labelGroups = g.selectAll('.label-g')
      .data(data)
      .join('g')
      .attr('class', 'label-g')
      .attr('transform', d => `translate(${xScale(d.score) + 12}, ${yScale(d.name) + yScale.bandwidth() / 2 + 5})`)
      .style('opacity', 0);

    labelGroups.append('text')
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '13px')
      .attr('font-weight', '700')
      .attr('fill', 'var(--color-heading)')
      .text(d => `${d.score}%`);

    labelGroups.append('text')
      .attr('x', 52)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', d => d.drop === 0 ? '#2563EB' : '#DC2626')
      .text(d => d.drop === 0 ? '(Baseline)' : `(${d.drop}% drop)`);

    labelGroups.transition().duration(600).delay(250).style('opacity', 1);

    // Interactivity
    g.selectAll('.bar')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        tooltip.show(`
          <div class="tooltip-title">${d.name}</div>
          <div class="tooltip-field">
            <span class="tooltip-label">Cognitive Focus</span>
            <span class="tooltip-value">${d.desc}</span>
          </div>
          <div class="tooltip-field">
            <span class="tooltip-label">Average Accuracy</span>
            <span class="tooltip-value" style="font-weight: 700; color: ${d.color};">${d.score}%</span>
          </div>
          <div class="tooltip-field">
            <span class="tooltip-label">Decay from Tier 1</span>
            <span class="tooltip-value" style="font-weight: 700; color: ${d.drop === 0 ? '#2563EB' : '#DC2626'};">
              ${d.drop === 0 ? 'Baseline (No Drop)' : `${d.drop}% drop from recall`}
            </span>
          </div>
        `, event);
      })
      .on('mousemove', event => tooltip.move(event))
      .on('mouseleave', () => tooltip.hide());
  }

  /**
   * Renders View 2: Institutional Rote vs Analysis Gap Dumbbell Chart matching Page 20.
   */
  function renderInstitutionsView() {
    g.selectAll('*').remove();

    // Sort institutions by cognitive gap (drop from understanding to analysis) descending
    const data = [...gapInstitutions].sort((a, b) => (b.understanding_accuracy - b.analysis_accuracy) - (a.understanding_accuracy - a.analysis_accuracy));

    const yScale = d3
      .scaleBand()
      .domain(data.map(d => d.institution))
      .range([0, innerHeight])
      .padding(0.38);

    const xScale = d3
      .scaleLinear()
      .domain([30, 65]) // matches 31-67 range in Page 20
      .range([0, innerWidth]);

    // Grid
    g.append('g')
      .call(d3.axisBottom(xScale).tickValues([30, 35, 40, 45, 50, 55, 60, 65]).tickSize(innerHeight).tickFormat(''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick line').attr('stroke', '#E2E8F0').attr('stroke-dasharray', '3,3'));

    // X-Axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale).tickValues([30, 35, 40, 45, 50, 55, 60, 65]).tickFormat(d => `${d}%`))
      .call(g => g.select('.domain').attr('stroke', '#CBD5E1'))
      .call(g => g.selectAll('.tick text').attr('font-family', 'var(--font-mono)').attr('fill', 'var(--color-muted)'));

    // Y-Axis
    g.append('g')
      .call(d3.axisLeft(yScale).tickSize(0).tickPadding(14))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text')
        .attr('font-family', 'var(--font-body)')
        .attr('font-size', '11.5px')
        .attr('font-weight', '600')
        .attr('fill', 'var(--color-heading)')
      );

    // Legend inside chart area matching Page 20
    const legendG = g.append('g').attr('transform', `translate(${innerWidth - 280}, -16)`);
    legendG.append('circle').attr('cx', 0).attr('cy', 0).attr('r', 5).attr('fill', '#10B981');
    legendG.append('text').attr('x', 9).attr('y', 4).attr('font-size', '10.5px').attr('font-family', 'var(--font-mono)').attr('fill', '#059669').attr('font-weight', '600').text('Understanding (Recall)');
    legendG.append('circle').attr('cx', 160).attr('cy', 0).attr('r', 5).attr('fill', '#EF4444');
    legendG.append('text').attr('x', 169).attr('y', 4).attr('font-size', '10.5px').attr('font-family', 'var(--font-mono)').attr('fill', '#DC2626').attr('font-weight', '600').text('Analysis (Reasoning)');

    // Connecting Drop-off Lines
    g.selectAll('.dumbbell-line')
      .data(data)
      .join('line')
      .attr('class', 'dumbbell-line')
      .attr('x1', d => xScale(d.analysis_accuracy))
      .attr('x2', d => xScale(d.understanding_accuracy))
      .attr('y1', d => yScale(d.institution) + yScale.bandwidth() / 2)
      .attr('y2', d => yScale(d.institution) + yScale.bandwidth() / 2)
      .attr('stroke', '#FECDD3')
      .attr('stroke-width', 5)
      .attr('stroke-linecap', 'round');

    // Analysis Circles (Lower score, Red)
    g.selectAll('.dot-analysis')
      .data(data)
      .join('circle')
      .attr('class', 'dot-analysis')
      .attr('cx', d => xScale(d.analysis_accuracy))
      .attr('cy', d => yScale(d.institution) + yScale.bandwidth() / 2)
      .attr('r', 6)
      .attr('fill', '#EF4444')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Understanding Circles (Higher score, Green)
    g.selectAll('.dot-understanding')
      .data(data)
      .join('circle')
      .attr('class', 'dot-understanding')
      .attr('cx', d => xScale(d.understanding_accuracy))
      .attr('cy', d => yScale(d.institution) + yScale.bandwidth() / 2)
      .attr('r', 6)
      .attr('fill', '#10B981')
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Drop Gap Label on the Right
    g.selectAll('.diff-label')
      .data(data)
      .join('text')
      .attr('class', 'diff-label')
      .attr('x', d => xScale(d.understanding_accuracy) + 12)
      .attr('y', d => yScale(d.institution) + yScale.bandwidth() / 2 + 4)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '10.5px')
      .attr('font-weight', '700')
      .attr('fill', '#DC2626')
      .text(d => `▼ -${(d.understanding_accuracy - d.analysis_accuracy).toFixed(1)}% drop`);

    // Interactive Tooltips
    const rowTargets = g.selectAll('.dumbbell-row-target')
      .data(data)
      .join('rect')
      .attr('class', 'dumbbell-row-target')
      .attr('x', -margin.left)
      .attr('y', d => yScale(d.institution))
      .attr('width', width)
      .attr('height', yScale.bandwidth())
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const gap = (d.understanding_accuracy - d.analysis_accuracy).toFixed(1);

        tooltip.show(`
          <div class="tooltip-title">🏫 ${d.institution}</div>
          <div class="tooltip-field">
            <span class="tooltip-label">Tier 1: Understanding (Recall)</span>
            <span class="tooltip-value" style="font-weight: 700; color: #059669;">${d.understanding_accuracy}%</span>
          </div>
          <div class="tooltip-field">
            <span class="tooltip-label">Tier 3: Analysis (Reasoning)</span>
            <span class="tooltip-value" style="font-weight: 700; color: #DC2626;">${d.analysis_accuracy}%</span>
          </div>
          <div class="tooltip-divider"></div>
          <div class="tooltip-field">
            <span class="tooltip-label">Cognitive Drop-Off Gap</span>
            <span class="tooltip-value" style="color: #DC2626; font-weight: 700;">-${gap}% accuracy collapse</span>
          </div>
          <div style="font-size: 11px; color: var(--color-muted); margin-top: 4px; line-height: 1.4;">
            Identified in HEC Report Page 20 as exhibiting steep rote-to-reasoning disparity.
          </div>
        `, event);
      })
      .on('mousemove', event => tooltip.move(event))
      .on('mouseleave', () => tooltip.hide());
  }

  // Bind View Toggle
  container.querySelectorAll('#cog-view-toggle .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#cog-view-toggle .toggle-btn').forEach(b => b.classList.remove('toggle-btn--active'));
      btn.classList.add('toggle-btn--active');
      currentView = btn.dataset.view;
      if (currentView === 'tiers') {
        renderTiersView();
      } else {
        renderInstitutionsView();
      }
    });
  });

  // Initial render with Tiers View
  renderTiersView();

  // 4. Executive Insight Callout below the chart matching HEC Page 20
  const callout = document.createElement('div');
  callout.className = 'insight-callout';
  callout.innerHTML = `
    <p>
      <strong>The Rote-to-Reasoning Breakdown (HEC Report Page 19–20):</strong> Across 33,038 candidates, performance exhibits steady decay 
      as questions transition from passive recall (<strong>Tier 1: 49.5%</strong>) to procedural application (<strong>Tier 2: 45.1%</strong>) 
      and multi-step analytical reasoning (<strong>Tier 3: 44.8%</strong>). The plateau between Application and Analysis reveals that 
      students default to guessing once questions deviate from rehearsed textbook patterns. 
      Furthermore, the HEC's <em>Rote Memorization Alert</em> highlights 10 universities—led by 
      <strong>KUST (-11.5% drop)</strong>, <strong>IM Sciences (-7.8%)</strong>, and <strong>LCWU (-7.7%)</strong>—where the collapse from 
      memorized syntax to analytical execution is most acute.
    </p>
  `;
  container.appendChild(callout);
}
