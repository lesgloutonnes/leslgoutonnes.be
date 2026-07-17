/**
 * AMÉLIORATIONS SOCIAL PUBLISHER - Exemples d'implémentation
 * À intégrer progressivement dans social-publisher.js
 */

// ================================
// 1. ANALYSE INCRÉMENTALE
// ================================
let lastAnalyzedText = '';
let analysisCache = {};

function getTextDiff(oldText, newText) {
    // Simple diff : retourner les caractères ajoutés
    if (oldText.length >= newText.length) {
        return newText;
    }
    return newText.slice(oldText.length);
}

function updateIncrementalAnalysis(diff) {
    // Analyser seulement la nouvelle partie
    const newAnalysis = window.advancedAI?.analyzeContent(diff) || {};
    
    // Fusionner avec l'analyse précédente
    if (analysisCache.full) {
        analysisCache.full = {
            ...analysisCache.full,
            // Mettre à jour les métriques
            wordCount: analysisCache.full.wordCount + (diff.split(/\s+/).length),
            charCount: analysisCache.full.charCount + diff.length
        };
    }
    
    updateUI(analysisCache.full);
}

function updateRealTimeInsightsOptimized() {
    const text = appState.currentText.trim();
    
    // Ne pas réanalyser si pas de changement significatif
    if (text === lastAnalyzedText) {
        return;
    }
    
    const diff = getTextDiff(lastAnalyzedText, text);
    
    // Si changement mineur (< 10 caractères), mise à jour incrémentale
    if (diff.length < 10 && analysisCache.full) {
        updateIncrementalAnalysis(diff);
    } else {
        // Analyse complète avec debounce
        clearTimeout(window.analysisTimeout);
        window.analysisTimeout = setTimeout(() => {
            const analysis = window.advancedAI?.analyzeContent(text) || {};
            analysisCache.full = analysis;
            updateUI(analysis);
        }, 500);
    }
    
    lastAnalyzedText = text;
}

// ================================
// 2. SAUVEGARDE INTELLIGENTE
// ================================
let lastSavedContent = '';
let saveQueue = [];

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

function autoSaveOptimized() {
    const current = appState.currentText;
    
    // Ne sauvegarder que si changement significatif (> 10 caractères)
    const diff = getTextDiff(lastSavedContent, current);
    if (diff.length < 10 && lastSavedContent) {
        return;
    }
    
    // Ajouter à la queue
    saveQueue.push({
        content: current,
        hashtags: appState.currentHashtags,
        timestamp: Date.now()
    });
    
    // Garder seulement les 5 dernières sauvegardes en queue
    if (saveQueue.length > 5) {
        saveQueue.shift();
    }
    
    // Sauvegarder avec debounce
    debouncedServerSave();
}

const debouncedServerSave = debounce(async () => {
    if (saveQueue.length === 0) return;
    
    // Prendre la dernière version
    const latest = saveQueue[saveQueue.length - 1];
    
    try {
        await saveDraftToServer(latest);
        saveQueue = [];
        lastSavedContent = latest.content;
        console.log('💾 Sauvegarde réussie');
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        // Garder en queue pour retry plus tard
    }
}, 5000);

async function saveDraftToServer(data) {
    const formData = new FormData();
    formData.append('action', 'save_draft');
    formData.append('key', 'gloutonnes2025');
    formData.append('content', data.content);
    formData.append('hashtags', data.hashtags);
    
    const response = await fetch('../api/social-api.php', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'Erreur serveur');
    }
    
    return result;
}

