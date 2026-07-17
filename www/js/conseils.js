document.addEventListener("DOMContentLoaded", () => {
  initConseilsPage();
  initScrollAnimations();
});

function initConseilsPage() {
  const root = document.querySelector(".conseils-page");
  if (!root) return;

  initSmoothScrolling(root);
  initVideoThumbnails(root);
}

function initSmoothScrolling(root) {
  const links = root.querySelectorAll("[data-scroll-link]");
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);
      if (!target) return;

      const offset = 100;
      const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "smooth" });
      history.pushState(null, "", targetId);
    });
  });

  if (window.location.hash) {
    const target = document.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        const offset = 100;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }, 300);
    }
  }
}

function initVideoThumbnails(root) {
  const cards = root.querySelectorAll("[data-video-card]");
  cards.forEach((card) => {
    const trigger = card.querySelector("[data-video-trigger]");
    const link = card.querySelector(".conseils-video__link");
    if (!trigger || !link) return;

    trigger.addEventListener("click", () => {
      window.open(link.getAttribute("href"), "_blank", "noopener");
    });
  });
}

function initScrollAnimations() {
  const root = document.querySelector(".conseils-page");
  if (!root) return;

  const sections = root.querySelectorAll(".conseils-hero, .conseils-section");
  const revealables = () => root.querySelectorAll(
    ".conseils-category, .conseils-video, .conseils-featured__media, .conseils-contact__banner"
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
  