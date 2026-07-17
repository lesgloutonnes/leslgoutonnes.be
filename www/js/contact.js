document.addEventListener("DOMContentLoaded", () => {
    // Référence aux éléments du DOM
    const appointmentForm = document.getElementById("appointment-form");
    const visitDateInput = document.getElementById("visit-date");
    const visitTimeSelect = document.getElementById("visit-time");
  
    // Configuration des dates pour le calendrier
    if (visitDateInput) {
      // Définir la date minimale à aujourd'hui
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      visitDateInput.setAttribute("min", formattedDate);
  
      // Définir la date maximale à 3 mois après aujourd'hui
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 3);
      const formattedMaxDate = maxDate.toISOString().split("T")[0];
      visitDateInput.setAttribute("max", formattedMaxDate);
  
      // Événement pour adapter les horaires selon le jour sélectionné
      visitDateInput.addEventListener("input", function () {
        const selectedDate = new Date(this.value);
        const day = selectedDate.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
  
        updateTimeSlots(day);
      });
    }
  
    // Fonction pour mettre à jour les créneaux horaires en fonction du jour
    function updateTimeSlots(day) {
      // Réinitialiser les options d'horaires
      visitTimeSelect.innerHTML = '<option value="">Choisir un horaire</option>';
  
      // Dimanche ou Samedi (0 ou 6)
      if (day === 0 || day === 6) {
        // Horaires de 10h à 20h
        for (let hour = 10; hour < 20; hour++) {
          addTimeOption(`${hour}:00`, `${hour}h00 - ${hour + 1}h00`);
        }
      } else {
        // Lundi à Vendredi (1-5) : 16h30-19h30
        addTimeOption("16:30", "16h30 - 17h30");
        addTimeOption("17:30", "17h30 - 18h30");
        addTimeOption("18:30", "18h30 - 19h30");
      }
    }
  
    // Fonction pour ajouter une option d'horaire
    function addTimeOption(value, text) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      visitTimeSelect.appendChild(option);
    }
  
    // Validation et soumission du formulaire
    if (appointmentForm) {
      const formStartInput = appointmentForm.querySelector('input[name="form_start"]');
      if (formStartInput) {
        formStartInput.value = Math.floor(Date.now() / 1000).toString();
      }

      appointmentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
  
        // Validation de base du formulaire
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const date = visitDateInput.value;
        const time = visitTimeSelect.value;
        const visitors = document.getElementById("visitors").value;
        const message = document.getElementById("message").value;
  
        if (!name || !email || !phone || !date || !time || !visitors) {
          alert("Veuillez remplir tous les champs obligatoires.");
          return;
        }
  
        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          alert("Veuillez entrer une adresse email valide.");
          return;
        }
  
        // Validation du téléphone
        const phoneRegex =
          /^(?:(?:\+|00)32|0)(?:\s*[1-9](?:[\s.-]*\d{2}){4}|\d{8})$/;
        if (!phoneRegex.test(phone)) {
          alert("Veuillez entrer un numéro de téléphone valide (format belge).");
          return;
        }
  
        // Récupération des plantes sélectionnées pour l'affichage
        const plantSelect = document.getElementById("interested-plants");
        const selectedPlants = Array.from(plantSelect.selectedOptions).map(
          (option) => option.text
        );
  
        // Afficher un indicateur de chargement
        const submitBtn = appointmentForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Envoi en cours...";
  
        // Préparer les données pour le formulaire PHP classique
        const formData = new FormData(appointmentForm);
        // Ajouter les plantes sélectionnées (valeurs, pas texte)
        const selectedPlantValues = Array.from(plantSelect.selectedOptions).map(
          (option) => option.value
        );
        
        // Supprimer l'ancien champ et ajouter les nouvelles valeurs
        formData.delete('interested-plants');
        selectedPlantValues.forEach(plant => {
          formData.append('interested-plants[]', plant);
        });

        try {
          // Envoi vers le script PHP dans /api/
          const response = await fetch("/api/process-contact.php", {
            method: "POST",
            body: formData,
          });

          const result = await response.json();

          if (result.success) {
            const requestId =
              result.data && result.data.request_id
                ? result.data.request_id
                : "non communiqué";
            // Message de confirmation personnalisé
            const successMessage = `Merci pour ta demande de rendez-vous, ${name} !
                    
J'ai bien reçu ta demande pour le ${formatDate(date)} à ${time}.
Nombre de visiteurs : ${visitors}
Plantes d'intérêt : ${selectedPlants.length > 0 ? selectedPlants.join(", ") : "Aucune plante spécifique"}

Je te contacterai rapidement pour confirmer ta visite.
Référence : ${requestId}`;
    
            alert(successMessage);
            
            // Réinitialiser le formulaire
            appointmentForm.reset();
            // Réinitialiser aussi les horaires
            visitTimeSelect.innerHTML = '<option value="">Choisir un horaire</option>';
          } else {
            throw new Error(result.message || "Erreur lors de l'envoi");
          }
        } catch (error) {
          console.error("Erreur:", error);
          alert(
            error.message || "Une erreur est survenue. Contacte-moi directement au +32 494 81 14 87"
          );
        } finally {
          // Restaurer le bouton
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      });
    }
  
    // Fonction pour formatter une date en français
    function formatDate(dateString) {
      const date = new Date(dateString);
      const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return date.toLocaleDateString("fr-FR", options);
    }
  
    // Animation au défilement pour les sections
    const animateSections = () => {
      const sections = document.querySelectorAll("section");
  
      sections.forEach((section) => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
  
        if (sectionTop < windowHeight * 0.75) {
          section.classList.add("visible");
        }
      });
    };
  
    // Exécuter l'animation au chargement et au défilement
    animateSections();
    window.addEventListener("scroll", animateSections);
  
    // Interaction avec la carte
    const mapVisual = document.querySelector('[data-contact-map]');
    if (mapVisual) {
      const planImage = mapVisual.querySelector('.contact-map__image--plan');
      const streetImage = mapVisual.querySelector('.contact-map__image--street');
      const mapLink = mapVisual.querySelector('.contact-map__cta a');
      const hint = mapVisual.querySelector('.contact-map__hint');
      let isStreetView = false;

      const toggleMapImages = (forceState) => {
        const showStreet = typeof forceState === 'boolean' ? forceState : !isStreetView;
        if (!planImage || !streetImage) return;

        if (showStreet) {
          planImage.classList.remove('is-active');
          streetImage.classList.add('is-active');
          if (hint) {
            hint.textContent = '👁️ Tape pour voir le plan';
          }
        } else {
          streetImage.classList.remove('is-active');
          planImage.classList.add('is-active');
          if (hint) {
            hint.textContent = '👁️ Tape pour passer en Street View';
          }
        }
        isStreetView = showStreet;
      };

      if ("ontouchstart" in window || navigator.maxTouchPoints) {
        mapVisual.addEventListener('click', (event) => {
          if (event.target.closest('.contact-map__cta')) {
            return;
          }
          event.preventDefault();
          toggleMapImages();
        });
      } else if (planImage && streetImage) {
        mapVisual.addEventListener('mouseleave', () => {
          toggleMapImages(false);
        });
      }

      if (mapLink && planImage) {
        planImage.addEventListener('click', () => mapLink.click());
      }
      if (mapLink && streetImage) {
        streetImage.addEventListener('click', () => mapLink.click());
      }
    }
  
    // Gestion des boutons WhatsApp
    const whatsappButton = document.querySelector(".whatsapp-link");
    if (whatsappButton) {
      whatsappButton.addEventListener("click", (e) => {
        e.preventDefault();
        const message = encodeURIComponent(
          "Bonjour, je souhaiterais plus d'informations sur les plantes carnivores et les visites à la serre."
        );
        window.open(
          `${whatsappButton.getAttribute("href")}?text=${message}`,
          "_blank"
        );
      });
    }
  });
  
  // Basculement des images de carte pour appareils tactiles
  // Interaction tactile : déjà gérée ci-dessus via data-contact-map