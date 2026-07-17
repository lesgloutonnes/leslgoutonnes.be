document.addEventListener("DOMContentLoaded", async () => {
  await loadEventsData();
  initScrollAnimations();
  initGallery();
  initCalendarButtons();
  initSmoothScrolling();
});

const MONTHS_MAP = {
  janvier: 0,
  février: 1,
  fevrier: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  août: 7,
  aout: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  décembre: 11,
  decembre: 11,
  jan: 0,
  fév: 1,
  fev: 1,
  mar: 2,
  avr: 3,
  sep: 8,
  oct: 9,
  nov: 10,
  déc: 11,
  dec: 11,
};

function parseEventDay(dayValue, pick = "start") {
  let day = String(dayValue ?? "1");
  if (day.includes("&") || day.includes("-")) {
    const parts = day.split(/[&-]/).map((part) => part.trim()).filter(Boolean);
    day = pick === "end" ? parts[parts.length - 1] : parts[0];
  }
  return Number(day) || 1;
}

function getEventStartDate(event) {
  return new Date(event.date.year, event.date.month - 1, parseEventDay(event.date.day, "start"));
}

function getEventEndDate(event) {
  return new Date(
    event.date.year,
    event.date.month - 1,
    parseEventDay(event.date.day, "end"),
    23,
    59,
    59
  );
}

function isEventPast(eventDate) {
  const today = new Date();
  const monthIndex = MONTHS_MAP[eventDate.month?.toLowerCase?.() ?? ""];
  if (monthIndex === undefined) return false;

  const year = Number(eventDate.year) || today.getFullYear();
  const parsedDay = parseEventDay(eventDate.day, "end");
  const eventEndDate = new Date(year, monthIndex, parsedDay, 23, 59, 59);
  return eventEndDate < today;
}

async function loadEventsData() {
  try {
    const response = await fetch("../json/events.json");
    if (!response.ok) {
      throw new Error(`Erreur de chargement: ${response.status}`);
    }
    
    const eventsData = await response.json();
    renderMyEvents(eventsData.myEvents || []);
    renderPartners(eventsData.partners || []);
  } catch (error) {
    console.error("Erreur lors du chargement des données des événements:", error);
    const grid = document.querySelector("[data-events-grid]");
    const partners = document.querySelector("[data-events-partners]");
    const errorMarkup = `
      <div class="events-error" role="alert">
        <h3>Impossible de charger les événements</h3>
        <p>Merci de réessayer plus tard ou contacte-moi pour obtenir le calendrier actualisé.</p>
        </div>
      `;
    if (grid) grid.innerHTML = errorMarkup;
    if (partners) partners.innerHTML = errorMarkup;
    }
}

function renderMyEvents(myEvents = []) {
  const grid = document.querySelector("[data-events-grid]");
  if (!grid) return;

  if (myEvents.length === 0) {
    grid.innerHTML = `
      <div class="events-error" role="alert">
        <p>Aucun événement prévu pour le moment. Reviens bientôt pour découvrir mes prochaines dates !</p>
      </div>
    `;
    return;
  }

  // Trier les événements par date de début
  const sortedEvents = [...myEvents].sort((a, b) => {
    return getEventStartDate(a) - getEventStartDate(b);
  });

  grid.innerHTML = sortedEvents
    .map((event, index) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isPast = getEventEndDate(event) < today;
      
      // Rotation aléatoire pour effet post-it naturel (-3° à +3°)
      const rotation = (Math.random() * 6 - 3).toFixed(1);
      
      const highlightsHTML = (event.highlights || [])
        .map(highlight => `<li>${highlight}</li>`)
        .join("");

      const calendarButton = !isPast && event.calendarData
        ? `<a href="#" class="btn btn-primary btn-small add-calendar-btn" 
             data-event-name="${event.calendarData.eventName || event.title}"
             data-event-date="${event.calendarData.eventDate || ""}"
             data-event-time="${event.calendarData.eventTime || ""}"
             data-event-location="${event.calendarData.eventLocation || event.address || event.location}">
             Ajouter au calendrier
           </a>`
        : "";

      return `
        <article class="events-sticky-note ${isPast ? "is-past" : ""}" style="--note-rotation: ${rotation}deg">
          <div class="events-sticky-note__header">
            <div class="events-sticky-note__date">
              <span class="events-sticky-note__day">${event.date.day}</span>
              <span class="events-sticky-note__month">${event.date.monthName}</span>
              <span class="events-sticky-note__year">${event.date.year}</span>
            </div>
            <div class="events-sticky-note__content">
              <h3 class="events-sticky-note__title">${event.title}</h3>
              <div class="events-sticky-note__meta">
                <div class="events-sticky-note__meta-item">
                <span class="events-icon events-icon--location" aria-hidden="true"></span>
                ${event.location}
                </div>
                <div class="events-sticky-note__meta-item">
                <span class="events-icon events-icon--time" aria-hidden="true"></span>
                ${event.time}
          </div>
              </div>
        </div>
      </div>
          <div class="events-sticky-note__body">
            <p class="events-sticky-note__description">${event.description}</p>
            ${highlightsHTML ? `<ul class="events-sticky-note__highlights">${highlightsHTML}</ul>` : ""}
          </div>
          <div class="events-sticky-note__footer">
            ${isPast ? '<span class="events-sticky-note__tag">Événement passé</span>' : '<span class="events-sticky-note__tag">À venir</span>'}
            ${calendarButton}
          </div>
        </article>
      `;
    })
    .join("");

  // Réinitialiser les boutons calendrier après le rendu
  initCalendarButtons();
}

