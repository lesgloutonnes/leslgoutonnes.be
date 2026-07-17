/**
 * Newsletter Script Optimisé + Améliorations - Les Gloutonnes
 * VERSION COMPLÈTE avec sauvegarde auto, template mensuel, compteur caractères, vue mobile
 * VERSION AMÉLIORÉE avec retry, cache, pagination, validation temps réel, gestion d'état
 */

const API_URL = '../api/admin-api.php';
const ADMIN_KEY = 'gloutonnes2025';
const BATCH_SIZE = 50;
let allSubscribers = [];
let currentBatchLoaded = -1;

// Newsletter Script Optimisé + Améliorations chargé

// ================================
// UTILITAIRES AMÉLIORÉS
// ================================

/**
 * Fetch avec retry automatique et backoff exponentiel
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return response;
            }
            
            // Retry sur erreurs 5xx uniquement
            if (response.status >= 500 && i < maxRetries - 1) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return response; // Ne pas retry sur 4xx
        } catch (error) {
            if (i === maxRetries - 1 || error.name === 'AbortError') {
                throw error;
            }
            
            // Backoff exponentiel
            const delay = 1000 * Math.pow(2, i);
            // Tentative échouée, retry en cours
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Cache intelligent pour les données
 */
const DataCache = {
    subscribers: null,
    lastFetch: {
        subscribers: null
    },
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    
    async getSubscribers(forceRefresh = false) {
        const now = Date.now();
        const lastFetch = this.lastFetch.subscribers;
        
        if (!forceRefresh && 
            this.subscribers && 
            lastFetch && 
            (now - lastFetch) < this.cacheDuration) {
            // Utilisation du cache abonnés
            return Promise.resolve(this.subscribers);
        }
        
        try {
            const response = await fetchWithRetry(
                `${API_URL}?action=get_subscribers&key=${ADMIN_KEY}&page=1&limit=1000`
            );
            const result = await response.json();
            
            if (result.success) {
                this.subscribers = result.data.subscribers || [];
                this.lastFetch.subscribers = now;
                return this.subscribers;
            }
            throw new Error(result.message);
        } catch (error) {
            // Retourner cache même si expiré en cas d'erreur
            if (this.subscribers) {
                // Utilisation cache expiré suite à erreur
                return this.subscribers;
            }
            throw error;
        }
    },
    
    invalidate(type = 'all') {
        if (type === 'all' || type === 'subscribers') {
            this.subscribers = null;
            this.lastFetch.subscribers = null;
        }
    }
};

/**
 * Gestion d'état centralisée
 */
const NewsletterState = {
    subscribers: [],
    currentBatch: null,
    currentCampaign: null,
    drafts: [],
    isLoading: false,
    currentPage: 1,
    totalPages: 1,
    totalSubscribers: 0,
    
    listeners: {},
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },
    
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    },
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    // Erreur dans listener (silencieux)
                }
            });
        }
    },
    
    setSubscribers(subscribers) {
        this.subscribers = subscribers;
        this.emit('subscribers_changed', subscribers);
    },
    
    setPagination(page, totalPages, total = null) {
        this.currentPage = page;
        this.totalPages = totalPages;
        if (total !== null) {
            this.totalSubscribers = total;
        }
        this.emit('pagination_changed', { page, totalPages, total });
    },
    
    setCurrentBatch(batch) {
        this.currentBatch = batch;
        this.emit('batch_changed', batch);
    },
    
    setCurrentCampaign(campaign) {
        this.currentCampaign = campaign;
        this.emit('campaign_changed', campaign);
    },
    
    setLoading(loading) {
        this.isLoading = loading;
        this.emit('loading_changed', loading);
    }
};

// Écouter les changements d'état
NewsletterState.on('subscribers_changed', (subscribers) => {
    // Abonnés chargés - utiliser le total du state
    const pagination = {
        total: NewsletterState.totalSubscribers
    };
    updateStats(subscribers, pagination);
});

NewsletterState.on('loading_changed', (isLoading) => {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = isLoading ? 'block' : 'none';
    }
});

/**
 * Afficher un indicateur de chargement
 */
function showLoadingState(container, message = 'Chargement...') {
    const existingLoader = container.querySelector('.loading-overlay');
    if (existingLoader) {
        existingLoader.remove();
    }
    
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    loader.innerHTML = `
        <div class="spinner" style="
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid var(--primary-color, #5b0092);
            border-radius: 50%;
            animation: spin 1s linear infinite;
        "></div>
        <p style="margin-top: 1rem; color: #666;">${message}</p>
    `;
    
    // Ajouter animation CSS si pas déjà présente
    if (!document.getElementById('spinner-animation')) {
        const style = document.createElement('style');
        style.id = 'spinner-animation';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    const containerStyle = window.getComputedStyle(container);
    if (containerStyle.position === 'static') {
        container.style.position = 'relative';
    }
    
    container.appendChild(loader);
    
    return () => {
        loader.remove();
    };
}

// ===============================
// INITIALISATION
// ===============================
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(() => {
        initTabs();
        initAdmin();
        initEditor();
        initTemplateButtons();
    }, 200);
});

