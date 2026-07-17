document.addEventListener("DOMContentLoaded", async () => {
  const root = document.querySelector(".sphaignes-page");
  if (!root) return;

  await loadSphaignesData(root);
  initScrollAnimations(root);
  initFAQ(root);
  initImageZoom(root);
});

async function loadSphaignesData(root) {
  const grid = root.querySelector("[data-sphaignes-grid]");
  const loading = root.querySelector("[data-sphaignes-loading]");
  const emptyState = root.querySelector("[data-sphaignes-empty]");

  if (!grid) return;

  try {
    const response = await fetch("../json/sphaignes.json");
    if (!response.ok) {
      throw new Error(`Erreur de chargement: ${response.status}`);
    }

    const data = await response.json();
    renderSphaigneCards(grid, data);
    if (loading) loading.remove();
    initFilters(root);
    toggleEmptyState(emptyState, grid.querySelectorAll("[data-sphaignes-card]").length === 0);
  } catch (error) {
    console.error("Erreur lors du chargement des données des sphaignes:", error);
    if (grid) {
      grid.innerHTML = `
        <div class="sphaignes-gallery__empty">
          <h3>Erreur lors du chargement des données</h3>
          <p>Nous n'avons pas pu charger les sphaignes pour le moment. Merci de réessayer plus tard.</p>
        </div>
      `;
    }
    if (loading) loading.remove();
  }
}