function renderPartners(partners = []) {
  const grid = document.querySelector("[data-events-partners]");
  if (!grid) return;
  
  grid.innerHTML = partners
    .map(
      (partner) => `
        <article class="events-partner events-card">
          <div class="events-partner__logo">
            <img src="${partner.logo}" alt="Logo ${partner.name}" loading="lazy" />
        </div>
          <div class="events-partner__body">
            <h3 class="events-partner__title">${partner.name}</h3>
            <p class="events-partner__description">${partner.description}</p>
            <a href="${partner.website}" class="events-partner__link" target="_blank" rel="noopener noreferrer">
              Visiter leur site
            </a>
        </div>
        </article>
      `
    )
    .join("");
}

function initScrollAnimations() {
  const root = document.querySelector(".events-page");
  if (!root) return;

  const sections = root.querySelectorAll(".events-hero, .events-section");
  const animated = () =>
    root.querySelectorAll(
      ".events-sticky-note, .events-partner, .events-contact__banner"
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

    animated().forEach((block) => {
      if (!block.classList.contains("visible") && isInViewport(block, 0.15)) {
        block.classList.add("visible");
        }
    });
  };

  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}

function initGallery() {
  const galleryImages = document.querySelectorAll(".gallery-image");
  galleryImages.forEach((image) => {
    image.addEventListener("click", () => {
      const modal = document.createElement("div");
      modal.classList.add("gallery-modal");

      const content = document.createElement("div");
      content.classList.add("modal-content");

      const img = document.createElement("img");
      img.src = image.querySelector("img")?.getAttribute("src") ?? "";
      img.alt = image.querySelector("img")?.getAttribute("alt") ?? "Visuel d'événement";

      const closeBtn = document.createElement("button");
      closeBtn.classList.add("modal-close");
      closeBtn.innerHTML = "&times;";

      content.append(img, closeBtn);
      modal.appendChild(content);
      document.body.appendChild(modal);

      requestAnimationFrame(() => modal.classList.add("active"));

      const closeModal = () => {
        modal.classList.remove("active");
        setTimeout(() => {
          document.body.removeChild(modal);
        }, 250);
      };

      closeBtn.addEventListener("click", closeModal, { once: true });
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
      });
    });
  });
}