function initTabs() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.onclick = (e) => {
            e.preventDefault();
            const targetTab = tab.getAttribute('data-tab');
            
            // Masquer tous les onglets
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            
            // Afficher l'onglet cible
            tab.classList.add('active');
            const tabContent = document.getElementById(targetTab + '-tab');
            if (tabContent) {
                tabContent.style.display = 'block';
                
                // Actions spécifiques par onglet
                if (targetTab === 'subscribers') {
                    // Activation onglet admin
                    loadSubscribersData();
                } else if (targetTab === 'editor') {
                    // Activation onglet éditeur
                    loadAllSubscribersForBatches();
                    loadLastDraft(); // Auto-restauration du brouillon
                } else if (targetTab === 'stats') {
                    // Activation onglet stats
                    // Déclencher le chargement des stats
                    if (typeof window.initializeStats === 'function') {
                        window.initializeStats();
                    } else if (typeof initStatsTab === 'function') {
                        initStatsTab();
                    } else {
                        // Fallback : déclencher un événement personnalisé
                        document.dispatchEvent(new CustomEvent('tabSwitched', { detail: { tab: 'stats' } }));
                    }
                }
            }
        };
    });
}

// ===============================
// SYSTÈME DE SAUVEGARDE AUTOMATIQUE
// ===============================
function autoSaveDraft() {
    const draft = {
        subject: getFieldValue('newsletter-subject'),
        title: getFieldValue('newsletter-title'),
        intro: getFieldValue('newsletter-intro'),
        content: getFieldValue('newsletter-content'),
        ctaText: getFieldValue('newsletter-cta-text'),
        ctaLink: getFieldValue('newsletter-cta-link'),
        version: Date.now(),
        saved_at: new Date().toLocaleString('fr-FR')
    };
    
    const currentMonth = new Date().getMonth();
    
    // Sauvegarder version actuelle
    localStorage.setItem(`newsletter_draft_${currentMonth}`, JSON.stringify(draft));
    
    // Ajouter au système de versionning
    saveDraftVersion(draft);
    
    // Brouillon sauvegardé automatiquement
}

/**
 * Versionning des brouillons
 */
function saveDraftVersion(draft) {
    const currentMonth = new Date().getMonth();
    const storageKey = `newsletter_draft_versions_${currentMonth}`;
    
    const versions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    versions.push(draft);
    
    // Trier par date (plus récent en premier)
    versions.sort((a, b) => (b.version || 0) - (a.version || 0));
    
    // Garder seulement les 10 dernières versions
    const keptVersions = versions.slice(0, 10);
    
    localStorage.setItem(storageKey, JSON.stringify(keptVersions));
}

function loadDraftVersion(version) {
    const currentMonth = new Date().getMonth();
    const storageKey = `newsletter_draft_versions_${currentMonth}`;
    const versions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const draft = versions.find(v => v.version === version);
    if (!draft) {
        showAlert('Version introuvable', 'error');
        return;
    }
    
    Object.keys(draft).forEach(key => {
        if (key !== 'version' && key !== 'saved_at') {
            const field = document.getElementById('newsletter-' + key);
            if (field) {
                field.value = draft[key] || '';
            }
        }
    });
    
    updateEditorPreview();
    showAlert(`📄 Version du ${new Date(draft.saved_at).toLocaleString('fr-FR')} restaurée`, 'success');
}

