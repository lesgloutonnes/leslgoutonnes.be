/**
 * Newsletter Campaigns Management - Les Gloutonnes
 * Gestion des campagnes pour le tracking
 */

const CAMPAIGNS_API_URL = '../api/stats-api.php';
const CAMPAIGNS_ADMIN_KEY = 'gloutonnes2025';

let currentCampaignId = null;
let currentCampaignName = '';
let availableCampaigns = [];
let isCampaignsInitialized = false;

// Campaigns Management Script chargé

// ===============================
// INITIALISATION DES CAMPAGNES
// ===============================
document.addEventListener('DOMContentLoaded', function() {
    
    // Attendre que l'éditeur soit initialisé
    setTimeout(() => {
        initCampaignsSystem();
    }, 1000);
    
    // Aussi écouter l'activation de l'onglet éditeur
    document.addEventListener('tabSwitched', function(e) {
        if (e.detail.tab === 'editor') {
            setTimeout(() => {
                if (!isCampaignsInitialized) {
                    initCampaignsSystem();
                }
            }, 200);
        }
    });
});

function initCampaignsSystem() {
    if (isCampaignsInitialized) return;
    
    
    // Setup des event listeners
    setupCampaignsEventListeners();
    
    // Charger les campagnes existantes
    loadExistingCampaigns();
    
    // Initialiser l'état par défaut
    updateCampaignState();
    
    isCampaignsInitialized = true;
}

function setupCampaignsEventListeners() {
    
    // Sélecteur de campagne
    const campaignSelector = document.getElementById('campaign-selector');
    if (campaignSelector) {
        campaignSelector.addEventListener('change', handleCampaignSelection);
    }
    
    // Bouton créer campagne
    const createBtn = document.getElementById('btn-create-campaign');
    if (createBtn) {
        createBtn.addEventListener('click', createNewCampaign);
    }
    
    // Override des fonctions de preview pour inclure le tracking
    overridePreviewGeneration();
}

// ===============================
// GESTION DES CAMPAGNES
// ===============================
async function loadExistingCampaigns() {
    
    try {
        const response = await fetch(`${CAMPAIGNS_API_URL}?action=get_campaigns&key=${CAMPAIGNS_ADMIN_KEY}`);
        const result = await response.json();
        
        if (result.success) {
            availableCampaigns = result.data;
            populateCampaignSelector();
        } else {
            // Erreur campagnes
        }
    } catch (error) {
        // Erreur chargement campagnes
    }
}

function populateCampaignSelector() {
    const selector = document.getElementById('campaign-selector');
    if (!selector) return;
    
    // Garder les options par défaut
    const defaultOptions = selector.innerHTML;
    
    // Ajouter les campagnes existantes
    let existingOptions = '';
    availableCampaigns.forEach(campaign => {
        const date = new Date(campaign.sent_date).toLocaleDateString('fr-FR');
        existingOptions += `<option value="${campaign.id}">📊 ${campaign.campaign_name} (${date})</option>`;
    });
    
    selector.innerHTML = defaultOptions + existingOptions;
}

function handleCampaignSelection() {
    const selector = document.getElementById('campaign-selector');
    const selectedValue = selector.value;
    
    
    if (selectedValue === 'new') {
        // Afficher le formulaire de nouvelle campagne
        showNewCampaignForm(true);
        currentCampaignId = null;
    } else if (selectedValue === '') {
        // Aucune campagne sélectionnée
        showNewCampaignForm(false);
        currentCampaignId = null;
        currentCampaignName = '';
    } else {
        // Campagne existante sélectionnée
        showNewCampaignForm(false);
        currentCampaignId = parseInt(selectedValue);
        const campaign = availableCampaigns.find(c => c.id == selectedValue);
        currentCampaignName = campaign ? campaign.campaign_name : 'Campagne #' + selectedValue;
    }
    
    updateCampaignState();
    updatePreview();
}

function showNewCampaignForm(show) {
    const form = document.getElementById('new-campaign-form');
    if (form) {
        form.style.display = show ? 'block' : 'none';
    }
}

