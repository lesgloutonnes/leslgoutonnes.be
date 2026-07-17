document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".sitemap-page");
  if (!root) return;

  initialiseRevealDelays(root);
  initScrollAnimations(root);
});

function initScrollAnimations(root) {
  const sections = root.querySelectorAll(".sitemap-section");
  const categories = root.querySelectorAll(".sitemap-category");

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

    categories.forEach((category) => {
      if (!category.classList.contains("visible") && isInViewport(category, 0.12)) {
        category.classList.add("visible");
      }
    });
  };

  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}

function initialiseRevealDelays(root) {
  root.querySelectorAll(
    ".sitemap-category .sitemap-links li"
  ).forEach((item, index) => {
    item.style.setProperty("--index", index);
  });
}