function initCalendarButtons() {
  const calendarButtons = document.querySelectorAll(".add-calendar-btn");
  calendarButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const eventName = button.getAttribute("data-event-name") ?? "Événement Les Gloutonnes";
      const eventDate = button.getAttribute("data-event-date") ?? "";
      const eventTime = button.getAttribute("data-event-time") ?? "";
      const eventLocation = button.getAttribute("data-event-location") ?? "Les Gloutonnes";

      const options = [
        { name: "Google Calendar", action: createGoogleCalendarLink },
        { name: "iCal / Apple Calendar", action: createICalLink },
        { name: "Outlook", action: createOutlookLink },
        { name: "Annuler", action: closeCalendarMenu },
      ];

      createCalendarMenu(button, options, eventName, eventDate, eventTime, eventLocation);
    });
  });

  function createCalendarMenu(button, options, eventName, eventDate, eventTime, eventLocation) {
    closeCalendarMenu();

    const menu = document.createElement("div");
    menu.classList.add("calendar-menu");

    const title = document.createElement("div");
    title.classList.add("calendar-menu-title");
    title.textContent = "Choisir un calendrier";
    menu.appendChild(title);

    options.forEach((option) => {
      const item = document.createElement("div");
      item.classList.add("calendar-menu-item");
      item.textContent = option.name;
      item.addEventListener("click", () => option.action(eventName, eventDate, eventTime, eventLocation));
      menu.appendChild(item);
    });

    document.body.appendChild(menu);
    const rect = button.getBoundingClientRect();
    menu.style.position = "absolute";
    menu.style.top = `${rect.bottom + window.pageYOffset}px`;
    menu.style.left = `${rect.left + window.pageXOffset}px`;

    if (!document.getElementById("events-calendar-style")) {
      const style = document.createElement("style");
      style.id = "events-calendar-style";
      style.textContent = `
        .calendar-menu { background-color: #fff; border-radius: 8px; box-shadow: 0 8px 24px rgba(12, 0, 28, 0.18); padding: 0.5rem 0; min-width: 220px; z-index: 120; }
        .calendar-menu-title { font-weight: 600; padding: 0.6rem 1rem; color: var(--primary-color); border-bottom: 1px solid rgba(91, 0, 146, 0.1); }
        .calendar-menu-item { padding: 0.55rem 1rem; cursor: pointer; transition: background-color 0.2s ease, color 0.2s ease; }
        .calendar-menu-item:hover { background-color: rgba(91, 0, 146, 0.08); color: var(--primary-color); }
        .calendar-menu-item:last-child { border-top: 1px solid rgba(91, 0, 146, 0.08); margin-top: 0.4rem; }
        `;
      document.head.appendChild(style);
    }

    document.addEventListener("click", closeOnOutsideClick);
  }

  function closeCalendarMenu() {
    const menu = document.querySelector(".calendar-menu");
    if (menu) {
      document.body.removeChild(menu);
      document.removeEventListener("click", closeOnOutsideClick);
    }
  }

  function closeOnOutsideClick(event) {
    const menu = document.querySelector(".calendar-menu");
    if (!menu) return;
    if (!menu.contains(event.target) && !event.target.classList.contains("add-calendar-btn")) {
      closeCalendarMenu();
    }
  }

  function createGoogleCalendarLink(eventName, eventDate, eventTime, eventLocation) {
    const [startTime, endTimeRaw] = eventTime.split("-");
    const startDateTime = formatDateTime(eventDate, startTime);
    const endDateTime = formatDateTime(eventDate, endTimeRaw || addHours(startTime, 1));
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventName)}&dates=${startDateTime}/${endDateTime}&location=${encodeURIComponent(eventLocation)}&details=${encodeURIComponent("Événement Les Gloutonnes")}`;
    window.open(url, "_blank");
    closeCalendarMenu();
  }

  function createICalLink(eventName, eventDate, eventTime, eventLocation) {
    alert(
      `Pour ajouter à ton calendrier Apple/iCal, enregistre cet événement :\n\nÉvénement : ${eventName}\nDate : ${eventDate}\nHeure : ${eventTime}\nLieu : ${eventLocation}`
    );
    closeCalendarMenu();
  }

  function createOutlookLink(eventName, eventDate, eventTime, eventLocation) {
    const [startTime, endTimeRaw] = eventTime.split("-");
    const startDateTime = formatDateTimeForOutlook(eventDate, startTime);
    const endDateTime = formatDateTimeForOutlook(eventDate, endTimeRaw || addHours(startTime, 1));
    const url = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(eventName)}&startdt=${startDateTime}&enddt=${endDateTime}&location=${encodeURIComponent(eventLocation)}&body=${encodeURIComponent("Événement Les Gloutonnes")}`;
    window.open(url, "_blank");
    closeCalendarMenu();
  }

  function formatDateTime(date, time) {
    if (!date || !time) return "";
    const [year, month, day] = date.split("-");
    const [hours, minutes] = time.split(":");
    return `${year}${month}${day}T${hours}${minutes}00`;
  }

  function formatDateTimeForOutlook(date, time) {
    if (!date || !time) return "";
    const [hours, minutes] = time.split(":");
    return `${date}T${hours}:${minutes}:00`;
  }

  function addHours(time, hoursToAdd) {
    if (!time) return "01:00";
    const [hours, minutes] = time.split(":");
    let totalHours = Number(hours) + Number(hoursToAdd);
    if (totalHours >= 24) totalHours -= 24;
    return `${String(totalHours).padStart(2, "0")}:${minutes}`;
  }
}

function initSmoothScrolling() {
  const anchorLinks = document.querySelectorAll('a[href^="/pages/events.html#"], a[href^="#"]');

  const scrollToTarget = (targetId) => {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const header = document.querySelector("header");
    const headerOffset = header ? header.offsetHeight + 12 : 88;
    const elementPosition = targetElement.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
  };

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href") ?? "";
      const hash = href.includes("#") ? href.split("#")[1] : "";
      if (!hash) return;

      const isSamePage = href.startsWith("#") || href.startsWith("/pages/events.html#");
      if (!isSamePage) return;

      event.preventDefault();
      scrollToTarget(hash);
      history.pushState(null, "", `#${hash}`);
    });
  });

  if (window.location.hash) {
      setTimeout(() => {
      scrollToTarget(window.location.hash.substring(1));
      }, 300);
  }
}