async function createNewCampaign() {
    
    const nameField = document.getElementById('new-campaign-name');
    const descField = document.getElementById('new-campaign-description');
    const subjectField = document.getElementById('newsletter-subject');
    
    const campaignName = nameField?.value?.trim();
    const description = descField?.value?.trim();
    const subject = subjectField?.value?.trim() || 'Newsletter Les Gloutonnes';
    
    if (!campaignName) {
        showCampaignAlert('Nom de campagne requis', 'error');
        return;
    }
    
    try {
        showCampaignAlert('Création de la campagne...', 'info');
        
        const formData = new FormData();
        formData.append('action', 'record_campaign');
        formData.append('campaign_name', campaignName);
        formData.append('subject', subject);
        formData.append('content_preview', description || 'Newsletter générée via l\'éditeur');
        formData.append('total_sent', 0); // Sera mis à jour lors de l'envoi
        formData.append('key', CAMPAIGNS_ADMIN_KEY);
        
        const response = await fetch(CAMPAIGNS_API_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentCampaignId = result.data.campaign_id;
            currentCampaignName = campaignName;
            
            // Réinitialiser le formulaire
            nameField.value = '';
            descField.value = '';
            showNewCampaignForm(false);
            
            // Mettre à jour le sélecteur
            const selector = document.getElementById('campaign-selector');
            const newOption = document.createElement('option');
            newOption.value = currentCampaignId;
            newOption.textContent = `📊 ${campaignName} (nouvelle)`;
            newOption.selected = true;
            selector.appendChild(newOption);
            
            // Ajouter à la liste
            availableCampaigns.unshift({
                id: currentCampaignId,
                campaign_name: campaignName,
                sent_date: new Date().toISOString()
            });
            
            updateCampaignState();
            updatePreview();
            
            showCampaignAlert(`Campagne "${campaignName}" créée avec succès !`, 'success');
            
        } else {
            showCampaignAlert('Erreur: ' + result.message, 'error');
        }
        
    } catch (error) {
        // Erreur création campagne
        showCampaignAlert('Erreur de connexion', 'error');
    }
}

// ===============================
// MISE À JOUR DE L'INTERFACE
// ===============================
function updateCampaignState() {
    const hasCampaign = currentCampaignId !== null;
    
    // Mettre à jour les alertes de preview
    const noCampaignAlert = document.getElementById('no-campaign-alert');
    const campaignInfoPreview = document.getElementById('campaign-info-preview');
    
    if (noCampaignAlert) {
        noCampaignAlert.style.display = hasCampaign ? 'none' : 'block';
    }
    
    if (campaignInfoPreview) {
        campaignInfoPreview.style.display = hasCampaign ? 'block' : 'none';
        if (hasCampaign) {
            const nameSpan = document.getElementById('preview-campaign-name');
            const idSpan = document.getElementById('preview-campaign-id');
            if (nameSpan) nameSpan.textContent = currentCampaignName;
            if (idSpan) idSpan.textContent = currentCampaignId;
        }
    }
    
    // Mettre à jour le statut dans l'éditeur
    const campaignStatus = document.getElementById('campaign-status');
    if (campaignStatus) {
        campaignStatus.style.display = hasCampaign ? 'block' : 'none';
        if (hasCampaign) {
            const nameSpan = document.getElementById('active-campaign-name');
            const idSpan = document.getElementById('active-campaign-id');
            if (nameSpan) nameSpan.textContent = currentCampaignName;
            if (idSpan) idSpan.textContent = currentCampaignId;
        }
    }
    
    // Activer/désactiver les boutons
    updateButtonsState(hasCampaign);
    
}

function updateButtonsState(hasCampaign) {
    // Boutons de lots
    const loadBtn = document.getElementById('btn-load-subscribers');
    const mailtoBtn = document.getElementById('btn-create-mailto-batch');
    
    if (loadBtn) {
        loadBtn.disabled = !hasCampaign;
        loadBtn.title = hasCampaign ? 'Charger les abonnés pour cette campagne' : 'Sélectionne une campagne d\'abord';
    }
    
    if (mailtoBtn) {
        mailtoBtn.disabled = !hasCampaign;
        mailtoBtn.title = hasCampaign ? 'Créer email avec tracking' : 'Sélectionne une campagne d\'abord';
    }
}

// ===============================
// CONFIGURATION DYNAMIQUE DE L'URL
// ===============================

function getTrackingBaseUrl() {
    // Détecter automatiquement l'URL de base
    const currentDomain = window.location.hostname;
    
    if (currentDomain.includes('cluster021.hosting.ovh.net')) {
        // URL OVH temporaire
        return 'https://lesglom.cluster021.hosting.ovh.net';
    } else if (currentDomain.includes('lesgloutonnes.be')) {
        // Domaine final
        return 'https://www.lesgloutonnes.be';
    } else {
        // Fallback - tenter le domaine actuel
        return `${window.location.protocol}//${window.location.hostname}`;
    }
}

// ===============================
// INTÉGRATION AVEC LE PREVIEW
// ===============================
function overridePreviewGeneration() {
    // Sauvegarder la fonction originale
    if (typeof window.originalGenerateNewsletterHTML === 'undefined') {
        window.originalGenerateNewsletterHTML = window.generateNewsletterHTML;
    }
    
    // Remplacer par notre version avec tracking
    window.generateNewsletterHTML = function(data) {
        const originalHTML = window.originalGenerateNewsletterHTML(data);
        
        if (currentCampaignId) {
            // Utiliser l'URL détectée automatiquement
            const baseUrl = getTrackingBaseUrl();
            const trackingPixel = `<img src="${baseUrl}/track-open.php?c=${currentCampaignId}&e=EMAIL_HASH" width="1" height="1" style="display:none;" alt="">`;
            
            return originalHTML.replace(
                /<img src="[^"]*track-open\.php[^"]*"[^>]*>/g,
                trackingPixel
            );
        } else {
            // Pas de campagne = pas de tracking
            return originalHTML.replace(
                /<img src="[^"]*track-open\.php[^"]*"[^>]*>/g,
                '<!-- Tracking désactivé: aucune campagne sélectionnée -->'
            );
        }
    };
    
}

