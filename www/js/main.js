document.addEventListener("DOMContentLoaded", () => {
  // Charger et afficher le nombre de cultivars de Dionaea
  loadDionaeaCount();

  // Contact form handling
  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    const formStartInput = contactForm.querySelector('input[name="form_start"]');
    if (formStartInput) {
      formStartInput.value = Math.floor(Date.now() / 1000).toString();
    }

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Récupérer les données du formulaire
      const formData = new FormData(contactForm);
      // Afficher un indicateur de chargement
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalButtonText = submitButton.textContent;
      submitButton.textContent = "Envoi en cours...";
      submitButton.disabled = true;

      // Envoyer les données au serveur - CHEMIN MODIFIÉ
      fetch("api/process-inquiry.php", {
        method: "POST",
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            // Afficher un message de succès
            alert(data.message || "Merci pour ton message ! Je te contacterai bientôt.");
            contactForm.reset();
          } else {
            // Afficher un message d'erreur
            alert(data.message || "Une erreur s'est produite. Peux-tu réessayer ?");
          }
        })
        .catch((error) => {
          console.error("Erreur:", error);
          alert("Une erreur s'est produite lors de l'envoi du message. Tu peux me contacter directement via WhatsApp au +32 494 81 14 87");
        })
        .finally(() => {
          // Restaurer le bouton
          submitButton.textContent = originalButtonText;
          submitButton.disabled = false;
        });
    });
  }

  // Fonction pour charger et afficher le nombre de cultivars de Dionaea
  function loadDionaeaCount() {
    fetch('/json/liste_dionaea.json')
      .then(response => response.json())
      .then(data => {
        const count = data.length;
        const countText = count > 0 ? count.toString() : 'Plus de 120';
        
        // Mettre à jour tous les éléments avec le nombre de cultivars
        const elements = [
          document.getElementById('dionaea-count'),
          document.getElementById('dionaea-count-about'),
          document.getElementById('dionaea-count-list')
        ];
        
        elements.forEach(element => {
          if (element) {
            element.textContent = countText;
          }
        });
      })
      .catch(error => {
        console.error('Erreur lors du chargement du nombre de cultivars:', error);
        // En cas d'erreur, on garde le texte par défaut "Plus de 120"
    });
  }

  // WhatsApp contact link - NUMÉRO CORRIGÉ
  const whatsappLinks = document.querySelectorAll(".whatsapp-link");
  whatsappLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      // Message prédéfini avec le bon numéro
      const message = encodeURIComponent(
        "Bonjour, je souhaiterais plus d'informations sur les plantes carnivores."
      );
      window.open(`https://wa.me/+32494881487?text=${message}`, "_blank");
    });
  });

  // Initialiser les effets de survol
  initHoverEffects();

  // Fonction pour initialiser les effets de survol
  function initHoverEffects() {
    // Plant cards hover effect
    const plantCards = document.querySelectorAll(".plant-card");
    plantCards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.classList.add("hover-zoom");
        card.classList.add("hover-shadow");
      });

      card.addEventListener("mouseleave", () => {
        card.classList.remove("hover-zoom");
        card.classList.remove("hover-shadow");
      });
    });

    // Value cards hover effect
    const valueCards = document.querySelectorAll(".value-card");
    valueCards.forEach((card) => {
      card.addEventListener("mouseenter", () => {
        card.style.transform = "translateY(-10px)";
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "translateY(0)";
      });
    });
  }

  // Initialiser le slider si présent
  initSlider();

  // Gestion des formulaires
  initForms();

  // Fonction pour initialiser les formulaires
  function initForms() {
    const formControls = document.querySelectorAll(".form-control");

    formControls.forEach((control) => {
      // Ajouter des classes de validation au focus/blur
      control.addEventListener("focus", () => {
        control.parentElement.classList.add("focused");
      });

      control.addEventListener("blur", () => {
        control.parentElement.classList.remove("focused");

        // Validation simple
        if (control.required && !control.value) {
          control.classList.add("is-invalid");
        } else {
          control.classList.remove("is-invalid");
          if (control.value) {
            control.classList.add("is-valid");
          } else {
            control.classList.remove("is-valid");
          }
        }
      });
    });
  }

  // Fonction pour initialiser le slider
  function initSlider() {
    const slider = document.querySelector(".slider");

    if (slider) {
      const slides = slider.querySelectorAll(".slide");
      if (slides.length === 0) return;

      let currentSlide = 0;

      // Créer les contrôles du slider s'ils n'existent pas
      if (!slider.querySelector(".slider-controls")) {
        // Créer dots
        const sliderControls = document.createElement("div");
        sliderControls.className = "slider-controls";

        slides.forEach((_, index) => {
          const dot = document.createElement("div");
          dot.className = "slider-dot";
          if (index === 0) dot.classList.add("active");

          dot.addEventListener("click", () => {
            goToSlide(index);
          });

          sliderControls.appendChild(dot);
        });

        slider.appendChild(sliderControls);

        // Créer boutons prev/next
        const sliderNav = document.createElement("div");
        sliderNav.className = "slider-nav";

        const prevBtn = document.createElement("button");
        prevBtn.className = "slider-prev";
        prevBtn.innerHTML = "&#10094;";
        prevBtn.setAttribute("aria-label", "Slide précédent");
        prevBtn.addEventListener("click", prevSlide);

        const nextBtn = document.createElement("button");
        nextBtn.className = "slider-next";
        nextBtn.innerHTML = "&#10095;";
        nextBtn.setAttribute("aria-label", "Slide suivant");
        nextBtn.addEventListener("click", nextSlide);

        sliderNav.appendChild(prevBtn);
        sliderNav.appendChild(nextBtn);

        slider.appendChild(sliderNav);
      }

      // Functions for slider controls
      function goToSlide(index) {
        slides[currentSlide].classList.remove("active");
        const dots = slider.querySelectorAll(".slider-dot");
        dots[currentSlide].classList.remove("active");

        currentSlide = index;

        slides[currentSlide].classList.add("active");
        dots[currentSlide].classList.add("active");
      }

      function nextSlide() {
        const newIndex = (currentSlide + 1) % slides.length;
        goToSlide(newIndex);
      }

      function prevSlide() {
        const newIndex = (currentSlide - 1 + slides.length) % slides.length;
        goToSlide(newIndex);
      }

      // Autoplay
      let slideInterval = setInterval(nextSlide, 5000);

      // Pause on hover
      slider.addEventListener("mouseenter", () => {
        clearInterval(slideInterval);
      });

      slider.addEventListener("mouseleave", () => {
        slideInterval = setInterval(nextSlide, 5000);
      });
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Éléments du hero mobile
  const heroSection = document.getElementById("mobile-hero");
  if (!heroSection) return;

  // Animation des éléments de la bannière d'introduction
  const introBanner = heroSection.querySelector(".intro-banner");
  const logo = heroSection.querySelector(".hero-logo");
  const paragraphs = introBanner.querySelectorAll("p");
  const actionButton = introBanner.querySelector(".btn");

  // Animer l'apparition des éléments avec un délai progressif
  if (logo) {
    animateElement(logo, 0);
  }

  paragraphs.forEach((p, index) => {
    animateElement(p, 100 + index * 150);
  });

  if (actionButton) {
    animateElement(actionButton, 100 + paragraphs.length * 150);
  }

  // Animer les cartes de fonctionnalités
  const featureCards = heroSection.querySelectorAll(".feature-card");
  featureCards.forEach((card, index) => {
    animateElement(card, 500 + index * 100);
  });

  // Animer la bannière de mise en avant
  const highlightBanner = heroSection.querySelector(".highlight-banner");
  if (highlightBanner) {
    // Utiliser IntersectionObserver pour déclencher l'animation au défilement
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    // Préparer l'élément pour l'animation
    highlightBanner.style.opacity = "0";
    highlightBanner.style.transform = "translateY(20px)";
    highlightBanner.style.transition = "opacity 0.6s ease, transform 0.6s ease";

    // Observer l'élément
    observer.observe(highlightBanner);
  }

  // Fonction utilitaire pour animer un élément avec un délai
  function animateElement(element, delay) {
    // Préparation de l'animation
    element.style.opacity = "0";
    element.style.transform = "translateY(15px)";
    element.style.transition = "opacity 0.5s ease, transform 0.5s ease";

    // Déclencher l'animation après le délai
    setTimeout(() => {
      element.style.opacity = "1";
      element.style.transform = "translateY(0)";
    }, delay);
  }

  // Ajouter des effets de survol améliorés aux cartes
  featureCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      // Style plus prononcé au survol
      this.style.transform = "translateY(-8px)";
      this.style.boxShadow = "var(--shadow-lg)";

      // Animer l'icône
      const icon = this.querySelector(".card-icon");
      if (icon) {
        icon.style.transform = "scale(1.1)";
        icon.style.transition = "transform 0.3s ease";
      }
    });

    card.addEventListener("mouseleave", function () {
      // Revenir à l'état normal
      this.style.transform = "translateY(0)";
      this.style.boxShadow = "var(--shadow-sm)";

      // Réinitialiser l'icône
      const icon = this.querySelector(".card-icon");
      if (icon) {
        icon.style.transform = "scale(1)";
      }
    });
  });
});