function showDraftVersions() {
    const currentMonth = new Date().getMonth();
    const storageKey = `newsletter_draft_versions_${currentMonth}`;
    const versions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (versions.length === 0) {
        showAlert('Aucune version sauvegardée', 'info');
        return;
    }
    
    // Créer un modal avec la liste des versions
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div class="modal-content" style="
            background: white;
            padding: 2rem;
            border-radius: 8px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <h3 style="margin-top: 0;">Versions sauvegardées</h3>
            <ul style="list-style: none; padding: 0;">
                ${versions.map(v => `
                    <li style="margin-bottom: 0.5rem;">
                        <button onclick="loadDraftVersion(${v.version}); this.closest('.modal').remove();" 
                                class="btn btn-light" style="width: 100%; text-align: left;">
                            ${new Date(v.saved_at).toLocaleString('fr-FR')}
                        </button>
                    </li>
                `).join('')}
            </ul>
            <button onclick="this.closest('.modal').remove()" class="btn btn-primary" style="margin-top: 1rem;">Fermer</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fermer en cliquant en dehors
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function loadLastDraft() {
    const currentMonth = new Date().getMonth();
    const draft = localStorage.getItem(`newsletter_draft_${currentMonth}`);
    
    if (draft) {
        try {
            const data = JSON.parse(draft);
            let hasContent = false;
            
            Object.keys(data).forEach(key => {
                if (key !== 'saved_at') {
                    const field = document.getElementById('newsletter-' + key);
                    if (field && data[key]) {
                        field.value = data[key];
                        hasContent = true;
                    }
                }
            });
            
            if (hasContent) {
                updateEditorPreview();
                showAlert(`📄 Brouillon du ${data.saved_at} restauré`, 'info');
            }
        } catch (error) {
            // Erreur restauration brouillon (silencieux)
        }
    }
}

function clearCurrentDraft() {
    const currentMonth = new Date().getMonth();
    localStorage.removeItem(`newsletter_draft_${currentMonth}`);
    
    ['subject', 'title', 'intro', 'content', 'cta-text', 'cta-link'].forEach(field => {
        const element = document.getElementById('newsletter-' + field);
        if (element) element.value = '';
    });
    
    updateEditorPreview();
    showAlert('🗑️ Brouillon effacé', 'success');
}

// ===============================
// TEMPLATE MENSUEL PRÉDÉFINI
// ===============================
function initTemplateButtons() {
    // Ajouter les boutons template dans l'éditeur si pas déjà présents
    const editorPanel = document.querySelector('.editor-panel');
    if (editorPanel && !document.getElementById('template-buttons')) {
        const templateContainer = document.createElement('div');
        templateContainer.id = 'template-buttons';
        templateContainer.style.cssText = `
            margin-bottom: 20px; 
            padding: 15px; 
            background: rgba(91, 0, 146, 0.05); 
            border-radius: 8px; 
            border: 1px solid rgba(91, 0, 146, 0.1);
        `;
        
        templateContainer.innerHTML = `
            <h4 style="color: var(--primary-color); margin-bottom: 10px;">🎯 Templates rapides</h4>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button type="button" onclick="loadMonthlyTemplate()" class="btn btn-accent btn-sm">
                    📅 Template mensuel
                </button>
                <button type="button" onclick="loadLastDraft()" class="btn btn-light btn-sm">
                    📄 Restaurer brouillon
                </button>
                <button type="button" onclick="clearCurrentDraft()" class="btn btn-light btn-sm">
                    🗑️ Nouveau brouillon
                </button>
            </div>
        `;
        
        editorPanel.insertBefore(templateContainer, editorPanel.firstChild);
    }
}

function loadMonthlyTemplate() {
    const now = new Date();
    const currentMonth = now.toLocaleDateString('fr-FR', { month: 'long' });
    const currentYear = now.getFullYear();
    const monthYear = `${currentMonth} ${currentYear}`;
    
    const template = {
        subject: `Newsletter ${monthYear} - Les Gloutonnes`,
        title: `Nouvelles du mois de ${currentMonth}`,
        intro: `Salut !\n\nJ'espère que tu vas bien et que tes plantes carnivores se portent à merveille. Voici les nouveautés de ce mois-ci :`,
        content: `🌱 **Nouvelles plantes disponibles**\n[Décris tes nouvelles créations du mois]\n\n💡 **Conseil du mois**\n[Partage ton meilleur conseil de culture pour la saison]\n\n📅 **Prochains événements**\n[Annonce tes événements à venir : bourses, marchés, ateliers]\n\n🔥 **Coup de cœur du mois**\n[Mets en avant une plante ou un produit spécial]`,
        'cta-text': 'Découvrir les nouveautés',
        'cta-link': 'https://www.lesgloutonnes.be/pages/contact.html'
    };
    
    Object.keys(template).forEach(key => {
        const field = document.getElementById('newsletter-' + key);
        if (field) field.value = template[key];
    });
    
    updateEditorPreview();
    updateCharacterCount();
    showAlert('📅 Template mensuel chargé !', 'success');
    
    // Auto-sauvegarde du template
    setTimeout(autoSaveDraft, 500);
}

// ===============================
// VALIDATION EMAIL ROBUSTE
// ===============================
function validateEmail(email) {
    if (!email || typeof email !== 'string') return false;
    
    // Nettoyer l'email
    email = email.toLowerCase().trim();
    
    // Regex plus stricte
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    // Blacklist étendue
    const blacklist = [
        // Emails de test
        'test@', 'example@', 'sample@', 'demo@',
        // Emails jetables/temporaires  
        '10minutemail', 'guerrillamail', 'mailinator', 'tempmail',
        'throwaway', 'trashmail', 'dispostable', 'getairmail',
        // Emails système
        'noreply@', 'no-reply@', 'admin@', 'root@', 'postmaster@',
        // Patterns suspects
        'aaa@', 'zzz@', '123@', 'qwe@'
    ];
    
    // Vérifications strictes
    const checks = [
        re.test(email),                                    // Format valide
        email.length >= 5 && email.length <= 254,         // Longueur RFC
        !email.startsWith('.') && !email.endsWith('.'),   // Pas de point au début/fin
        !email.includes('..'),                             // Pas de doubles points
        !blacklist.some(blocked => email.includes(blocked)), // Pas dans blacklist
        email.split('@').length === 2,                     // Un seul @
        email.split('@')[1].includes('.'),                 // Domaine avec point
        !email.split('@')[1].startsWith('.'),             // Domaine ne commence pas par .
        email.split('@')[1].length >= 4,                  // Domaine minimum (a.co = 4 chars)
        !/\s/.test(email)                                  // Pas d'espaces
    ];
    
    return checks.every(check => check === true);
}

// ===============================
// COMPTEUR DE CARACTÈRES POUR L'OBJET
// ===============================
function updateCharacterCount() {
    const subject = getFieldValue('newsletter-subject');
    const count = subject.length;
    const maxRecommended = 50; // Limite recommandée pour l'objet
    
    let counter = document.getElementById('subject-counter');
    const subjectField = document.getElementById('newsletter-subject');
    
    if (!counter && subjectField) {
        counter = document.createElement('small');
        counter.id = 'subject-counter';
        counter.style.cssText = `
            display: block; 
            margin-top: 5px; 
            font-weight: 500;
            transition: color 0.3s;
        `;
        subjectField.parentNode.appendChild(counter);
    }
    
    if (counter) {
        counter.textContent = `${count} caractères`;
        
        if (count === 0) {
            counter.style.color = '#666';
        } else if (count <= maxRecommended) {
            counter.style.color = '#28a745';
            counter.textContent += ' ✅';
        } else {
            counter.style.color = '#dc3545';
            counter.textContent += ` ⚠️ (+ de ${maxRecommended} peut réduire le taux d'ouverture)`;
        }
    }
}

// ===============================
// PRÉVISUALISATION MOBILE
// ===============================
function toggleMobilePreview() {
    const preview = document.getElementById('newsletter-preview');
    const button = document.getElementById('mobile-preview-btn');
    
    if (!preview || !button) return;
    
    const isMobile = preview.classList.contains('mobile-preview');
    
    if (isMobile) {
        // Retour vue desktop
        preview.classList.remove('mobile-preview');
        preview.style.maxWidth = '600px';
        preview.style.transform = 'scale(1)';
        preview.style.transformOrigin = 'top center';
        button.innerHTML = '📱 Vue mobile';
        button.className = 'btn btn-light';
    } else {
        // Passage vue mobile
        preview.classList.add('mobile-preview');
        preview.style.maxWidth = '320px';
        preview.style.transform = 'scale(0.8)';
        preview.style.transformOrigin = 'top center';
        button.innerHTML = '💻 Vue desktop';
        button.className = 'btn btn-accent';
    }
}

function initMobilePreviewButton() {
    const previewPanel = document.querySelector('.preview-panel');
    
    if (previewPanel && !document.getElementById('mobile-preview-btn')) {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'margin-bottom: 15px; text-align: center;';
        
        buttonContainer.innerHTML = `
            <button id="mobile-preview-btn" onclick="toggleMobilePreview()" class="btn btn-light" 
                    style="font-size: 0.9em;">
                📱 Vue mobile
            </button>
        `;
        
        // Insérer après le titre h2
        const h2 = previewPanel.querySelector('h2');
        if (h2) {
            h2.parentNode.insertBefore(buttonContainer, h2.nextSibling);
        }
    }
}

// ===============================
// SECTION ADMIN
// ===============================
function initAdmin() {
    const exportBtn = document.getElementById('btn-export');
    const refreshBtn = document.getElementById('btn-refresh');
    const addBtn = document.getElementById('btn-add-email');
    const searchBtn = document.getElementById('btn-search');
    
    if (exportBtn) exportBtn.onclick = exportSubscribers;
    if (refreshBtn) refreshBtn.onclick = loadSubscribersData;
    if (addBtn) addBtn.onclick = addNewSubscriber;
    if (searchBtn) searchBtn.onclick = searchSubscribers;
    
    // Event listeners pour les champs
    const searchInput = document.getElementById('search-input');
    const newEmailInput = document.getElementById('new-email');
    
    if (searchInput) {
        searchInput.addEventListener('input', debouncedSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                debouncedSearch();
            }
        });
    }
    
    if (newEmailInput) {
        newEmailInput.onkeyup = (e) => {
            if (e.key === 'Enter') addNewSubscriber();
        };
    }
    
    // Charger les abonnés automatiquement
    loadSubscribersData();
}

