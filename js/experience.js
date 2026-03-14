/**
 * ═══════════════════════════════════════════════════════════════
 *  LAYER 2 — EXPERIENCE LAYER
 *  UIManager       : DOM manipulation and event binding
 *  FlowVisualizer  : Animation control for the workflow steps
 *  StateManagement : Client-side reactive state
 * ═══════════════════════════════════════════════════════════════
 */

const ExperienceLayer = (() => {

  const UIManager = {
    init() {
      this._bindEvents();
      this._subscribeToWorkflow();
      this.refreshLeadTable();
      this.refreshActivityLog();
    },

    _bindEvents() {
      const form = document.getElementById('lead-submission-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          const leadInput = Object.fromEntries(formData.entries());
          
          form.reset();
          this.showToast('Workflow Started...', 'info');
          
          try {
            await ApplicationLayer.WorkflowOrchestrator.processNewLead(leadInput);
          } catch (err) {
            this.showToast('Workflow Error: ' + err.message, 'error');
          }
        });
      }
    },

    _subscribeToWorkflow() {
      ApplicationLayer.SystemEvents.on('flow:step', (data) => {
        FlowVisualizer.highlightStep(data.step, data.label);
        this.refreshActivityLog();
        if (data.step === 5 && data.data.subject) {
          this.showEmailModal(data.data);
        }
      });

      ApplicationLayer.SystemEvents.on('workflow:complete', (lead) => {
        this.showToast(`Lead ${lead.id} Processed Successfully!`, 'success');
        this.refreshLeadTable();
        this.refreshActivityLog();
        AnalyticsLayer.AnalyticsEngine.refresh();
      });
    },

    refreshLeadTable() {
      const tbody = document.getElementById('leads-table-body');
      if (!tbody) return;

      const leads = DataLayer.LeadRepository.getAll();
      tbody.innerHTML = leads.map(l => `
        <tr>
          <td><div style="font-weight:600">${l.name}</div><div style="font-size:0.75rem;color:var(--muted)">${l.company}</div></td>
          <td><span class="pill pill-score">${l.score || '...'}</span></td>
          <td><span class="pill pill-${(l.priority || 'cold').toLowerCase()}">${l.priority || '-'}</span></td>
          <td><div style="font-size:0.85rem">${l.assignedTeam || '-'}</div></td>
          <td><span class="tag">${l.status}</span></td>
          <td style="font-size:0.75rem;color:var(--muted)">${l.createdAt}</td>
        </tr>
      `).join('');
    },

    refreshActivityLog() {
      const container = document.getElementById('activity-feed');
      if (!container) return;

      const logs = DataLayer.ActivityLog.getLast(15);
      container.innerHTML = logs.map(log => `
        <div class="log-entry log-${log.type}">
          <span class="log-time">${log.time}</span>
          <span class="log-msg">${log.message}</span>
        </div>
      `).join('');
      container.scrollTop = 0; // Keep newest at top
    },

    showToast(msg, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.innerText = msg;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    },

    showEmailModal(email) {
      const modal = document.getElementById('email-modal');
      if (!modal) return;
      
      document.getElementById('modal-to').innerText = email.to;
      document.getElementById('modal-subject').innerText = email.subject;
      document.getElementById('modal-body').innerText = email.body;
      
      modal.classList.add('show');
    },

    closeModal() {
      const modal = document.getElementById('email-modal');
      if (modal) modal.classList.remove('show');
    }
  };

  const FlowVisualizer = {
    highlightStep(stepNum, label) {
      // Clear all flow steps
      document.querySelectorAll('.flow-step').forEach(s => s.classList.remove('active', 'completed'));
      
      // Mark previous as completed
      for(let i=1; i < stepNum; i++) {
        const s = document.querySelector(`.flow-step[data-step="${i}"]`);
        if (s) s.classList.add('completed');
      }

      // Mark current as active
      const current = document.querySelector(`.flow-step[data-step="${stepNum}"]`);
      if (current) {
        current.classList.add('active');
        current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };

  return { UIManager, FlowVisualizer };
})();
