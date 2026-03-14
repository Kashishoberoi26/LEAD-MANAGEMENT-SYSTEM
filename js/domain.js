/**
 * ═══════════════════════════════════════════════════════════════
 *  LAYER 4 — DOMAIN LAYER
 *  ScoringEngine      : Budget-based lead scoring (0–100)
 *  PriorityClassifier : Score → Hot / Warm / Cold
 *  RoutingEngine      : Industry → Assigned Sales Team
 *  LifecycleManager   : Lead status transitions
 * ═══════════════════════════════════════════════════════════════
 */

const DomainLayer = (() => {

  // ── Scoring Rules (mirrors Salesforce Flow conditions) ────────
  const SCORING_RULES = [
    { label: 'High Value',      condition: b => b > 50000,              score: 90, budgetBand: '> ₹50,000' },
    { label: 'Medium Potential',condition: b => b >= 20000 && b <= 50000, score: 70, budgetBand: '₹20,000 – ₹50,000' },
    { label: 'Low Potential',   condition: b => b < 20000,              score: 40, budgetBand: '< ₹20,000' },
  ];

  // Company size bonus modifiers
  const SIZE_MODIFIER = {
    'Enterprise'    : 5,
    'Medium Business': 3,
    'Small Business': 1,
    'Startup'       : 0,
  };

  // Source bonus modifiers
  const SOURCE_MODIFIER = {
    'Referral'    : 4,
    'Event'       : 2,
    'Web'         : 1,
    'Social Media': 0,
    'Cold Call'   : -2,
  };

  const ScoringEngine = {
    /**
     * Score a lead based on budget, company size, and source.
     * Returns { score, rule, breakdown }
     */
    score(lead) {
      const budget   = Number(lead.budget) || 0;
      const sizeBonus= SIZE_MODIFIER[lead.companySize]  || 0;
      const srcBonus = SOURCE_MODIFIER[lead.leadSource]  || 0;

      const matched  = SCORING_RULES.find(r => r.condition(budget)) || SCORING_RULES[2];
      const raw      = matched.score + sizeBonus + srcBonus;
      const final    = Math.min(100, Math.max(0, raw));

      return {
        score    : final,
        baseScore: matched.score,
        ruleName : matched.label,
        budgetBand: matched.budgetBand,
        breakdown: [
          { label: 'Budget Rule',   value: matched.score },
          { label: 'Company Size',  value: sizeBonus },
          { label: 'Lead Source',   value: srcBonus },
        ]
      };
    }
  };

  // ── Priority Classification ───────────────────────────────────
  const PRIORITY_RULES = [
    { label: 'Hot',  emoji: '🔥', threshold: 80, color: '#ef4444', action: 'Immediate response — manager notified' },
    { label: 'Warm', emoji: '☀️', threshold: 50, color: '#f59e0b', action: 'Standard follow-up within 24 hours' },
    { label: 'Cold', emoji: '❄️', threshold: 0,  color: '#3b82f6', action: 'Nurture via email sequences' },
  ];

  const PriorityClassifier = {
    classify(score) {
      return PRIORITY_RULES.find(r => score >= r.threshold) || PRIORITY_RULES[2];
    },
    all() { return PRIORITY_RULES; }
  };

  // ── Routing Engine ────────────────────────────────────────────
  const ROUTING_TABLE = {
    'Technology': { team: 'Technology Sales Team', rep: 'Arjun Kapoor',    email: 'tech.sales@crm.io',        icon: '💻' },
    'Finance'   : { team: 'Finance Sales Team',    rep: 'Sneha Iyer',      email: 'finance.sales@crm.io',     icon: '🏦' },
    'Healthcare': { team: 'Healthcare Sales Team', rep: 'Dr. Ramesh Nair', email: 'healthcare.sales@crm.io',  icon: '🏥' },
    'Retail'    : { team: 'Retail Sales Team',     rep: 'Kavya Sharma',    email: 'retail.sales@crm.io',      icon: '🛒' },
    'Education' : { team: 'Education Sales Team',  rep: 'Aarav Mehta',     email: 'edu.sales@crm.io',         icon: '🎓' },
  };

  const RoutingEngine = {
    route(industry) {
      return ROUTING_TABLE[industry] || { team: 'General Sales Team', rep: 'Sales Team', email: 'sales@crm.io', icon: '👤' };
    },
    getTable() { return { ...ROUTING_TABLE }; }
  };

  // ── Lifecycle Manager ─────────────────────────────────────────
  const LIFECYCLE_STAGES = ['New', 'Contacted', 'Qualified', 'Converted', 'Disqualified'];

  const LifecycleManager = {
    getStages() { return [...LIFECYCLE_STAGES]; },

    getNextStatus(lead) {
      if (!lead.score) return 'New';
      if (lead.priority === 'Hot')  return 'Contacted';
      if (lead.priority === 'Warm') return 'Contacted';
      return 'New';
    },

    /**
     * Validate: prevent Qualified without Budget
     */
    canQualify(lead) {
      return lead.budget && lead.budget > 0;
    }
  };

  return { ScoringEngine, PriorityClassifier, RoutingEngine, LifecycleManager };
})();
