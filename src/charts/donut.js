/**
 * ============================================================================
 * GRADE DISTRIBUTION DONUT CHART (src/charts/donut.js)
 * ============================================================================
 *
 * Visualizes the 5-tier HEC Grading Scheme across 33,038 test takers:
 * Grade F (61.4%) | Grade D (21.3%) | Grade C (13.2%) | Grade B (3.6%) | Grade A (0.4%)
 *
 * D3.JS CONCEPTS TAUGHT IN THIS MODULE:
 * -------------------------------------
 * 1. THE PIE GENERATOR (d3.pie):
 *    - d3.pie() is NOT a drawing function; it is a DATA TRANSFORMER.
 *    - It takes an array of data objects, calculates angles proportional to each
 *      item's value, and outputs an array of arc descriptor objects with
 *      `startAngle` and `endAngle` (in radians: 0 to 2π).
 *    - .sort(null) preserves our exact logical grade sequence (F -> D -> C -> B -> A)
 *      rather than auto-sorting by descending size.
 *    - .padAngle(0.02) injects a crisp angular gap between slices.
 *
 * 2. THE ARC GENERATOR (d3.arc):
 *    - d3.arc() is a PATH GENERATOR.
 *    - It consumes the {startAngle, endAngle} produced by d3.pie() and outputs
 *      the SVG path string ("M... A... Z") that draws the slice.
 *    - .innerRadius() > 0 hollows out the circle, turning a pie into a modern DONUT chart.
 *    - .cornerRadius() rounds the geometric corners of each slice.
 *
 * 3. D3 TWEENING & ANIMATIONS (.attrTween):
 *    - To animate slices growing smoothly on load, we interpolate radians from
 *      0 to their final angle using d3.interpolate() inside a custom tween.
 *
 * 4. DYNAMIC CENTER METRICS & BIDIRECTIONAL LINKING:
 *    - Moving the mouse over a slice (or a legend row) updates the SVG center
 *      readout in real-time and scales the hovered slice.
 * ============================================================================
 */

import * as d3 from 'd3';
import { COLORS } from '../utils/colors.js';
import { formatComma } from '../utils/formatters.js';
import { createTooltip } from '../utils/tooltip.js';

/**
 * Renders the Grade Distribution Donut Chart and Interactive Legend.
 * @param {Object} database - The complete NSCT database JSON object.
 */