function renderSphaigneCards(grid, sphaignesData) {
  grid.innerHTML = "";

  sphaignesData.forEach((sphaigne) => {
    const specsHTML = (sphaigne.specs || [])
      .map(
        (spec) => `
          <div class="sphaignes-card__spec">
            <span class="sphaignes-card__spec-value">${spec.value}</span>
            <span class="sphaignes-card__spec-label">${spec.label}</span>
          </div>
        `
      )
      .join("");

    const descriptionHTML = (sphaigne.description || [])
      .map((para) => `<p class="sphaignes-card__paragraph">${para}</p>`)
      .join("");

    const card = document.createElement("article");
    card.className = "sphaignes-card";
    card.setAttribute("data-sphaignes-card", "");
    card.setAttribute("data-color", sphaigne.type);
    card.setAttribute("data-habitat", sphaigne.habitat);
    card.innerHTML = `
      <div class="sphaignes-card__media" data-sphaignes-zoom>
        <span class="sphaignes-card__badge">${capitalizeFirstLetter(sphaigne.type || "")}</span>
        <img src="${sphaigne.image}" alt="${sphaigne.name}" class="sphaignes-card__image" loading="lazy" />
        <span class="sphaignes-card__signature">WWW.LESGLOUTONNES.BE</span>
      </div>
      <div class="sphaignes-card__body">
        <h3 class="sphaignes-card__title">${sphaigne.name}</h3>
        <p class="sphaignes-card__subtitle">${sphaigne.commonName || ""}</p>
        <div class="sphaignes-card__specs">
          ${specsHTML}
        </div>
        <div class="sphaignes-card__description">
          ${descriptionHTML}
        </div>
        <div class="sphaignes-card__observation">
          <h4 class="sphaignes-card__observation-title">Où l'observer</h4>
          <p class="sphaignes-card__observation-text">${sphaigne.observation || ""}</p>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

function initFilters(root) {
  const colorFilter = root.querySelector('[data-sphaignes-filter="color"]');
  const habitatFilter = root.querySelector('[data-sphaignes-filter="habitat"]');
  const resetButton = root.querySelector("#reset-filters");
  const cards = root.querySelectorAll("[data-sphaignes-card]");
  const emptyState = root.querySelector("[data-sphaignes-empty]");

  const applyFilters = () => {
    const colorValue = colorFilter ? colorFilter.value : "all";
    const habitatValue = habitatFilter ? habitatFilter.value : "all";
    let visibleCount = 0;

    cards.forEach((card) => {
      const matchesColor = colorValue === "all" || card.getAttribute("data-color") === colorValue;
      const matchesHabitat = habitatValue === "all" || card.getAttribute("data-habitat") === habitatValue;
      const shouldShow = matchesColor && matchesHabitat;
      card.style.display = shouldShow ? "grid" : "none";
      if (shouldShow) visibleCount += 1;
    });

    toggleEmptyState(emptyState, visibleCount === 0);
  };

  colorFilter?.addEventListener("change", applyFilters);
  habitatFilter?.addEventListener("change", applyFilters);

  resetButton?.addEventListener("click", () => {
    if (colorFilter) colorFilter.value = "all";
    if (habitatFilter) habitatFilter.value = "all";
    applyFilters();
  });

  applyFilters();
}

function toggleEmptyState(emptyState, shouldShow) {
  if (!emptyState) return;
  emptyState.hidden = !shouldShow;
}

function initFAQ(root) {
  const items = root.querySelectorAll("[data-sphaignes-faq]");
  items.forEach((item) => {
    const toggle = item.querySelector("[data-sphaignes-faq-toggle]");
    const answer = item.querySelector(".sphaignes-faq__answer");
    if (!toggle || !answer) return;

    toggle.addEventListener("click", () => {
      const isActive = item.classList.contains("active");
      items.forEach((other) => other.classList.remove("active"));
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

function initImageZoom(root) {
  const zoomables = root.querySelectorAll("[data-sphaignes-zoom]");
  if (!zoomables.length) return;

  const createModal = () => {
    let modal = document.querySelector(".sphaignes-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.className = "sphaignes-modal";
      modal.innerHTML = `
        <div class="sphaignes-modal__content">
          <button type="button" class="sphaignes-modal__close" aria-label="Fermer">&times;</button>
          <img src="" alt="" class="sphaignes-modal__image" />
        </div>
      `;
      document.body.appendChild(modal);
    }
    return modal;
  };

  zoomables.forEach((element) => {
    element.addEventListener("click", () => {
      const img = element.querySelector("img");
      if (!img) return;
      const modal = createModal();
      const modalImage = modal.querySelector(".sphaignes-modal__image");
      if (modalImage) {
        modalImage.src = img.src;
        modalImage.alt = img.alt || "";
      }

      const closeModal = () => {
        modal.classList.remove("active");
        modal.removeEventListener("click", handleBackdropClick);
        document.removeEventListener("keydown", handleKeyDown);
      };

      const handleBackdropClick = (event) => {
        if (event.target === modal) closeModal();
      };

      const handleKeyDown = (event) => {
        if (event.key === "Escape") closeModal();
      };

      modal.querySelector(".sphaignes-modal__close")?.addEventListener("click", closeModal, { once: true });
      modal.addEventListener("click", handleBackdropClick);
      document.addEventListener("keydown", handleKeyDown);

      requestAnimationFrame(() => modal.classList.add("active"));
    });
  });
}

function initScrollAnimations(root) {
  const sections = root.querySelectorAll(".sphaignes-hero, .sphaignes-section");
  const revealables = () => root.querySelectorAll(
    ".sphaignes-card, .sphaignes-importance__card, .sphaignes-tourism__tip, .sphaignes-faq__item, .sphaignes-contact__banner"
  );

  const isInViewport = (element, threshold = 0.2) => {
    const rect = element.getBoundingClientRect();
    return rect.top <= (window.innerHeight || document.documentElement.clientHeight) * (1 - threshold);
  };

  const reveal = () => {
    sections.forEach((section) => {
      if (!section.classList.contains("visible") && isInViewport(section, 0.1)) {
        section.classList.add("visible");
      }
    });

    revealables().forEach((node) => {
      if (!node.classList.contains("visible") && isInViewport(node, 0.18)) {
        node.classList.add("visible");
      }
    });
  };

  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}

function capitalizeFirstLetter(string = "") {
  return string.charAt(0).toUpperCase() + string.slice(1);
}