// ================================
// 3. RETRY AVEC OFFLINE QUEUE
// ================================
const OfflineQueue = {
    queue: [],
    
    init() {
        // Charger la queue depuis localStorage
        const saved = localStorage.getItem('social_offline_queue');
        if (saved) {
            try {
                this.queue = JSON.parse(saved);
                this.processQueue();
            } catch (e) {
                console.error('Erreur chargement queue:', e);
            }
        }
    },
    
    add(action, data) {
        this.queue.push({
            action,
            data,
            timestamp: Date.now(),
            retries: 0
        });
        this.save();
    },
    
    async processQueue() {
        if (this.queue.length === 0) return;
        
        const item = this.queue[0];
        
        try {
            await this.executeAction(item);
            this.queue.shift();
            this.save();
            
            // Traiter le suivant
            if (this.queue.length > 0) {
                setTimeout(() => this.processQueue(), 1000);
            }
        } catch (error) {
            item.retries++;
            
            if (item.retries >= 3) {
                // Abandonner après 3 tentatives
                console.error('Abandon après 3 tentatives:', item);
                this.queue.shift();
                this.save();
            } else {
                // Retry avec backoff
                const delay = 5000 * item.retries;
                setTimeout(() => this.processQueue(), delay);
            }
        }
    },
    
    async executeAction(item) {
        const formData = new FormData();
        formData.append('action', item.action);
        formData.append('key', 'gloutonnes2025');
        
        Object.entries(item.data).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        const response = await fetch('../api/social-api.php', {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }
        
        return result;
    },
    
    save() {
        localStorage.setItem('social_offline_queue', JSON.stringify(this.queue));
    }
};

// Initialiser au chargement
OfflineQueue.init();

// Utilisation
async function saveDraftWithOfflineSupport(data) {
    try {
        await saveDraftToServer(data);
    } catch (error) {
        console.warn('Sauvegarde en queue offline:', error);
        OfflineQueue.add('save_draft', data);
        showMessage('⚠️ Sauvegarde en attente (hors ligne)', 'warning');
    }
}

// ================================
// 4. EXTRACTION HASHTAGS AVANCÉE
// ================================
async function extractHashtagsAdvanced(text) {
    const hashtags = new Set();
    
    // 1. Hashtags explicites dans le texte
    const explicit = text.match(/#\w+/g) || [];
    explicit.forEach(h => hashtags.add(h.toLowerCase()));
    
    // 2. Suggestions basées sur le contenu
    const contentHashtags = suggestHashtagsFromContent(text);
    contentHashtags.forEach(h => hashtags.add(h.toLowerCase()));
    
    // 3. Hashtags populaires depuis l'API
    try {
        const popular = await getPopularHashtags();
        popular.slice(0, 3).forEach(h => hashtags.add(h.toLowerCase()));
    } catch (error) {
        console.warn('Impossible de charger hashtags populaires:', error);
    }
    
    // 4. Hashtags par défaut
    const defaults = ['#PlantesCarnivoRes', '#LesGloutonnes'];
    defaults.forEach(h => hashtags.add(h.toLowerCase()));
    
    // Retourner array limité à 15
    return Array.from(hashtags).slice(0, 15);
}

async function getPopularHashtags() {
    try {
        const response = await fetch(
            '../api/social-api.php?action=get_hashtag_stats&key=gloutonnes2025&limit=10&order_by=usage_count'
        );
        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data.map(h => h.hashtag);
        }
        return [];
    } catch (error) {
        console.error('Erreur chargement hashtags populaires:', error);
        return [];
    }
}

function suggestHashtagsFromContent(text) {
    const suggestions = [];
    const lowerText = text.toLowerCase();
    
    // Mots-clés à détecter
    const keywords = {
        'plante': '#PlantesCarnivoRes',
        'carnivore': '#PlantesCarnivoRes',
        'dionaea': '#Dionaea',
        'sarra': '#Sarracenia',
        'nepenthes': '#Nepenthes',
        'atelier': '#Atelier',
        'conseil': '#Conseil',
        'nouveauté': '#Nouveauté',
        'bourse': '#BoursePlantes'
    };
    
    Object.entries(keywords).forEach(([keyword, hashtag]) => {
        if (lowerText.includes(keyword)) {
            suggestions.push(hashtag);
        }
    });
    
    return suggestions;
}

// ================================
// 5. PLANIFICATION
// ================================
function showScheduleModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Planifier la publication</h3>
            <label>
                Date et heure :
                <input type="datetime-local" id="schedule-datetime" required>
            </label>
            <label>
                Plateformes :
                <div>
                    <label><input type="checkbox" name="platform" value="facebook" checked> Facebook</label>
                    <label><input type="checkbox" name="platform" value="instagram" checked> Instagram</label>
                </div>
            </label>
            <div style="margin-top: 1rem;">
                <button onclick="confirmSchedule()" class="btn btn-primary">Planifier</button>
                <button onclick="this.closest('.modal').remove()" class="btn btn-light">Annuler</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Définir la date/heure par défaut (maintenant + 1h)
    const now = new Date();
    now.setHours(now.getHours() + 1);
    const datetimeInput = document.getElementById('schedule-datetime');
    datetimeInput.value = now.toISOString().slice(0, 16);
}

async function confirmSchedule() {
    const datetimeInput = document.getElementById('schedule-datetime');
    const datetime = new Date(datetimeInput.value);
    
    if (datetime < new Date()) {
        showMessage('⚠️ La date doit être dans le futur', 'error');
        return;
    }
    
    const platforms = Array.from(
        document.querySelectorAll('input[name="platform"]:checked')
    ).map(cb => cb.value);
    
    if (platforms.length === 0) {
        showMessage('⚠️ Sélectionnez au moins une plateforme', 'error');
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('action', 'save_publication');
        formData.append('key', 'gloutonnes2025');
        formData.append('content', appState.currentText);
        formData.append('hashtags', appState.currentHashtags);
        formData.append('platforms', JSON.stringify(platforms));
        formData.append('status', 'scheduled');
        formData.append('scheduled_at', datetime.toISOString());
        
        const response = await fetch('../api/social-api.php', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage(`✅ Publication planifiée pour le ${datetime.toLocaleString('fr-FR')}`, 'success');
            document.querySelector('.modal').remove();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Erreur planification:', error);
        showMessage('❌ Erreur lors de la planification', 'error');
    }
}

// ================================
// 6. HISTORIQUE
// ================================
async function loadPublicationHistory() {
    try {
        const response = await fetch(
            '../api/social-api.php?action=get_publications&key=gloutonnes2025&limit=50&status=published'
        );
        const result = await response.json();
        
        if (result.success) {
            renderHistory(result.data);
        }
    } catch (error) {
        console.error('Erreur chargement historique:', error);
        showMessage('❌ Erreur chargement historique', 'error');
    }
}

function renderHistory(publications) {
    const container = document.getElementById('publication-history') || createHistoryContainer();
    
    if (publications.length === 0) {
        container.innerHTML = '<p>Aucune publication trouvée</p>';
        return;
    }
    
    container.innerHTML = publications.map(pub => `
        <div class="history-item">
            <div class="history-content">${pub.content.substring(0, 100)}...</div>
            <div class="history-meta">
                <span>${new Date(pub.published_at).toLocaleString('fr-FR')}</span>
                <span>${pub.platforms.join(', ')}</span>
                ${pub.facebook_reach ? `<span>Portée: ${pub.facebook_reach}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function createHistoryContainer() {
    const container = document.createElement('div');
    container.id = 'publication-history';
    container.className = 'history-container';
    document.body.appendChild(container);
    return container;
}

// Exporter pour utilisation globale
window.socialImprovements = {
    updateRealTimeInsightsOptimized,
    autoSaveOptimized,
    extractHashtagsAdvanced,
    showScheduleModal,
    loadPublicationHistory
};