async function loadSubscribersData(page = 1, forceRefresh = false) {
    // Chargement abonnés
    const container = document.getElementById('subscribers-tab');
    const hideLoader = container ? showLoadingState(container, 'Chargement des abonnés...') : null;
    NewsletterState.setLoading(true);
    
    try {
        const response = await fetchWithRetry(
            `${API_URL}?action=get_subscribers&key=${ADMIN_KEY}&page=${page}&limit=50`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const subscribers = result.data.subscribers || [];
            const pagination = result.data.pagination || {};
            
            NewsletterState.setSubscribers(subscribers);
            NewsletterState.setPagination(pagination.page || 1, pagination.total_pages || 1, pagination.total || 0);
            
            renderSubscribers(subscribers);
            renderPagination(pagination);
            updateStats(subscribers, pagination);
            
            if (!forceRefresh) {
                showAlert(`${pagination.total || subscribers.length} abonnés chargés`, 'success');
            }
        } else {
            throw new Error(result.message || 'Erreur inconnue');
        }
    } catch (error) {
        // Erreur (gérée)
        
        // Essayer d'utiliser le cache en cas d'erreur
        try {
            const cached = await DataCache.getSubscribers(true);
            if (cached && cached.length > 0) {
                NewsletterState.setSubscribers(cached);
                renderSubscribers(cached);
                showAlert('⚠️ Données en cache (connexion indisponible)', 'warning');
                return;
            }
        } catch (cacheError) {
            // Erreur cache (silencieux)
        }
        
        showAlert('Erreur de connexion: ' + error.message, 'error');
    } finally {
        if (hideLoader) hideLoader();
        NewsletterState.setLoading(false);
    }
}

/**
 * Rendre la pagination
 */
function renderPagination(pagination) {
    const container = document.getElementById('pagination-container');
    if (!container) {
        // Créer le conteneur si inexistant
        const subscribersTab = document.getElementById('subscribers-tab');
        if (subscribersTab) {
            const paginationDiv = document.createElement('div');
            paginationDiv.id = 'pagination-container';
            paginationDiv.style.cssText = 'margin-top: 1rem; display: flex; justify-content: center; gap: 0.5rem;';
            subscribersTab.appendChild(paginationDiv);
        } else {
            return;
        }
    }
    
    const paginationContainer = document.getElementById('pagination-container');
    if (!pagination || pagination.total_pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    const currentPage = pagination.page || 1;
    const totalPages = pagination.total_pages || 1;
    
    let html = '';
    
    // Bouton précédent
    if (currentPage > 1) {
        html += `<button class="btn btn-light btn-sm" onclick="loadSubscribersData(${currentPage - 1})">← Précédent</button>`;
    }
    
    // Numéros de page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button class="btn btn-light btn-sm" onclick="loadSubscribersData(1)">1</button>`;
        if (startPage > 2) {
            html += `<span>...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="btn btn-primary btn-sm" disabled>${i}</button>`;
        } else {
            html += `<button class="btn btn-light btn-sm" onclick="loadSubscribersData(${i})">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span>...</span>`;
        }
        html += `<button class="btn btn-light btn-sm" onclick="loadSubscribersData(${totalPages})">${totalPages}</button>`;
    }
    
    // Bouton suivant
    if (currentPage < totalPages) {
        html += `<button class="btn btn-light btn-sm" onclick="loadSubscribersData(${currentPage + 1})">Suivant →</button>`;
    }
    
    html += `<span style="margin-left: 1rem; color: #666;">Page ${currentPage} / ${totalPages}</span>`;
    
    paginationContainer.innerHTML = html;
}