function updatePreview() {
    // Déclencher la mise à jour du preview
    if (typeof window.updateEditorPreview === 'function') {
        setTimeout(() => {
            window.updateEditorPreview();
        }, 100);
    }
}

// ===============================
// INTÉGRATION AVEC LES LOTS
// ===============================

// Override de la fonction de création des emails pour inclure le tracking
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // Override de createSimpleMailtoForCurrentBatch (la fonction réellement utilisée)
        if (typeof window.createSimpleMailtoForCurrentBatch === 'function') {
            window.originalCreateSimpleMailtoForCurrentBatch = window.createSimpleMailtoForCurrentBatch;
            
            window.createSimpleMailtoForCurrentBatch = function() {
                if (!currentCampaignId) {
                    showCampaignAlert('Sélectionne une campagne avant de créer les emails !', 'error');
                    return;
                }
                
                // Mettre à jour le nombre d'emails envoyés dans la campagne AVANT d'ouvrir Outlook
                updateCampaignSentCount();
                
                // Appeler la fonction originale
                window.originalCreateSimpleMailtoForCurrentBatch();
            };
        } else {
            // createSimpleMailtoForCurrentBatch non trouvée, réessai
            // Réessayer après un délai supplémentaire
            setTimeout(() => {
                if (typeof window.createSimpleMailtoForCurrentBatch === 'function') {
                    window.originalCreateSimpleMailtoForCurrentBatch = window.createSimpleMailtoForCurrentBatch;
                    window.createSimpleMailtoForCurrentBatch = function() {
                        if (!currentCampaignId) {
                            showCampaignAlert('Sélectionne une campagne avant de créer les emails !', 'error');
                            return;
                        }
                        updateCampaignSentCount();
                        window.originalCreateSimpleMailtoForCurrentBatch();
                    };
                }
            }, 1000);
        }
    }, 2000);
});

async function updateCampaignSentCount() {
    const emailListTextarea = document.getElementById('email-list-textarea');
    const emailList = emailListTextarea?.value?.trim();
    
    if (!emailList) {
        // Aucune liste d'emails trouvée
        return;
    }
    
    if (!currentCampaignId) {
        // Aucune campagne sélectionnée
        return;
    }
    
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const matches = emailList.match(emailRegex);
    const emailCount = matches ? matches.length : 0;
    
    if (emailCount === 0) {
        // Aucun email valide trouvé
        return;
    }
    
    try {
        
        const formData = new FormData();
        formData.append('action', 'update_campaign_sent');
        formData.append('campaign_id', currentCampaignId);
        formData.append('additional_sent', emailCount);
        formData.append('key', CAMPAIGNS_ADMIN_KEY);
        
        const response = await fetch(CAMPAIGNS_API_URL, {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showCampaignAlert(`✅ ${emailCount} emails ajoutés au compteur de la campagne`, 'success');
            
            // Rafraîchir les stats si l'onglet stats est actif
            if (typeof window.refreshNewsletterStats === 'function') {
                setTimeout(() => {
                    window.refreshNewsletterStats();
                }, 500);
            }
        } else {
            // Erreur API
            showCampaignAlert('Erreur lors de la mise à jour: ' + result.message, 'error');
        }
        
    } catch (error) {
        // Erreur mise à jour campagne
        showCampaignAlert('Erreur de connexion lors de la mise à jour', 'error');
    }
}

// ===============================
// FONCTIONS UTILITAIRES
// ===============================
function showCampaignAlert(message, type = 'info') {
    
    // Utiliser le système d'alertes existant si disponible
    if (typeof showAlert === 'function') {
        showAlert(message, type);
    } else {
        // Fallback simple
        alert(message);
    }
}

// Fonction publique pour récupérer l'ID de campagne actuelle
window.getCurrentCampaignId = function() {
    return currentCampaignId;
};

window.getCurrentCampaignName = function() {
    return currentCampaignName;
};

// Auto-diagnostic
setTimeout(() => {
    // Auto-diagnostic campaigns
    
    const criticalElements = [
        'campaign-selector', 'btn-create-campaign', 
        'new-campaign-form', 'campaign-status'
    ];
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
    });
    
}, 3000);

// Campaigns Management Script - COMPLET et prêt