document.addEventListener("DOMContentLoaded", () => {
  initCollectionPage();
  initScrollAnimations();
});

function initScrollAnimations() {
  const root = document.querySelector(".dionaea-page");
  if (!root) return;

  const sections = root.querySelectorAll(".dionaea-hero, .dionaea-section");
  const revealable = () => root.querySelectorAll(".dionaea-table-container, .dionaea-contact__banner");

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

function initCollectionPage() {
  const loader = document.getElementById("loading-indicator");
  const tableContainer = document.getElementById("plants-table-container");
  const emptyState = document.getElementById("no-results");
  const pagination = document.querySelector(".dionaea-pagination");
  const paginationNumbers = document.getElementById("pagination-numbers");
  const prevButton = document.getElementById("prev-page");
  const nextButton = document.getElementById("next-page");
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const resetButton = document.getElementById("reset-search");
  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");
  const modalTitle = document.getElementById("modal-title");
  const modalClose = modal?.querySelector(".dionaea-modal__close");

  let currentPage = 1;
  const itemsPerPage = 20;
  let allData = [];
  let filteredData = [];

  const toggleLoader = (show) => {
    if (!loader) return;
    loader.hidden = !show;
    loader.style.opacity = show ? "1" : "0";
    loader.style.transform = show ? "translateY(0)" : "translateY(12px)";
  };

  const toggleEmptyState = (show) => {
    if (emptyState) emptyState.hidden = !show;
    if (tableContainer) {
      tableContainer.style.display = show ? "none" : "block";
      if (!show) tableContainer.classList.add("is-ready");
    }
    if (pagination) pagination.style.display = show ? "none" : "flex";
  };

  const loadData = async () => {
    try {
      toggleLoader(true);
      const response = await fetch("../json/liste_dionaea.json");
      if (!response.ok) throw new Error("Impossible de charger les données");
      const data = await response.json();
      allData = data;
      filteredData = [...allData];
      renderPlants(1);
      updatePagination();
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
      toggleEmptyState(true);
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.innerHTML = `
          <p class="dionaea-empty__text">Une erreur est survenue lors du chargement des données. Merci de réessayer plus tard.</p>
          <button id="reset-search" class="btn btn-primary dionaea-empty__button">Réinitialiser</button>
        `;
      }
    } finally {
      toggleLoader(false);
    }
  };

  const renderPlants = (page) => {
    if (!tableContainer) return;

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filteredData.slice(startIndex, endIndex);

    if (paginated.length === 0) {
      toggleEmptyState(true);
      return;
    }

    toggleEmptyState(false);
    const tableHTML = `
      <table class="dionaea-table">
        <thead>
          <tr>
            <th scope="col">Image</th>
            <th scope="col">Nom</th>
            <th scope="col">ID</th>
          </tr>
        </thead>
        <tbody>
          ${paginated
            .map(
              (plant) => `
                <tr class="dionaea-row" data-id="${plant.id}">
                  <td class="dionaea-image-cell" data-label="Image">
                    <div class="dionaea-image-container" role="button" tabindex="0" aria-label="Agrandir ${plant.name}">
                      <img src="${plant.image}" alt="${plant.name}" class="dionaea-thumbnail" loading="lazy" />
                    </div>
                  </td>
                  <td class="dionaea-name-cell" data-label="Nom">
                    <strong>${plant.name}</strong>
                  </td>
                  <td class="dionaea-id-cell" data-label="ID">${plant.id}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    `;

    tableContainer.innerHTML = tableHTML;
    requestAnimationFrame(() => tableContainer.classList.add("is-ready"));
    initPlantImageListeners();
  };

  const updatePagination = () => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (!paginationNumbers) return;

    paginationNumbers.innerHTML = createPaginationMarkup(totalPages, currentPage);
    prevButton?.classList.toggle("disabled", currentPage === 1);
    nextButton?.classList.toggle("disabled", currentPage === totalPages || totalPages === 0);

    paginationNumbers.querySelectorAll(".pagination-number").forEach((button) => {
      button.addEventListener("click", () => {
        const targetPage = Number(button.dataset.page);
        goToPage(targetPage);
      });
    });
  };

  const createPaginationMarkup = (totalPages, currentPage) => {
    if (totalPages <= 1) return "";

    let markup = "";
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (endPage - startPage < 4) {
      if (startPage === 1) endPage = Math.min(totalPages, startPage + 4);
      else if (endPage === totalPages) startPage = Math.max(1, endPage - 4);
    }

    if (startPage > 1) {
      markup += paginationButton(1, currentPage === 1);
      if (startPage > 2) markup += `<span class="pagination-ellipsis">…</span>`;
    }

    for (let i = startPage; i <= endPage; i += 1) {
      markup += paginationButton(i, i === currentPage);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) markup += `<span class="pagination-ellipsis">…</span>`;
      markup += paginationButton(totalPages, totalPages === currentPage);
    }

    return markup;
  };

  const paginationButton = (number, active) => `
    <button class="pagination-number ${active ? "active" : ""}" data-page="${number}" type="button">
      ${number}
    </button>
  `;

  const goToPage = (page) => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    if (tableContainer) tableContainer.classList.remove("is-ready");
    renderPlants(page);
    updatePagination();
    document.getElementById("collection-gallery")?.scrollIntoView({ behavior: "smooth" });
  };

  const filterData = (term) => {
    const normalized = term.trim().toLowerCase();
    filteredData = normalized
      ? allData.filter(
          (plant) =>
            plant.id.toLowerCase().includes(normalized) ||
            plant.name.toLowerCase().includes(normalized)
        )
      : [...allData];
    currentPage = 1;
    if (tableContainer) tableContainer.classList.remove("is-ready");
    renderPlants(currentPage);
    updatePagination();
  };

  const initPlantImageListeners = () => {
    const containers = document.querySelectorAll(".dionaea-image-container");
    containers.forEach((container) => {
      const openModal = () => {
        if (!modal || !modalImage || !modalTitle) return;
        const img = container.querySelector("img");
        const row = container.closest(".dionaea-row");
        if (!img || !row) return;
        modalImage.src = img.src;
        modalImage.alt = img.alt;
        modalTitle.textContent = row.querySelector(".dionaea-name-cell strong")?.textContent ?? "";
        modal.classList.add("show");
        modal.removeAttribute("hidden");
      };

      container.addEventListener("click", openModal);
      container.addEventListener("keypress", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openModal();
        }
      });
    });
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("show");
    setTimeout(() => modal.setAttribute("hidden", ""), 250);
  };

  modalClose?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal?.classList.contains("show")) closeModal();
  });

  prevButton?.addEventListener("click", () => {
    if (!prevButton.classList.contains("disabled")) goToPage(currentPage - 1);
  });

  nextButton?.addEventListener("click", () => {
    if (!nextButton.classList.contains("disabled")) goToPage(currentPage + 1);
  });

  searchButton?.addEventListener("click", () => filterData(searchInput?.value ?? ""));

  searchInput?.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      filterData(searchInput.value);
    }
  });

  resetButton?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    filterData("");
  });

  if (tableContainer) tableContainer.classList.remove("is-ready");
  loadData();
}