// Recherche avec debouncing
const debouncedSearch = debounce(async function() {
    const searchTerm = document.getElementById('search-input')?.value?.trim() || '';
    
    if (searchTerm.length < 2) {
        // Recharger tout si recherche trop courte
        loadSubscribersData(1, true);
        return;
    }
    
    // Recherche en cours
    NewsletterState.setLoading(true);
    
    try {
        const response = await fetchWithRetry(
            `${API_URL}?action=search_subscribers&key=${ADMIN_KEY}&q=${encodeURIComponent(searchTerm)}&page=1&limit=50`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const subscribers = result.data.subscribers || [];
            const pagination = result.data.pagination || {};
            
            NewsletterState.setSubscribers(subscribers);
            NewsletterState.setPagination(pagination.page || 1, pagination.total_pages || 1, pagination.total || 0);
            
            renderSubscribers(subscribers);
            renderPagination(pagination);
            updateStats(subscribers, pagination);
            
            showAlert(`${pagination.total || subscribers.length} résultats trouvés`, 'info');
        } else {
            throw new Error(result.message || 'Erreur recherche');
        }
    } catch (error) {
        // Erreur recherche (gérée)
        showAlert('Erreur de recherche: ' + error.message, 'error');
    } finally {
        NewsletterState.setLoading(false);
    }
}, 300);

async function searchSubscribers() {
    debouncedSearch();
}

function updateStats(subscribers, pagination = null) {
    // Utiliser le total de la pagination si disponible, sinon la longueur du tableau
    const total = pagination?.total ?? subscribers.length;
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newCount = subscribers.filter(sub => 
        sub.date_inscription && new Date(sub.date_inscription) >= oneWeekAgo
    ).length;
    
    const totalEl = document.getElementById('total-emails');
    const newEl = document.getElementById('new-emails');
    
    if (totalEl) totalEl.textContent = total;
    if (newEl) newEl.textContent = newCount;
    
    // Stats mises à jour
}

async function addNewSubscriber() {
    const email = document.getElementById('new-email')?.value?.trim();
    if (!email) return showAlert('Email requis', 'error');
    
    // VALIDATION ROBUSTE
    if (!validateEmail(email)) {
        return showAlert('Email invalide ou dans la liste noire', 'error');
    }
    
    try {
        const formData = new FormData();
        formData.append('action', 'add_subscriber');
        formData.append('email', email);
        formData.append('key', ADMIN_KEY);
        
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('new-email').value = '';
            loadSubscribersData();
            showAlert('✅ Abonné ajouté et validé', 'success');
        }
    } catch (error) {
        showAlert('Erreur', 'error');
    }
}

function renderSubscribers(subscribers) {
    const emailsList = document.getElementById('emails-list');
    const emptyState = document.getElementById('empty-state');
    const emailsTable = document.getElementById('emails-table');
    
    if (!emailsList) {
        // Element emails-list introuvable
        return;
    }
    
    // Rendu abonnés
    
    emailsList.innerHTML = '';
    
    if (subscribers.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (emailsTable) emailsTable.style.display = 'none';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    if (emailsTable) emailsTable.style.display = 'table';
    
    subscribers.forEach((sub, index) => {
        const row = document.createElement('tr');
        const date = sub.date_inscription ? 
            new Date(sub.date_inscription).toLocaleDateString('fr-FR') : 'Inconnu';
        const name = [sub.prenom, sub.nom].filter(n => n).join(' ') || 'Non renseigné';
        
        row.innerHTML = `
            <td>
                <div><strong>${sub.email}</strong></div>
                <div style="font-size:0.9em;color:#666">${name}</div>
            </td>
            <td>${date}</td>
            <td>
                <button onclick="removeSubscriber('${sub.email}')" class="btn btn-light btn-sm">
                    Supprimer
                </button>
            </td>
        `;
        emailsList.appendChild(row);
    });
    
    // Rendu terminé
}

function exportSubscribers() {
    window.open(`${API_URL}?action=export_csv&key=${ADMIN_KEY}`, '_blank');
}

// ===============================
// SECTION ÉDITEUR AMÉLIORÉE
// ===============================
// Validation en temps réel
const FieldValidators = {
    'newsletter-subject': {
        min: 5,
        max: 100,
        required: true,
        pattern: null
    },
    'newsletter-title': {
        min: 3,
        max: 80,
        required: true,
        pattern: null
    },
    'newsletter-content': {
        min: 50,
        max: 5000,
        required: true,
        pattern: null
    },
    'newsletter-cta-link': {
        min: 0,
        max: 500,
        required: false,
        pattern: /^https?:\/\/.+/
    }
};

function validateField(field, rules) {
    const value = field.value.trim();
    const errors = [];
    
    if (rules.required && !value) {
        errors.push('Ce champ est requis');
    }
    
    if (value) {
        if (value.length < rules.min) {
            errors.push(`Minimum ${rules.min} caractères requis`);
        }
        if (value.length > rules.max) {
            errors.push(`Maximum ${rules.max} caractères autorisés`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
            errors.push('Format invalide (doit commencer par http:// ou https://)');
        }
    }
    
    if (errors.length > 0) {
        showFieldError(field, errors.join(', '));
        return false;
    }
    
    clearFieldError(field);
    return true;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    field.style.borderColor = '#e74c3c';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #e74c3c; font-size: 0.875rem; margin-top: 0.25rem;';
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    field.style.borderColor = '';
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function initEditor() {
    // Event listeners pour preview en temps réel + sauvegarde auto + validation
    ['newsletter-subject', 'newsletter-title', 'newsletter-intro', 'newsletter-content', 'newsletter-cta-text', 'newsletter-cta-link'].forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            const rules = FieldValidators[id];
            
            // Validation au blur
            if (rules) {
                field.addEventListener('blur', () => {
                    validateField(field, rules);
                });
                
                // Clear erreur à la saisie
                field.addEventListener('input', () => {
                    clearFieldError(field);
                });
            }
            
            field.oninput = function() {
                updateEditorPreview();
                if (id === 'newsletter-subject') {
                    updateCharacterCount();
                }
                // Auto-sauvegarde avec délai
                clearTimeout(field.saveTimeout);
                field.saveTimeout = setTimeout(autoSaveDraft, 2000);
            };
        }
    });
    
    // Ajouter bouton versions dans les templates
    const templateContainer = document.getElementById('template-buttons');
    if (templateContainer && !document.getElementById('versions-btn')) {
        const versionsBtn = document.createElement('button');
        versionsBtn.id = 'versions-btn';
        versionsBtn.type = 'button';
        versionsBtn.onclick = showDraftVersions;
        versionsBtn.className = 'btn btn-light btn-sm';
        versionsBtn.innerHTML = '📚 Versions';
        templateContainer.querySelector('div').appendChild(versionsBtn);
    }
    
    updateEditorPreview();
    updateCharacterCount();
    initMobilePreviewButton();
    
    // Sauvegarde périodique (toutes les 2 minutes)
    setInterval(autoSaveDraft, 120000);
    
    // Éditeur initialisé
}

