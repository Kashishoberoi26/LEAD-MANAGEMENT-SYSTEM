/**
 * ═══════════════════════════════════════════════════════════════
 *  LAYER 7 — ANALYTICS LAYER
 *  AnalyticsEngine : Computes metrics and manages dynamic charts
 * ═══════════════════════════════════════════════════════════════
 */

const AnalyticsLayer = (() => {

  const AnalyticsEngine = {
    /**
     * Re-calculates all metrics from the data repository
     */
    refresh() {
      const metrics = DataLayer.LeadRepository.getMetrics();
      this._renderLeadDistribution(metrics);
      this._renderPipelineValue(metrics);
      this._renderConversionFunnel(metrics);
      this._renderSourcePerformance(metrics);
    },

    _renderLeadDistribution(m) {
      const container = document.getElementById('analytics-distribution');
      if (!container) return;

      const hotPct  = m.total ? Math.round((m.hot / m.total) * 100) : 0;
      const warmPct = m.total ? Math.round((m.warm / m.total) * 100) : 0;
      const coldPct = m.total ? Math.round((m.cold / m.total) * 100) : 0;

      container.innerHTML = `
        <div class="analytic-item">
          <div class="analytic-header"><span>🔥 Hot Leads</span><span>${hotPct}%</span></div>
          <div class="analytic-bar-bg"><div class="analytic-bar-fill hot" style="width: ${hotPct}%"></div></div>
        </div>
        <div class="analytic-item">
          <div class="analytic-header"><span>☀️ Warm Leads</span><span>${warmPct}%</span></div>
          <div class="analytic-bar-bg"><div class="analytic-bar-fill warm" style="width: ${warmPct}%"></div></div>
        </div>
        <div class="analytic-item">
          <div class="analytic-header"><span>❄️ Cold Leads</span><span>${coldPct}%</span></div>
          <div class="analytic-bar-bg"><div class="analytic-bar-fill cold" style="width: ${coldPct}%"></div></div>
        </div>
      `;
    },

    _renderPipelineValue(m) {
      const el = document.getElementById('pipeline-value');
      if (el) {
        el.innerText = `₹${m.value.toLocaleString('en-IN')}`;
      }
    },

    _renderConversionFunnel(m) {
      const container = document.getElementById('analytics-funnel');
      if (!container) return;

      // Simple visual representation of a funnel
      container.innerHTML = `
        <div class="funnel-step">
          <div class="funnel-bar" style="width: 100%"></div>
          <div class="funnel-label">Leads (100%)</div>
        </div>
        <div class="funnel-step">
          <div class="funnel-bar" style="width: ${m.total ? Math.round(((m.hot + m.warm) / m.total) * 100) : 0}%"></div>
          <div class="funnel-label">Qualified (${m.total ? Math.round(((m.hot + m.warm) / m.total) * 100) : 0}%)</div>
        </div>
        <div class="funnel-step">
          <div class="funnel-bar" style="width: ${m.total ? Math.round((m.converted / m.total) * 100) : 0}%"></div>
          <div class="funnel-label">Converted (${m.total ? Math.round((m.converted / m.total) * 100) : 0}%)</div>
        </div>
      `;
    },

    _renderSourcePerformance(m) {
      const container = document.getElementById('analytics-sources');
      if (!container) return;

      let html = '';
      for (const [source, count] of Object.entries(m.sourceMap)) {
        const pct = m.total ? Math.round((count / m.total) * 100) : 0;
        html += `
          <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.8rem;">
            <span>${source}</span>
            <span style="color:var(--accent)">${count} leads</span>
          </div>
        `;
      }
      container.innerHTML = html || '<div style="color:var(--muted)">No source data available.</div>';
    }
  };

  return { AnalyticsEngine };
})();