export function renderGradeDonut(database) {
  const container = document.getElementById('grade-chart');
  if (!container) return;

  // 1. Clear previous content
  container.innerHTML = '';

  // 2. Prepare structured grade data
  const rawGrades = database.hec_grade_distribution || [
    { grade: 'F', label: 'Fail', range: '< 50', percentage: 61.4, count: 20294, description: 'Failed to secure minimum passing baseline of 50 marks' },
    { grade: 'D', label: 'Pass', range: '50-57', percentage: 21.3, count: 7052, description: 'Cleared bare minimum, requires extensive foundational upskilling' },
    { grade: 'C', label: 'Acceptable', range: '58-67', percentage: 13.2, count: 4375, description: 'Demonstrated acceptable competency, suitable for entry-level integration' },
    { grade: 'B', label: 'Good', range: '68-79', percentage: 3.6, count: 1192, description: 'Highly capable, strong analytical and applied knowledge' },
    { grade: 'A', label: 'Excellent', range: '80+', percentage: 0.4, count: 125, description: 'The absolute elite, near-perfect scores across all cognitive tiers' },
  ];

  const gradeColors = {
    F: COLORS.grades.F || '#EF4444',
    D: COLORS.grades.D || '#F59E0B',
    C: COLORS.grades.C || '#3B82F6',
    B: COLORS.grades.B || '#8B5CF6',
    A: COLORS.grades.A || '#10B981',
  };

  const grades = rawGrades.map(g => ({
    ...g,
    color: gradeColors[g.grade] || '#64748B',
  }));

  const totalCandidates = d3.sum(grades, d => d.count);

  // 3. Create 2-column flex container: Donut Visual (Left) + Analytical Legend (Right)
  const wrapper = document.createElement('div');
  wrapper.className = 'donut-layout';
  container.appendChild(wrapper);

  const visualCol = document.createElement('div');
  visualCol.className = 'donut-chart__visual';
  wrapper.appendChild(visualCol);

  const legendCol = document.createElement('div');
  legendCol.className = 'donut-chart__details';
  wrapper.appendChild(legendCol);

  // 4. Setup SVG dimensions & Arc generators
  const size = 360;
  const outerRadius = size / 2 - 16;
  const innerRadius = outerRadius - 54; // 54px thick donut ring

  const tooltip = createTooltip(container);

  const svg = d3
    .select(visualCol)
    .append('svg')
    .attr('viewBox', `0 0 ${size} ${size}`)
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('class', 'donut-svg')
    .style('width', '100%')
    .style('max-width', `${size}px`)
    .style('height', 'auto')
    .style('display', 'block');

  // Center group for the donut
  const g = svg
    .append('g')
    .attr('transform', `translate(${size / 2}, ${size / 2})`);

  // D3 Pie Generator: calculates startAngle & endAngle
  const pie = d3
    .pie()
    .value(d => d.count)
    .sort(null) // Keep exact order (F -> D -> C -> B -> A)
    .padAngle(0.024); // Crisp gap between slices

  // D3 Arc Generator: standard resting slice
  const arc = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(4);

  // D3 Arc Generator: slightly expanded for hover state
  const arcHover = d3
    .arc()
    .innerRadius(innerRadius - 3)
    .outerRadius(outerRadius + 6)
    .cornerRadius(5);

  const pieData = pie(grades);

  // 5. Center Information Display (The Donut Hole readout)
  const centerGroup = g.append('g').attr('class', 'donut-center-text');

  const centerPercent = centerGroup
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('y', -12)
    .attr('font-family', 'var(--font-mono)')
    .attr('font-size', '34px')
    .attr('font-weight', '800')
    .attr('fill', COLORS.grades.F)
    .text('61.4%');

  const centerGrade = centerGroup
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('y', 14)
    .attr('font-family', 'var(--font-body)')
    .attr('font-size', '13px')
    .attr('font-weight', '700')
    .attr('fill', '#0F172A')
    .text('Grade F (Fail)');

  const centerCount = centerGroup
    .append('text')
    .attr('text-anchor', 'middle')
    .attr('y', 34)
    .attr('font-family', 'var(--font-mono)')
    .attr('font-size', '11px')
    .attr('font-weight', '500')
    .attr('fill', '#64748B')
    .text('20,294 candidates');

  // Helper to reset center text to default (Grade F national baseline)
  function resetCenter() {
    centerPercent.text('61.4%').attr('fill', COLORS.grades.F);
    centerGrade.text('Grade F (Fail)');
    centerCount.text('20,294 candidates (< 50 marks)');
  }

  // Helper to update center text for a specific grade
  function updateCenter(d) {
    centerPercent.text(`${d.percentage}%`).attr('fill', d.color);
    centerGrade.text(`Grade ${d.grade} (${d.label})`);
    centerCount.text(`${formatComma(d.count)} candidates (${d.range} marks)`);
  }

  // 6. Draw Donut Slices with Smooth Arc Tween Animation
  const slices = g
    .selectAll('.donut-slice')
    .data(pieData)
    .join('path')
    .attr('class', 'donut-slice')
    .attr('data-grade', d => d.data.grade)
    .attr('fill', d => d.data.color)
    .style('cursor', 'pointer')
    .style('transition', 'filter 150ms ease');

  // Animate slices drawing from 0 to full angle
  slices
    .transition()
    .duration(900)
    .ease(d3.easeCubicOut)
    .attrTween('d', function (d) {
      // Interpolate angles from 0 to target
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return function (t) {
        return arc(interpolate(t));
      };
    });

  // 7. Render Analytical Legend & Breakdown Table on the Right
  legendCol.innerHTML = `
    <div class="grade-table-header">
      <span class="col-grade">GRADE</span>
      <span class="col-range">RANGE</span>
      <span class="col-count">CANDIDATES</span>
      <span class="col-share">SHARE</span>
    </div>
    <div class="grade-table-body">
      ${grades
        .map(
          g => `
        <div class="grade-row" data-grade="${g.grade}">
          <div class="col-grade">
            <span class="grade-badge" style="background-color: ${g.color};">${g.grade}</span>
            <span class="grade-label-text">${g.label}</span>
          </div>
          <div class="col-range">${g.range}</div>
          <div class="col-count">${formatComma(g.count)}</div>
          <div class="col-share">
            <div class="share-bar-wrap">
              <div class="share-bar-fill" style="width: ${g.percentage}%; background-color: ${g.color};"></div>
            </div>
            <span class="share-pct">${g.percentage}%</span>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
    <div class="grade-summary-stat">
      <div class="stat-bubble">
        <span class="stat-num" style="color: #EF4444;">82.7%</span>
        <span class="stat-desc">Candidates scored below 58% (Grades D & F combined)</span>
      </div>
      <div class="stat-bubble">
        <span class="stat-num" style="color: #10B981;">0.4%</span>
        <span class="stat-desc">Elite Grade A achievers (125 students nationwide)</span>
      </div>
    </div>
  `;

  // 8. Bidirectional Interactivity (Slice <-> Legend Row)
  function highlightGrade(gradeKey, event = null) {
    const targetSlice = slices.filter(d => d.data.grade === gradeKey);
    const targetData = grades.find(g => g.grade === gradeKey);

    if (targetSlice.node()) {
      targetSlice
        .transition()
        .duration(180)
        .attr('d', arcHover)
        .style('filter', 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))');
    }

    // Highlight row in legend
    legendCol.querySelectorAll('.grade-row').forEach(row => {
      if (row.dataset.grade === gradeKey) {
        row.classList.add('grade-row--active');
      } else {
        row.classList.remove('grade-row--active');
      }
    });

    if (targetData) {
      updateCenter(targetData);

      if (event) {
        const tooltipHtml = `
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${targetData.color};"></span>
            <strong style="color: #FFFFFF; font-size: 13px;">Grade ${targetData.grade} — ${targetData.label}</strong>
          </div>
          <div style="display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 12px;">
            <span style="color: #94A3B8;">Marks Range:</span>
            <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${targetData.range}</strong>
            <span style="color: #94A3B8;">Candidates:</span>
            <strong style="font-family: var(--font-mono); color: #FFFFFF; text-align: right;">${formatComma(targetData.count)}</strong>
            <span style="color: #94A3B8;">National Share:</span>
            <strong style="font-family: var(--font-mono); color: ${targetData.color}; text-align: right;">${targetData.percentage}%</strong>
          </div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 11px; color: #CBD5E1; max-width: 220px; line-height: 1.4;">
            ${targetData.description}
          </div>
        `;
        tooltip.show(tooltipHtml, event);
      }
    }
  }

  function unhighlightGrade(gradeKey) {
    const targetSlice = slices.filter(d => d.data.grade === gradeKey);
    if (targetSlice.node()) {
      targetSlice
        .transition()
        .duration(180)
        .attr('d', arc)
        .style('filter', 'none');
    }

    legendCol.querySelectorAll('.grade-row').forEach(row => {
      row.classList.remove('grade-row--active');
    });

    resetCenter();
    tooltip.hide();
  }

  // Bind slice events
  slices
    .on('mouseenter', function (event, d) {
      highlightGrade(d.data.grade, event);
    })
    .on('mousemove', function (event) {
      tooltip.show(null, event);
    })
    .on('mouseleave', function (_, d) {
      unhighlightGrade(d.data.grade);
    });

  // Bind legend row events
  legendCol.querySelectorAll('.grade-row').forEach(row => {
    const gradeKey = row.dataset.grade;
    row.addEventListener('mouseenter', e => highlightGrade(gradeKey, e));
    row.addEventListener('mouseleave', () => unhighlightGrade(gradeKey));
  });

  // 9. Append Contextual Insight Callout
  const gradeCard = document.getElementById('grade-card');
  if (gradeCard && !gradeCard.querySelector('.insight-callout')) {
    const callout = document.createElement('div');
    callout.className = 'insight-callout';
    callout.innerHTML = `
      <p>
        <strong>82.7% Foundational Upskilling Deficit:</strong> 61.4% of all tested graduates failed to achieve the 
        passing threshold of 50 marks (Grade F), and another 21.3% cleared only the bare minimum (Grade D, 50-57 marks). 
        Nationwide, only <strong>125 students (0.4%)</strong> demonstrated Grade A mastery (80+ marks) — reflecting an acute shortage 
        of senior-ready technical talent despite large graduate volumes.
      </p>
    `;
    gradeCard.appendChild(callout);
  }
}