function updateEditorPreview() {
    const previewDiv = document.getElementById('newsletter-preview');
    if (!previewDiv) return;
    
    const data = {
        subject: getFieldValue('newsletter-subject') || 'Newsletter Les Gloutonnes',
        title: getFieldValue('newsletter-title') || 'Nouvelles des Gloutonnes',
        intro: getFieldValue('newsletter-intro') || 'Salut ! J\'espère que tu vas bien.',
        content: getFieldValue('newsletter-content') || 'Contenu de la newsletter...',
        ctaText: getFieldValue('newsletter-cta-text') || 'Découvrir mes plantes',
        ctaLink: getFieldValue('newsletter-cta-link') || 'https://www.lesgloutonnes.be'
    };
    
    const html = generateNewsletterHTML(data);
    previewDiv.innerHTML = html;
}

function generateNewsletterHTML(data) {
    // Logo avec tracking si campagne active
    const campaignId = window.getCurrentCampaignId ? window.getCurrentCampaignId() : null;
    const baseUrl = getTrackingBaseUrl();
    
    let logoUrl = 'https://www.lesgloutonnes.be/images/logo/logo.png';
    if (campaignId) {
        logoUrl = `${baseUrl}/track-logo.php?c=${campaignId}&r=${encodeURIComponent(logoUrl)}`;
    }
    
    return `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #ddd; border-radius: 8px;">
            <div style="background: #5b0092; padding: 30px; text-align: center;">
                <h1 style="color: white; font-size: 28px; margin: 0 0 15px 0;">${data.title}</h1>
                <div style="text-align: center; margin: 10px 0;">
                    <img src="${logoUrl}" alt="Les Gloutonnes" style="max-width: 150px; height: auto; display: inline-block;" />
                </div>
                <p style="color: #fff; margin: 10px 0 0 0;">Ta passion pour les plantes carnivores</p>
            </div>
            
            <div style="padding: 30px;">
                <div style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                    ${data.intro.replace(/\n/g, '<br>')}
                </div>
                
                <div style="margin: 20px 0; text-align: center;">
                    ${formatContent(data.content)}
                </div>
            </div>
            
            ${data.ctaText && data.ctaLink ? `
            <div style="background: #ff9100; padding: 20px; text-align: center;">
                <a href="${data.ctaLink}" style="color: white; text-decoration: none; font-weight: bold; font-size: 18px;">
                    ${data.ctaText}
                </a>
            </div>
            ` : ''}
            
            <div style="padding: 20px; font-size: 12px; color: #666; line-height: 1.4; text-align: center;">
                <strong style="color: #333;">Les Gloutonnes</strong><br>
                Charles Bussers<br>
                Voie des Jardinets 47B, 4537 Verlaine, Belgique<br>
                <a href="mailto:infos@lesgloutonnes.be" style="color: #5b0092;">infos@lesgloutonnes.be</a> | 
                <a href="tel:+32494811487" style="color: #5b0092;">+32 494 81 14 87</a>
                
                <div style="margin: 15px 0 0 0; font-size: 12px;">
                    <a href="../pages/unsubscribe.php" style="color: #dc3545; text-decoration: none;">Se désabonner</a> | 
                    <a href="https://www.lesgloutonnes.be" style="color: #5b0092; text-decoration: none;">www.lesgloutonnes.be</a>
                </div>
            </div>
        </div>
    `;
}

