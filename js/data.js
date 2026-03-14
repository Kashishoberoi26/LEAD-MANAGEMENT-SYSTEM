/**
 * ═══════════════════════════════════════════════════════════════
 *  LAYER 6 — DATA LAYER
 *  LeadRepository  : In-memory CRUD store for Lead objects
 *  PipelineStore   : Tracks pipeline value & conversion metrics
 * ═══════════════════════════════════════════════════════════════
 */

const DataLayer = (() => {

  // ── Internal storage ──────────────────────────────────────────
  let _leads = [];
  let _activityLog = [];
  let _idCounter = 1000;

  // ── Helpers ───────────────────────────────────────────────────
  function _uid() { return 'LEAD-' + (++_idCounter); }
  function _timestamp() {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // ── LeadRepository ────────────────────────────────────────────
  const LeadRepository = {
    create(input) {
      const lead = {
        id           : _uid(),
        createdAt    : _timestamp(),
        name         : input.name,
        company      : input.company,
        budget       : Number(input.budget),
        industry     : input.industry,
        companySize  : input.companySize,
        leadSource   : input.leadSource,
        // Scored fields — populated by Domain Layer
        score        : null,
        priority     : null,
        assignedTeam : null,
        status       : 'New',
      };
      _leads.unshift(lead);
      return lead;
    },

    update(id, patch) {
      const lead = _leads.find(l => l.id === id);
      if (lead) Object.assign(lead, patch);
      return lead;
    },

    getAll()              { return [..._leads]; },
    getById(id)           { return _leads.find(l => l.id === id) || null; },
    getByPriority(p)      { return _leads.filter(l => l.priority === p); },
    count()               { return _leads.length; },

    // Bulk metrics
    getMetrics() {
      const total     = _leads.length;
      const hot       = _leads.filter(l => l.priority === 'Hot').length;
      const warm      = _leads.filter(l => l.priority === 'Warm').length;
      const cold      = _leads.filter(l => l.priority === 'Cold').length;
      const converted = _leads.filter(l => l.status === 'Converted').length;
      const value     = _leads.reduce((s, l) => s + l.budget, 0);
      const avgScore  = total ? Math.round(_leads.reduce((s, l) => s + (l.score || 0), 0) / total) : 0;

      const sourceMap = {};
      _leads.forEach(l => {
        sourceMap[l.leadSource] = (sourceMap[l.leadSource] || 0) + 1;
      });

      const industryMap = {};
      _leads.forEach(l => {
        industryMap[l.industry] = (industryMap[l.industry] || 0) + 1;
      });

      return { total, hot, warm, cold, converted, value, avgScore, sourceMap, industryMap };
    },

    // Seed demo data so dashboard is non-empty on load
    seed() {
      const demos = [
        { name:'Priya Mehta',    company:'FinEdge Ltd',      budget:75000, industry:'Finance',    companySize:'Enterprise',       leadSource:'Referral' },
        { name:'Akash Verma',   company:'GreenTech',        budget:32000, industry:'Technology', companySize:'Medium Business',  leadSource:'Web' },
        { name:'Sara Khan',     company:'LifePlus Pvt',     budget:9000,  industry:'Healthcare', companySize:'Startup',          leadSource:'Social Media' },
        { name:'Ravi Sharma',   company:'Infra Corp',       budget:55000, industry:'Finance',    companySize:'Enterprise',       leadSource:'Event' },
        { name:'Deepa Nair',    company:'BioSync',          budget:18000, industry:'Healthcare', companySize:'Small Business',   leadSource:'Web' },
      ];
      demos.forEach(d => this.create(d));
    }
  };

  // ── ActivityLog ───────────────────────────────────────────────
  const ActivityLog = {
    push(event) {
      _activityLog.unshift({ time: _timestamp(), ...event });
      if (_activityLog.length > 50) _activityLog.pop();
    },
    getAll() { return [..._activityLog]; },
    getLast(n = 10) { return _activityLog.slice(0, n); }
  };

  return { LeadRepository, ActivityLog };
})();
