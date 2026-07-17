/**
 * Newsletter Copy Magic POPUP - Les Gloutonnes
 * VERSION POPUP HTML PROPRE - Plus besoin de télécharger !
 */

let copyMagicInitialized = false;

// Copy Magic POPUP Script chargé

// ===============================
// INITIALISATION
// ===============================
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initCopyMagicPopup();
    }, 2000);
});

function initCopyMagicPopup() {
    if (copyMagicInitialized) return;
    
    // Initialisation Copy Magic POPUP
    
    // Setup du bouton popup
    const copyButton = document.getElementById('btn-copy-html-magic');
    if (copyButton) {
        // Changer le texte du bouton
        copyButton.innerHTML = '📄 Ouvrir HTML pour Outlook';
        copyButton.addEventListener('click', openCleanHTMLPopup);
        // Bouton copy magic configuré
    }
    
    // Écouter les changements d'état
    document.addEventListener('tabSwitched', updateCopyButtonState);
    document.addEventListener('campaignChanged', updateCopyButtonState);
    document.addEventListener('batchLoaded', updateCopyButtonState);
    
    copyMagicInitialized = true;
}

// ===============================
// ÉTAT DU BOUTON
// ===============================
function updateCopyButtonState() {
    const copyButton = document.getElementById('btn-copy-html-magic');
    if (!copyButton) return;
    
    // Vérifier si on a une campagne et un lot
    const hasCampaign = window.getCurrentCampaignId && window.getCurrentCampaignId();
    const emailListTextarea = document.getElementById('email-list-textarea');
    const hasEmails = emailListTextarea && emailListTextarea.value.trim();
    
    const canCopy = hasCampaign && hasEmails;
    
    copyButton.disabled = !canCopy;
    
    if (canCopy) {
        copyButton.title = 'Ouvrir HTML propre dans une popup pour copier vers Outlook';
        copyButton.innerHTML = '📄 Ouvrir HTML pour Outlook';
    } else if (!hasCampaign) {
        copyButton.title = 'Sélectionne une campagne d\'abord';
        copyButton.innerHTML = '❌ Sélectionne une campagne';
    } else if (!hasEmails) {
        copyButton.title = 'Charge un lot d\'emails d\'abord';
        copyButton.innerHTML = '❌ Charge un lot d\'emails';
    }
    
    // État bouton mis à jour
}

// ===============================
// POPUP HTML PROPRE
// ===============================
function openCleanHTMLPopup() {
    // Ouverture popup HTML
    
    try {
        // Récupérer les emails du lot actuel
        const emailListTextarea = document.getElementById('email-list-textarea');
        const emailList = emailListTextarea?.value?.trim();
        
        if (!emailList) {
            showCopyAlert('Aucun lot d\'emails chargé', 'error');
            return;
        }
        
        // Parser les emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = emailList.match(emailRegex);
        const emails = matches ? [...new Set(matches)] : [];
        
        if (emails.length === 0) {
            showCopyAlert('Aucune adresse email valide trouvée', 'error');
            return;
        }
        
        // Récupérer l'ID de campagne
        const campaignId = window.getCurrentCampaignId ? window.getCurrentCampaignId() : null;
        if (!campaignId) {
            showCopyAlert('Aucune campagne sélectionnée', 'error');
            return;
        }
        
        // Génération popup
        
        // Générer l'HTML propre
        const cleanHTML = generateCleanNewsletterHTML(campaignId, emails);
        
        // Ouvrir la popup
        openHTMLPopup(cleanHTML, campaignId, emails.length);
        
        // Message de succès
        showCopySuccess(emails.length, 'popup');
        
        // Popup HTML ouverte avec succès
        
    } catch (error) {
        // Erreur ouverture popup (silencieux)
        showCopyAlert('Erreur lors de l\'ouverture: ' + error.message, 'error');
    }
}

