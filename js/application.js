/**
 * ═══════════════════════════════════════════════════════════════
 *  LAYER 3 — APPLICATION LAYER
 *  WorkflowOrchestrator : Controls the execution flow of leads
 *  SystemEvents         : Publishes events for UI/Experience layer
 * ═══════════════════════════════════════════════════════════════
 */

const ApplicationLayer = (() => {

  // Simple event emitter for the UI to listen to
  const _listeners = {};
  const SystemEvents = {
    on(event, callback) {
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push(callback);
    },
    emit(event, data) {
      if (_listeners[event]) {
        _listeners[event].forEach(cb => cb(data));
      }
    }
  };

  const WorkflowOrchestrator = {
    /**
     * Master workflow for processing a new lead ingestion
     */
    async processNewLead(leadInput) {
      SystemEvents.emit('workflow:start', { name: leadInput.name });
      IntegrationLayer.ActivityLogger.log(`Starting workflow for prospect: ${leadInput.name}`, 'process');

      // 1. DATA LAYER: Persist raw lead
      const lead = DataLayer.LeadRepository.create(leadInput);
      SystemEvents.emit('flow:step', { step: 1, label: 'Lead Created', data: lead });
      await this._think(400);

      // 2. DOMAIN LAYER: Intelligence / Scoring
      IntegrationLayer.ActivityLogger.log(`Executing Intelligence Engine...`, 'domain');
      const scoreResult = DomainLayer.ScoringEngine.score(lead);
      DataLayer.LeadRepository.update(lead.id, { 
        score: scoreResult.score,
        intelligenceData: scoreResult
      });
      SystemEvents.emit('flow:step', { step: 2, label: 'Scoring Complete', data: scoreResult });
      await this._think(600);

      // 3. DOMAIN LAYER: Priority Classification
      const priorityResult = DomainLayer.PriorityClassifier.classify(scoreResult.score);
      DataLayer.LeadRepository.update(lead.id, { priority: priorityResult.label });
      SystemEvents.emit('flow:step', { step: 3, label: 'Priority Assigned', data: priorityResult });
      await this._think(400);

      // 4. DOMAIN LAYER: Routing
      const routeResult = DomainLayer.RoutingEngine.route(lead.industry);
      DataLayer.LeadRepository.update(lead.id, { assignedTeam: routeResult.team });
      SystemEvents.emit('flow:step', { step: 4, label: 'Lead Routed', data: routeResult });
      await this._think(500);

      // 5. INTEGRATION LAYER: Notifications
      if (priorityResult.label === 'Hot') {
        const email = await IntegrationLayer.NotificationService.sendManagerAlert(lead);
        SystemEvents.emit('flow:step', { step: 5, label: 'Manager Alerted', data: email });
      } else {
        await IntegrationLayer.NotificationService.sendWelcomeEmail(lead);
        SystemEvents.emit('flow:step', { step: 5, label: 'Automation Triggered', data: 'Nurture sequence started' });
      }

      // 6. ANALYTICS: Refresh stats
      AnalyticsLayer.refresh();
      
      SystemEvents.emit('workflow:complete', lead);
      IntegrationLayer.ActivityLogger.log(`Workflow complete for ${lead.id}`, 'success');
      
      return lead;
    },

    _think(ms) {
      return new Promise(r => setTimeout(r, ms));
    }
  };

  return { WorkflowOrchestrator, SystemEvents };
})();
