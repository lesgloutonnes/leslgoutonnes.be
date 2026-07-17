document.addEventListener("DOMContentLoaded", () => {
    // Gestion du slider de témoignages
    initTestimonialSlider();
  
    // Animation au défilement
    initScrollAnimations();
  
    // Interactions galerie
    initGalleryInteractions();
  });
  
  // Fonction pour initialiser le slider de témoignages
  function initTestimonialSlider() {
    const slides = document.querySelectorAll(".testimonial-slide");
    const dots = document.querySelectorAll(".testimonial-dot");
  
    if (slides.length === 0 || dots.length === 0) return;
  
    // Configuration du slider
    let currentSlide = 0;
    let slideInterval;
  
    // Fonction pour afficher un slide spécifique
    const showSlide = (index) => {
      // Masquer tous les slides
      slides.forEach((slide) => {
        slide.classList.remove("active");
      });
  
      // Désactiver tous les indicateurs
      dots.forEach((dot) => {
        dot.classList.remove("active");
      });
  
      // Afficher le slide demandé
      slides[index].classList.add("active");
      dots[index].classList.add("active");
  
      // Mettre à jour le slide courant
      currentSlide = index;
    };
  
    // Fonction pour passer au slide suivant
    const nextSlide = () => {
      const newIndex = (currentSlide + 1) % slides.length;
      showSlide(newIndex);
    };
  
    // Ajouter les événements click aux dots
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showSlide(index);
        resetInterval();
      });
    });
  
    // Démarrer l'autoplay
    const startAutoplay = () => {
      slideInterval = setInterval(nextSlide, 5000);
    };
  
    // Réinitialiser l'intervalle
    const resetInterval = () => {
      clearInterval(slideInterval);
      startAutoplay();
    };
  
    // Initialiser le slider
    startAutoplay();
  
    // Pause de l'autoplay au survol
    const sliderContainer = document.querySelector(".testimonial-slider");
    if (sliderContainer) {
      sliderContainer.addEventListener("mouseenter", () => {
        clearInterval(slideInterval);
      });
  
      sliderContainer.addEventListener("mouseleave", () => {
        startAutoplay();
      });
    }
  }
  
  // Fonction pour initialiser les animations au défilement
  function initScrollAnimations() {
    const sections = document.querySelectorAll(".about-hero, .about-section");
    const animatedElements = document.querySelectorAll(
      ".about-founder__layout, .about-values__card, .about-collection__content, .about-greenhouse__layout, .about-media__link"
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
      animatedElements.forEach((element) => {
        if (isElementInViewport(element)) {
          element.classList.add("animated");
        }
      });
  
      sections.forEach((section) => {
        if (isElementInViewport(section, 0.1)) {
          section.classList.add("visible");
        }
      });
    };
  
    // Exécuter l'animation au chargement et au défilement
    animateElements();
    window.addEventListener("scroll", animateElements);
  }
  
  // Fonction pour initialiser les interactions de la galerie
  function initGalleryInteractions() {
    const galleryImages = document.querySelectorAll(".about-gallery__item");
  
    galleryImages.forEach((image) => {
      image.addEventListener("click", () => {
        // Créer une modal pour afficher l'image en grand
        const modal = document.createElement("div");
        modal.classList.add("gallery-modal");
  
        const modalContent = document.createElement("div");
        modalContent.classList.add("modal-content");
  
        const imgSrc = image.querySelector("img").getAttribute("src");
        const modalImg = document.createElement("img");
        modalImg.setAttribute("src", imgSrc);
  
        const closeBtn = document.createElement("button");
        closeBtn.classList.add("modal-close");
        closeBtn.innerHTML = "&times;";
  
        modalContent.appendChild(modalImg);
        modalContent.appendChild(closeBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
  
        // Afficher la modal
        setTimeout(() => {
          modal.classList.add("active");
        }, 10);
  
        // Fermer la modal
        closeBtn.addEventListener("click", () => {
          modal.classList.remove("active");
          setTimeout(() => {
            document.body.removeChild(modal);
          }, 300);
        });
  
        // Fermer la modal au clic en dehors de l'image
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.classList.remove("active");
            setTimeout(() => {
              document.body.removeChild(modal);
            }, 300);
          }
        });
      });
    });
  }
  