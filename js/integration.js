/**
 * ═══════════════════════════════════════════════════════════════
 *  LAYER 5 — INTEGRATION LAYER
 *  NotificationService : External communication (Email/API)
 *  ActivityLogger      : Bridges system events to Data Layer logs
 *  APISimulator        : Mock async network calls
 * ═══════════════════════════════════════════════════════════════
 */

const IntegrationLayer = (() => {

  const ActivityLogger = {
    log(message, type = 'info', metadata = {}) {
      DataLayer.ActivityLog.push({ message, type, ...metadata });
      console.log(`[CRM LOG] [${type.toUpperCase()}] ${message}`);
    }
  };

  const NotificationService = {
    /**
     * Simulates sending a manager alert for high-value leads
     */
    async sendManagerAlert(lead) {
      ActivityLogger.log(`Sending Manager Alert for ${lead.name}`, 'integration');
      
      // Simulate network latency
      await APISimulator.post('/notify/manager', { leadId: lead.id, priority: lead.priority });
      
      const emailContent = {
        to: 'sales.manager@crm.io',
        subject: `🔥 High-Value Lead: ${lead.name} (${lead.company})`,
        body: `A Hot lead with a budget of ${lead.budget} has been detected. Assigned to ${lead.assignedTeam}.`
      };

      // In this simulation, we'll store this to show in a UI modal later
      ActivityLogger.log(`Email dispatched to sales manager`, 'success');
      return emailContent;
    },

    async sendWelcomeEmail(lead) {
      ActivityLogger.log(`Sending Welcome Email to ${lead.name}`, 'integration');
      await APISimulator.post('/mail/welcome', { email: lead.email });
      ActivityLogger.log(`Welcome email sent to prospect`, 'success');
    }
  };

  const APISimulator = {
    async post(endpoint, data) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ status: 200, data: { success: true, timestamp: Date.now() } });
        }, 600);
      });
    }
  };

  return { NotificationService, ActivityLogger, APISimulator };
})();