// ===============================
// SYSTÈME DE LOTS OPTIMISÉ
// ===============================
async function loadAllSubscribersForBatches() {
    try {
        // Charger la première page avec limite maximale (100)
        const response = await fetch(`${API_URL}?action=get_subscribers&key=${ADMIN_KEY}&limit=100&page=1`);
        const result = await response.json();
        
        if (result.success) {
            allSubscribers = result.data.subscribers || [];
            const pagination = result.data.pagination || {};
            const total = pagination.total || allSubscribers.length;
            const totalPages = pagination.total_pages || 1;
            
            // Si on a plusieurs pages, charger toutes les pages
            if (totalPages > 1) {
                const allPages = [result.data.subscribers];
                
                // Charger les autres pages
                for (let page = 2; page <= totalPages; page++) {
                    try {
                        const pageResponse = await fetch(`${API_URL}?action=get_subscribers&key=${ADMIN_KEY}&limit=100&page=${page}`);
                        const pageResult = await pageResponse.json();
                        if (pageResult.success && pageResult.data.subscribers) {
                            allPages.push(pageResult.data.subscribers);
                        }
                    } catch (err) {
                        console.error(`Erreur chargement page ${page}:`, err);
                    }
                }
                
                // Fusionner tous les abonnés
                allSubscribers = allPages.flat();
            }
            
            createBatchButtons();
        } else {
            console.error('Erreur chargement abonnés:', result.message);
            showAlert('Erreur lors du chargement des abonnés', 'error');
        }
    } catch (error) {
        console.error('Erreur chargement abonnés:', error);
        showAlert('Erreur lors du chargement des abonnés', 'error');
    }
}

function createBatchButtons() {
    const container = document.getElementById('batch-buttons-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!allSubscribers || allSubscribers.length === 0) {
        container.innerHTML = '<p style="color: #666;">Aucun abonné disponible pour créer des lots.</p>';
        return;
    }
    
    const totalBatches = Math.ceil(allSubscribers.length / BATCH_SIZE);
    
    // Créer un conteneur flex pour les boutons de lots
    const batchesWrapper = document.createElement('div');
    batchesWrapper.style.display = 'flex';
    batchesWrapper.style.flexWrap = 'wrap';
    batchesWrapper.style.gap = '10px';
    batchesWrapper.style.marginBottom = '15px';
    
    for (let i = 0; i < totalBatches; i++) {
        const startIndex = i * BATCH_SIZE;
        const endIndex = Math.min(startIndex + BATCH_SIZE, allSubscribers.length);
        const count = endIndex - startIndex;
        
        const button = document.createElement('button');
        button.className = 'btn btn-primary batch-btn';
        button.setAttribute('data-batch-index', i);
        button.innerHTML = `📥 Lot ${i + 1} (${count} emails)`;
        button.onclick = () => loadBatch(i);
        
        batchesWrapper.appendChild(button);
    }
    
    container.appendChild(batchesWrapper);
    
    const mailtoButton = document.createElement('button');
    mailtoButton.id = 'btn-create-mailto-batch';
    mailtoButton.className = 'btn btn-accent';
    mailtoButton.innerHTML = '📧 Créer email Outlook';
    mailtoButton.onclick = createSimpleMailtoForCurrentBatch;
    mailtoButton.disabled = true;
    
    container.appendChild(mailtoButton);
    
    // Afficher les informations sur les lots
    const batchInfo = document.getElementById('batch-info');
    if (batchInfo) {
        batchInfo.innerHTML = `
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                <strong>📊 Statistiques des lots :</strong><br>
                <small>Total d'abonnés : ${allSubscribers.length} | Nombre de lots : ${totalBatches} | Taille par lot : ${BATCH_SIZE} emails max</small>
            </div>
        `;
    }
}

function loadBatch(batchIndex) {
    if (!allSubscribers || allSubscribers.length === 0) {
        showAlert('Aucun abonné disponible', 'error');
        return;
    }
    
    const startIndex = batchIndex * BATCH_SIZE;
    const endIndex = Math.min(startIndex + BATCH_SIZE, allSubscribers.length);
    const batchEmails = allSubscribers.slice(startIndex, endIndex);
    
    if (batchEmails.length === 0) {
        showAlert(`Le lot ${batchIndex + 1} est vide`, 'error');
        return;
    }
    
    const emailListTextarea = document.getElementById('email-list-textarea');
    if (emailListTextarea) {
        emailListTextarea.value = batchEmails.map(sub => sub.email).join('\n');
    }
    
    currentBatchLoaded = batchIndex;
    
    // Mise à jour visuelle des boutons en utilisant data-batch-index
    document.querySelectorAll('.batch-btn').forEach((btn) => {
        const btnIndex = parseInt(btn.getAttribute('data-batch-index'));
        if (btnIndex === batchIndex) {
            btn.classList.add('active');
            btn.innerHTML = `✅ Lot ${batchIndex + 1} chargé`;
        } else {
            btn.classList.remove('active');
            const btnStartIndex = btnIndex * BATCH_SIZE;
            const btnEndIndex = Math.min(btnStartIndex + BATCH_SIZE, allSubscribers.length);
            const btnCount = btnEndIndex - btnStartIndex;
            btn.innerHTML = `📥 Lot ${btnIndex + 1} (${btnCount} emails)`;
        }
    });
    
    const mailtoButton = document.getElementById('btn-create-mailto-batch');
    if (mailtoButton) {
        mailtoButton.disabled = false;
    }
    
    showAlert(`Lot ${batchIndex + 1} chargé: ${batchEmails.length} emails`, 'success');
}

