document.addEventListener("DOMContentLoaded", () => {
  const privacyRoot = document.querySelector(".privacy-page");
  const mentionsRoot = document.querySelector(".mentions-page");

  if (privacyRoot) {
    initPrivacyPage(privacyRoot);
  }

  if (mentionsRoot) {
    initMentionsPage(mentionsRoot);
  }
});

function initPrivacyPage(root) {
  initialiseRevealDelays(root, ".privacy-card ul li");
  initScrollAnimations(root, ".privacy-section", ".privacy-card");
  initAnchorNavigation(root, "[data-privacy-anchor]");
}

function initMentionsPage(root) {
  initScrollAnimations(root, "section", ".mentions-card, .privacy-card");
  initAnchorNavigation(root, ".category-card");
}

function initScrollAnimations(root, sectionSelector, itemSelector) {
  const sections = root.querySelectorAll(sectionSelector);
  const items = root.querySelectorAll(itemSelector);

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

    items.forEach((item) => {
      if (!item.classList.contains("visible") && isInViewport(item, 0.12)) {
        item.classList.add("visible");
      }
    });
  };

  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}

function initAnchorNavigation(root, selector) {
  const links = root.querySelectorAll(selector);
  if (!links.length) return;

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("#")) return;

    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = root.querySelector(href);
      if (!target) return;

      const offset = 100;
      const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({ top: targetPosition, behavior: "smooth" });
      history.pushState(null, "", href);
    });
  });

  if (window.location.hash) {
    const target = root.querySelector(window.location.hash);
    if (target) {
      setTimeout(() => {
        const offset = 100;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: targetPosition, behavior: "smooth" });
      }, 250);
    }
  }
}

function initialiseRevealDelays(root, selector) {
  root.querySelectorAll(selector).forEach((element, index) => {
    element.style.setProperty("--index", index);
  });
}
  