import './style.css';

import * as d3 from 'd3';

import { renderKPICards } from './components/kpi-cards.js';
import { renderFunnelChart } from './charts/funnel.js';
import { renderGradeDonut } from './charts/donut.js';
import { renderHistogram } from './charts/histogram.js';
import { renderGenderChart } from './charts/gender.js';
import { renderGeographyChart } from './charts/geography.js';


function initSidebar() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.getElementById('sidebar');
  const closeBtn = document.getElementById('sidebar-close');

  // Open sidebar when hamburger is clicked
  hamburger?.addEventListener('click', () => {
    sidebar.classList.add('sidebar--open');
  });

  // Close sidebar when × is clicked
  closeBtn?.addEventListener('click', () => {
    sidebar.classList.remove('sidebar--open');
  });

  // Close sidebar when a nav link is clicked (mobile UX — navigate then close)
  const navLinks = document.querySelectorAll('.sidebar__link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      sidebar.classList.remove('sidebar--open');
    });
  });

  /*
   * ACTIVE LINK TRACKING with IntersectionObserver
   * ===============================================
   * We observe each <section>. When a section is at least 30% visible 
   * in the viewport, we mark its corresponding sidebar link as active.
   *
   * The threshold: 0.3 means "trigger when 30% of the section is visible".
   * rootMargin: '-10% 0px -60% 0px' means:
   *   - Shrink the detection area by 10% from top and 60% from bottom
   *   - This makes the "active" section the one near the top of the viewport
   */
  const sections = document.querySelectorAll('.section');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Remove active class from all links
          navLinks.forEach(link => link.classList.remove('sidebar__link--active'));

          // Add active class to the link matching this section's ID
          const activeLink = document.querySelector(
            `.sidebar__link[href="#${entry.target.id}"]`
          );
          activeLink?.classList.add('sidebar__link--active');
        }
      });
    },
    {
      rootMargin: '-10% 0px -60% 0px',
      threshold: 0.3,
    }
  );

  sections.forEach(section => observer.observe(section));
}


/*
 * ============================================================================
 * DATA LOADING
 * ============================================================================
 *
 * We load all JSON data files upfront using fetch() (wrapped by D3's d3.json).
 * 
 * d3.json() is a convenience wrapper around fetch() + response.json().
 * It returns a Promise, so we use async/await for clean sequential loading.
 *
 * Promise.all() loads all files IN PARALLEL — much faster than loading
 * one after another sequentially.
 * ============================================================================
 */

async function loadData() {
  try {
    /*
     * Promise.all takes an array of Promises and waits for ALL to resolve.
     * If any one fails, the whole thing fails (we catch that below).
     *
     * The data files are in /data/ relative to the project root.
     * Vite serves the project root as the web server root.
     */
    const [database, universities, students] = await Promise.all([
      d3.json('/data/nsct_database.json'),
      d3.json('/data/universities.json'),
      d3.json('/data/top_students.json'),
    ]);

    console.log('✅ Data loaded successfully');
    console.log(`   Database: ${Object.keys(database).length} datasets`);
    console.log(`   Universities: ${universities.length} records`);
    console.log(`   Students: ${students.length} records`);

    return { database, universities, students };

  } catch (error) {
    console.error('❌ Failed to load data:', error);
    /*
     * If data fails to load, we show an error in the UI rather than 
     * silently failing. Always surface errors to the user.
     */
    document.querySelector('.main').innerHTML = `
      <div style="text-align: center; padding: 4rem;">
        <h2 style="color: var(--color-fail);">Failed to load data</h2>
        <p style="color: var(--color-muted); margin-top: 1rem;">
          ${error.message}. Please ensure the data files are in the /data/ directory.
        </p>
      </div>
    `;
    return null;
  }
}


/*
 * ============================================================================
 * SECTIONS INITIALIZATION
 * ============================================================================
 * Individual components and charts are modularized in:
 * - src/components/ (UI components like KPI cards, data tables, modals)
 * - src/charts/     (D3 chart modules: funnel, donut, histogram, etc.)
 * ============================================================================
 */



/*
 * ============================================================================
 * APPLICATION INITIALIZATION
 * ============================================================================
 *
 * This is the main entry point. We:
 * 1. Initialize the sidebar (doesn't need data)
 * 2. Load all data files
 * 3. Render each section
 *
 * The init() function is async because data loading is asynchronous.
 * We call it immediately at the bottom of this file.
 * ============================================================================
 */

async function init() {
  // 1. Sidebar works without data — initialize immediately
  initSidebar();

  // 2. Load data
  const data = await loadData();
  if (!data) return; // Exit if data loading failed

  // 3. Render sections
  // Section 1: National Overview (Hero)
  renderKPICards(data.database);
  renderFunnelChart(data.database);
  renderGradeDonut(data.database);
  renderHistogram(data.database);
 
  // Section 2: Gender Analysis
  renderGenderChart(data.database);
 
  // Section 3: Urban vs Rural Divide
  renderGeographyChart(data.database);

  console.log('Application initialized');
}

// Run the app
init();
