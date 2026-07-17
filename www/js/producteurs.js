document.addEventListener("DOMContentLoaded", () => {
  initProducteursPage();
  initScrollAnimations();
});

async function initProducteursPage() {
  const root = document.querySelector(".producteurs-page");
  if (!root) return;

  const grid = root.querySelector("[data-producteurs-grid]");
  const loader = grid?.querySelector(".producteurs-loader");
  const paysFilter = root.querySelector("#pays-filter");

  if (!grid || !paysFilter) return;

  let allProducteurs = [];
  let filteredProducteurs = [];

  const toggleLoader = (show) => {
    if (!loader) return;
    loader.hidden = !show;
    loader.style.opacity = show ? "1" : "0";
    loader.style.transform = show ? "translateY(0)" : "translateY(12px)";
  };

  try {
    toggleLoader(true);
    const response = await fetch("../json/producteurs.json");
    if (!response.ok) throw new Error("Impossible de charger les données");
    allProducteurs = await response.json();
    filteredProducteurs = [...allProducteurs];
    renderProducteurs(filteredProducteurs);
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    grid.innerHTML = `
      <div class="producteurs-empty">
        <h3 class="producteurs-empty__title">Erreur de chargement</h3>
        <p class="producteurs-empty__text">Nous n'avons pas pu charger les producteurs. Merci de réessayer plus tard.</p>
      </div>
    `;
  } finally {
    toggleLoader(false);
  }

  function renderProducteurs(producteurs) {
    if (!producteurs.length) {
      grid.innerHTML = `
        <div class="producteurs-empty">
          <h3 class="producteurs-empty__title">Aucun producteur trouvé</h3>
          <p class="producteurs-empty__text">Aucun résultat ne correspond à ces critères. Ajuste les filtres ou contacte-moi pour une recommandation personnalisée.</p>
          <a href="contact.html" class="btn btn-primary">Demander un conseil</a>
        </div>
      `;
      return;
    }

    grid.innerHTML = producteurs
      .map((producteur) => {
        const paysLabel = producteur.pays === "france" ? "France" : "Belgique";
        const linkLabel = producteur.linkLabel || "Visiter le site web";
        let logoLabel = "";
        if (producteur.website) {
          try {
            const host = new URL(producteur.website).hostname.replace(/^www\./, "");
            logoLabel = host.includes("instagram.com")
              ? "INSTAGRAM"
              : host.toUpperCase();
          } catch {
            logoLabel = producteur.name.toUpperCase();
          }
        }

        return `
          <article
            class="producteurs-card"
            id="${producteur.id}"
            data-pays="${producteur.pays}"
          >
            <div class="producteurs-card__media" role="button" tabindex="0" aria-label="Agrandir ${producteur.name}">
              <span class="producteurs-card__badge">${paysLabel}</span>
              <img
                src="${producteur.image}"
                alt="${producteur.name}"
                class="producteurs-card__image"
                loading="lazy"
                onerror="this.onerror=null; this.src='../images/producteurs/default.jpg';"
              />
              ${logoLabel ? `<span class="producteurs-card__logo">${logoLabel}</span>` : ""}
            </div>
            <div class="producteurs-card__body">
              <header class="producteurs-card__header">
                <h3 class="producteurs-card__title">${producteur.name}</h3>
                <p class="producteurs-card__subtitle">${producteur.subtitle}</p>
              </header>

              <dl class="producteurs-card__specs">
                <div class="producteurs-spec">
                  <dt class="producteurs-spec__label">Localisation</dt>
                  <dd class="producteurs-spec__value">${producteur.localisation}</dd>
                </div>
              </dl>

              <div class="producteurs-card__description">
                <p>${producteur.description}</p>
              </div>

              <div class="producteurs-card__actions">
                ${producteur.website ? `
                <a
                  href="${producteur.website}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn btn-primary"
                  >${linkLabel}</a
                >
                ` : ""}
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    if (loader) loader.remove();
    requestAnimationFrame(() => grid.classList.add("is-ready"));
    attachModalListeners();
    revealCardsSequentially();
  }

  function filterProducteurs() {
    const paysValue = paysFilter.value;

    filteredProducteurs = allProducteurs.filter((producteur) => {
      const matchPays = paysValue === "all" || producteur.pays === paysValue;

      return matchPays;
    });

    if (grid) grid.classList.remove("is-ready");
    renderProducteurs(filteredProducteurs);
  }

  function attachModalListeners() {
    const mediaBlocks = grid.querySelectorAll(".producteurs-card__media");
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
  }

  function revealCardsSequentially() {
    const cards = grid.querySelectorAll(".producteurs-card");
    cards.forEach((card, index) => {
      setTimeout(() => card.classList.add("visible"), index * 120);
    });
  }

  paysFilter.addEventListener("change", filterProducteurs);
}

function showImageModal(src, title) {
  const existingModal = document.querySelector(".producteurs-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.className = "producteurs-modal";
  modal.innerHTML = `
    <div class="producteurs-modal__content">
      <button class="producteurs-modal__close" type="button" aria-label="Fermer">&times;</button>
      <img src="${src}" alt="${title}" class="producteurs-modal__image" />
      ${title ? `<h3 class="producteurs-modal__title">${title}</h3>` : ""}
    </div>
  `;

  const appendTarget = document.querySelector(".producteurs-page") || document.body;
  appendTarget.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("active"));

  const closeModal = () => {
    modal.classList.remove("active");
    setTimeout(() => modal.remove(), 250);
  };

  modal.querySelector(".producteurs-modal__close")?.addEventListener("click", closeModal);
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
}

function initScrollAnimations() {
  const root = document.querySelector(".producteurs-page");
  if (!root) return;

  const sections = root.querySelectorAll(".producteurs-hero, .producteurs-section");
  const revealable = () => root.querySelectorAll(".producteurs-card, .producteurs-contact__banner");

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
      if (!node.classList.contains("visible") && isInViewport(node, 0.2)) {
        node.classList.add("visible");
      }
    });
  };

  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}
