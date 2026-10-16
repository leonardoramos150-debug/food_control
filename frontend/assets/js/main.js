/**
 * FoodControl 4.0 - ERP Front-end Interactions & UX Engine
 * Provedor de micro-interações funcionais, filtros dinâmicos e controle de interface.
 */

document.addEventListener('DOMContentLoaded', () => {
  initSearchShortcut();
  initTableFilters();
  initModals();
  initAlertActions();
  initBatchActions();
});

// Atalho global Ctrl+K para barra de busca
function initSearchShortcut() {
  const globalSearch = document.getElementById('globalSearchInput');
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (globalSearch) {
        globalSearch.focus();
        showToast('Busca global ativada. Digite para localizar produtos ou lotes.', 'info');
      }
    }
  });
}

// Filtro instantâneo para tabelas de dados
function initTableFilters() {
  const searchInput = document.getElementById('tableSearchInput') || document.getElementById('fPesquisar');
  const categorySelect = document.getElementById('tableCategoryFilter') || document.getElementById('fCategoria');
  const statusSelect = document.getElementById('tableStatusFilter') || document.getElementById('fStatus') || document.getElementById('fSituação');
  const table = document.querySelector('.data-table tbody');

  if (!table) return;

  function applyFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCat = categorySelect ? categorySelect.value.toLowerCase().trim() : 'todas';
    const selectedStat = statusSelect ? statusSelect.value.toLowerCase().trim() : 'todos';

    const rows = table.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
      const text = row.innerText.toLowerCase();
      const matchesQuery = !query || text.includes(query);
      const matchesCat = !selectedCat || selectedCat === 'todas' || text.includes(selectedCat);
      const matchesStat = !selectedStat || selectedStat === 'todos' || selectedStat === 'todas' || text.includes(selectedStat);

      if (matchesQuery && matchesCat && matchesStat) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    const counter = document.getElementById('tableRowCount');
    if (counter) {
      counter.innerText = `${visibleCount} registro(s) exibido(s)`;
    }
  }

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (categorySelect) categorySelect.addEventListener('change', applyFilters);
  if (statusSelect) statusSelect.addEventListener('change', applyFilters);
}

// Sistema de Modais Acessíveis
function initModals() {
  const triggers = document.querySelectorAll('[data-modal-target]');
  const closeButtons = document.querySelectorAll('[data-modal-close]');

  triggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-modal-target');
      const modal = document.getElementById(targetId);
      if (modal) {
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  });

  // Fechar ao clicar fora
  document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  });
}

// Ações inline para resolução de Alertas
function initAlertActions() {
  document.querySelectorAll('.js-resolve-alert').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const alertItem = btn.closest('.alert-item');
      if (alertItem) {
        alertItem.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        alertItem.style.opacity = '0';
        alertItem.style.transform = 'translateX(20px)';
        setTimeout(() => {
          alertItem.remove();
          showToast('Alerta marcado como resolvido no sistema.', 'success');
          updateOpenAlertsCount();
        }, 250);
      }
    });
  });
}

function updateOpenAlertsCount() {
  const alerts = document.querySelectorAll('.alert-item');
  const badge = document.querySelector('.notification-count');
  const panelBadge = document.querySelector('.panel-badge');
  if (badge) {
    badge.innerText = alerts.length;
    if (alerts.length === 0) badge.style.display = 'none';
  }
  if (panelBadge) {
    panelBadge.innerText = `${alerts.length} ativos`;
  }
}

// Ações em Lotes (Bloqueio / Liberação com feedback)
function initBatchActions() {
  document.querySelectorAll('.js-block-batch').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const row = btn.closest('tr');
      const batchCode = row ? row.querySelector('td')?.innerText.trim() : 'Lote';
      
      if (btn.classList.contains('is-blocked')) {
        btn.classList.remove('is-blocked');
        btn.innerText = 'Bloquear';
        btn.className = 'btn btn-secondary btn-sm js-block-batch';
        showToast(`${batchCode} desbloqueado e retornado para Disponível.`, 'info');
      } else {
        btn.classList.add('is-blocked');
        btn.innerText = 'Desbloquear';
        btn.className = 'btn btn-danger-outline btn-sm js-block-batch is-blocked';
        showToast(`${batchCode} foi bloqueado para expedição preventiva.`, 'warning');
      }
    });
  });
}

// Toast Feedback System
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  if (type === 'success') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  }

  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