function openHTMLPopup(htmlContent, campaignId, emailCount) {
    // Dimensions optimales pour la popup
    const width = 900;
    const height = 700;
    const left = Math.round((screen.width / 2) - (width / 2));
    const top = Math.round((screen.height / 2) - (height / 2));
    
    // Ouvrir popup centrée
    const popup = window.open(
        '',
        `newsletter_${campaignId}`,
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=no,toolbar=no,menubar=no`
    );
    
    if (!popup) {
        showCopyAlert('Popup bloquée ! Autorise les popups pour ce site.', 'error');
        return;
    }
    
    // Contenu de la popup avec instructions
    popup.document.open();
    popup.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Newsletter Les Gloutonnes - Copie pour Outlook</title>
            <style>
                body { 
                    margin: 0; 
                    padding: 0; 
                    font-family: 'Poppins', Arial, sans-serif; 
                    background: #f8f9fa;
                }
                
                .instructions { 
                    background: linear-gradient(135deg, #5b0092, #7b1fa2);
                    color: white;
                    padding: 20px; 
                    border-radius: 10px; 
                    margin-bottom: 20px;
                    text-align: center;
                    box-shadow: 0 4px 8px rgba(91, 0, 146, 0.2);
                }
                
                .instructions h2 {
                    margin: 0 0 15px 0;
                    color: #ff9100;
                    font-size: 1.5rem;
                }
                
                .instructions ol {
                    margin: 15px 0;
                    padding-left: 0;
                    list-style: none;
                    counter-reset: step-counter;
                }
                
                .instructions li {
                    counter-increment: step-counter;
                    margin: 10px 0;
                    padding-left: 40px;
                    position: relative;
                    font-size: 1.1rem;
                }
                
                .instructions li::before {
                    content: counter(step-counter);
                    position: absolute;
                    left: 0;
                    top: 0;
                    background: #ff9100;
                    color: white;
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 0.9rem;
                }
                
                .campaign-info {
                    background: rgba(255, 255, 255, 0.2);
                    padding: 10px 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                    font-size: 0.9rem;
                }
                
                .newsletter-container {
                    background: white;
                    margin: 0;
                    padding: 0;
                }
            </style>
        </head>
        <body>
            <!-- Instructions supprimées pour éviter la copie -->
            
            <div class="newsletter-container">
                ${htmlContent}
            </div>
            
            <script>
                // Auto-focus pour que Ctrl+A fonctionne immédiatement
                window.focus();
                
                // Message dans la console seulement
                // Newsletter popup prête
            </script>
        </body>
        </html>
    `);
    popup.document.close();
    
    // Focus sur la popup
    popup.focus();
    
    // Popup ouverte
}

// ===============================
// GÉNÉRATION HTML ULTRA-PROPRE
// ===============================
function generateCleanNewsletterHTML(campaignId, emails) {
    // Récupérer les données du formulaire
    const data = {
        subject: getFieldValue('newsletter-subject') || 'Newsletter Les Gloutonnes',
        title: getFieldValue('newsletter-title') || 'Nouvelles des Gloutonnes',
        intro: getFieldValue('newsletter-intro') || 'Salut ! J\'espère que tu vas bien et que tes plantes carnivores se portent à merveille.',
        content: getFieldValue('newsletter-content') || 'Je voulais partager avec toi mes dernières découvertes et nouveautés dans le monde fascinant des plantes carnivores...',
        ctaText: getFieldValue('newsletter-cta-text') || 'Découvrir mes plantes',
        ctaLink: getFieldValue('newsletter-cta-link') || 'https://www.lesgloutonnes.be/pages/contact.html'
    };
    
    // URL de base pour le tracking
    const baseUrl = getTrackingBaseUrl();
    
    // URL du logo avec tracking
    const originalLogoUrl = 'https://www.lesgloutonnes.be/images/logo/logo.png';
    const trackedLogoUrl = `${baseUrl}/track-logo.php?c=${campaignId}&r=${encodeURIComponent(originalLogoUrl)}`;
    
    // Logo tracking généré
    
    // HTML ultra-propre pour Outlook
    return `
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; font-family: 'Poppins', Arial, sans-serif;">
    <tr>
        <td align="center" style="padding: 20px 0;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                
                <!-- Header avec logo tracké -->
                <tr>
                    <td style="background: #5b0092; padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 15px 0; font-weight: bold; font-family: 'Poppins', Arial, sans-serif;">Les Gloutonnes</h1>
                        <img src="${trackedLogoUrl}" alt="Les Gloutonnes Logo" width="150" style="max-width: 150px; height: auto; margin: 10px 0; border: none; display: block; margin-left: auto; margin-right: auto;" />
                        <p style="color: #ffffff; font-size: 16px; margin: 10px 0 0 0; opacity: 0.9; font-family: 'Poppins', Arial, sans-serif;">Ta passion pour les plantes carnivores</p>
                    </td>
                </tr>
                
                <!-- Contenu principal -->
                <tr>
                    <td style="padding: 30px;">
                        <h2 style="color: #5b0092; font-size: 26px; margin: 0 0 20px 0; text-align: center; font-weight: bold; font-family: 'Poppins', Arial, sans-serif;">${data.title}</h2>
                        
                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; text-align: center; font-family: 'Poppins', Arial, sans-serif;">
                            ${data.intro.replace(/\n/g, '<br>')}
                        </p>
                        
                        <div style="margin: 20px 0; text-align: center;">
                            ${formatOutlookContent(data.content)}
                        </div>
                    </td>
                </tr>
                
                ${data.ctaText && data.ctaLink ? `
                <!-- Bouton CTA -->
                <tr>
                    <td style="background: #ff9100; padding: 20px; text-align: center;">
                        <a href="${data.ctaLink}" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 18px; font-family: 'Poppins', Arial, sans-serif; display: block;">
                            ${data.ctaText}
                        </a>
                    </td>
                </tr>
                ` : ''}
                
                <!-- Footer -->
                <tr>
                    <td style="background: #f4f4f4; padding: 20px; text-align: center;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td style="padding-bottom: 20px; text-align: center;">
                                    <a href="https://facebook.com/gloutonnes" style="color: #5b0092; text-decoration: none; font-weight: bold; margin: 0 15px; font-size: 14px; font-family: Arial, sans-serif;">📘 Facebook</a>
                                    <a href="https://instagram.com/lesgloutonnes.be" style="color: #5b0092; text-decoration: none; font-weight: bold; margin: 0 15px; font-size: 14px; font-family: Arial, sans-serif;">📸 Instagram</a>
                                    <a href="https://youtube.com/@lesgloutonnes" style="color: #5b0092; text-decoration: none; font-weight: bold; margin: 0 15px; font-size: 14px; font-family: Arial, sans-serif;">🎥 YouTube</a>
                                </td>
                            </tr>
                            <tr>
                                <td style="font-size: 12px; color: #666666; line-height: 1.4; text-align: center; font-family: Arial, sans-serif;">
                                    <strong style="color: #333333;">Les Gloutonnes</strong><br>
                                    Charles Bussers<br>
                                    Voie des Jardinets 47B, 4537 Verlaine, Belgique<br>
                                    <a href="mailto:infos@lesgloutonnes.be" style="color: #5b0092;">infos@lesgloutonnes.be</a> | 
                                    <a href="tel:+32494811487" style="color: #5b0092;">+32 494 81 14 87</a>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding-top: 15px; font-size: 12px; text-align: center; font-family: Arial, sans-serif;">
                                    <a href="../pages/unsubscribe.php" style="color: #dc3545; text-decoration: none;">Se désabonner</a> | 
                                    <a href="https://www.lesgloutonnes.be" style="color: #5b0092; text-decoration: none;">www.lesgloutonnes.be</a>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                
            </table>
        </td>
    </tr>
</table>`;
}

