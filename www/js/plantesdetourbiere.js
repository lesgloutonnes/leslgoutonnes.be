document.addEventListener("DOMContentLoaded", () => {
  initTourbierePage();
  initScrollAnimations();
});

function initTourbierePage() {
  const grid = document.querySelector("[data-tourbiere-grid]");
  const loader = document.querySelector("[data-tourbiere-loader]");
  const emptyState = document.querySelector("[data-tourbiere-empty]");
  const typeFilter = document.getElementById("plant-type-filter");
  const difficultyFilter = document.getElementById("difficulty-filter");
  const resetButton = document.getElementById("reset-filters");

  if (!grid || !loader || !emptyState || !typeFilter || !difficultyFilter) return;

  let allPlants = [];
  let filteredPlants = [];

  const toggleLoader = (show) => {
    if (!loader) return;
    loader.hidden = !show;
    loader.style.opacity = show ? "1" : "0";
    loader.style.transform = show ? "translateY(0)" : "translateY(12px)";
  };

  const toggleEmptyState = (show) => {
    emptyState.hidden = !show;
    if (grid) {
      grid.style.display = show ? "none" : "grid";
      if (!show) grid.classList.add("is-ready");
    }
  };

  const fetchPlants = async () => {
    try {
      toggleLoader(true);
      const response = await fetch("../json/tourbiere.json");
      if (!response.ok) throw new Error("Impossible de charger les données");
      const data = await response.json();
      allPlants = data;
      filteredPlants = [...allPlants];
      renderPlants(filteredPlants);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toggleEmptyState(true);
      emptyState.innerHTML = `
        <h3 class="tourbiere-empty__title">Erreur de chargement</h3>
        <p class="tourbiere-empty__text">Nous n'avons pas pu charger les plantes de tourbière. Merci de réessayer plus tard.</p>
      `;
    } finally {
      toggleLoader(false);
    }
  };

  const renderPlants = (plants) => {
    if (!plants.length) {
      grid.innerHTML = "";
      toggleEmptyState(true);
      return;
    }

    toggleEmptyState(false);
    grid.classList.remove("is-ready");

    grid.innerHTML = plants
      .map((plant) => {
        const lastSpec = pickAdditionalSpec(plant.specs);
        return `
          <article class="tourbiere-card" data-type="${plant.category}" data-difficulty="${plant.difficulty}">
            <div class="tourbiere-card__media" role="button" tabindex="0" aria-label="Agrandir ${plant.name}" data-image-modal="${plant.images?.main ?? ""}">
              <span class="tourbiere-card__badge">${mapCategoryLabel(plant.category)}</span>
              <img src="${plant.images?.main ?? ""}" alt="${plant.name}" loading="lazy" />
              <span class="tourbiere-card__logo">LES GLOUTONNES</span>
            </div>
            <div class="tourbiere-card__body">
              <div>
                <h3 class="tourbiere-card__title">${plant.name}</h3>
                <p class="tourbiere-card__subtitle">${plant.commonName ?? ""}</p>
              </div>
              <div class="tourbiere-specs">
                <div class="tourbiere-spec">
                  <span class="tourbiere-spec__icon">🌡️</span>
                  <span class="tourbiere-spec__value">${plant.specs?.rusticite ?? "—"}</span>
                  <span class="tourbiere-spec__label">Rusticité</span>
                </div>
                <div class="tourbiere-spec">
                  <span class="tourbiere-spec__icon">☀️</span>
                  <span class="tourbiere-spec__value">${plant.specs?.exposition ?? "—"}</span>
                  <span class="tourbiere-spec__label">Exposition</span>
                </div>
                <div class="tourbiere-spec">
                  <span class="tourbiere-spec__icon">📏</span>
                  <span class="tourbiere-spec__value">${plant.specs?.hauteur ?? "—"}</span>
                  <span class="tourbiere-spec__label">Hauteur</span>
                </div>
                <div class="tourbiere-spec">
                  <span class="tourbiere-spec__icon">${lastSpec.icon}</span>
                  <span class="tourbiere-spec__value">${lastSpec.value}</span>
                  <span class="tourbiere-spec__label">${lastSpec.label}</span>
                </div>
              </div>
              <div class="tourbiere-card__description">
                ${formatDescription(plant.description)}
              </div>
              <div class="tourbiere-card__culture">
                <h4>Conseils de culture</h4>
                <ul>
                  ${(plant.cultureNotes ?? []).map((note) => `<li>${note}</li>`).join("")}
                </ul>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    requestAnimationFrame(() => grid.classList.add("is-ready"));
    attachModalListeners();
  };

  const filterPlants = () => {
    const typeValue = typeFilter.value;
    const difficultyValue = difficultyFilter.value;

    filteredPlants = allPlants.filter((plant) => {
      const matchType = typeValue === "all" || plant.category === typeValue;
      const matchDifficulty = difficultyValue === "all" || plant.difficulty === difficultyValue;
      return matchType && matchDifficulty;
    });

    if (grid) grid.classList.remove("is-ready");
    renderPlants(filteredPlants);
  };

  const mapCategoryLabel = (category) => {
    const labels = {
      orchidees: "Orchidée",
      arbustes: "Arbuste",
      vivaces: "Vivace",
      fougeres: "Fougère",
      bulbeuses: "Bulbeuse",
    };
    return labels[category] ?? category ?? "Plante";
  };

  const pickAdditionalSpec = (specs = {}) => {
    if (specs.floraison) return { icon: "🌸", value: specs.floraison, label: "Floraison" };
    if (specs.fruits) return { icon: "🍒", value: specs.fruits, label: "Fruits" };
    if (specs.epis) return { icon: "🌾", value: specs.epis, label: "Épis" };
    if (specs.inflorescence) return { icon: "🌾", value: specs.inflorescence, label: "Inflorescence" };
    return { icon: "🌿", value: "Variable", label: "Caractéristique" };
  };

  const formatDescription = (description = "") => {
    if (description.includes("<")) return description;
    return description
      .split(/\n\n+/)
      .map((paragraph) => `<p>${paragraph.trim()}</p>`)
      .join("");
  };

  const attachModalListeners = () => {
    const mediaBlocks = grid.querySelectorAll(".tourbiere-card__media");
    mediaBlocks.forEach((block) => {
      const image = block.querySelector("img");
      if (!image) return;

      const openModal = () => showImageModal(image.src, image.alt);

      block.addEventListener("click", openModal);
      block.addEventListener("keypress", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openModal();
        }
      });
    });
  };

  const showImageModal = (src, title) => {
    const existingModal = document.querySelector(".tourbiere-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.className = "tourbiere-modal";
    modal.innerHTML = `
      <div class="tourbiere-modal__content">
        <button class="tourbiere-modal__close" type="button" aria-label="Fermer">&times;</button>
        <img src="${src}" alt="${title}" class="tourbiere-modal__image" />
        ${title ? `<h3 class="tourbiere-modal__title">${title}</h3>` : ""}
      </div>
    `;

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.classList.add("active"));

    const closeModal = () => {
      modal.classList.remove("active");
      setTimeout(() => modal.remove(), 250);
    };

    modal.querySelector(".tourbiere-modal__close")?.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" && modal.classList.contains("active")) closeModal();
      },
      { once: true }
    );
  };

  typeFilter.addEventListener("change", filterPlants);
  difficultyFilter.addEventListener("change", filterPlants);
  resetButton?.addEventListener("click", () => {
    typeFilter.value = "all";
    difficultyFilter.value = "all";
    filterPlants();
  });

  if (grid) grid.classList.remove("is-ready");
  fetchPlants();
}

function initScrollAnimations() {
  const root = document.querySelector(".tourbiere-page");
  if (!root) return;

  const sections = root.querySelectorAll(".tourbiere-hero, .tourbiere-section");
  const revealable = () => root.querySelectorAll(".tourbiere-card, .tourbiere-contact__banner, .tourbiere-link-card");

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

    revealable().forEach((node) => {
      if (!node.classList.contains("visible") && isInViewport(node, 0.18)) {
        node.classList.add("visible");
      }
    });
  };

  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}