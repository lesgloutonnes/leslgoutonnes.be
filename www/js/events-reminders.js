document.addEventListener("DOMContentLoaded", async () => {
  await loadRemindersData();
  initScrollAnimations();
});

async function loadRemindersData() {
  try {
    const response = await fetch("../json/events.json");
    if (!response.ok) {
      throw new Error(`Erreur de chargement: ${response.status}`);
    }
    
    const eventsData = await response.json();
    renderReminders(eventsData.reminders);
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    const container = document.querySelector("[data-reminders-list]");
    if (container) {
      container.innerHTML = `
        <div class="events-error" role="alert">
          <h3>Impossible de charger les événements</h3>
          <p>Merci de réessayer plus tard.</p>
        </div>
      `;
    }
  }
}

function renderReminders(reminders) {
  const container = document.querySelector("[data-reminders-list]");
  const descriptionEl = document.querySelector("[data-reminders-description]");
  
  if (!container || !reminders) return;

  if (descriptionEl && reminders.description) {
    descriptionEl.textContent = reminders.description;
  }

  if (!reminders.categories || reminders.categories.length === 0) {
    container.innerHTML = `
      <div class="events-error" role="alert">
        <p>Aucun événement à afficher pour le moment.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reminders.categories
    .map((category) => {
      const eventsHTML = (category.events || [])
        .map((event) => {
          const linkHTML = event.link 
            ? `<div class="events-reminder-card__link">
                <a href="${event.link.url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-sm">
                  ${event.link.text}
                </a>
              </div>`
            : '';
          
          return `
          <article class="events-reminder-card">
            <div class="events-reminder-card__header">
              <h3 class="events-reminder-card__title">${event.title}</h3>
              <div class="events-reminder-card__period">${event.period}</div>
            </div>
            <div class="events-reminder-card__body">
              <div class="events-reminder-card__location">
                <span class="events-icon events-icon--location" aria-hidden="true"></span>
                ${event.location}
              </div>
              <p class="events-reminder-card__description">${event.description}</p>
              ${linkHTML}
            </div>
          </article>
        `;
        })
        .join("");

      return `
        <section class="events-reminders__category">
          <h2 class="events-reminders__category-title">${category.title}</h2>
          <div class="events-reminders__events">
            ${eventsHTML}
          </div>
        </section>
      `;
    })
    .join("");
}

function initScrollAnimations() {
  const root = document.querySelector(".events-reminders-page");
  if (!root) return;

  const sections = root.querySelectorAll(".events-hero, .events-section");
  const cards = root.querySelectorAll(".events-reminder-card, .events-reminders__category");

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

    cards.forEach((card) => {
      if (!card.classList.contains("visible") && isInViewport(card, 0.15)) {
        card.classList.add("visible");
      }
    });
  };

  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}

