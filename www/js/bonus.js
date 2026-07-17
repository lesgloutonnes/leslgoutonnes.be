document.addEventListener("DOMContentLoaded", () => {
    // Référence aux sections
    const formSection = document.getElementById("form-section");
    const downloadSection = document.getElementById("download-section");
    const downloadForm = document.getElementById("download-form");
  
    // Initialiser les animations au défilement
    initScrollAnimations();
  
    // Gérer le formulaire de téléchargement si présent
    if (formSection && downloadSection && downloadForm) {
      // Gérer la soumission du formulaire
      downloadForm.addEventListener("submit", async function (e) {
        e.preventDefault();
  
        // Désactiver le bouton pendant l'envoi
        const submitButton = downloadForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Inscription en cours...';

        try {
          // Récupérer les données du formulaire
          const formData = new FormData(downloadForm);
          const userData = {
            prenom: formData.get("prenom"),
            nom: formData.get("nom"),
            email: formData.get("email"),
            newsletter: formData.get("newsletter") === "on",
          };
    
          // Stocker les données dans le localStorage pour référence future
          localStorage.setItem("userGuideData", JSON.stringify(userData));
    
          // NOUVEAU: Envoyer vers ton API SQL
          const response = await fetch('../api/process-form.php', {
            method: 'POST',
            body: formData
          });

          if (!response.ok) {
            throw new Error('Erreur serveur');
          }

          const result = await response.json();

          if (result.success) {
            // Si l'utilisateur a coché la case newsletter et que l'API a réussi
            if (userData.newsletter) {
              // Afficher message de confirmation newsletter
              const newsletterMsg = document.createElement("div");
              newsletterMsg.className = "newsletter-confirmation";
              newsletterMsg.innerHTML =
                "<p>✅ Merci de t'être inscrit à ma newsletter ! Tu recevras bientôt mes conseils par email.</p>";
    
              // Ajouter ce message dans la section de téléchargement
              if (downloadSection.querySelector(".bonus-message")) {
                downloadSection
                  .querySelector(".bonus-message")
                  .appendChild(newsletterMsg);
              }
            }

            // Cacher le formulaire et afficher la section de téléchargement
            formSection.style.display = "none";
            downloadSection.style.display = "block";
            downloadSection.classList.add("active");
    
            // Faire défiler jusqu'à la section de téléchargement
            downloadSection.scrollIntoView({ behavior: "smooth" });

            // Afficher message de succès
            showAlert(result.message, 'success');

          } else {
            // Erreur retournée par l'API
            showAlert(result.message, 'error');
          }

        } catch (error) {
          console.error("Erreur lors de l'inscription:", error);
          showAlert('Erreur de connexion. Vérifie ta connexion internet et réessaie.', 'error');
        } finally {
          // Réactiver le bouton
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      });
    }
  
    // Gérer le bouton de téléchargement
    const downloadButton = document.querySelector(".download-button");
    if (downloadButton) {
      downloadButton.addEventListener("click", function () {
        // Enregistrer que l'utilisateur a téléchargé le guide
        localStorage.setItem("guideDownloaded", "true");
  
        // Événement de conversion pour le marketing
        if (typeof gtag !== "undefined") {
          gtag("event", "guide_download", {
            event_category: "engagement",
            event_label: "Guide Culture Plantes Carnivores",
          });
        }
      });
    }
});

// NOUVELLE FONCTION: Affichage des messages
function showAlert(message, type = 'info') {
  // Supprimer les messages existants
  const existingMessages = document.querySelectorAll('.temp-message');
  existingMessages.forEach(msg => msg.remove());

  // Créer le nouveau message
  const messageDiv = document.createElement('div');
  messageDiv.className = `temp-message temp-message-${type}`;
  messageDiv.textContent = message;
  
  // Style du message
  messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-family: 'Poppins', Arial, sans-serif;
      font-weight: 500;
      z-index: 1000;
      max-width: 400px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      ${type === 'success' ? 'background-color: #28a745;' : 'background-color: #dc3545;'}
  `;

  document.body.appendChild(messageDiv);

  // Supprimer après 4 secondes
  setTimeout(() => {
      messageDiv.remove();
  }, 4000);
}
  
// Fonction pour initialiser les animations au défilement
function initScrollAnimations() {
  // Animer TOUTES les sections - important pour l'affichage
  const sections = document.querySelectorAll("section");
  const featuresSection = document.getElementById("bonus-features");
  const testimonialsSection = document.getElementById("bonus-testimonials");
  const contactSection = document.getElementById("bonus-contact");
  const featureCards = document.querySelectorAll(".feature-card");
  const testimonialCards = document.querySelectorAll(".testimonial-card");
  const contactBanner = document.querySelector(".contact-banner");

  // Fonction pour vérifier si un élément est visible
  const isElementInViewport = (el, offset = 0.2) => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top <=
      (window.innerHeight || document.documentElement.clientHeight) *
        (1 - offset)
    );
  };

  // Fonction pour animer les éléments visibles
  const animateElements = () => {
    // Animer les sections
    sections.forEach((section) => {
      if (isElementInViewport(section, 0.1)) {
        section.classList.add("visible");
      }
    });

    // Animer les cartes de fonctionnalités
    if (featuresSection && isElementInViewport(featuresSection, 0.1)) {
      featureCards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add("animated");
        }, index * 100);
      });
    }

    // Animer les témoignages
    if (testimonialsSection && isElementInViewport(testimonialsSection, 0.1)) {
      testimonialCards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add("animated");
        }, index * 150);
      });
    }

    // Animer la bannière de contact
    if (
      contactSection &&
      contactBanner &&
      isElementInViewport(contactSection, 0.1)
    ) {
      contactBanner.classList.add("animated");
    }
  };

  // Ajouter des classes pour les animations CSS
  featureCards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  });

  testimonialCards.forEach((card) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(20px)";
    card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  });

  if (contactBanner) {
    contactBanner.style.opacity = "0";
    contactBanner.style.transform = "translateY(20px)";
    contactBanner.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  }

  // Classe CSS pour les éléments animés et sections visibles
  document.head.insertAdjacentHTML(
    "beforeend",
    `
        <style>
            section.visible {
                opacity: 1;
                transform: translateY(0);
            }
            .feature-card.animated, .testimonial-card.animated, .contact-banner.animated {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
            .newsletter-confirmation {
                margin-top: 0.5rem;
                padding: 0.5rem;
                background-color: rgba(91, 0, 146, 0.1);
                border-radius: 5px;
            }
            .newsletter-confirmation p {
                margin: 0;
                color: var(--primary-color) !important;
                font-weight: 600;
            }
        </style>
    `
  );

  // Exécuter l'animation au chargement et au défilement
  animateElements();
  window.addEventListener("scroll", animateElements);
}