// Fonction principale pour initialiser la navigation
function initNavigation() {
  // Éléments du menu
  const mobileToggle = document.querySelector(".mobile-nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const dropdowns = document.querySelectorAll(".dropdown");
  const header = document.querySelector("header");

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".dropdown-toggle");
    if (toggle && !toggle.hasAttribute("aria-expanded")) {
      toggle.setAttribute("aria-expanded", "false");
    }
    if (toggle && !toggle.hasAttribute("aria-haspopup")) {
      toggle.setAttribute("aria-haspopup", "true");
    }
  });

  // Créer l'overlay pour le menu mobile s'il n'existe pas
  if (!document.querySelector(".mobile-nav-overlay")) {
    const overlay = document.createElement("div");
    overlay.className = "mobile-nav-overlay";
    document.body.appendChild(overlay);

    // Fermer le menu quand on clique sur l'overlay
    overlay.addEventListener("click", function () {
      closeMenu();
    });
  }

  // Créer le bouton de fermeture s'il n'existe pas
  if (!document.querySelector(".mobile-nav-close") && navLinks) {
    const closeButton = document.createElement("button");
    closeButton.className = "mobile-nav-close";
    closeButton.setAttribute("aria-label", "Fermer le menu");
    closeButton.setAttribute("type", "button");
    closeButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
    navLinks.prepend(closeButton);

    // Ajouter l'événement pour fermer le menu
    closeButton.addEventListener("click", closeMenu);
  }

  // Recherche dans le tiroir mobile (header-right est masqué ≤768px)
  if (!document.querySelector(".mobile-search") && navLinks) {
    const mobileSearch = document.createElement("div");
    mobileSearch.className = "mobile-search";
    mobileSearch.innerHTML = `
            <form action="/pages/recherche.html" method="get" role="search" aria-label="Rechercher sur le site">
                <input type="search" name="q" placeholder="Rechercher..." aria-label="Rechercher" />
                <button type="submit" class="mobile-search__submit" aria-label="Lancer la recherche">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
            </form>
        `;
    const closeBtn = navLinks.querySelector(".mobile-nav-close");
    if (closeBtn && closeBtn.nextSibling) {
      navLinks.insertBefore(mobileSearch, closeBtn.nextSibling);
    } else {
      navLinks.prepend(mobileSearch);
    }
  }

  // Créer le conteneur social mobile s'il n'existe pas déjà
  if (!document.querySelector(".mobile-social-container") && navLinks) {
    const mobileSocialContainer = document.createElement("div");
    mobileSocialContainer.className = "mobile-social-container";

    // Construction des icônes sociales
    mobileSocialContainer.innerHTML = `
            <div class="social-icons">
                <a href="https://instagram.com/lesgloutonnes.be" class="social-icon" aria-label="Instagram">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                </a>
                <a href="https://facebook.com/gloutonnes" class="social-icon" aria-label="Facebook">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                </a>
                <a href="https://youtube.com/@lesgloutonnes" class="social-icon" aria-label="YouTube">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path>
                        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                    </svg>
                </a>
            </div>
            <a href="/index.html#contact" class="cta-button">Me contacter</a>
        `;

    navLinks.appendChild(mobileSocialContainer);
  }

  if (mobileToggle && !mobileToggle.hasAttribute("aria-expanded")) {
    mobileToggle.setAttribute("aria-expanded", "false");
    mobileToggle.setAttribute("aria-controls", "main-nav-links");
  }
  if (navLinks && !navLinks.id) {
    navLinks.id = "main-nav-links";
  }

  // Fonction pour ouvrir/fermer le menu mobile
  function toggleMenu() {
    const isActive = navLinks.classList.contains("active");

    if (isActive) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Fonction pour ouvrir le menu
  function openMenu() {
    if (!navLinks || !mobileToggle) return;
    navLinks.classList.add("active");
    mobileToggle.classList.add("active");
    mobileToggle.setAttribute("aria-expanded", "true");
    const overlay = document.querySelector(".mobile-nav-overlay");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden"; // Empêcher le défilement

    // Animation séquentielle des éléments du menu
    const menuItems = navLinks.querySelectorAll("li");
    menuItems.forEach((item, index) => {
      item.style.setProperty("--item-index", index);
      // Reset des animations pour les faire rejouer
      item.style.animation = "none";
      item.offsetHeight; // Force reflow
      item.style.animation = null;
    });
  }

  // Fonction pour fermer le menu
  function closeMenu() {
    if (!navLinks || !mobileToggle) return;
    navLinks.classList.remove("active");
    mobileToggle.classList.remove("active");
    mobileToggle.setAttribute("aria-expanded", "false");
    const overlay = document.querySelector(".mobile-nav-overlay");
    if (overlay) overlay.classList.remove("active");
    document.body.style.overflow = ""; // Réactiver le défilement

    // Fermer tous les dropdowns
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove("active");
      const toggle = dropdown.querySelector(".dropdown-toggle");
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Gestionnaire d'événement pour le bouton hamburger
  if (mobileToggle) {
    mobileToggle.addEventListener("click", function (e) {
      e.preventDefault();
      toggleMenu();
    });
  }

  // Gestion des dropdowns en mobile
  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".dropdown-toggle");

    if (toggle) {
      toggle.addEventListener("click", function (e) {
        // Seulement en version mobile
        if (window.innerWidth <= 768) {
          e.preventDefault();

          // Toggle le dropdown actuel
          const isActive = dropdown.classList.toggle("active");
          toggle.setAttribute("aria-expanded", isActive ? "true" : "false");

          // Fermer les autres dropdowns
          dropdowns.forEach((otherDropdown) => {
            if (otherDropdown !== dropdown) {
              otherDropdown.classList.remove("active");
              const otherToggle = otherDropdown.querySelector(".dropdown-toggle");
              if (otherToggle) {
                otherToggle.setAttribute("aria-expanded", "false");
              }
            }
          });
        }
      });
    }
  });

  // CORRECTION: Toujours appliquer les styles des flèches pour dropdown,
  // quel que soit l'emplacement de la page ou la largeur d'écran
  setupDropdownArrows();

  // Fermer le menu lors d'un clic sur un lien
  const navItems = document.querySelectorAll(
    ".nav-links a:not(.dropdown-toggle)"
  );
  navItems.forEach((link) => {
    link.addEventListener("click", function () {
      if (window.innerWidth <= 768) {
        closeMenu();
      }
    });
  });

  // Fermer le menu si la fenêtre est redimensionnée au-delà de 768px
  window.addEventListener("resize", function () {
    if (window.innerWidth > 768) {
      closeMenu();
    } else {
      // S'assurer que les flèches sont correctement affichées
      // en cas de redimensionnement
      setupDropdownArrows();
    }
  });
}

// NOUVELLE FONCTION: Configuration des flèches de dropdown
function setupDropdownArrows() {
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector(".dropdown-toggle");

    if (toggle) {
      // Vérifier si la flèche existe déjà
      let arrow = toggle.querySelector(".dropdown-arrow");

      // Si la flèche n'existe pas, la créer
      if (!arrow) {
        arrow = document.createElement("span");
        arrow.className = "dropdown-arrow";
        toggle.appendChild(arrow);
      }
    }
  });
}

// Initialisation de la navigation après le chargement des composants
document.addEventListener("DOMContentLoaded", function () {
  // Vérifier si le header est déjà chargé
  if (document.querySelector("header")) {
    console.log(
      "Header déjà chargé, initialisation immédiate de la navigation"
    );
    initNavigation();
  } else {
    // Attendre que le header soit chargé via l'événement personnalisé
    document.addEventListener("componentLoaded", function (e) {
      if (e.detail.id === "header-component") {
        console.log(
          "Header chargé via componentLoaded, initialisation de la navigation"
        );
        initNavigation();
      }
    });
  }
});
