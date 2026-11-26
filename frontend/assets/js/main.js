const API_URL = 'http://localhost:3000/api';

const MENU_SISTEMA = [
  {
    titulo: 'Visão Geral',
    itens: [
      { href: 'dashboard.html', nome: 'Dashboard', svg: '<rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect>' }
    ]
  },
  {
    titulo: 'Operação',
    itens: [
      { href: 'produtos.html', nome: 'Produtos', svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>' },
      { href: 'lotes.html', nome: 'Lotes & Validade', svg: '<path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6a1.78 1.78 0 0 0 0-3.2z"></path><polyline points="18 4 18 20"></polyline>' },
      { href: 'producao.html', nome: 'Produção', svg: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' },
      { href: 'estoque.html', nome: 'Estoque', svg: '<rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>' }
    ]
  },
  {
    titulo: 'Comercial',
    itens: [
      { href: 'pedidos.html', nome: 'Pedidos', svg: '<circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>' }
    ]
  },
  {
    titulo: 'Qualidade',
    itens: [
      { href: 'perdas.html', nome: 'Perdas', svg: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline>' },
      { href: 'alertas.html', nome: 'Alertas', pill: true, svg: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>' }
    ]
  },
  {
    titulo: 'Administração',
    itens: [
      { href: 'relatorios.html', nome: 'Relatórios', svg: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>' },
      { href: 'usuarios.html', nome: 'Usuários & Acessos', svg: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' }
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  verificarAutenticacao();
  montarLayout();
  atualizarInterfaceUsuario();
  atualizarContadorAlertas();
  initTableFilters();
  initModals();
});

function obterUsuarioLogado() {
  const salvo = localStorage.getItem('foodcontrol_usuario');
  if (!salvo) return null;
  try {
    return JSON.parse(salvo);
  } catch (e) {
    return null;
  }
}

function verificarAutenticacao() {
  const naTelaLogin = window.location.pathname.endsWith('index.html') && !window.location.pathname.includes('/pages/');
  if (naTelaLogin) return;
  if (!obterUsuarioLogado()) {
    window.location.href = '../index.html';
  }
}

function sairDoSistema() {
  localStorage.removeItem('foodcontrol_usuario');
  window.location.href = '../index.html';
}

function montarLayout() {
  const layout = document.querySelector('.app-layout');
  const main = document.querySelector('.app-main');
  if (!layout || !main) return;

  const arquivoAtual = window.location.pathname.split('/').pop() || 'dashboard.html';
  let navHtml = '';
  for (let i = 0; i < MENU_SISTEMA.length; i++) {
    const sec = MENU_SISTEMA[i];
    navHtml += `<div class="nav-section"><span class="nav-section-title">${sec.titulo}</span>`;
    for (let j = 0; j < sec.itens.length; j++) {
      const it = sec.itens[j];
      const ativo = it.href === arquivoAtual ? ' active' : '';
      const aria = it.href === arquivoAtual ? ' aria-current="page"' : '';
      const pill = it.pill ? '<span class="nav-pill" style="display:none">0</span>' : '';
      navHtml += `<a href="${it.href}" class="nav-link${ativo}"${aria}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor">${it.svg}</svg><span>${it.nome}</span>${pill}</a>`;
    }
    navHtml += '</div>';
  }

  const sidebar = document.createElement('aside');
  sidebar.className = 'app-sidebar';
  sidebar.setAttribute('aria-label', 'Menu Principal');
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <a href="dashboard.html" class="sidebar-brand-standalone" title="Página Inicial">
        <img src="../assets/img/logo-side.png" alt="FoodControl" class="sidebar-logo-img logo-side" />
      </a>
    </div>
    <nav class="sidebar-nav">${navHtml}</nav>
    <div class="sidebar-footer">
      <span class="company-name">SaborSul Alimentos</span>
      <a href="../index.html" class="sidebar-logout" title="Sair do sistema">Sair</a>
    </div>
  `;
  layout.insertBefore(sidebar, main);

  const grupo = document.body.dataset.grupo;
  const pagina = document.body.dataset.pagina || document.title.replace(' - FoodControl', '');
  const migalhaGrupo = grupo ? `<span>${grupo}</span><span class="separator">/</span>` : '';
  const sinoAlertas = arquivoAtual !== 'alertas.html'
    ? `<a href="alertas.html" class="header-notification-btn" title="Central de Alertas"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><span class="notification-count" style="display:none">0</span></a>`
    : '';

  const header = document.createElement('header');
  header.className = 'app-header';
  header.innerHTML = `
    <div class="header-breadcrumbs">
      <a href="dashboard.html">Início</a><span class="separator">/</span>${migalhaGrupo}<span class="current">${pagina}</span>
    </div>
    <div class="header-right">
      <div class="operational-date-chip">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <span>-</span>
      </div>
      ${sinoAlertas}
      <div class="user-profile">
        <div class="user-avatar">--</div>
        <div class="user-details"><span class="user-name">Usuário</span><span class="user-role">Perfil</span></div>
      </div>
    </div>
  `;
  main.insertBefore(header, main.firstChild);
}

function atualizarInterfaceUsuario() {
  const usuario = obterUsuarioLogado();
  const dataEl = document.querySelector('.operational-date-chip span');
  if (dataEl) dataEl.innerText = formatarDataBR(hojeLocalIso());

  const btnSair = document.querySelector('.sidebar-logout');
  if (btnSair) {
    btnSair.addEventListener('click', (e) => {
      e.preventDefault();
      sairDoSistema();
    });
  }

  if (!usuario) return;

  const nomesPerfis = { administrador: 'Administrador', producao: 'Produção', estoque: 'Estoque', qualidade: 'Qualidade' };
  const nomeEl = document.querySelector('.user-name');
  const roleEl = document.querySelector('.user-role');
  const avatarEl = document.querySelector('.user-avatar');

  if (nomeEl) nomeEl.innerText = usuario.nome;
  if (roleEl) roleEl.innerText = nomesPerfis[usuario.perfil] || usuario.perfil;
  if (avatarEl) {
    const partes = usuario.nome.trim().split(' ');
    avatarEl.innerText = partes.length > 1 ? (partes[0][0] + partes[partes.length - 1][0]).toUpperCase() : usuario.nome.slice(0, 2).toUpperCase();
  }

  if (usuario.perfil !== 'administrador') {
    const linkUsuarios = document.querySelector('a[href="usuarios.html"]');
    if (linkUsuarios) linkUsuarios.style.display = 'none';
  }
  if (usuario.perfil === 'producao') {
    const linkPerdas = document.querySelector('a[href="perdas.html"]');
    if (linkPerdas) linkPerdas.style.display = 'none';
  }
}

async function atualizarContadorAlertas() {
  const badgeHeader = document.querySelector('.notification-count');
  const pillMenu = document.querySelector('.nav-pill');
  if (!badgeHeader && !pillMenu) return;

  try {
    const alertas = await apiRequest('/alertas');
    let abertos = 0;
    for (let i = 0; i < alertas.length; i++) {
      if (alertas[i].status === 'Aberto') abertos++;
    }
    if (badgeHeader) {
      badgeHeader.innerText = abertos;
      badgeHeader.style.display = abertos > 0 ? '' : 'none';
    }
    if (pillMenu) {
      pillMenu.innerText = abertos;
      pillMenu.style.display = abertos > 0 ? '' : 'none';
    }
  } catch (erro) {
    console.error('Erro ao contar alertas:', erro);
  }
}

async function apiRequest(caminho, metodo = 'GET', corpo = null) {
  const opcoes = { method: metodo, headers: { 'Content-Type': 'application/json' } };
  if (corpo !== null) opcoes.body = JSON.stringify(corpo);

  const resp = await fetch(`${API_URL}${caminho}`, opcoes);
  const dados = await resp.json();
  if (!resp.ok) throw new Error(dados.mensagem || 'Erro ao comunicar com o servidor');
  return dados;
}

function hojeLocalIso() {
  return new Date().toLocaleDateString('en-CA');
}

function primeiroDiaMesIso() {
  return hojeLocalIso().slice(0, 8) + '01';
}

function formatarDataBR(dataIso) {
  if (!dataIso) return '-';
  const p = String(dataIso).slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(dataIso);
}

function formatarMoeda(valor) {
  return 'R$ ' + (Number(valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatarNumero(valor) {
  return (Number(valor) || 0).toLocaleString('pt-BR');
}

function criarBadge(classe, texto, comPonto = true) {
  const ponto = comPonto ? '<span class="badge-dot"></span>' : '';
  return `<span class="badge ${classe}">${ponto}${texto}</span>`;
}

function aplicarFiltrosTabela() {
  const searchInput = document.getElementById('tableSearchInput');
  const categorySelect = document.getElementById('tableCategoryFilter');
  const statusSelect = document.getElementById('tableStatusFilter');
  const table = document.querySelector('.data-table tbody');
  if (!table) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const selectedCat = categorySelect ? categorySelect.value.toLowerCase().trim() : 'todas';
  const selectedStat = statusSelect ? statusSelect.value.toLowerCase().trim() : 'todos';

  const rows = table.querySelectorAll('tr');
  let visibleCount = 0;

  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    const ok = (!query || text.includes(query))
      && (!selectedCat || selectedCat === 'todas' || text.includes(selectedCat))
      && (!selectedStat || selectedStat === 'todos' || selectedStat === 'todas' || text.includes(selectedStat));
    row.style.display = ok ? '' : 'none';
    if (ok) visibleCount++;
  });

  const counter = document.getElementById('tableRowCount');
  if (counter) counter.innerText = `${visibleCount} registro(s) exibido(s)`;
}

function initTableFilters() {
  ['tableSearchInput', 'tableCategoryFilter', 'tableStatusFilter'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(id === 'tableSearchInput' ? 'input' : 'change', aplicarFiltrosTabela);
  });
}

function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
}

function fecharModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }
}

function initModals() {
  document.querySelectorAll('[data-modal-target]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModal(btn.getAttribute('data-modal-target'));
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  });

  document.querySelectorAll('.modal-backdrop').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
      }
    });
  });
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
