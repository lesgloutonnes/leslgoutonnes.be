/**
 * Newsletter Statistics OPTIMISÉ - Les Gloutonnes
 * VERSION SIMPLIFIÉE - Focus sur l'essentiel seulement
 */

const STATS_API_URL = "../api/stats-api.php";
const STATS_ADMIN_KEY = "gloutonnes2025";
let isStatsInitialized = false;
let statsData = {
  overview: {},
  campaigns: []
};

// Newsletter Stats Script OPTIMISÉ chargé

// ===============================
// INITIALISATION SIMPLIFIÉE
// ===============================
document.addEventListener("DOMContentLoaded", function () {

  setTimeout(() => {
    const statsTab = document.getElementById("stats-tab");
    if (statsTab && statsTab.style.display !== "none") {
      initStatsTab();
    }
  }, 2000);

  // Écouter l'activation de l'onglet stats via événement personnalisé
  document.addEventListener('tabSwitched', function(e) {
    if (e.detail && e.detail.tab === 'stats') {
      setTimeout(() => {
        initStatsTab();
      }, 200);
    }
  });
  
  // Écouter aussi directement le clic sur le bouton (fallback)
  setTimeout(() => {
    const statsTabButton = document.querySelector('[data-tab="stats"]');
    if (statsTabButton) {
      statsTabButton.addEventListener("click", function () {
        setTimeout(() => {
          initStatsTab();
        }, 300);
      });
    }
  }, 1000);
});

function initStatsTab() {
  if (isStatsInitialized) {
    refreshStats();
    return;
  }


  setupStatsButtons();
  loadStatsData();

  isStatsInitialized = true;
}

function setupStatsButtons() {

  const refreshBtn = document.getElementById("btn-refresh-stats");
  const exportBtn = document.getElementById("btn-export-stats");

  if (refreshBtn) {
    refreshBtn.onclick = refreshStats;
  }

  if (exportBtn) {
    exportBtn.onclick = exportStats;
  }
}

// ===============================
// CHARGEMENT DES DONNÉES ESSENTIELLES
// ===============================
async function loadStatsData() {

  showStatsLoading(true);

  try {
    await loadOverviewStats();
    await loadCampaignsStats();
    generateSimpleInsights();
    showStatsLoading(false);

  } catch (error) {
    // Erreur chargement stats
    showStatsError("Aucune donnée disponible. Créez votre première campagne !");
    showStatsLoading(false);
  }
}

