document.addEventListener("DOMContentLoaded", () => {
    // Initialisation des animations pour les cartes de fonctionnalités
    const featureCards = document.querySelectorAll(".feature-card");
  
    // Ajouter une animation d'entrée progressive avec un délai pour chaque carte
    featureCards.forEach((card, index) => {
      // Masquer initialement les cartes
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
      card.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  
      // Afficher progressivement avec un délai basé sur l'index
      setTimeout(() => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, 100 + index * 100); // Délai croissant pour chaque carte
    });
  
    // Animation de la bannière de mise en avant
    const highlightBanner = document.querySelector(".highlight-banner");
    if (highlightBanner) {
      highlightBanner.style.opacity = "0";
      highlightBanner.style.transform = "scale(0.95)";
      highlightBanner.style.transition = "opacity 0.7s ease, transform 0.7s ease";
  
      // Déclencher l'animation lorsque la bannière devient visible
      const observerOptions = {
        threshold: 0.2, // Déclencher quand 20% de l'élément est visible
        rootMargin: "0px",
      };
  
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            highlightBanner.style.opacity = "1";
            highlightBanner.style.transform = "scale(1)";
            // Arrêter d'observer une fois l'animation déclenchée
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);
  
      observer.observe(highlightBanner);
    }
  
    // Détection de l'orientation pour optimiser l'affichage (optionnel)
    const checkOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
  
      // Ajuster le layout pour l'orientation paysage sur mobile
      if (isLandscape && window.innerWidth < 1024) {
        document.body.classList.add("landscape");
      } else {
        document.body.classList.remove("landscape");
      }
    };
  
    // Vérifier l'orientation initiale
    checkOrientation();
  
    // Vérifier à chaque changement d'orientation
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
  
    // NOUVELLE FONCTIONNALITÉ: Initialiser la texture pour l'intro-banner
    initIntroBannerTexture();
  
    // Fonction pour initialiser la texture de la bannière d'introduction
    function initIntroBannerTexture() {
      const introBanner = document.querySelector(".intro-banner");
  
      if (introBanner) {
        // Créer un élément de fond pour la texture
        const textureOverlay = document.createElement("div");
        textureOverlay.className = "texture-overlay";
  
        // Insérer l'élément de texture en premier enfant pour qu'il soit en arrière-plan
        introBanner.prepend(textureOverlay);
  
        // Effet de parallaxe léger sur la texture (optionnel)
        if (window.innerWidth >= 768) {
          // Seulement sur les écrans plus grands
          introBanner.addEventListener("mousemove", (e) => {
            const xPos = (e.clientX / window.innerWidth - 0.5) * 20;
            const yPos = (e.clientY / window.innerHeight - 0.5) * 20;
  
            textureOverlay.style.transform = `translate(${xPos}px, ${yPos}px)`;
          });
  
          introBanner.addEventListener("mouseleave", () => {
            textureOverlay.style.transform = "translate(0, 0)";
          });
        }
      }
    }
  
    // Fonction pour initialiser le slider hero si présent (version classique)
    initHeroSlider();
  
    function initHeroSlider() {
      const heroSlider = document.querySelector(".hero-slider");
  
      if (heroSlider) {
        const slides = heroSlider.querySelectorAll(".slide");
        if (slides.length === 0) return;
  
        let currentSlide = 0;
  
        // Sélectionner les éléments de contrôle
        const dots = heroSlider.querySelectorAll(".slider-controls .slider-dot");
        const prevBtn = heroSlider.querySelector(".slider-prev");
        const nextBtn = heroSlider.querySelector(".slider-next");
  
        // Si les points de navigation n'existent pas, les créer
        if (dots.length === 0) {
          createSliderControls();
        }
  
        // Créer les contrôles du slider si nécessaire
        function createSliderControls() {
          const sliderControls = heroSlider.querySelector(".slider-controls");
  
          // Si le conteneur de contrôles existe mais est vide, ou n'existe pas du tout
          if (!sliderControls || sliderControls.children.length === 0) {
            // Créer le conteneur s'il n'existe pas
            const controlsContainer =
              sliderControls || document.createElement("div");
            if (!sliderControls) {
              controlsContainer.className = "slider-controls";
            }
  
            // Créer un point pour chaque diapositive
            slides.forEach((_, index) => {
              const dot = document.createElement("div");
              dot.className = "slider-dot";
              if (index === 0) dot.classList.add("active");
  
              dot.addEventListener("click", () => {
                goToSlide(index);
              });
  
              controlsContainer.appendChild(dot);
            });
  
            // Ajouter le conteneur au slider s'il n'existait pas
            if (!sliderControls) {
              heroSlider.appendChild(controlsContainer);
            }
          }
  
          // S'assurer que les boutons de navigation fonctionnent
          const navContainer = heroSlider.querySelector(".slider-nav");
          if (navContainer) {
            const prevButton = navContainer.querySelector(".slider-prev");
            const nextButton = navContainer.querySelector(".slider-next");
  
            if (prevButton) {
              prevButton.addEventListener("click", prevSlide);
            }
  
            if (nextButton) {
              nextButton.addEventListener("click", nextSlide);
            }
          }
        }
  
        // Fonctions pour le contrôle du slider
        function goToSlide(index) {
          // Retirer la classe active de la diapo actuelle
          slides[currentSlide].classList.remove("active");
  
          // Mettre à jour le point de navigation actif
          const dots = heroSlider.querySelectorAll(
            ".slider-controls .slider-dot"
          );
          if (dots[currentSlide]) {
            dots[currentSlide].classList.remove("active");
          }
  
          // Mettre à jour l'index de la diapositive courante
          currentSlide = index;
  
          // Ajouter la classe active à la nouvelle diapo
          slides[currentSlide].classList.add("active");
  
          // Mettre à jour le point de navigation actif
          if (dots[currentSlide]) {
            dots[currentSlide].classList.add("active");
          }
        }
  
        function nextSlide() {
          const newIndex = (currentSlide + 1) % slides.length;
          goToSlide(newIndex);
        }
  
        function prevSlide() {
          const newIndex = (currentSlide - 1 + slides.length) % slides.length;
          goToSlide(newIndex);
        }
  
        // Attacher les événements aux boutons s'ils existent
        if (prevBtn) prevBtn.addEventListener("click", prevSlide);
        if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  
        // Configurer le défilement automatique
        let autoplayInterval = setInterval(nextSlide, 5000);
  
        // Mettre en pause au survol
        heroSlider.addEventListener("mouseenter", () => {
          clearInterval(autoplayInterval);
        });
  
        heroSlider.addEventListener("mouseleave", () => {
          autoplayInterval = setInterval(nextSlide, 5000);
        });
      }
    }
  });
  