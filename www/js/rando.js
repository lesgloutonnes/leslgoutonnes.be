document.addEventListener("DOMContentLoaded", async () => {
  const root = document.querySelector(".rando-page");
  if (!root) return;

  const state = {
    items: [],
    filters: {
      region: "all",
      difficulty: "all",
      plants: "all"
    }
  };

  await loadRandoData(root, state);
  initFilters(root, state);
  initImageZoom(root);
  initScrollAnimations(root);
});

async function loadRandoData(root, state) {
  const grid = root.querySelector("[data-rando-grid]");
  const loading = root.querySelector("[data-rando-loading]");
  const emptyState = root.querySelector("[data-rando-empty]");

  if (!grid) return;

  try {
    const response = await fetch("../json/randonnees.json");
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}`);
    }

    state.items = await response.json();
    renderRandoCards(root, state, state.items);
  } catch (error) {
    console.error("Erreur lors du chargement des randonnées:", error);
    grid.innerHTML = `
      <div class="rando-catalogue__empty">
        <h3>Impossible de charger les randonnées</h3>
        <p>Merci de réessayer plus tard ou contacte-moi pour obtenir la fiche souhaitée.</p>
      </div>
    `;
  } finally {
    loading?.remove();
    toggleEmptyState(emptyState, !grid.children.length);
  }
}

function renderRandoCards(root, state, items) {
  const grid = root.querySelector("[data-rando-grid]");
  const emptyState = root.querySelector("[data-rando-empty]");
  if (!grid) return;

  grid.innerHTML = "";

  items.forEach((item) => {
    const regionSlug = (item.region || "").toLowerCase();
    const difficultySlug = normalizeDifficulty(item.difficulte);
    const plantsSlug = (item.plantes || "").toLowerCase();

    const card = document.createElement("article");
    card.className = "rando-card";
    card.id = item.id || "";
    card.setAttribute("data-rando-card", "");
    card.dataset.region = regionSlug;
    card.dataset.difficulty = difficultySlug;
    card.dataset.plants = plantsSlug;

    const specs = createSpecsMarkup(item.specs || {});
    const plantsList = createPlantsList(item.plantesObservables || []);
    const difficultyLabel = item.specs?.difficulte || item.difficulte || "";
    const difficultyClass = `rando-card__difficulty rando-card__difficulty--${difficultySlug}`;
    const regionLabel = formatRegion(item.region);

    card.innerHTML = `
      <div class="rando-card__media" data-rando-zoom>
        <span class="rando-card__badge">${regionLabel}</span>
        <img src="${item.image}" alt="${item.imageAlt || item.titre}" class="rando-card__image" loading="lazy" />
        <span class="rando-card__signature">WWW.LESGLOUTONNES.BE</span>
      </div>
      <div class="rando-card__body">
        <div class="rando-card__header">
          <div class="rando-card__heading">
            <h3 class="rando-card__title">${item.titre}</h3>
            <p class="rando-card__subtitle">${item.sousTitre || ""}</p>
          </div>
          ${difficultyLabel ? `<span class="${difficultyClass}">${difficultyLabel}</span>` : ""}
        </div>

        <div class="rando-card__specs">
          ${specs}
        </div>

        <div class="rando-card__description">
          ${wrapParagraphs(item.description)}
        </div>

        <div class="rando-card__plants">
          <h4 class="rando-card__plants-title">Plantes observables</h4>
          ${plantsList}
        </div>

        <div class="rando-card__extra">
          ${item.meilleurePeriode ? `
            <div class="rando-card__extra-block">
              <h4 class="rando-card__extra-title">Meilleure période</h4>
              <p>${item.meilleurePeriode}</p>
            </div>
          ` : ""}
          ${item.conseils ? `
            <div class="rando-card__extra-block">
              <h4 class="rando-card__extra-title">Conseils pratiques</h4>
              <p>${item.conseils}</p>
            </div>
          ` : ""}
        </div>

        ${item.googleMapsUrl ? `
          <a href="${item.googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary rando-card__cta">Itinéraire Google Maps</a>
        ` : ""}
      </div>
    `;

    grid.appendChild(card);
  });

  toggleEmptyState(emptyState, items.length === 0);
}

function initFilters(root, state) {
  const regionFilter = root.querySelector('[data-rando-filter="region"]');
  const difficultyFilter = root.querySelector('[data-rando-filter="difficulty"]');
  const plantsFilter = root.querySelector('[data-rando-filter="plants"]');
  const resetButton = root.querySelector("#reset-filters");

  const applyFilters = () => {
    state.filters.region = regionFilter ? regionFilter.value : "all";
    state.filters.difficulty = difficultyFilter ? difficultyFilter.value : "all";
    state.filters.plants = plantsFilter ? plantsFilter.value : "all";

    const filtered = state.items.filter((item) => filterRando(item, state.filters));
    renderRandoCards(root, state, filtered);
    requestAnimationFrame(() => refreshAnimatedElements(root));
  };

  regionFilter?.addEventListener("change", applyFilters);
  difficultyFilter?.addEventListener("change", applyFilters);
  plantsFilter?.addEventListener("change", applyFilters);

  resetButton?.addEventListener("click", () => {
    if (regionFilter) regionFilter.value = "all";
    if (difficultyFilter) difficultyFilter.value = "all";
    if (plantsFilter) plantsFilter.value = "all";
    applyFilters();
  });

  applyFilters();
  scrollToHashCard();
}

function scrollToHashCard() {
  const hash = window.location.hash?.replace("#", "");
  if (!hash) return;
  const target = document.getElementById(hash);
  if (!target) return;
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function filterRando(item, filters) {
  const regionSlug = (item.region || "").toLowerCase();
  const difficultySlug = normalizeDifficulty(item.difficulte);
  const plantsString = (item.plantes || "").toLowerCase();

  const matchesRegion = filters.region === "all" || regionSlug === filters.region;
  const matchesDifficulty = filters.difficulty === "all" || difficultySlug === filters.difficulty;
  const matchesPlants = filters.plants === "all" || plantsString.split(/\s+/).includes(filters.plants);

  return matchesRegion && matchesDifficulty && matchesPlants;
}

function initImageZoom(root) {
  if (root.dataset.randoZoomInitialised) return;
  root.dataset.randoZoomInitialised = "true";

  root.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-rando-zoom]");
    if (!trigger || !root.contains(trigger)) return;

    const image = trigger.querySelector("img");
    if (!image) return;

    const modal = getOrCreateModal();
    const modalImage = modal.querySelector(".rando-modal__image");
    const closeButton = modal.querySelector(".rando-modal__close");

    modalImage.src = image.src;
    modalImage.alt = image.alt || "Randonnée";

    const closeModal = () => {
      modal.classList.remove("active");
      modal.removeEventListener("click", handleBackdropClick);
      document.removeEventListener("keydown", handleKeyDown);
      closeButton.removeEventListener("click", closeModal);
    };

    const handleBackdropClick = (evt) => {
      if (evt.target === modal) closeModal();
    };

    const handleKeyDown = (evt) => {
      if (evt.key === "Escape") closeModal();
    };

    closeButton.addEventListener("click", closeModal, { once: true });
    modal.addEventListener("click", handleBackdropClick);
    document.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(() => modal.classList.add("active"));
  });
}

function getOrCreateModal() {
  let modal = document.querySelector(".rando-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "rando-modal";
    modal.innerHTML = `
      <div class="rando-modal__content">
        <button type="button" class="rando-modal__close" aria-label="Fermer">&times;</button>
        <img src="" alt="" class="rando-modal__image" />
      </div>
    `;
    document.body.appendChild(modal);
  }
  return modal;
}

function initScrollAnimations(root) {
  const sections = root.querySelectorAll(".rando-hero, .rando-section");

  const getRevealables = () => root.querySelectorAll(
    ".rando-card, .rando-guidelines__card, .rando-contact__banner"
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

    getRevealables().forEach((node) => {
      if (!node.classList.contains("visible") && isInViewport(node, 0.18)) {
        node.classList.add("visible");
      }
    });
  };

  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}

function refreshAnimatedElements(root) {
  root.querySelectorAll(
    ".rando-card, .rando-guidelines__card, .rando-contact__banner"
  ).forEach((node) => node.classList.remove("visible"));
}

function toggleEmptyState(emptyState, shouldShow) {
  if (!emptyState) return;
  emptyState.hidden = !shouldShow;
}

function formatRegion(region) {
  if (!region) return "";
  return region.charAt(0).toUpperCase() + region.slice(1).toLowerCase();
}

function normalizeDifficulty(value) {
  const label = (value || "").toString().toLowerCase();
  if (label.startsWith("fac")) return "facile";
  if (label.startsWith("diff")) return "difficile";
  if (label.startsWith("moy")) return "moyen";
  return "moyen";
}

function createSpecsMarkup(specs) {
  const entries = [
    { icon: "📍", label: "Localisation", value: specs.localisation },
    { icon: "📏", label: "Distance", value: specs.distance },
    { icon: "⏱", label: "Durée", value: specs.duree },
    { icon: "🧗", label: "Difficulté", value: specs.difficulte }
  ].filter((entry) => entry.value);

  return entries
    .map(
      (entry) => `
        <div class="rando-card__spec">
          <span class="rando-card__spec-icon">${entry.icon}</span>
          <span class="rando-card__spec-label">${entry.label}</span>
          <span class="rando-card__spec-value">${entry.value}</span>
        </div>
      `
    )
    .join("");
}

function createPlantsList(plants) {
  if (!plants.length) return "<p>Aucune information disponible.</p>";
  return `
    <ul class="rando-card__plants-list">
      ${plants
        .map(
          (plant) => `
            <li class="rando-card__plants-item">
              <strong>${plant.nom}</strong> – ${plant.description}
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function wrapParagraphs(text) {
  if (!text) return "";
  if (Array.isArray(text)) {
    return text.map((paragraph) => `<p class="rando-card__paragraph">${paragraph}</p>`).join("");
  }
  return `<p class="rando-card__paragraph">${text}</p>`;
}