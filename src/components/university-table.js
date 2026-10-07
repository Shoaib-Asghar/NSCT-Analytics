/**
 * Interactive University Explorer Table Component
 * 
 * Executive-grade, zero-horizontal-overflow searchable and sortable data table
 * for all 155 universities in the NSCT dataset.
 */

import { formatComma } from '../utils/formatters.js';

/**
 * Initializes and renders the interactive university table.
 * @param {Array<Object>} rawData - Complete list of 155 university records.
 */
export function renderUniversityTable(rawData) {
  const container = document.getElementById('uni-table-container');
  const searchInput = document.getElementById('uni-search');
  if (!container || !rawData || !rawData.length) return;

  // Compute baseline national rank based on pass percentage (tie-break: avg score)
  const sortedByPass = [...rawData].sort((a, b) => b.pass_percentage - a.pass_percentage || b.avg_score - a.avg_score);
  const data = sortedByPass.map((item, index) => ({
    ...item,
    rank: index + 1
  }));

  let currentSortKey = 'rank';
  let isAscending = true;
  let searchQuery = '';
  let activeSector = 'all'; // 'all' | 'public' | 'private'
  let activeCohortFilter = 'all'; // 'all' | 'benchmark' (>=50 candidates)

  /**
   * Returns pass rate badge HTML with performance color classes.
   * @param {number} rate - Pass percentage.
   */
  function getPassBadge(rate) {
    const formatted = Number(rate).toFixed(1).replace(/\.0$/, '');
    let tierClass = 'badge--low';
    if (rate >= 70) tierClass = 'badge--high';
    else if (rate >= 50) tierClass = 'badge--mid';

    return `<span class="badge ${tierClass}">${formatted}%</span>`;
  }

  /**
   * Returns sector tag HTML.
   * @param {string} sector - 'public' or 'private'.
   */
  function getSectorBadge(sector) {
    if (sector === 'public') {
      return `<span class="sector-tag sector-tag--public">Public</span>`;
    }
    return `<span class="sector-tag sector-tag--private">Private</span>`;
  }

  /**
   * Returns rank display HTML with medal badges for top 3.
   * @param {number} rank - University rank.
   */
  function getRankBadge(rank) {
    if (rank === 1) return `<span class="rank-badge rank-badge--gold" title="Rank 1">1</span>`;
    if (rank === 2) return `<span class="rank-badge rank-badge--silver" title="Rank 2">2</span>`;
    if (rank === 3) return `<span class="rank-badge rank-badge--bronze" title="Rank 3">3</span>`;
    return `<span class="rank-num">#${rank}</span>`;
  }

  /**
   * Filters and sorts the data according to active state.
   */
  function getProcessedData() {
    let result = [...data];

    // Sector filter
    if (activeSector !== 'all') {
      result = result.filter(u => u.sector === activeSector);
    }

    // Cohort size filter
    if (activeCohortFilter === 'benchmark') {
      result = result.filter(u => u.total_appeared >= 50);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        (u.short_name && u.short_name.toLowerCase().includes(q)) ||
        (u.sector && u.sector.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[currentSortKey];
      let valB = b[currentSortKey];

      if (typeof valA === 'string') {
        return isAscending
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      return isAscending ? valA - valB : valB - valA;
    });

    return result;
  }

  /**
   * Renders the complete table HTML with guaranteed zero horizontal overflow.
   */
  function render() {
    const processed = getProcessedData();

    // 5 Columns designed for 100% width fit with fixed table-layout
    const columns = [
      { key: 'rank', label: '#', align: 'center', width: '50px' },
      { key: 'name', label: 'Institution', align: 'left', width: 'auto' },
      { key: 'total_appeared', label: 'Cohort', align: 'right', width: '110px' },
      { key: 'pass_percentage', label: 'Pass Rate', align: 'right', width: '150px' },
      { key: 'avg_score', label: 'Avg Score', align: 'right', width: '110px' },
    ];

    const headerHtml = columns.map(col => {
      const isSorted = currentSortKey === col.key;
      const arrow = isSorted ? (isAscending ? ' ▲' : ' ▼') : ' <span class="sort-arrow">↕</span>';
      const sortedClass = isSorted ? 'sorted' : '';
      const style = col.width !== 'auto' ? `style="width: ${col.width};"` : '';
      return `
        <th class="${sortedClass} ${col.align === 'right' ? 'num' : ''} ${col.align === 'center' ? 'center' : ''}" 
            data-sort="${col.key}" ${style}>
          ${col.label}${arrow}
        </th>
      `;
    }).join('');

    // Table Rows
    const rowsHtml = processed.length > 0
      ? processed.map(u => {
          let barClass = 'mini-bar-fill--low';
          if (u.pass_percentage >= 70) barClass = 'mini-bar-fill--high';
          else if (u.pass_percentage >= 50) barClass = 'mini-bar-fill--mid';

          return `
          <tr>
            <td class="col-rank">${getRankBadge(u.rank)}</td>
            <td class="col-name">
              <div class="uni-cell">
                <div class="uni-name-row">
                  <span class="uni-title">${u.name}</span>
                  ${getSectorBadge(u.sector)}
                </div>
                ${u.short_name && u.short_name !== u.name ? `<div class="uni-subtext">${u.short_name}</div>` : ''}
              </div>
            </td>
            <td class="col-stat">
              <div class="cohort-cell">
                <div class="cohort-total">${formatComma(u.total_appeared)}</div>
                <div class="cohort-split">${u.female} F • ${u.male} M</div>
              </div>
            </td>
            <td class="col-stat">
              <div class="pass-cell">
                <div class="pass-cell-header">
                  ${getPassBadge(u.pass_percentage)}
                  <span class="pass-count">${formatComma(u.students_passed)} passed</span>
                </div>
                <div class="mini-bar-track" title="${u.pass_percentage}% Pass Rate">
                  <div class="mini-bar-fill ${barClass}" style="width: ${Math.min(100, Math.max(2, u.pass_percentage))}%;"></div>
                </div>
              </div>
            </td>
            <td class="col-stat">
              <div class="score-cell">
                <div class="score-avg">${u.avg_score}</div>
                <div class="score-range">${u.min_score}–${u.max_score} marks</div>
              </div>
            </td>
          </tr>
        `;
      }).join('')
      : `
          <tr>
            <td colspan="${columns.length}" class="table-empty-state">
              <div class="empty-icon">🔍</div>
              <div class="empty-title">No institutions found</div>
              <div class="empty-desc">No universities match "<strong>${searchQuery}</strong>" with the selected filters.</div>
            </td>
          </tr>
        `;

    const publicCount = data.filter(d => d.sector === 'public').length;
    const privateCount = data.filter(d => d.sector === 'private').length;
    const benchmarkCount = data.filter(d => d.total_appeared >= 50).length;

    container.innerHTML = `
      <div class="table-meta-bar">
        <div class="table-meta-left">
          <span class="meta-count">Showing <strong>${processed.length}</strong> of <strong>${data.length}</strong> institutions</span>
        </div>
        <div class="table-filters-wrap">
          <div class="filter-pill-group">
            <span class="filter-label">Sector:</span>
            <button class="sector-pill ${activeSector === 'all' ? 'sector-pill--active' : ''}" data-sector="all">All (${data.length})</button>
            <button class="sector-pill ${activeSector === 'public' ? 'sector-pill--active' : ''}" data-sector="public">Public (${publicCount})</button>
            <button class="sector-pill ${activeSector === 'private' ? 'sector-pill--active' : ''}" data-sector="private">Private (${privateCount})</button>
          </div>
          <div class="filter-pill-group">
            <span class="filter-label">Cohort:</span>
            <button class="cohort-pill ${activeCohortFilter === 'all' ? 'sector-pill--active' : ''}" data-cohort="all">All Sizes</button>
            <button class="cohort-pill ${activeCohortFilter === 'benchmark' ? 'sector-pill--active' : ''}" data-cohort="benchmark" title="HEC official benchmark: ≥50 candidates appeared">≥ 50 (${benchmarkCount})</button>
          </div>
        </div>
      </div>
      <div class="table-scroll-container">
        <table class="data-table data-table--compact">
          <thead>
            <tr>${headerHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    // Rebind column click handlers
    container.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const sortKey = th.dataset.sort;
        if (currentSortKey === sortKey) {
          isAscending = !isAscending;
        } else {
          currentSortKey = sortKey;
          // Numeric columns default to descending; name and rank default to ascending
          isAscending = sortKey === 'rank' || sortKey === 'name';
        }
        render();
      });
    });

    // Rebind sector pill handlers
    container.querySelectorAll('.sector-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSector = btn.dataset.sector;
        render();
      });
    });

    // Rebind cohort pill handlers
    container.querySelectorAll('.cohort-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCohortFilter = btn.dataset.cohort;
        render();
      });
    });
  }

  // Bind live search
  if (searchInput) {
    searchInput.placeholder = 'Search university, city, or sector...';
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });
  }

  // Initial render
  render();
}

