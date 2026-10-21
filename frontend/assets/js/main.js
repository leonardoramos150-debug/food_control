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
  initFefoTimeline();
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

// ========================================================
// Linha do Tempo FEFO Linear com Clustering & Popovers
// ========================================================
function initFefoTimeline() {
  const timelineViewport = document.querySelector('.fefo-timeline-visual');
  if (!timelineViewport) return;

  const FEFO_LOTS = {
    'LOT-2026-021': {
      code: 'LOT-2026-021',
      product: 'Lasanha Bolonhesa',
      chamber: 'camara-a',
      chamberLabel: 'Câmara A • Congelados (-18°C)',
      location: 'Pallet F-12',
      days: 5,
      date: '05/10/2026',
      qty: '320 un',
      price: 'R$ 12,50',
      riskValue: 'R$ 4.000,00',
      status: 'critico',
      statusLabel: 'Crítico (≤ 7 dias)',
      primaryCta: 'Alocar no Pedido #102',
      secondaryCta: 'Despachar com Desconto'
    },
    'LOT-2026-024': {
      code: 'LOT-2026-024',
      product: 'Lasanha Bolonhesa',
      chamber: 'camara-a',
      chamberLabel: 'Câmara A • Congelados (-18°C)',
      location: 'Pallet F-15',
      days: 12,
      date: '12/10/2026',
      qty: '100 un',
      price: 'R$ 12,50',
      riskValue: 'R$ 1.250,00',
      status: 'atencao',
      statusLabel: 'Atenção (12 dias)',
      primaryCta: 'Alocar no Pedido #104',
      secondaryCta: 'Mover de Pallet'
    },
    'LOT-2026-036': {
      code: 'LOT-2026-036',
      product: 'Strogonoff de Frango',
      chamber: 'camara-b',
      chamberLabel: 'Câmara B • Resfriados (+4°C)',
      location: 'Pallet R-04',
      days: 25,
      date: '25/10/2026',
      qty: '40 un',
      price: 'R$ 15,00',
      riskValue: 'R$ 600,00',
      status: 'atencao',
      statusLabel: 'Atenção (25 dias)',
      primaryCta: 'Alocar no Pedido #105',
      secondaryCta: 'Emitir OP Complementar'
    },
    'LOT-2026-041': {
      code: 'LOT-2026-041',
      product: 'Pastel de Carne',
      chamber: 'camara-b',
      chamberLabel: 'Câmara B • Resfriados (+4°C)',
      location: 'Pallet R-09',
      days: 50,
      date: '19/11/2026',
      qty: '500 un',
      price: 'R$ 3,25',
      riskValue: 'R$ 1.625,00',
      status: 'normal',
      statusLabel: 'Regular (50 dias)',
      primaryCta: 'Vincular a Pedido',
      secondaryCta: 'Inspecionar'
    },
    'LOT-2026-042': {
      code: 'LOT-2026-042',
      product: 'Coxinha de Frango',
      chamber: 'camara-c',
      chamberLabel: 'Câmara C • Secos & Salgados',
      location: 'Pallet S-02',
      days: 82,
      date: '21/12/2026',
      qty: '900 un',
      price: 'R$ 3,00',
      riskValue: 'R$ 2.700,00',
      status: 'normal',
      statusLabel: 'Regular (82 dias)',
      primaryCta: 'Reinspecionar',
      secondaryCta: 'Mover de Pallet'
    },
    'LOT-2026-043': {
      code: 'LOT-2026-043',
      product: 'Lasanha Bolonhesa',
      chamber: 'camara-a',
      chamberLabel: 'Câmara A • Congelados (-18°C)',
      location: 'Pallet F-18',
      days: 85,
      date: '24/12/2026',
      qty: '580 un',
      price: 'R$ 12,50',
      riskValue: 'R$ 7.250,00',
      status: 'normal',
      statusLabel: 'Regular (85 dias)',
      primaryCta: 'Reservar para Distribuição',
      secondaryCta: 'Ver Detalhes'
    },
    'LOT-2026-039': {
      code: 'LOT-2026-039',
      product: 'Pizza Calabresa',
      chamber: 'camara-a',
      chamberLabel: 'Câmara A • Congelados (-18°C)',
      location: 'Pallet F-08',
      days: 105,
      date: '13/01/2027',
      qty: '100 un',
      price: 'R$ 18,00',
      riskValue: 'R$ 1.800,00',
      status: 'normal',
      statusLabel: 'Regular (> 90 dias)',
      primaryCta: 'Reservar para Distribuição',
      secondaryCta: 'Ver Detalhes'
    }
  };

  const FEFO_CLUSTERS = {
    'warning': {
      title: 'Lotes em Atenção • 8 a 30 dias',
      subtitle: '2 lotes agrupados · Total R$ 1.850,00',
      lots: ['LOT-2026-024', 'LOT-2026-036']
    },
    'regular': {
      title: 'Lotes Regulares • Acima de 30 dias',
      subtitle: '4 lotes com shelf-life seguro · Total R$ 13.375,00',
      lots: ['LOT-2026-041', 'LOT-2026-042', 'LOT-2026-043', 'LOT-2026-039']
    }
  };

  const popover = document.getElementById('fefoClusterPopover');
  const popoverTitle = document.getElementById('popoverTitle');
  const popoverSubtitle = document.getElementById('popoverSubtitle');
  const popoverBody = document.getElementById('popoverBody');
  const popoverCloseBtn = document.getElementById('popoverCloseBtn');

  const filterButtons = document.querySelectorAll('.fefo-filter-btn');
  const lotNodes = document.querySelectorAll('.timeline-lot-node');
  const clusterNodes = document.querySelectorAll('.timeline-cluster-node');

  let popoverCloseTimeout = null;

  function closePopover() {
    if (!popover) return;
    popover.classList.remove('is-open');
    clusterNodes.forEach(c => c.classList.remove('is-active'));
    lotNodes.forEach(n => n.classList.remove('is-selected'));
  }

  function scheduleClosePopover() {
    clearTimeout(popoverCloseTimeout);
    popoverCloseTimeout = setTimeout(() => {
      closePopover();
    }, 350);
  }

  function cancelClosePopover() {
    clearTimeout(popoverCloseTimeout);
  }

  function renderLotsInPopover(lotsArray) {
    if (!popoverBody) return;
    popoverBody.innerHTML = lotsArray.map(lot => {
      if (!lot) return '';
      const isCrit = lot.status === 'critico';
      const isWarn = lot.status === 'atencao';
      const badgeBg = isCrit ? '#fee2e2' : isWarn ? '#fef3c7' : '#e0f2fe';
      const badgeColor = isCrit ? '#991b1b' : isWarn ? '#92400e' : '#0369a1';

      return `
        <div class="popover-lot-item" data-lot="${lot.code}">
          <div class="popover-lot-header">
            <span class="popover-lot-code">${lot.code}</span>
            <span style="font-size:10px; font-weight:800; padding:2px 7px; border-radius:999px; background:${badgeBg}; color:${badgeColor}">
              ${lot.days} dias (${lot.date})
            </span>
          </div>
          <div class="popover-lot-prod">${lot.product}</div>
          <div class="popover-lot-metrics">
            <span>Saldo: <b>${lot.qty}</b> (${lot.location})</span>
            <span>Risco: <b style="color:${isCrit ? '#dc2626' : isWarn ? '#d97706' : '#0284c7'}">${lot.riskValue}</b></span>
          </div>
          <div class="popover-lot-actions">
            <button type="button" class="popover-cta-btn popover-cta-primary js-popover-cta" data-action="allocate" data-lot="${lot.code}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              ${lot.primaryCta}
            </button>
            <button type="button" class="popover-cta-btn popover-cta-secondary js-popover-cta" data-action="secondary" data-lot="${lot.code}">
              ${lot.secondaryCta}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Eventos nos CTAs do popover
    popoverBody.querySelectorAll('.js-popover-cta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = btn.getAttribute('data-lot');
        const action = btn.getAttribute('data-action');
        const lot = FEFO_LOTS[code];
        if (!lot) return;

        if (action === 'allocate') {
          btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Alocado`;
          btn.style.background = '#059669';
          showToast(`Sucesso: ${lot.product} (${lot.code}) alocado com prioridade FEFO.`, 'success');
        } else {
          showToast(`Operação registrada para o lote ${lot.code} (${lot.location}).`, 'info');
        }
      });
    });
  }

  function positionPopover(triggerEl) {
    if (!popover || !triggerEl) return;
    const viewportRect = timelineViewport.getBoundingClientRect();
    const triggerRect = triggerEl.getBoundingClientRect();

    let leftPos = triggerRect.left - viewportRect.left - 40;
    const maxLeft = viewportRect.width - 400;
    leftPos = Math.max(16, Math.min(leftPos, maxLeft));

    let topPos = triggerRect.top - viewportRect.top - 12;
    if (topPos < 10) topPos = 10;

    popover.style.left = `${leftPos}px`;
    popover.style.top = `${topPos}px`;
    popover.classList.add('is-open');
  }

  function openLotPopover(lotId, triggerEl) {
    const lot = FEFO_LOTS[lotId];
    if (!lot || !popover) return;

    cancelClosePopover();
    lotNodes.forEach(n => n.classList.remove('is-selected'));
    clusterNodes.forEach(c => c.classList.remove('is-active'));
    triggerEl.classList.add('is-selected');

    if (popoverTitle) popoverTitle.innerText = `Lote Crítico • ${lot.code}`;
    if (popoverSubtitle) popoverSubtitle.innerText = `Vencimento em ${lot.days} dias · ${lot.chamberLabel.split('•')[0].trim()}`;

    renderLotsInPopover([lot]);
    positionPopover(triggerEl);
  }

  function openClusterPopover(clusterKey, triggerEl) {
    const cluster = FEFO_CLUSTERS[clusterKey];
    if (!cluster || !popover) return;

    cancelClosePopover();
    lotNodes.forEach(n => n.classList.remove('is-selected'));
    clusterNodes.forEach(c => c.classList.remove('is-active'));
    triggerEl.classList.add('is-active');

    if (popoverTitle) popoverTitle.innerText = cluster.title;
    if (popoverSubtitle) popoverSubtitle.innerText = cluster.subtitle;

    const lots = cluster.lots.map(id => FEFO_LOTS[id]).filter(Boolean);
    renderLotsInPopover(lots);
    positionPopover(triggerEl);
  }

  // Interação nos Clusters (Clique e Hover com auto-dismiss)
  clusterNodes.forEach(chip => {
    const clusterKey = chip.getAttribute('data-cluster');

    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      openClusterPopover(clusterKey, chip);
    });

    chip.addEventListener('mouseenter', () => {
      cancelClosePopover();
      openClusterPopover(clusterKey, chip);
    });

    chip.addEventListener('mouseleave', () => {
      scheduleClosePopover();
    });
  });

  // Interação no Node Crítico Individual
  lotNodes.forEach(node => {
    const lotId = node.getAttribute('data-lot');

    node.addEventListener('click', (e) => {
      e.stopPropagation();
      openLotPopover(lotId, node);
    });

    node.addEventListener('mouseenter', () => {
      cancelClosePopover();
      openLotPopover(lotId, node);
    });

    node.addEventListener('mouseleave', () => {
      scheduleClosePopover();
    });
  });

  // Eventos no próprio Popover (manter aberto no hover, fechar ao sair)
  if (popover) {
    popover.addEventListener('mouseenter', () => {
      cancelClosePopover();
    });

    popover.addEventListener('mouseleave', () => {
      scheduleClosePopover();
    });
  }

  if (popoverCloseBtn) {
    popoverCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closePopover();
    });
  }

  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (popover && popover.classList.contains('is-open')) {
      if (!popover.contains(e.target) && !e.target.closest('.timeline-cluster-node') && !e.target.closest('.timeline-lot-node')) {
        closePopover();
      }
    }
  });

  // Filtros de Câmaras Frias
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      closePopover();

      // Filtrar node individual
      lotNodes.forEach(node => {
        const chamber = node.getAttribute('data-chamber');
        if (filter === 'todos' || chamber === filter) {
          node.style.opacity = '1';
          node.style.pointerEvents = 'auto';
        } else {
          node.style.opacity = '0.15';
          node.style.pointerEvents = 'none';
        }
      });

      // Filtrar clusters
      clusterNodes.forEach(chip => {
        const clusterKey = chip.getAttribute('data-cluster');
        const cluster = FEFO_CLUSTERS[clusterKey];
        if (!cluster) return;

        const hasMatchingLot = cluster.lots.some(lotId => {
          const lot = FEFO_LOTS[lotId];
          return filter === 'todos' || (lot && lot.chamber === filter);
        });

        if (hasMatchingLot) {
          chip.style.opacity = '1';
          chip.style.pointerEvents = 'auto';
        } else {
          chip.style.opacity = '0.15';
          chip.style.pointerEvents = 'none';
        }
      });
    });
  });
}
