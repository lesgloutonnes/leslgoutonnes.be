/**
 * AMÉLIORATIONS NEWSLETTER - Exemples d'implémentation
 * À intégrer progressivement dans newsletter-admin.js
 */

// ================================
// 1. RETRY AUTOMATIQUE
// ================================
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(10000) // Timeout 10s
            });
            
            if (response.ok) {
                return response;
            }
            
            // Retry sur erreurs 5xx
            if (response.status >= 500 && i < maxRetries - 1) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return response; // Ne pas retry sur 4xx
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error;
            }
            
            // Backoff exponentiel
            const delay = 1000 * Math.pow(2, i);
            console.warn(`⚠️ Tentative ${i + 1}/${maxRetries} échouée, retry dans ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// ================================
// 2. DEBOUNCING RECHERCHE
// ================================
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

// Utilisation
const debouncedSearch = debounce(async function() {
    const searchTerm = document.getElementById('search-input')?.value?.trim() || '';
    if (searchTerm.length < 2) {
        loadSubscribersData(); // Recharger tout si recherche trop courte
        return;
    }
    
    try {
        const response = await fetchWithRetry(
            `${API_URL}?action=search_subscribers&key=${ADMIN_KEY}&q=${encodeURIComponent(searchTerm)}`
        );
        const result = await response.json();
        
        if (result.success) {
            renderSubscribers(result.data.subscribers || []);
        }
    } catch (error) {
        console.error('Erreur recherche:', error);
        showAlert('Erreur de recherche. Réessayez.', 'error');
    }
}, 300);

// Attacher au champ de recherche
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debouncedSearch);
    }
});

// ================================
// 3. CACHE INTELLIGENT
// ================================
const DataCache = {
    subscribers: null,
    campaigns: null,
    lastFetch: {
        subscribers: null,
        campaigns: null
    },
    cacheDuration: 5 * 60 * 1000, // 5 minutes
    
    async getSubscribers(forceRefresh = false) {
        const now = Date.now();
        const lastFetch = this.lastFetch.subscribers;
        
        if (!forceRefresh && 
            this.subscribers && 
            lastFetch && 
            (now - lastFetch) < this.cacheDuration) {
            console.log('📦 Utilisation du cache abonnés');
            return Promise.resolve(this.subscribers);
        }
        
        try {
            const response = await fetchWithRetry(
                `${API_URL}?action=get_subscribers&key=${ADMIN_KEY}`
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
                console.warn('⚠️ Utilisation cache expiré suite à erreur');
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
        if (type === 'all' || type === 'campaigns') {
            this.campaigns = null;
            this.lastFetch.campaigns = null;
        }
    }
};

// ================================
// 4. GESTION D'ÉTAT CENTRALISÉE
// ================================
const NewsletterState = {
    subscribers: [],
    currentBatch: null,
    currentCampaign: null,
    drafts: [],
    isLoading: false,
    
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
                    console.error(`Erreur dans listener ${event}:`, error);
                }
            });
        }
    },
    
    setSubscribers(subscribers) {
        this.subscribers = subscribers;
        this.emit('subscribers_changed', subscribers);
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

// Exemple d'utilisation
NewsletterState.on('subscribers_changed', (subscribers) => {
    console.log(`📊 ${subscribers.length} abonnés chargés`);
    updateStats(subscribers);
});

NewsletterState.on('loading_changed', (isLoading) => {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = isLoading ? 'block' : 'none';
    }
});

// ================================
// 5. VALIDATION TEMPS RÉEL
// ================================
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

function setupRealTimeValidation() {
    Object.keys(FieldValidators).forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        const rules = FieldValidators[fieldId];
        
        // Validation au blur
        field.addEventListener('blur', () => {
            validateField(field, rules);
        });
        
        // Clear erreur à la saisie
        field.addEventListener('input', () => {
            clearFieldError(field);
        });
    });
}

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
            errors.push('Format invalide');
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
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #e74c3c; font-size: 0.875rem; margin-top: 0.25rem;';
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// ================================
// 6. INDICATEURS DE CHARGEMENT
// ================================
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

// Utilisation
async function loadSubscribersDataWithLoader() {
    const container = document.getElementById('subscribers-tab');
    if (!container) return;
    
    const hideLoader = showLoadingState(container, 'Chargement des abonnés...');
    NewsletterState.setLoading(true);
    
    try {
        const subscribers = await DataCache.getSubscribers();
        NewsletterState.setSubscribers(subscribers);
        renderSubscribers(subscribers);
    } catch (error) {
        console.error('Erreur:', error);
        showAlert('Erreur de chargement. Réessayez.', 'error');
    } finally {
        hideLoader();
        NewsletterState.setLoading(false);
    }
}

// ================================
// 7. VERSIONNING BROUILLONS
// ================================
function saveDraftVersion() {
    const draft = {
        subject: getFieldValue('newsletter-subject'),
        title: getFieldValue('newsletter-title'),
        intro: getFieldValue('newsletter-intro'),
        content: getFieldValue('newsletter-content'),
        ctaText: getFieldValue('newsletter-cta-text'),
        ctaLink: getFieldValue('newsletter-cta-link'),
        version: Date.now(),
        saved_at: new Date().toISOString()
    };
    
    const currentMonth = new Date().getMonth();
    const storageKey = `newsletter_draft_versions_${currentMonth}`;
    
    const versions = JSON.parse(localStorage.getItem(storageKey) || '[]');
    versions.push(draft);
    
    // Trier par date (plus récent en premier)
    versions.sort((a, b) => b.version - a.version);
    
    // Garder seulement les 10 dernières versions
    const keptVersions = versions.slice(0, 10);
    
    localStorage.setItem(storageKey, JSON.stringify(keptVersions));
    
    // Sauvegarder aussi comme version actuelle
    localStorage.setItem(`newsletter_draft_${currentMonth}`, JSON.stringify(draft));
    
    console.log(`💾 Version sauvegardée (${keptVersions.length} versions au total)`);
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
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Versions sauvegardées</h3>
            <ul>
                ${versions.map(v => `
                    <li>
                        <button onclick="loadDraftVersion(${v.version})">
                            ${new Date(v.saved_at).toLocaleString('fr-FR')}
                        </button>
                    </li>
                `).join('')}
            </ul>
            <button onclick="this.closest('.modal').remove()">Fermer</button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// ================================
// INITIALISATION
// ================================
document.addEventListener('DOMContentLoaded', () => {
    setupRealTimeValidation();
    
    // Utiliser le cache pour le chargement initial
    loadSubscribersDataWithLoader();
});

