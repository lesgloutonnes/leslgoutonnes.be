document.addEventListener("DOMContentLoaded", () => {
  initApplicationsPage();
  initScrollAnimations();
});

function initApplicationsPage() {
  const root = document.querySelector(".applications-page");
  if (!root) return;

  const cards = () => Array.from(root.querySelectorAll(".applications-card"));
  const mediaBlocks = () => Array.from(root.querySelectorAll(".applications-card__media"));
  const downloadButton = root.querySelector(".applications-download__button");

  revealCardsSequentially();
  attachModalListeners();
  enhanceDownloadButton();

  function revealCardsSequentially() {
    cards().forEach((card, index) => {
      setTimeout(() => card.classList.add("visible"), index * 120);
    });
  }

  function attachModalListeners() {
    mediaBlocks().forEach((block) => {
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

  function enhanceDownloadButton() {
    if (!downloadButton) return;

    const originalLabel = downloadButton.innerHTML;
    const hoverLabel = '<i class="fas fa-download"></i> Télécharger maintenant';

    downloadButton.addEventListener("mouseenter", () => {
      downloadButton.innerHTML = hoverLabel;
    });

    downloadButton.addEventListener("mouseleave", () => {
      downloadButton.innerHTML = originalLabel;
    });
  }
}

function showImageModal(src, title) {
  const existingModal = document.querySelector(".applications-modal");
  if (existingModal) existingModal.remove();

  const modal = document.createElement("div");
  modal.className = "applications-modal";
  modal.innerHTML = `
    <div class="applications-modal__content">
      <button class="applications-modal__close" type="button" aria-label="Fermer">&times;</button>
      <img src="${src}" alt="${title}" class="applications-modal__image" />
      ${title ? `<h3 class="applications-modal__title">${title}</h3>` : ""}
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add("active"));

  const closeModal = () => {
    modal.classList.remove("active");
    setTimeout(() => modal.remove(), 250);
  };

  modal.querySelector(".applications-modal__close")?.addEventListener("click", closeModal);
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
  const root = document.querySelector(".applications-page");
  if (!root) return;

  const sections = root.querySelectorAll(".applications-hero, .applications-section");
  const revealable = () => root.querySelectorAll(
    ".applications-card, .applications-collection__media, .applications-contact__banner, .applications-benefits__card"
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

    revealable().forEach((node) => {
      if (!node.classList.contains("visible") && isInViewport(node, 0.18)) {
        node.classList.add("visible");
      }
    });
  };

  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}