// FONCTION MAILTO SIMPLIFIÉE (sans corps de message)
function createSimpleMailtoForCurrentBatch() {
    const emailListTextarea = document.getElementById('email-list-textarea');
    const emailList = emailListTextarea?.value?.trim();
    
    if (!emailList) {
        showAlert('Aucun lot chargé', 'error');
        return;
    }
    
    const emails = emailList.split('\n').filter(email => email.trim());
    const subject = getFieldValue('newsletter-subject') || 'Newsletter Les Gloutonnes';
    
    // MAILTO SIMPLIFIÉ : Expéditeur fixe + BCC + Objet seulement
    const fromEmail = 'infos@lesgloutonnes.be';
    const bccEmails = emails.join(',');
    const encodedSubject = encodeURIComponent(subject);
    
    // Structure mailto simple pour éviter les limites de caractères
    const mailtoLink = `mailto:${fromEmail}?bcc=${encodeURIComponent(bccEmails)}&subject=${encodedSubject}`;
    
    window.open(mailtoLink);
    
    showAlert(`✅ Email créé pour ${emails.length} destinataires. Copie le HTML du preview pour le contenu !`, 'success');
    
    // Auto-publication sociale si activée
    setTimeout(() => {
        checkAndCreateSocialPublication();
    }, 1000);
}

// ===============================
// FONCTIONS UTILITAIRES
// ===============================
function getFieldValue(fieldId) {
    const field = document.getElementById(fieldId);
    return field ? field.value.trim() : '';
}

function formatContent(content) {
    if (!content) return '';
    return content.split('\n\n').map(p => 
        p.trim() ? `<p style="margin: 0 0 15px 0;">${p.trim().replace(/\n/g, '<br>')}</p>` : ''
    ).join('');
}

function getTrackingBaseUrl() {
    const domain = window.location.hostname;
    if (domain.includes('cluster021.hosting.ovh.net')) {
        return 'https://lesglom.cluster021.hosting.ovh.net';
    } else if (domain.includes('lesgloutonnes.be')) {
        return 'https://www.lesgloutonnes.be';
    }
    return `${window.location.protocol}//${window.location.hostname}`;
}

function showAlert(message, type = 'info') {
    // Alert affichée
    
    // Supprimer les anciens messages
    document.querySelectorAll('.temp-message, .alert, .stats-message').forEach(msg => msg.remove());
    
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8'
    };
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'temp-message';
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px;
        border-radius: 5px; color: white; font-weight: 500; z-index: 1000;
        background-color: ${colors[type] || colors.info};
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        max-width: 350px; word-wrap: break-word;
    `;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// ===============================
// FONCTIONS GLOBALES
// ===============================
window.removeSubscriber = async function(email) {
    if (!confirm(`Supprimer ${email} ?`)) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'remove_subscriber');
        formData.append('email', email);
        formData.append('key', ADMIN_KEY);
        
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const result = await response.json();
        
        if (result.success) {
            loadSubscribersData();
            showAlert('Supprimé', 'success');
        }
    } catch (error) {
        showAlert('Erreur', 'error');
    }
};

window.copyPreviewHTML = function() {
    const previewDiv = document.getElementById('newsletter-preview');
    if (!previewDiv) return;
    
    navigator.clipboard.writeText(previewDiv.innerHTML).then(() => {
        showAlert('HTML copié !', 'success');
    }).catch(() => {
        showAlert('Erreur copie', 'error');
    });
};

// Fonctions globales pour les templates
window.loadMonthlyTemplate = loadMonthlyTemplate;
window.loadLastDraft = loadLastDraft;
window.clearCurrentDraft = clearCurrentDraft;
window.toggleMobilePreview = toggleMobilePreview;

// ===============================
// AUTO-PUBLICATION SOCIALE SIMPLIFIÉE
// ===============================
async function checkAndCreateSocialPublication() {
    try {
        const campaignId = window.getCurrentCampaignId ? window.getCurrentCampaignId() : null;
        const title = getFieldValue('newsletter-title') || getFieldValue('newsletter-subject');
        const intro = getFieldValue('newsletter-intro');
        const link = 'https://www.lesgloutonnes.be/newsletter/' + (campaignId || Date.now());
        
        if (!campaignId || !title) {
            // Données newsletter insuffisantes
            return;
        }
        
        const formData = new FormData();
        formData.append('action', 'create_auto_publication');
        formData.append('key', 'gloutonnes2025');
        formData.append('campaign_id', campaignId);
        formData.append('newsletter_title', title);
        formData.append('newsletter_intro', intro);
        formData.append('newsletter_link', link);
        
        const response = await fetch('../api/social-api.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success && result.data.created) {
            const scheduledTime = new Date(result.data.scheduled_time).toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            showAlert(`📱 Publication sociale programmée pour ${scheduledTime}`, 'info');
        }
        
    } catch (error) {
        // Erreur auto-publication (silencieux)
    }
}

// ===============================
// DÉMARRAGE ET AUTO-NETTOYAGE
// ===============================

// Auto-nettoyage des messages au changement d'onglet
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('nav-tab')) {
        setTimeout(() => {
            const oldMessages = document.querySelectorAll('.temp-message, .stats-message');
            if (oldMessages.length > 1) {
                oldMessages.forEach((msg, index) => {
                    if (index < oldMessages.length - 1) msg.remove();
                });
            }
        }, 100);
    }
});

// Message de bienvenue avec les nouvelles fonctionnalités
// Newsletter Script COMPLET - PRÊT