// ===============================
// FONCTIONS UTILITAIRES
// ===============================
function getTrackingBaseUrl() {
    const currentDomain = window.location.hostname;
    
    if (currentDomain.includes('cluster021.hosting.ovh.net')) {
        return 'https://lesglom.cluster021.hosting.ovh.net';
    } else if (currentDomain.includes('lesgloutonnes.be')) {
        return 'https://www.lesgloutonnes.be';
    } else {
        return `${window.location.protocol}//${window.location.hostname}`;
    }
}

function getFieldValue(fieldId) {
    const field = document.getElementById(fieldId);
    return field ? field.value.trim() : '';
}

function formatOutlookContent(content) {
    if (!content) return '';
    
    return content.split('\n\n').map(paragraph => {
        if (paragraph.trim()) {
            return `<p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 0 0 15px 0; text-align: center; font-family: 'Poppins', Arial, sans-serif;">${paragraph.trim().replace(/\n/g, '<br>')}</p>`;
        }
        return '';
    }).join('');
}

function showCopySuccess(emailCount, method = 'popup') {
    const button = document.getElementById('btn-copy-html-magic');
    const statusButton = document.getElementById('btn-copy-status');
    
    if (button && statusButton) {
        // Masquer le bouton principal temporairement
        button.style.display = 'none';
        
        // Afficher le statut de succès
        statusButton.style.display = 'inline-block';
        statusButton.textContent = `✅ Popup HTML ouverte pour ${emailCount} emails !`;
        statusButton.disabled = true;
        
        // Remettre le bouton normal après 4 secondes
        setTimeout(() => {
            button.style.display = 'inline-block';
            statusButton.style.display = 'none';
        }, 4000);
    }
    
    showCopyAlert(`📄 Popup HTML ouverte pour ${emailCount} emails ! 📋 Ctrl+A puis Ctrl+C dans la popup pour copier vers Outlook.`, 'success');
}

function showCopyAlert(message, type = 'info') {
    // Alert affichée
    
    // Utiliser le système d'alertes existant si disponible
    if (typeof showAlert === 'function') {
        showAlert(message, type);
    } else {
        // Fallback simple
        alert(message);
    }
}

// ===============================
// INTÉGRATION AVEC LE SYSTÈME EXISTANT
// ===============================

// Override pour mettre à jour l'état du bouton
function triggerCopyButtonUpdate() {
    setTimeout(() => {
        updateCopyButtonState();
    }, 100);
}

// Écouter les changements pour mettre à jour le bouton
if (typeof window.loadBatch === 'function') {
    const originalLoadBatch = window.loadBatch;
    window.loadBatch = function(...args) {
        originalLoadBatch.apply(this, args);
        triggerCopyButtonUpdate();
    };
}

// Fonction de test pour debug
window.testPopupHTML = function() {
    // Test popup HTML
    const campaignId = window.getCurrentCampaignId ? window.getCurrentCampaignId() : 999;
    const testEmails = ['test1@example.com', 'test2@example.com'];
    
    const html = generateCleanNewsletterHTML(campaignId, testEmails);
    openHTMLPopup(html, campaignId, testEmails.length);
};

// Copy Magic POPUP Script - VERSION POPUP OPTIMISÉE prête