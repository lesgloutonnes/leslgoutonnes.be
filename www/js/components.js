document.addEventListener("DOMContentLoaded", function () {
    function enforceExternalLinkSecurity(scope = document) {
      const externalLinks = scope.querySelectorAll('a[target="_blank"]');
      externalLinks.forEach((link) => {
        const rel = (link.getAttribute("rel") || "").split(/\s+/).filter(Boolean);
        if (!rel.includes("noopener")) {
          rel.push("noopener");
        }
        if (!rel.includes("noreferrer")) {
          rel.push("noreferrer");
        }
        link.setAttribute("rel", rel.join(" ").trim());
      });
    }
  
    function ensureMainLandmark(scope = document) {
      const main = scope.querySelector("main");
      if (main && !main.id) {
        main.id = "main-content";
      }
    }

    function enforceLazyLoading(scope = document) {
      const images = scope.querySelectorAll("img");
      images.forEach((img) => {
        if (img.hasAttribute("loading")) {
          return;
        }
        if (img.dataset.lazy === "eager") {
          return;
        }
        img.setAttribute("loading", "lazy");
      });
    }
  
    // Fonction pour charger les composants HTML
    function loadComponent(elementId, componentPath) {
      const element = document.getElementById(elementId);
      if (element) {
        fetch(componentPath)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Erreur réseau lors du chargement du composant");
            }
            return response.text();
          })
          .then((data) => {
            element.innerHTML = data;
  
            // Ajustement des chemins relatifs en fonction de l'emplacement de la page
            const isInRootDir =
              window.location.pathname === "/" ||
              window.location.pathname === "/index.html";
  
            if (!isInRootDir) {
              // Ajuster les liens et images si la page n'est pas à la racine
              const links = element.querySelectorAll("a");
              const images = element.querySelectorAll("img");
  
              links.forEach((link) => {
                if (
                  link.getAttribute("href") &&
                  link.getAttribute("href").startsWith("/")
                ) {
                  const newHref = link.getAttribute("href").replace("/", "../");
                  link.setAttribute("href", newHref);
                }
              });
  
              images.forEach((img) => {
                if (
                  img.getAttribute("src") &&
                  img.getAttribute("src").startsWith("/")
                ) {
                  const newSrc = img.getAttribute("src").replace("/", "../");
                  img.setAttribute("src", newSrc);
                }
              });
  
              // Corriger les chemins du formulaire de recherche
              const searchForm = element.querySelector(".search-form form");
              if (searchForm) {
                const currentAction = searchForm.getAttribute("action");
                if (currentAction && currentAction.startsWith("../")) {
                  // Déjà ajusté, on ne fait rien
                } else if (currentAction && currentAction.startsWith("/")) {
                  const newAction = "../" + currentAction.substring(1);
                  searchForm.setAttribute("action", newAction);
                }
              }
            }
  
            // Ajouter les classes "active" aux liens de navigation actuels
            const currentPath = window.location.pathname;
            const navLinksItems = element.querySelectorAll(".nav-link");
  
            // Reset all active states first
            navLinksItems.forEach((link) => link.classList.remove("active"));
  
            // Handle Accueil (Home page)
            if (currentPath === "/" || currentPath === "/index.html") {
              const homeLink = element.querySelector('a[href="/index.html"]');
              if (homeLink) homeLink.classList.add("active");
            }
            // Handle regular pages
            else {
              navLinksItems.forEach((link) => {
                const href = link.getAttribute("href");
                if (href && currentPath.includes(href.substring(1))) {
                  link.classList.add("active");
                }
              });
            }
  
            // Exécuter un événement personnalisé pour signaler que le composant est chargé
            const event = new CustomEvent("componentLoaded", {
              detail: { id: elementId },
            });
            document.dispatchEvent(event);

            enforceExternalLinkSecurity(element);
            ensureMainLandmark(document);
            enforceLazyLoading(element);
          })
          .catch((error) => {
            console.error("Erreur lors du chargement du composant:", error);
            element.innerHTML = "<p>Erreur lors du chargement du composant.</p>";
          });
      }
    }
  
    // Charger les composants
    loadComponent("header-component", "/components/header.html");
    loadComponent("footer-component", "/components/footer.html");
    enforceExternalLinkSecurity();
    ensureMainLandmark();
    enforceLazyLoading();
  
    // Gérer le bouton "Retour en haut"
    window.addEventListener("scroll", function () {
      const backToTop = document.querySelector(".back-to-top");
      if (backToTop) {
        if (window.scrollY > 300) {
          backToTop.classList.add("visible");
        } else {
          backToTop.classList.remove("visible");
        }
      }
    });
  
    // Initialiser les éléments qui nécessitent du JavaScript après le chargement des composants
    document.addEventListener("componentLoaded", function (e) {
      if (e.detail.id === "footer-component") {
        const backToTop = document.querySelector(".back-to-top");
        if (backToTop) {
          backToTop.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          });
        }

        initFooterAccordions();
  
        // Initialiser le formulaire de newsletter
        const newsletterForm = document.querySelector(".newsletter-form");
        if (newsletterForm) {
          newsletterForm.addEventListener("submit", function (e) {
            e.preventDefault();
            alert("Merci de vous être inscrit à notre newsletter !");
            newsletterForm.reset();
          });
        }
      }
    });
  });

  function initFooterAccordions() {
    const columns = document.querySelectorAll("footer details.footer-column");
    if (!columns.length) return;

    const syncFooterOpenState = () => {
      const isMobile = window.innerWidth <= 768;
      columns.forEach((column, index) => {
        if (isMobile) {
          // Sur mobile : première colonne ouverte, le reste replié
          if (index === 0) column.setAttribute("open", "");
          else column.removeAttribute("open");
        } else {
          column.setAttribute("open", "");
        }
      });
    };

    syncFooterOpenState();
    window.addEventListener("resize", syncFooterOpenState);
  }
  
  // Script pour gérer la fonctionnalité de recherche
  document.addEventListener("DOMContentLoaded", function () {
    // Attendre que le composant header soit chargé
    document.addEventListener("componentLoaded", function (e) {
      if (e.detail.id === "header-component") {
        initSearchFunctionality();
      }
    });
  
    // Si le header est déjà chargé (rare, mais possible)
    if (document.querySelector(".search-toggle")) {
      initSearchFunctionality();
    }
  });
  
  function initSearchFunctionality() {
    // Éléments de recherche
    const searchToggle = document.querySelector(".search-toggle");
    const searchForm = document.querySelector(".search-form");
    const searchInput = document.querySelector('.search-form input[type="text"]');
  
    // Ouvrir/fermer la barre de recherche
    if (searchToggle) {
      searchToggle.addEventListener("click", function (e) {
        e.preventDefault();
        searchForm.classList.toggle("active");
  
        // Focus automatique sur l'input quand on ouvre la recherche
        if (searchForm.classList.contains("active")) {
          searchInput.focus();
  
          // Ajouter un détecteur de clic en dehors pour fermer
          document.addEventListener("click", closeSearchOnClickOutside);
        } else {
          document.removeEventListener("click", closeSearchOnClickOutside);
        }
      });
    }
  
    // Fermer la recherche quand on clique ailleurs
    function closeSearchOnClickOutside(e) {
      // Si on clique en dehors de la recherche ou du bouton de recherche
      if (!searchForm.contains(e.target) && !searchToggle.contains(e.target)) {
        searchForm.classList.remove("active");
        document.removeEventListener("click", closeSearchOnClickOutside);
      }
    }
  
    // Validation de la recherche
    const searchFormElement = document.querySelector(".search-form form");
    if (searchFormElement) {
      searchFormElement.addEventListener("submit", function (e) {
        // Valider qu'il y a au moins 2 caractères avant de soumettre
        if (searchInput.value.trim().length < 2) {
          e.preventDefault();
          // Option: afficher un message d'erreur
          alert("Veuillez entrer au moins 2 caractères pour la recherche.");
        }
      });
    }
  
    // Suggestions de recherche (optionnel)
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        // Ici, vous pourriez implémenter des suggestions en direct
        // Pour une version simple, on pourrait charger les suggestions depuis un fichier JSON
      });
    }
  }
  