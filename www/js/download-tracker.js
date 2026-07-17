// js/download-tracker.js - Gestion des téléchargements côté client

class DownloadTracker {
    constructor() {
        this.apiUrl = '/api/downloads.php';
        this.downloadUrl = '/api/download.php';
        this.init();
    }

    init() {
        // Charger les compteurs au chargement de la page
        this.loadDownloadCounts();
        
        // Attacher les événements aux liens de téléchargement
        this.attachDownloadEvents();
        
        // Mettre à jour les compteurs toutes les 5 minutes
        setInterval(() => this.loadDownloadCounts(), 300000);
    }

    async loadDownloadCounts() {
        try {
            const response = await fetch(this.apiUrl);
            const data = await response.json();
            
            if (data.success) {
                this.updateCounters(data.downloads);
            } else {
                console.warn('Erreur API downloads:', data.message);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des compteurs:', error);
            this.handleCounterError();
        }
    }

    updateCounters(downloads) {
        downloads.forEach(download => {
            const formattedCount = this.formatDownloadCount(download.download_count);
            
            // Mettre à jour les éléments avec data-download-file
            const counterElements = document.querySelectorAll(`[data-download-file="${download.file_name}"]`);
            counterElements.forEach(element => {
                // Retirer la classe de chargement
                element.classList.remove('loading', 'error');
                element.classList.add('updated');
                
                element.textContent = `${formattedCount} téléchargements`;
                
                // Retirer la classe updated après l'animation
                setTimeout(() => element.classList.remove('updated'), 500);
            });
            
            // Mettre à jour le texte dans les descriptions (pour compatibilité)
            const descriptionElements = document.querySelectorAll('.download-info p');
            descriptionElements.forEach(element => {
                if (element.textContent.includes('téléchargements')) {
                    // Chercher un span avec data-download-file à l'intérieur
                    const spanElement = element.querySelector(`[data-download-file="${download.file_name}"]`);
                    if (spanElement) {
                        // Le span sera mis à jour par le code ci-dessus
                        return;
                    }
                    
                    // Fallback: mise à jour directe du texte
                    element.textContent = element.textContent.replace(
                        /(\d+\s+)?téléchargements/, 
                        `${formattedCount} téléchargements`
                    );
                }
            });
        });
    }

    handleCounterError() {
        // Marquer tous les compteurs comme ayant une erreur
        const counterElements = document.querySelectorAll('[data-download-file]');
        counterElements.forEach(element => {
            element.classList.remove('loading', 'updated');
            element.classList.add('error');
            element.textContent = '-- téléchargements';
        });
    }

    attachDownloadEvents() {
        // Attacher les événements aux liens de téléchargement
        document.querySelectorAll('.download-btn, [data-download="true"]').forEach(link => {
            link.addEventListener('click', (e) => {
                this.handleDownload(e);
            });
        });
    }

    handleDownload(event) {
        const link = event.currentTarget;
        const originalHref = link.getAttribute('href');
        
        // Si le lien pointe déjà vers notre API de téléchargement, laisser faire
        if (originalHref.includes('/api/download.php')) {
            // Mettre à jour le compteur après le téléchargement
            setTimeout(() => this.loadDownloadCounts(), 1000);
            return;
        }
        
        // Extraire le nom du fichier depuis le href original
        let fileName = originalHref.split('/').pop();
        
        // Gérer les cas où le fichier est dans un sous-dossier
        if (fileName.includes('?')) {
            fileName = fileName.split('?')[0];
        }
        
        // Rediriger vers notre script de téléchargement
        if (fileName) {
            event.preventDefault();
            
            // Indiquer que le téléchargement est en cours
            this.indicateDownloadInProgress(fileName);
            
            window.location.href = `${this.downloadUrl}?file=${encodeURIComponent(fileName)}`;
            
            // Mettre à jour le compteur localement (optimistic update)
            setTimeout(() => this.loadDownloadCounts(), 1000);
        }
    }

    indicateDownloadInProgress(fileName) {
        const counterElements = document.querySelectorAll(`[data-download-file="${fileName}"]`);
        counterElements.forEach(element => {
            element.classList.add('loading');
        });
    }

    // Méthode pour récupérer le compteur d'un fichier spécifique
    async getDownloadCount(fileName) {
        try {
            const response = await fetch(`${this.apiUrl}?file=${encodeURIComponent(fileName)}`);
            const data = await response.json();
            
            if (data.success) {
                return data.download_count;
            }
            return 0;
        } catch (error) {
            console.error('Erreur lors de la récupération du compteur:', error);
            return 0;
        }
    }

    // Méthode pour formater les nombres
    formatDownloadCount(count) {
        const num = parseInt(count);
        
        if (isNaN(num)) {
            return '--';
        }
        
        // Format français avec espaces pour les milliers
        if (num >= 1000) {
            return num.toLocaleString('fr-FR');
        }
        
        return num.toString();
    }

    // Méthode pour initialiser les états de chargement
    initLoadingStates() {
        const counterElements = document.querySelectorAll('[data-download-file]');
        counterElements.forEach(element => {
            if (element.textContent.includes('Chargement') || 
                element.textContent.includes('téléchargements') && 
                !element.textContent.match(/\d+/)) {
                element.classList.add('loading');
                element.textContent = 'Chargement... téléchargements';
            }
        });
    }
}

// Initialiser le tracker quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    window.downloadTracker = new DownloadTracker();
    
    // Initialiser les états de chargement
    window.downloadTracker.initLoadingStates();
});

// Fonction utilitaire globale pour formater les nombres (pour compatibilité)
function formatDownloadCount(count) {
    if (count >= 1000) {
        return count.toLocaleString('fr-FR');
    }
    return count.toString();
}