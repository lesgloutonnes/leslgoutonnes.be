document.addEventListener("DOMContentLoaded", () => {
    // Initialiser les animations au défilement
    initScrollAnimations();
  
    // Initialiser les liens d'ancre
    initSmoothScrolling();
  
    // Initialiser les vidéos YouTube
    initYoutubeVideos();
  
    // Forcer l'affichage immédiat de la section contact
    const contactSection = document.getElementById("guides-contact");
    if (contactSection) {
      contactSection.classList.add("visible");
    }
  });
  
  // Fonction pour initialiser les animations au défilement
  function initScrollAnimations() {
    const pageRoot = document.querySelector(".guides-page");
    if (!pageRoot) return;

    const sections = pageRoot.querySelectorAll(
      ".guides-hero, .guides-section:not(.guides-contact)"
    );
    const plantGuides = pageRoot.querySelectorAll(".plant-guide");
    const animatedElements = pageRoot.querySelectorAll(
      ".contact-banner, .additional-tip, .species-card, .season, .cultivation-card, .note-card"
    );
  
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
      sections.forEach((section) => {
        if (isElementInViewport(section, 0.1)) {
          section.classList.add("visible");
        }
      });
  
      plantGuides.forEach((guide) => {
        if (isElementInViewport(guide, 0.1)) {
          guide.classList.add("visible");
        }
      });
  
      animatedElements.forEach((element) => {
        if (isElementInViewport(element, 0.1)) {
          element.classList.add("visible");
        }
      });
    };
  
    // Exécuter l'animation au chargement et au défilement
    animateElements();
    window.addEventListener("scroll", animateElements);
  }
  
  // Fonction pour initialiser le défilement fluide des liens d'ancre
  function initSmoothScrolling() {
    const guideNavItems = document.querySelectorAll(".guide-nav-item");
  
    guideNavItems.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
  
        const targetId = link.getAttribute("href");
        const targetElement = document.querySelector(targetId);
  
        if (targetElement) {
          // Calculer la position avec un léger décalage en haut
          const offset = 100; // Ajuster selon la hauteur de votre header
          const targetPosition =
            targetElement.getBoundingClientRect().top +
            window.pageYOffset -
            offset;
  
          // Défiler doucement vers la cible
          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
  
          // Mettre à jour l'URL sans défilement
          history.pushState(null, null, targetId);
  
          // Ajouter une classe pour mettre en évidence la section ciblée
          document.querySelectorAll(".plant-guide").forEach((guide) => {
            guide.classList.remove("target-highlight");
          });
          targetElement.classList.add("target-highlight");
  
          // Retirer la mise en évidence après 2 secondes
          setTimeout(() => {
            targetElement.classList.remove("target-highlight");
          }, 2000);
        }
      });
    });
  
    // Vérifier si l'URL contient déjà un hash et défiler vers cet élément
    if (window.location.hash) {
      const targetElement = document.querySelector(window.location.hash);
  
      if (targetElement) {
        // Attendre un court instant pour laisser la page se charger
        setTimeout(() => {
          const offset = 100;
          const targetPosition =
            targetElement.getBoundingClientRect().top +
            window.pageYOffset -
            offset;
  
          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });
  
          // Ajouter une classe pour mettre en évidence la section ciblée
          targetElement.classList.add("target-highlight");
  
          // Retirer la mise en évidence après 2 secondes
          setTimeout(() => {
            targetElement.classList.remove("target-highlight");
          }, 2000);
        }, 300);
      }
    }
  }
  
  // Fonction pour améliorer la gestion des vidéos YouTube
  function initYoutubeVideos() {
    const videoContainers = document.querySelectorAll(".video-container");
  
    videoContainers.forEach((container) => {
      // Ajouter une classe pour l'effet de survol
      container.addEventListener("mouseenter", () => {
        container.classList.add("video-hover");
      });
  
      container.addEventListener("mouseleave", () => {
        container.classList.remove("video-hover");
      });
  
      // Optimisation du chargement des vidéos YouTube
      const iframe = container.querySelector("iframe");
  
      // Si l'ID vidéo est un placeholder, ne pas modifier
      if (iframe && iframe.src.includes("VIDEO_ID_")) {
        // Remplacer les placeholders par de vraies miniatures YouTube
        const videoId = iframe.src.split("/").pop();
        if (
          videoId &&
          videoId !== "VIDEO_ID_SARRACENIA" &&
          videoId !== "VIDEO_ID_DROSERA"
        ) {
          // Créer un conteneur de prévisualisation pour les vraies vidéos
          const previewContainer = document.createElement("div");
          previewContainer.className = "video-preview";
          previewContainer.innerHTML = `
                      <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Prévisualisation vidéo YouTube">
                      <div class="play-button">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
                              <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.6)"/>
                              <path d="M16.5 12l-7.5 4.33v-8.66L16.5 12z" fill="#fff"/>
                          </svg>
                      </div>
                  `;
  
          // Remplacer l'iframe par la prévisualisation
          container.innerHTML = "";
          container.appendChild(previewContainer);
  
          // Ajouter l'événement de clic pour charger la vraie vidéo
          previewContainer.addEventListener("click", () => {
            container.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
          });
        }
      }
    });
  }
  
  // Ajout d'un observateur d'intersection pour optimiser les performances
  if ("IntersectionObserver" in window) {
    document.addEventListener("DOMContentLoaded", () => {
      const plantGuides = document.querySelectorAll(".plant-guide");
  
      const observerOptions = {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      };
  
      const guideObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const guide = entry.target;
            guide.classList.add("visible");
  
            // Animer les éléments à l'intérieur du guide
            const tipItems = guide.querySelectorAll(".additional-tip, .species-card, .season, .cultivation-card, .note-card");
            tipItems.forEach((tip, index) => {
              setTimeout(() => {
                tip.classList.add("visible");
              }, 100 * (index + 1));
            });
  
            // Désactiver l'observation une fois animé
            observer.unobserve(guide);
          }
        });
      }, observerOptions);
  
      // Observer chaque guide
      plantGuides.forEach((guide) => {
        guideObserver.observe(guide);
      });
    });
  }
  