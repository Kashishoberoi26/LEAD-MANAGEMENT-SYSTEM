/**
 * ═══════════════════════════════════════════════════════════════
 *  ENTRY POINT
 *  Main initialization script
 * ═══════════════════════════════════════════════════════════════
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 CRM Lead Intelligence System initializing...');

  // 1. Seed demo data (Layer 6)
  DataLayer.LeadRepository.seed();

  // 2. Initialize UI (Layer 2)
  ExperienceLayer.UIManager.init();

  // 3. Initial Analytics Refresh (Layer 7)
  AnalyticsLayer.AnalyticsEngine.refresh();

  console.log('✅ System Ready.');
});