async function loadOverviewStats() {

  try {
    const url = `${STATS_API_URL}?action=get_overview&key=${STATS_ADMIN_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();

    if (result.success) {
      statsData.overview = result.data;
      renderOverviewStats();
    } else {
      // Erreur overview
      renderEmptyOverview();
    }
  } catch (error) {
    // Erreur fetch overview
    renderEmptyOverview();
  }
}

async function loadCampaignsStats() {

  try {
    const url = `${STATS_API_URL}?action=get_campaigns&key=${STATS_ADMIN_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();

    if (result.success) {
      statsData.campaigns = result.data || [];
      renderCampaignsStats();
    } else {
      // Erreur campaigns
      renderEmptyCampaigns();
    }
  } catch (error) {
    // Erreur fetch campaigns
    renderEmptyCampaigns();
  }
}

// ===============================
// RENDU ÉTAT VIDE
// ===============================
function renderEmptyOverview() {

  const container = document.getElementById("stats-overview");
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📊</div>
        <h3 style="color: #666; margin-bottom: 1rem;">Aucune statistique disponible</h3>
        <p style="color: #999; margin-bottom: 2rem;">
            Créez votre première campagne pour voir apparaître les statistiques ici.
        </p>
        <a href="#" onclick="document.querySelector('[data-tab=editor]').click()" 
           style="background: #5b0092; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Créer ma première campagne
        </a>
    </div>
  `;
}

function renderEmptyCampaigns() {

  const tbody = document.getElementById("campaigns-list");
  const emptyState = document.getElementById("empty-campaigns");
  const table = document.getElementById("campaigns-table");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (emptyState) {
    emptyState.style.display = "block";
  }

  if (table) table.style.display = "none";
}

// ===============================
// RENDU DES STATISTIQUES ESSENTIELLES
// ===============================
function renderOverviewStats() {
  
  const container = document.getElementById('stats-overview');
  if (!container) return;
  
  const data = statsData.overview;
  
  if (!data || Object.keys(data).length === 0) {
    renderEmptyOverview();
    return;
  }
  
  // Stats essentielles seulement
  container.innerHTML = `
    <div class="stat-card">
        <div class="stat-header">
            <div>
                <div class="stat-value">${data.total_campaigns || 0}</div>
                <div class="stat-label">Newsletters envoyées</div>
                <div class="stat-trend trend-up">
                    📈 +${data.campaigns_this_month || 0} ce mois
                </div>
            </div>
            <div class="stat-icon">📧</div>
        </div>
    </div>

    <div class="stat-card accent">
        <div class="stat-header">
            <div>
                <div class="stat-value">${formatNumber(data.total_emails_sent || 0)}</div>
                <div class="stat-label">Emails envoyés total</div>
                <div class="stat-trend trend-up">
                    📬 Dernier envoi: ${data.emails_last_campaign || 0}
                </div>
            </div>
            <div class="stat-icon">📮</div>
        </div>
    </div>

    <div class="stat-card success">
        <div class="stat-header">
            <div>
                <div class="stat-value">${data.avg_open_rate || 0}%</div>
                <div class="stat-label">Taux d'ouverture moyen</div>
                <div class="stat-trend ${data.open_rate_trend >= 0 ? 'trend-up' : 'trend-down'}">
                    ${data.open_rate_trend >= 0 ? '📈' : '📉'} ${Math.abs(data.open_rate_trend || 0)}% vs dernier mois
                </div>
            </div>
            <div class="stat-icon">👀</div>
        </div>
    </div>

    <div class="stat-card warning">
        <div class="stat-header">
            <div>
                <div class="stat-value">${data.total_subscribers || 0}</div>
                <div class="stat-label">Total abonnés</div>
                <div class="stat-trend trend-up">
                    👥 +${data.new_subscribers_7_days || 0} cette semaine
                </div>
            </div>
            <div class="stat-icon">👥</div>
        </div>
    </div>
  `;
  
}

function renderCampaignsStats() {

  const tbody = document.getElementById("campaigns-list");
  const emptyState = document.getElementById("empty-campaigns");
  const table = document.getElementById("campaigns-table");

  if (!tbody) return;

  tbody.innerHTML = "";

  if (!statsData.campaigns || statsData.campaigns.length === 0) {
    renderEmptyCampaigns();
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (table) table.style.display = "table";

  statsData.campaigns.forEach((campaign) => {
    const row = document.createElement("tr");
    const openRate = campaign.open_rate || 0;
    const performanceBadge = getPerformanceBadge(openRate);

    row.innerHTML = `
      <td>
          <div class="campaign-name">${escapeHtml(campaign.campaign_name)}</div>
          <small style="color: #666;">${escapeHtml(campaign.subject || "")}</small>
      </td>
      <td>
          <div>${formatDate(campaign.sent_date)}</div>
          <small style="color: #666;">${formatTime(campaign.sent_date)}</small>
      </td>
      <td><strong>${campaign.total_sent || 0}</strong></td>
      <td>
          <div style="margin-bottom: 5px;"><strong>${openRate}%</strong> (${campaign.unique_opens || 0})</div>
          <div class="progress-bar">
              <div class="progress-fill" style="width: ${openRate}%;"></div>
          </div>
      </td>
      <td>${performanceBadge}</td>
    `;

    tbody.appendChild(row);
  });

}

// ===============================
// INSIGHTS SIMPLIFIÉS
// ===============================
function generateSimpleInsights() {

  // Plus d'affichage d'insights pour simplifier
  // Les données sont dans les cartes overview
}

// ===============================
// FONCTIONS UTILITAIRES ESSENTIELLES
// ===============================
function getPerformanceBadge(openRate) {
  if (openRate >= 70) {
    return '<span class="metric-badge badge-success">Excellent</span>';
  } else if (openRate >= 50) {
    return '<span class="metric-badge badge-warning">Bon</span>';
  } else if (openRate >= 25) {
    return '<span class="metric-badge badge-warning">Moyen</span>';
  } else if (openRate > 0) {
    return '<span class="metric-badge badge-danger">À améliorer</span>';
  } else {
    return '<span class="metric-badge badge-secondary">Pas de données</span>';
  }
}

function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR");
}

function formatTime(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ===============================
// ÉTATS DE CHARGEMENT
// ===============================
function showStatsLoading(show) {
  const loading = document.getElementById("stats-loading");
  const content = document.getElementById("stats-content");

  if (loading) loading.style.display = show ? "block" : "none";
  if (content) content.style.display = show ? "none" : "block";
}

function showStatsError(message) {
  const container = document.getElementById("stats-overview");
  if (container) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
          <h3 style="color: #dc3545;">Aucune donnée disponible</h3>
          <p style="color: #666; margin-bottom: 2rem;">${message}</p>
          <button onclick="refreshStats()" class="btn btn-primary" style="margin-right: 1rem;">
              Actualiser
          </button>
          <a href="#" onclick="document.querySelector('[data-tab=editor]').click()" 
             style="background: #5b0092; color: white; padding: 10px 20px; border-radius: 4px; text-decoration: none;">
              Créer une campagne
          </a>
      </div>
    `;
  }
}

// ===============================
// ACTIONS UTILISATEUR SIMPLIFIÉES
// ===============================
async function refreshStats() {
  showStatsMessage("Actualisation des données...", "info");
  await loadStatsData();
  showStatsMessage("Statistiques mises à jour !", "success");
}

async function exportStats() {

  try {
    const response = await fetch(
      `${STATS_API_URL}?action=export_stats&key=${STATS_ADMIN_KEY}`
    );

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stats-gloutonnes-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showStatsMessage("Export terminé !", "success");
    } else {
      throw new Error("Erreur lors de l'export");
    }
  } catch (error) {
    // Erreur export
    showStatsMessage("Aucune donnée à exporter", "info");
  }
}

function showStatsMessage(message, type = "info") {

  // Utiliser le système d'alertes existant si disponible
  if (typeof showAlert === "function") {
    showAlert(message, type);
  } else {
    // Fallback simple
    const colors = {
      success: "#28a745",
      error: "#dc3545",
      info: "#17a2b8"
    };
    
    // Supprimer les anciens messages
    document.querySelectorAll(".stats-message").forEach(msg => msg.remove());

    const messageDiv = document.createElement("div");
    messageDiv.className = "temp-message stats-message";
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed; top: 20px; right: 20px; padding: 15px 20px;
      border-radius: 5px; color: white; font-weight: 500; z-index: 1000;
      background-color: ${colors[type] || colors.info};
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
  }
}

// ===============================
// FONCTIONS PUBLIQUES SIMPLIFIÉES
// ===============================
window.initializeStats = function () {
  initStatsTab();
};

window.refreshNewsletterStats = function () {
  if (isStatsInitialized) {
    refreshStats();
  }
};

// Newsletter Stats Script OPTIMISÉ - VERSION SIMPLIFIÉE prête