/**
 * ANALYTICS.JS - LES GLOUTONNES
 * Google Analytics + Système de cookies RGPD intégré
 * Version tout-en-un - Il suffit d'inclure ce fichier !
 * 
 * @author Charles Bussers - Les Gloutonnes
 * @version 2.0 - Avec cookies RGPD
 */

(function() {
    'use strict';

    // ====== CONFIGURATION ======
    const GLOUTONNES_GA_ID = 'G-X7882J8W2Z';
    const COOKIE_NAME = 'gloutonnes_cookie_consent';
    const COOKIE_EXPIRY_DAYS = 365;

    // ====== STYLES CSS POUR LES COOKIES ======
    function injectCookieStyles() {
        if (document.getElementById('gloutonnes-cookie-styles')) return;

        const style = document.createElement('style');
        style.id = 'gloutonnes-cookie-styles';
        style.textContent = `
        /* Cookies Banner - Les Gloutonnes */
        .glt-cookie-banner {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #5b0092 0%, #7b1fa2 100%);
            color: white;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(91, 0, 146, 0.2);
            z-index: 999999;
            border-top: 3px solid #ff9100;
            transform: translateY(100%);
            transition: transform 0.4s ease;
            font-family: 'Poppins', -apple-system, sans-serif;
        }
        .glt-cookie-banner.show { transform: translateY(0); }
        .glt-cookie-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        .glt-cookie-icon {
            font-size: 2rem;
            animation: glt-bounce 2s infinite;
        }
        @keyframes glt-bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-5px); }
        }
        .glt-cookie-text {
            flex: 1;
            min-width: 300px;
        }
        .glt-cookie-text h3 {
            margin: 0 0 8px 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: #ff9100;
        }
        .glt-cookie-text p {
            margin: 0;
            font-size: 0.9rem;
            opacity: 0.95;
        }
        .glt-cookie-text a {
            color: #ff9100;
            text-decoration: underline;
        }
        .glt-cookie-buttons {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
        }
        .glt-cookie-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            font-family: inherit;
            font-weight: 500;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;
        }
        .glt-cookie-btn-accept {
            background: #ff9100;
            color: white;
        }
        .glt-cookie-btn-accept:hover {
            background: #e8860e;
            transform: translateY(-1px);
        }
        .glt-cookie-btn-decline {
            background: transparent;
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
        }
        .glt-cookie-btn-decline:hover {
            background: rgba(255,255,255,0.1);
        }
        .glt-cookie-btn-settings {
            background: transparent;
            color: #ff9100;
            border: 1px solid #ff9100;
            font-size: 0.8rem;
            padding: 8px 16px;
        }
        .glt-cookie-btn-settings:hover {
            background: #ff9100;
            color: white;
        }
        
        /* Modal de paramètres */
        .glt-cookie-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 999998;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: 'Poppins', sans-serif;
        }
        .glt-modal-content {
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 600px;
            width: 100%;
            max-height: 80vh;
            overflow-y: auto;
        }
        .glt-modal-content h2 {
            color: #5b0092;
            margin-top: 0;
        }
        .glt-cookie-category {
            margin: 20px 0;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: #fafafa;
        }
        .glt-category-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .glt-category-header h3 {
            color: #5b0092;
            margin: 0;
        }
        .glt-toggle {
            position: relative;
            width: 50px;
            height: 24px;
        }
        .glt-toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .glt-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: 0.4s;
            border-radius: 24px;
        }
        .glt-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: 0.4s;
            border-radius: 50%;
        }
        .glt-toggle input:checked + .glt-slider {
            background-color: #ff9100;
        }
        .glt-toggle input:checked + .glt-slider:before {
            transform: translateX(26px);
        }
        .glt-required {
            background: #f0f8f0 !important;
            border-color: #4caf50 !important;
        }
        .glt-required .glt-toggle {
            opacity: 0.5;
            pointer-events: none;
        }
        .glt-modal-buttons {
            display: flex;
            gap: 15px;
            justify-content: flex-end;
            margin-top: 30px;
        }
        
        /* Version mobile */
        @media (max-width: 768px) {
            .glt-cookie-content {
                flex-direction: column;
                text-align: center;
                gap: 15px;
            }
            .glt-cookie-buttons {
                justify-content: center;
                width: 100%;
            }
            .glt-cookie-btn {
                flex: 1;
                min-width: 120px;
            }
            .glt-modal-content {
                margin: 10px;
                padding: 20px;
            }
        }
        `;
        document.head.appendChild(style);
    }

    // ====== HTML POUR LES COOKIES ======
    function injectCookieHTML() {
        if (document.getElementById('glt-cookie-banner')) return;

        const cookieHTML = `
        <!-- Banner Cookies -->
        <div id="glt-cookie-banner" class="glt-cookie-banner">
            <div class="glt-cookie-content">
                <div class="glt-cookie-icon">🍪</div>
                <div class="glt-cookie-text">
                    <h3>Cookies & Vie Privée</h3>
                    <p>Les Gloutonnes utilise des cookies pour améliorer ton expérience. 
                       <a href="/pages/confidentialite.html" target="_blank" rel="noopener noreferrer">En savoir plus</a></p>
                </div>
                <div class="glt-cookie-buttons">
                    <button class="glt-cookie-btn glt-cookie-btn-accept" onclick="GltCookies.acceptAll()">
                        ✅ Accepter
                    </button>
                    <button class="glt-cookie-btn glt-cookie-btn-decline" onclick="GltCookies.declineAll()">
                        ❌ Refuser
                    </button>
                    <button class="glt-cookie-btn glt-cookie-btn-settings" onclick="GltCookies.showModal()">
                        ⚙️ Paramètres
                    </button>
                </div>
            </div>
        </div>

        <!-- Modal Paramètres -->
        <div id="glt-cookie-modal" class="glt-cookie-modal">
            <div class="glt-modal-content">
                <h2>🍪 Paramètres des Cookies</h2>
                <p>Choisis tes préférences de cookies pour Les Gloutonnes.</p>

                <div class="glt-cookie-category glt-required">
                    <div class="glt-category-header">
                        <h3>🔧 Cookies Essentiels</h3>
                        <label class="glt-toggle">
                            <input type="checkbox" checked disabled>
                            <span class="glt-slider"></span>
                        </label>
                    </div>
                    <p><strong>Toujours activés</strong> - Nécessaires au fonctionnement du site.</p>
                </div>

                <div class="glt-cookie-category">
                    <div class="glt-category-header">
                        <h3>📊 Cookies Analytiques</h3>
                        <label class="glt-toggle">
                            <input type="checkbox" id="glt-analytics">
                            <span class="glt-slider"></span>
                        </label>
                    </div>
                    <p>Google Analytics (${GLOUTONNES_GA_ID}) pour comprendre l'utilisation du site.</p>
                </div>

                <div class="glt-cookie-category">
                    <div class="glt-category-header">
                        <h3>🎯 Cookies Marketing</h3>
                        <label class="glt-toggle">
                            <input type="checkbox" id="glt-marketing">
                            <span class="glt-slider"></span>
                        </label>
                    </div>
                    <p>Publicités personnalisées et suivi des campagnes.</p>
                </div>

                <div class="glt-modal-buttons">
                    <button class="glt-cookie-btn glt-cookie-btn-decline" onclick="GltCookies.closeModal()">
                        Annuler
                    </button>
                    <button class="glt-cookie-btn glt-cookie-btn-accept" onclick="GltCookies.savePreferences()">
                        💾 Sauvegarder
                    </button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', cookieHTML);
    }

    // ====== GESTION DES COOKIES ======
    window.GltCookies = {
        getConsent: function() {
            const cookie = document.cookie
                .split('; ')
                .find(row => row.startsWith(COOKIE_NAME + '='));
            
            if (cookie) {
                try {
                    return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
                } catch (e) {
                    return null;
                }
            }
            return null;
        },

        setConsent: function(consent) {
            const date = new Date();
            date.setTime(date.getTime() + (COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
            
            document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(consent))}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
            
            // Charger les scripts selon le consentement
            this.loadScripts(consent);
        },

        showBanner: function() {
            const banner = document.getElementById('glt-cookie-banner');
            if (banner) banner.classList.add('show');
        },

        hideBanner: function() {
            const banner = document.getElementById('glt-cookie-banner');
            if (banner) banner.classList.remove('show');
        },

        acceptAll: function() {
            const consent = {
                essential: true,
                analytics: true,
                marketing: true,
                timestamp: Date.now()
            };
            
            this.setConsent(consent);
            this.hideBanner();
            console.log('✅ [Gloutonnes] Tous les cookies acceptés');
        },

        declineAll: function() {
            const consent = {
                essential: true,
                analytics: false,
                marketing: false,
                timestamp: Date.now()
            };
            
            this.setConsent(consent);
            this.hideBanner();
            console.log('❌ [Gloutonnes] Cookies analytiques refusés');
        },

        showModal: function() {
            const modal = document.getElementById('glt-cookie-modal');
            const consent = this.getConsent();
            
            // Pré-remplir les cases
            if (consent) {
                const analyticsCheckbox = document.getElementById('glt-analytics');
                const marketingCheckbox = document.getElementById('glt-marketing');
                
                if (analyticsCheckbox) analyticsCheckbox.checked = consent.analytics || false;
                if (marketingCheckbox) marketingCheckbox.checked = consent.marketing || false;
            }
            
            if (modal) {
                modal.style.display = 'flex';
                this.hideBanner();
            }
        },

        closeModal: function() {
            const modal = document.getElementById('glt-cookie-modal');
            if (modal) modal.style.display = 'none';
            
            // Remonter le banner si pas de consentement
            if (!this.getConsent()) {
                this.showBanner();
            }
        },

        savePreferences: function() {
            const analyticsCheckbox = document.getElementById('glt-analytics');
            const marketingCheckbox = document.getElementById('glt-marketing');
            
            const consent = {
                essential: true,
                analytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
                marketing: marketingCheckbox ? marketingCheckbox.checked : false,
                timestamp: Date.now()
            };
            
            this.setConsent(consent);
            this.closeModal();
            console.log('💾 [Gloutonnes] Préférences sauvegardées', consent);
        },

        loadScripts: function(consent) {
            if (consent.analytics) {
                console.log('📊 [Gloutonnes] Chargement Google Analytics...');
                loadGoogleAnalytics();
            } else {
                console.log('📊 [Gloutonnes] Google Analytics bloqué');
                blockGoogleAnalytics();
            }
            
            if (consent.marketing) {
                console.log('🎯 [Gloutonnes] Scripts marketing activés');
            }
        }
    };

    // ====== GOOGLE ANALYTICS ======
    function loadGoogleAnalytics() {
        // Éviter le double chargement
        if (window.gtag && document.querySelector(`script[src*="${GLOUTONNES_GA_ID}"]`)) {
            return;
        }

        // Charger le script GA
        var script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GLOUTONNES_GA_ID}`;
        document.head.appendChild(script);

        // Configuration GA4 (ton code original)
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', GLOUTONNES_GA_ID, {
            page_title: document.title,
            page_location: window.location.href,
            send_page_view: true
        });

        // Tes événements personnalisés
        window.trackWhatsAppClick = function() {
            gtag('event', 'contact', {
                method: 'whatsapp',
                event_category: 'engagement',
                event_label: 'whatsapp_click'
            });
        };

        window.trackPlantView = function(plantType) {
            gtag('event', 'view_item', {
                item_category: 'plantes_carnivores',
                item_name: plantType,
                event_category: 'catalog'
            });
        };

        window.trackFormSubmit = function(formType) {
            gtag('event', 'generate_lead', {
                event_category: 'form',
                event_label: formType
            });
        };

        console.log('✅ [Gloutonnes] Google Analytics chargé');
    }

    function blockGoogleAnalytics() {
        // Désactiver GA si déjà chargé
        if (window.gtag) {
            gtag('consent', 'update', {
                'analytics_storage': 'denied'
            });
        }
        
        // Bloquer les futurs chargements
        window['ga-disable-' + GLOUTONNES_GA_ID] = true;
    }

    // ====== EVENT LISTENERS ======
    function setupEventListeners() {
        // Fermer modal en cliquant dehors
        document.addEventListener('click', function(e) {
            const modal = document.getElementById('glt-cookie-modal');
            if (e.target === modal) {
                GltCookies.closeModal();
            }
        });

        // Escape pour fermer
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('glt-cookie-modal');
                if (modal && modal.style.display === 'flex') {
                    GltCookies.closeModal();
                }
            }
        });

        // Auto-tracker les liens WhatsApp
        document.addEventListener('click', function(e) {
            if (e.target.closest('.whatsapp-link, [href*="wa.me"]') && window.trackWhatsAppClick) {
                window.trackWhatsAppClick();
            }
        });

        // Auto-tracker les formulaires
        document.addEventListener('submit', function(e) {
            if (e.target.tagName === 'FORM' && window.trackFormSubmit) {
                window.trackFormSubmit(e.target.id || 'form');
            }
        });
    }

    // ====== INITIALISATION ======
    function init() {
        // Injecter CSS et HTML
        injectCookieStyles();
        injectCookieHTML();
        setupEventListeners();

        // Vérifier le consentement
        const consent = GltCookies.getConsent();
        if (!consent) {
            // Attendre que la page soit chargée
            setTimeout(() => {
                GltCookies.showBanner();
            }, 1500);
        } else {
            // Charger les scripts selon le consentement
            GltCookies.loadScripts(consent);
        }
    }

    // Démarrer quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API publique pour debug
    if (window.location.hostname === 'localhost') {
        window.GltDebug = {
            resetConsent: function() {
                document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                location.reload();
            },
            getConsent: GltCookies.getConsent,
            showBanner: GltCookies.showBanner
        };
    }

})();