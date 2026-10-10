/**
 * Top Students Leaderboard Component
 * 
 * Renders an executive-grade, zero-horizontal-overflow searchable and sortable
 * leaderboard for the 150 highest-scoring IT graduates in Pakistan (NSCT 2026).
 */

import { formatComma } from '../utils/formatters.js';

/**
 * Initializes and renders the Top Students leaderboard.
 * @param {Array<Object>} students - Array of 150 top student records.
 * @param {Array<Object>} universities - Array of 155 university records for sector lookup.
 */
export function renderTopStudentsTable(students, universities) {
  const container = document.getElementById('students-table-container');
  const searchInput = document.getElementById('student-search');
  if (!container || !students || !students.length) return;

  // Build university name-to-sector lookup map
  const sectorMap = new Map();
  if (universities && universities.length) {
    universities.forEach(u => {
      sectorMap.set(u.name.toLowerCase().trim(), u.sector);
      if (u.short_name) {
        sectorMap.set(u.short_name.toLowerCase().trim(), u.sector);
      }
    });
  }

  /**
   * Resolves the sector ('public' or 'private') for a university.
   * @param {string} uniName - Name of the institution.
   */
  function resolveSector(uniName) {
    if (!uniName) return 'public';
    const clean = uniName.toLowerCase().trim();
    if (sectorMap.has(clean)) return sectorMap.get(clean);

    // Private sector keywords / institutions
    if (
      clean.includes('fast') ||
      clean.includes('abasyn') ||
      clean.includes('habib') ||
      clean.includes('jinnah') ||
      clean.includes('iqra') ||
      clean.includes('management and technology') ||
      clean.includes('ghulam ishaq') ||
      clean.includes('giki') ||
      clean.includes('gift') ||
      clean.includes('forman christian') ||
      clean.includes('superior') ||
      clean.includes('hitec') ||
      clean.includes('central punjab') ||
      clean.includes('the university of faisalabad')
    ) {
      return 'private';
    }

    return 'public';
  }

  // Pre-process student records with resolved sector
  const data = students.map(s => ({
    ...s,
    sector: resolveSector(s.university)
  }));

  let currentSortKey = 'rank';
  let isAscending = true;
  let searchQuery = '';
  let activeSector = 'all'; // 'all' | 'public' | 'private'
  let activeScoreBracket = 'all'; // 'all' | '90+' | '85-89' | '80-84' | '<80'

  /**
   * Returns medal badge HTML for top ranks.
   * @param {number} rank - Student rank.
   */
  function getRankBadge(rank) {
    if (rank === 1) return `<span class="rank-badge rank-badge--gold" title="National #1">1</span>`;
    if (rank <= 6) return `<span class="rank-badge rank-badge--silver" title="Rank ${rank}">2</span>`;
    if (rank <= 9) return `<span class="rank-badge rank-badge--bronze" title="Rank ${rank}">3</span>`;
    return `<span class="rank-num">#${rank}</span>`;
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
   * Filters and sorts the data according to active state.
   */
  function getProcessedData() {
    let result = [...data];

    // Sector filter
    if (activeSector !== 'all') {
      result = result.filter(s => s.sector === activeSector);
    }

    // Score bracket filter
    if (activeScoreBracket === '90+') {
      result = result.filter(s => s.marks >= 90);
    } else if (activeScoreBracket === '85-89') {
      result = result.filter(s => s.marks >= 85 && s.marks < 90);
    } else if (activeScoreBracket === '80-84') {
      result = result.filter(s => s.marks >= 80 && s.marks < 85);
    } else if (activeScoreBracket === '<80') {
      result = result.filter(s => s.marks < 80);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.university.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
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
      { key: 'rank', label: '#', align: 'center', width: '48px' },
      { key: 'name', label: 'Candidate', align: 'left', width: 'auto' },
      { key: 'university', label: 'Institution & Sector', align: 'left', width: '38%' },
      { key: 'city', label: 'City', align: 'center', width: '110px' },
      { key: 'marks', label: 'Score', align: 'right', width: '115px' },
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
      ? processed.map(s => {
          let scoreBarClass = 'mini-bar-fill--high';
          if (s.marks >= 90) scoreBarClass = 'mini-bar-fill--elite';

          return `
          <tr>
            <td class="col-rank">${getRankBadge(s.rank)}</td>
            <td class="col-name">
              <div class="student-cell">
                <div class="student-name">${s.name}</div>
                <div class="student-percentile">Top ${((150 - s.rank + 1) / 33038 * 100).toFixed(3)}% of test takers</div>
              </div>
            </td>
            <td class="col-uni">
              <div class="uni-cell">
                <div class="uni-name-row">
                  <span class="uni-title">${s.university}</span>
                  ${getSectorBadge(s.sector)}
                </div>
              </div>
            </td>
            <td class="col-city">
              <span class="city-tag">${s.city}</span>
            </td>
            <td class="col-stat">
              <div class="student-score-wrap">
                <div class="student-score-val">${s.marks}<span style="font-size: 10px; color: var(--color-muted); font-weight: 500;">/100</span></div>
                <div class="mini-bar-track" title="${s.marks}/100 Marks">
                  <div class="mini-bar-fill ${scoreBarClass}" style="width: ${s.marks}%;"></div>
                </div>
              </div>
            </td>
          </tr>
        `;
      }).join('')
      : `
          <tr>
            <td colspan="${columns.length}" class="table-empty-state">
              <div class="empty-icon">🔍</div>
              <div class="empty-title">No candidates found</div>
              <div class="empty-desc">No top performers match "<strong>${searchQuery}</strong>" with the selected filters.</div>
            </td>
          </tr>
        `;

    const publicCount = data.filter(d => d.sector === 'public').length;
    const privateCount = data.filter(d => d.sector === 'private').length;
    const count90Plus = data.filter(d => d.marks >= 90).length;

    container.innerHTML = `
      <div class="table-meta-bar">
        <div class="table-meta-left">
          <span class="meta-count">Showing <strong>${processed.length}</strong> of <strong>${data.length}</strong> top graduates (Top 0.45% nationally)</span>
        </div>
        <div class="table-filters-wrap">
          <div class="filter-pill-group">
            <span class="filter-label">Sector:</span>
            <button class="sector-pill ${activeSector === 'all' ? 'sector-pill--active' : ''}" data-sector="all">All (${data.length})</button>
            <button class="sector-pill ${activeSector === 'public' ? 'sector-pill--active' : ''}" data-sector="public">Public (${publicCount})</button>
            <button class="sector-pill ${activeSector === 'private' ? 'sector-pill--active' : ''}" data-sector="private">Private (${privateCount})</button>
          </div>
          <div class="filter-pill-group">
            <span class="filter-label">Marks:</span>
            <button class="score-pill ${activeScoreBracket === 'all' ? 'sector-pill--active' : ''}" data-score="all">All Scores</button>
            <button class="score-pill ${activeScoreBracket === '90+' ? 'sector-pill--active' : ''}" data-score="90+" title="Elite 90+ scorers">90+ (${count90Plus})</button>
            <button class="score-pill ${activeScoreBracket === '85-89' ? 'sector-pill--active' : ''}" data-score="85-89">85–89</button>
            <button class="score-pill ${activeScoreBracket === '80-84' ? 'sector-pill--active' : ''}" data-score="80-84">80–84</button>
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
          // Marks defaults to descending; names and rank default to ascending
          isAscending = sortKey === 'rank' || sortKey === 'name' || sortKey === 'university' || sortKey === 'city';
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

    // Rebind score bracket handlers
    container.querySelectorAll('.score-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        activeScoreBracket = btn.dataset.score;
        render();
      });
    });
  }

  // Bind live search
  if (searchInput) {
    searchInput.placeholder = 'Search candidate, university, or city...';
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });
  }

  // Initial render
  render();

  // Executive Insight Callout below the leaderboard matching HEC Page 15-17
  const callout = document.createElement('div');
  callout.className = 'insight-callout';
  callout.style.marginTop = 'var(--space-6)';
  callout.innerHTML = `
    <p>
      <strong>Decentralized Public Brilliance vs. Consolidated Private Networks (HEC Report Page 15–17):</strong>
      The top 150 leaderboard demonstrates that peak computational talent is not monopolized by legacy metropolitan institutes. 
      The national #1 performer, <strong>Zain-ul-Abden (97/100)</strong>, graduated from the <em>University of Sindh</em> in Jamshoro. 
      In the public sector, top scores are heavily decentralized across regional universities: 
      <strong>PAF-IAST (Haripur)</strong>, <strong>University of Malakand</strong>, and <strong>University of Swat</strong> produced 
      multiple students scoring 90–96 marks. Meanwhile, <em>Virtual University</em> acts as the nation's largest single incubator of elite public talent (8 students in the top 30). 
      Conversely, private sector brilliance is structurally consolidated: the <strong>FAST-NUCES</strong> campus network accounts for 19 of the top 30 private students, alongside top-performing cohorts from <em>Abasyn University</em> (95 and 93 marks) and <em>Habib University</em>.
    </p>
  `;
  container.appendChild(callout);
}
