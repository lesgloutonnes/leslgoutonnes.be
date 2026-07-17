// Script pour gérer la page de résultats de recherche
document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector(".search-page");
  if (!root) return;

  initSearchPage(root);
});

function initSearchPage(root) {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";

  const queryLabel = root.querySelector("[data-search-query]");
  if (queryLabel) {
    queryLabel.textContent = query || "...";
  }

  if (query) {
    document.title = `Recherche : ${query} - Les Gloutonnes`;
    runSearch(root, query);
  } else {
    clearResults(root);
    showEmptyState(root, true);
  }

  initScrollAnimations(root);
}

function initScrollAnimations(root) {
  const sections = root.querySelectorAll(".search-section");
  const items = () => root.querySelectorAll(".search-result-item");

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

    items().forEach((item) => {
      if (!item.classList.contains("animate") && isInViewport(item, 0.1)) {
        item.classList.add("animate");
      }
    });
  };

  reveal();
  window.addEventListener("scroll", reveal, { passive: true });
}

function runSearch(root, query) {
  showLoading(root);

  setTimeout(() => {
    const matches = performClientSideSearch(query);
    renderSearchResults(root, matches);
  }, 400);
}

function renderSearchResults(root, results) {
  const resultsContainer = root.querySelector("[data-search-results]");
  const emptyState = root.querySelector("[data-search-empty]");
  if (!resultsContainer) return;

  resultsContainer.innerHTML = "";

  if (results.length === 0) {
    showEmptyState(root, true);
    return;
  }

  showEmptyState(root, false);

  results.forEach((result) => {
    const card = document.createElement("article");
    card.className = "search-result-item";
    card.innerHTML = `
      <h3><a href="${result.url}">${result.title}</a></h3>
      <p class="result-category">${result.category}</p>
      <p class="result-excerpt">${result.excerpt}</p>
    `;
    resultsContainer.appendChild(card);
  });
}

function showLoading(root) {
  const container = root.querySelector("[data-search-results]");
  if (!container) return;
  container.innerHTML = `
    <div class="search-results__loading" data-search-loading>
      <div class="search-results__spinner"></div>
      <p>Recherche en cours...</p>
    </div>
  `;
}

function showEmptyState(root, shouldShow) {
  const emptyState = root.querySelector("[data-search-empty]");
  if (!emptyState) return;
  if (shouldShow) {
    emptyState.removeAttribute("hidden");
  } else {
    emptyState.setAttribute("hidden", "hidden");
  }
}

function clearResults(root) {
  const container = root.querySelector("[data-search-results]");
  if (container) container.innerHTML = "";
}

/**
 * Fonction principale de recherche
 */
function searchSite(query) {
  // Référencer les éléments du DOM
  const resultsContainer = document.getElementById("search-results-container");
  const noResults = document.getElementById("no-results");

  if (!resultsContainer || !noResults) {
    console.error("Éléments de recherche non trouvés dans le DOM");
    return;
  }

  // Afficher l'état de chargement
  resultsContainer.innerHTML = `
          <div class="loading">
              <div class="spinner"></div>
              <p>Recherche en cours...</p>
          </div>
      `;

  // Simuler un délai de chargement pour l'effet
  setTimeout(function () {
    // Récupérer l'index de recherche
    const searchResults = performClientSideSearch(query);
    displayResults(searchResults, resultsContainer, noResults);
  }, 500);
}

/**
 * Afficher les résultats dans le DOM
 */
function displayResults(results, container, noResultsElement) {
  // Vider le conteneur
  container.innerHTML = "";

  if (results && results.length > 0) {
    // Afficher les résultats
    results.forEach((result) => {
      const resultElement = document.createElement("div");
      resultElement.className = "search-result-item";
      resultElement.innerHTML = `
                  <h3><a href="${result.url}">${result.title}</a></h3>
                  <p class="result-category">${result.category}</p>
                  <p class="result-excerpt">${result.excerpt}</p>
              `;
      container.appendChild(resultElement);
    });

    noResultsElement.style.display = "none";
  } else {
    // Aucun résultat
    container.innerHTML = "";
    noResultsElement.style.display = "block";
  }
}

/**
 * Recherche côté client - Base de données interne
 */
function performClientSideSearch(query) {
  // Normaliser la requête
  query = query.toLowerCase().trim();

  // Base de données de recherche - Données du site
  const siteData = [
    {
      title: "Dionaea (Attrape-mouche de Vénus)",
      url: "/pages/collection-dionaea.html",
      category: "Plantes carnivores",
      excerpt:
        "La plante carnivore la plus emblématique avec ses pièges actifs qui se referment en moins d'une seconde.",
    },
    {
      title: "Sarracenia - Culture et entretien",
      url: "/pages/guides.html#sarracenia",
      category: "Guides de culture",
      excerpt:
        "Comment cultiver les Sarracenia en extérieur, les protéger en hiver et favoriser leur floraison.",
    },
    {
      title: "Nepenthes pour culture d'intérieur",
      url: "/applications/nepenthes/",
      category: "Plantes carnivores",
      excerpt:
        "Découvrez nos Nepenthes hybrides adaptés à la culture en appartement avec une humidité modérée.",
    },
    {
      title: "Cephalotus follicularis",
      url: "/applications/cephalotus/",
      category: "Plantes carnivores",
      excerpt:
        "Plante carnivore à urnes originaire d'Australie, on peut la cultiver en intérieur et même en terrarium avec une aération maîtrisée.",
    },
    {
      title: "Drosera - Les plantes à rosée",
      url: "/pages/guides.html",
      category: "Plantes carnivores",
      excerpt:
        "Découvrez ces plantes couvertes de tentacules gluants qui capturent les insectes.",
    },
    {
      title: "Pinguicula - Les grasettes",
      url: "/pages/guides.html",
      category: "Plantes carnivores",
      excerpt:
        "Plantes carnivores aux feuilles collantes idéales pour capturer les petits insectes volants.",
    },
    {
      title: "Darlingtonia californica",
      url: "/applications/darlingtonia/",
      category: "Plantes carnivores",
      excerpt:
        "L'extraordinaire plante cobra avec ses pièges en forme de serpent dressé.",
    },
    {
      title: "Utricularia - Plantes à vessies",
      url: "/pages/guides.html",
      category: "Plantes carnivores",
      excerpt:
        "Ces plantes possèdent les pièges les plus sophistiqués du règne végétal.",
    },
    {
      title: "L'arrosage des plantes carnivores",
      url: "/pages/guides.html#arrosage",
      category: "Guides de culture",
      excerpt:
        "Comment arroser correctement vos plantes carnivores et quel type d'eau utiliser.",
    },
    {
      title: "Luminosité et emplacement",
      url: "/pages/guides.html#lumiere",
      category: "Guides de culture",
      excerpt:
        "Les besoins en lumière de chaque type de plante carnivore et comment les placer idéalement.",
    },
    {
      title: "Hivernage des Sarracenia",
      url: "/pages/guides.html#hivernage-sarracenia",
      category: "Guides de culture",
      excerpt:
        "Comment préparer vos Sarracenia pour l'hiver et garantir leur survie pendant la dormance.",
    },
    {
      title: "Live Twitch - Les Gloutonneries",
      url: "/pages/live-twitch.html",
      category: "Événements",
      excerpt:
        "Rejoignez-nous chaque lundi à 21h pour les Gloutonneries en direct sur Twitch. Découvrez la chasse aux Gloutonnes et les replays sur YouTube.",
    },
    {
      title: "Mes événements et bourses aux plantes",
      url: "/pages/events.html",
      category: "Événements",
      excerpt:
        "Calendrier des marchés aux plantes et expositions où vous pourrez rencontrer Les Gloutonnes.",
    },
    {
      title: "Événements à ne pas manquer",
      url: "/pages/events-reminders.html",
      category: "Événements",
      excerpt:
        "Un pense-bête des événements à garder à l'œil : bourses aux plantes, expositions et rencontres de passionnés.",
    },
    {
      title: "CarnEvent - Rendez-vous des passionnés",
      url: "https://www.carnevent.com",
      category: "Événements",
      excerpt:
        "Première édition les 11 et 12 juillet 2026 au Jardin botanique de Liège ; prochaine édition prévue en juillet 2027.",
    },
    {
      title: "Visites de la serre",
      url: "/pages/events.html#visites",
      category: "Événements",
      excerpt:
        "Comment organiser une visite de ma serre de plantes carnivores à Verlaine, Belgique.",
    },
    {
      title: "À propos des Gloutonnes",
      url: "/pages/about.html",
      category: "À propos",
      excerpt:
        "L'histoire de ma passion pour les plantes carnivores et la création des Gloutonnes.",
    },
    {
      title: "Plantes de tourbière compagnes",
      url: "/pages/plantesdetourbiere.html",
      category: "Écosystèmes",
      excerpt:
        "Découvrez les plantes idéales pour accompagner vos carnivores et recréer un écosystème de tourbière complet.",
    },
    {
      title: "Sphaignes des Hautes Fagnes",
      url: "/pages/sphaignes.html",
      category: "Écosystèmes",
      excerpt:
        "Tout savoir sur ces mousses extraordinaires qui constituent l'âme des tourbières et accompagnent parfaitement les plantes carnivores.",
    },
    {
      title: "Guide complet Dionaea muscipula",
      url: "/pages/guides.html#dionaea",
      category: "Guides de culture",
      excerpt:
        "Conseils détaillés pour réussir la culture de la Dionée attrape-mouche, de la plantation à la dormance hivernale.",
    },
    {
      title: "Culture des Nepenthes en intérieur",
      url: "/pages/guides.html#nepenthes",
      category: "Guides de culture",
      excerpt:
        "Comment cultiver les Nepenthes sur un rebord de fenêtre et obtenir de belles urnes même en appartement.",
    },
    {
      title: "Guide Cephalotus follicularis",
      url: "/pages/guides.html#cephalotus",
      category: "Guides de culture",
      excerpt:
        "Tous les secrets pour cultiver avec succès cette plante carnivore australienne à urnes et ses besoins spécifiques.",
    },
    {
      title: "Drosera - Guide par espèce",
      url: "/pages/guides.html#drosera",
      category: "Guides de culture",
      excerpt:
        "Différences entre Drosera capensis, rotundifolia et filiformis, avec conseils de culture adaptés à chaque type.",
    },
    {
      title: "Applications de culture spécialisées",
      url: "/pages/applications-culture.html",
      category: "Outils numériques",
      excerpt:
        "Découvrez mes applications interactives pour vous aider à cultiver vos plantes carnivores dans les meilleures conditions.",
    },
    {
      title: "Guide interactif Cephalotus",
      url: "/pages/applications-culture.html",
      category: "Outils numériques",
      excerpt:
        "Application complète avec carte des habitats, données climatiques et assistant substrat pour Cephalotus.",
    },
    {
      title: "Guide interactif Darlingtonia",
      url: "/pages/applications-culture.html",
      category: "Outils numériques",
      excerpt:
        "Application spécialisée pour maîtriser la culture du Darlingtonia californica avec gestion de température et qualité d'eau.",
    },
    {
      title: "Guide interactif Nepenthes",
      url: "/pages/applications-culture.html",
      category: "Outils numériques",
      excerpt:
        "Outil pour trouver les conditions de culture idéales pour les Nepenthes avec informations sur besoins thermiques et hygrométrie.",
    },
    {
      title: "Gestionnaire de collection",
      url: "/pages/liste-culture.html",
      category: "Outils numériques",
      excerpt:
        "Logiciel Windows pour gérer votre collection de plantes carnivores avec base de données complète des genres et espèces.",
    },
    {
      title: "Plantes pour tourbière artificielle",
      url: "/pages/plantesdetourbiere.html",
      category: "Guides pratiques",
      excerpt:
        "Sélection de plantes compagnes (orchidées, ericacées, vivaces, fougères) pour accompagner les carnivores en tourbière artificielle.",
    },
    {
      title: "Techniques de semis pour plantes carnivores",
      url: "/pages/guides.html",
      category: "Guides pratiques",
      excerpt:
        "Comment réussir vos semis de plantes carnivores, de la stratification des graines à l'élevage des jeunes plants.",
    },
    {
      title: "Division et multiplication des plantes",
      url: "/pages/guides.html",
      category: "Guides pratiques",
      excerpt:
        "Techniques pour multiplier vos plantes carnivores par division, bouturage et autres méthodes végétatives.",
    },
    {
      title: "Pièges noirs sur Dionaea",
      url: "/pages/conseils.html",
      category: "Problèmes et solutions",
      excerpt:
        "Comprendre pourquoi les pièges de Dionée noircissent et comment résoudre ce problème courant.",
    },
    {
      title: "Pucerons sur plantes carnivores",
      url: "/pages/conseils.html",
      category: "Problèmes et solutions",
      excerpt:
        "Solutions efficaces et naturelles pour éliminer les pucerons de vos plantes carnivores sans les endommager.",
    },
    {
      title: "Erreurs fréquentes en culture",
      url: "/pages/conseils.html#conseils-featured-video",
      category: "Problèmes et solutions",
      excerpt:
        "Les erreurs les plus courantes que commettent les débutants avec leurs plantes carnivores et comment les éviter.",
    },
    {
      title: "Prendre rendez-vous pour une visite",
      url: "/pages/contact.html#appointment",
      category: "Contact",
      excerpt:
        "Réservez votre visite pour un conseil personnalisé ou pour découvrir mes plantes les plus rares.",
    },
    {
      title: "Horaires et accès",
      url: "/pages/contact.html#find-us",
      category: "Informations pratiques",
      excerpt:
        "Comment me trouver à Verlaine, horaires d'ouverture et plans d'accès à la serre.",
    },
    {
      title: "Dormance hivernale des plantes carnivores",
      url: "/pages/guides.html",
      category: "Techniques de culture",
      excerpt:
        "Pourquoi et comment mettre vos plantes carnivores tempérées en dormance pendant l'hiver pour assurer leur santé et leur longévité.",
    },
    {
      title: "La méthode de la mini-tourbière",
      url: "/pages/conseils.html",
      category: "Techniques de culture",
      excerpt:
        "Guide pas à pas pour réaliser facilement une mini tourbière artificielle chez vous pour cultiver plusieurs types de plantes carnivores ensemble.",
    },
    {
      title: "Pollinisation et récolte de graines",
      url: "/pages/conseils.html",
      category: "Techniques avancées",
      excerpt:
        "Comment protéger les fleurs, polliniser manuellement et récolter les graines de vos plantes carnivores pour les multiplier.",
    },
    {
      title: "Heliamphora - Plantes à trompette des Tepuis",
      url: "/pages/guides.html#heliamphora",
      category: "Plantes carnivores",
      excerpt:
        "Découvrez ces plantes carnivores rares originaires des hauts plateaux d'Amérique du Sud et leurs besoins spécifiques en culture.",
    },
    {
      title: "Stylidium - Plantes protocarnivores",
      url: "/pages/guides.html#stylidium",
      category: "Plantes carnivores",
      excerpt:
        "Les plantes à colonne stylaire, fascinantes plantes à la frontière du monde des carnivores avec leur mécanisme unique de pollinisation.",
    },
    {
      title: "Triantha occidentalis - Lis des marais occidental",
      url: "/pages/guides.html#triantha",
      category: "Plantes carnivores",
      excerpt:
        "Cette récente découverte dans le monde des plantes protocarnivores capture les insectes avec ses tiges florales glandulaires.",
    },
    {
      title: "Bletilla striata - Orchidée terrestre japonaise",
      url: "/pages/plantesdetourbiere.html",
      category: "Plantes de tourbière",
      excerpt:
        "Cette orchidée terrestre d'Asie est l'une des plus faciles à cultiver en pleine terre aux côtés des plantes carnivores.",
    },
    {
      title: "Vaccinium macrocarpon - Canneberge",
      url: "/pages/plantesdetourbiere.html",
      category: "Plantes de tourbière",
      excerpt:
        "Petit arbuste rampant produisant des baies rouges comestibles, parfait pour couvrir le sol dans une tourbière artificielle.",
    },
    {
      title: "Iris sibirica - Iris de Sibérie",
      url: "/pages/plantesdetourbiere.html",
      category: "Plantes de tourbière",
      excerpt:
        "Vivace élégante qui forme des touffes dressées et ajoute une dimension verticale à l'aménagement de votre tourbière.",
    },
    {
      title: "Sphagnum medium / S. divinum - Sphaignes rouges",
      url: "/pages/sphaignes.html",
      category: "Sphaignes",
      excerpt:
        "Grandes sphaignes rouges des Hautes Fagnes (complexe autrefois appelé magellanicum), en coussins pourpres sur les buttes.",
    },
    {
      title: "Sphagnum papillosum - Sphaigne papilleuse",
      url: "/pages/sphaignes.html",
      category: "Sphaignes",
      excerpt:
        "Cette sphaigne robuste aux teintes brun-doré est l'une des principales espèces formatrices de tourbe dans les Hautes Fagnes.",
    },
    {
      title: "Sphagnum cuspidatum - Sphaigne aquatique",
      url: "/pages/sphaignes.html",
      category: "Sphaignes",
      excerpt:
        "Sphaigne aquatique d'un vert vif qui peut croître entièrement submergée dans les mares des tourbières.",
    },
    {
      title: "Faut-il couper les fleurs des plantes carnivores?",
      url: "/pages/conseils.html",
      category: "FAQ",
      excerpt:
        "La réponse à cette question courante et des conseils sur la gestion de la floraison de vos plantes carnivores.",
    },
    {
      title: "Quelle eau pour les plantes carnivores?",
      url: "/pages/conseils.html",
      category: "FAQ",
      excerpt:
        "L'importance d'utiliser la bonne eau et pourquoi l'eau du robinet peut être néfaste pour vos plantes carnivores.",
    },
    {
      title: "Comment nourrir les plantes carnivores?",
      url: "/pages/conseils.html",
      category: "FAQ",
      excerpt:
        "Est-il nécessaire de nourrir manuellement vos plantes carnivores? Conseils et méthodes pour le faire correctement.",
    },
    {
      title: "Bourse aux Plantes du Jardin Botanique de Liège",
      url: "/pages/events.html",
      category: "Événements",
      excerpt:
        "Grande bourse aux plantes où vous pourrez découvrir mon stand et ma collection variée de plantes carnivores.",
    },
    {
      title: "EEE 2025 - Exposition Européenne",
      url: "/pages/events-reminders.html",
      category: "Événements",
      excerpt:
        "L'association italienne des plantes carnivores accueillera la prochaine Exposition et échange Européenne des plantes carnivores à Mira, Italie.",
    },
    {
      title: "Journées portes ouvertes",
      url: "/pages/events.html",
      category: "Événements",
      excerpt:
        "Visitez ma serre lors des journées portes ouvertes spéciales et découvrez l'ensemble de ma collection.",
    },
    {
      title: "CarnEvent - Événement dédié aux plantes carnivores",
      url: "https://www.carnevent.com",
      category: "Événements",
      excerpt:
        "Salon plantes carnivores à Liège : édition 2026 les 11-12 juillet ; retour prévu en juillet 2027 (dates à confirmer).",
    },
    {
      title: "Live Twitch Les Gloutonnes",
      url: "/pages/live-twitch.html",
      category: "Médias",
      excerpt:
        "Rejoignez-nous chaque lundi à 21h pour les Gloutonneries en direct sur Twitch. Découvrez la chasse aux Gloutonnes et les replays sur YouTube.",
    },
    {
      title: "Chaîne YouTube Les Gloutonnes",
      url: "/pages/conseils.html",
      category: "Médias",
      excerpt:
        "Tutoriels vidéo, conseils et présentations de plantes carnivores sur ma chaîne YouTube dédiée.",
    },
    {
      title: "Guide de culture gratuit en PDF",
      url: "/bonus/index.html",
      category: "Ressources",
      excerpt:
        "Téléchargez mon guide complet de culture des plantes carnivores en format PDF gratuitement.",
    },
    {
      title: "Préparation des plantes carnivores pour l'été",
      url: "/pages/conseils.html",
      category: "Conseils saisonniers",
      excerpt:
        "Comment protéger vos plantes des fortes chaleurs et assurer une hydratation optimale pendant la saison chaude.",
    },
    {
      title: "Sortir les plantes carnivores au printemps",
      url: "/pages/conseils.html",
      category: "Conseils saisonniers",
      excerpt:
        "Guide pour acclimater progressivement vos plantes carnivores aux conditions extérieures après l'hiver.",
    },
    {
      title: "Préparer vos plantes pour la dormance",
      url: "/pages/conseils.html",
      category: "Conseils saisonniers",
      excerpt:
        "Étapes essentielles pour préparer vos plantes carnivores à la période de dormance hivernale.",
    },
    {
      title: "Prendre rendez-vous pour une visite",
      url: "/pages/contact.html",
      category: "Contact",
      excerpt:
        "Formulaire et informations pour organiser une visite personnalisée de ma collection.",
    },
    {
      title: "Politique de confidentialité",
      url: "/pages/confidentialite.html",
      category: "Informations légales",
      excerpt:
        "Informations sur la manière dont les données personnelles sont collectées et utilisées sur ce site.",
    },
    {
      title: "Mentions légales",
      url: "/pages/mentions-legales.html",
      category: "Informations légales",
      excerpt:
        "Informations légales concernant le site Les Gloutonnes et son propriétaire.",
    },
    {
      title: "Page non trouvée",
      url: "/404.html",
      category: "Navigation",
      excerpt:
        "Oups ! La page que vous cherchez semble avoir disparu... Peut-être a-t-elle été mangée par une de nos plantes carnivores ?",
    },
    {
      title: "Techniques de bouturage des Sarracenia",
      url: "/pages/conseils.html",
      category: "Techniques avancées",
      excerpt:
        "Comment multiplier vos Sarracenia par bouture de rhizome pour obtenir rapidement de nouvelles plantes identiques à la plante mère.",
    },
    {
      title: "Culture in vitro des plantes carnivores",
      url: "/pages/conseils.html",
      category: "Techniques avancées",
      excerpt:
        "Introduction aux techniques de laboratoire pour la multiplication accélérée et la préservation d'espèces rares.",
    },
    {
      title: "Acclimater les plantes carnivores tropicales",
      url: "/pages/conseils.html",
      category: "Techniques de culture",
      excerpt:
        "Comment adapter progressivement les plantes d'origine tropicale à nos conditions de culture européennes.",
    },
    {
      title: "Dionaea muscipula 'B52'",
      url: "/pages/guides.html#dionaea",
      category: "Cultivars",
      excerpt:
        "L'un des cultivars de Dionée les plus imposants avec des pièges pouvant atteindre 5 cm, idéal pour les collectionneurs.",
    },
    {
      title: "Sarracenia leucophylla 'Hurricane Creek White'",
      url: "/pages/guides.html#sarracenia",
      category: "Cultivars",
      excerpt:
        "Cultivar spectaculaire avec une partie supérieure très blanche et des veines rouges contrastées minimalistes.",
    },
    {
      title: "Nepenthes 'Rebecca Soper'",
      url: "/pages/guides.html#nepenthes",
      category: "Cultivars",
      excerpt:
        "Hybride vigoureux et facile à cultiver, idéal pour les conditions d'appartement avec des urnes richement colorées.",
    },
    {
      title: "Pogonia ophioglossoides - Orchidée rare",
      url: "/pages/plantesdetourbiere.html",
      category: "Plantes de tourbière",
      excerpt:
        "Orchidée rare des tourbières nord-américaines avec une fleur rose délicate au labelle frangé et parfumé.",
    },
    {
      title: "Calluna vulgaris - Bruyère commune",
      url: "/pages/plantesdetourbiere.html",
      category: "Plantes de tourbière",
      excerpt:
        "Espèce indigène qui tapisse naturellement les landes et tourbières d'Europe, parfaite pour structurer votre tourbière artificielle.",
    },
    {
      title: "Erica carnea - Bruyère d'hiver",
      url: "/pages/plantesdetourbiere.html",
      category: "Plantes de tourbière",
      excerpt:
        "Bruyère à floraison hivernale pour les bordures acides bien drainées, pas pour le cœur détrempé de la tourbière.",
    },
    {
      title: "Plantes carnivores pour débutants",
      url: "/pages/conseils.html",
      category: "Guides pour débutants",
      excerpt:
        "Les 5 espèces de plantes carnivores les plus faciles à cultiver quand on débute dans ce hobby fascinant.",
    },
    {
      title: "Comment commencer une collection",
      url: "/pages/conseils.html",
      category: "Guides pour débutants",
      excerpt:
        "Guide complet pour démarrer votre collection de plantes carnivores et l'agrandir progressivement.",
    },
    {
      title: "Floraison printanière des Sarracenia",
      url: "/pages/guides.html#sarracenia",
      category: "Conseils saisonniers",
      excerpt:
        "Comment favoriser et gérer la magnifique floraison printanière des Sarracenia avant l'apparition des pièges.",
    },
    {
      title: "Culture estivale en extérieur",
      url: "/pages/conseils.html",
      category: "Conseils saisonniers",
      excerpt:
        "Profiter de l'été pour offrir des conditions optimales à vos plantes carnivores et stimuler leur croissance.",
    },
    {
      title: "Protection contre le gel hivernal",
      url: "/pages/conseils.html",
      category: "Conseils saisonniers",
      excerpt:
        "Méthodes efficaces pour protéger vos plantes carnivores rustiques des gelées excessives tout en respectant leur besoin de dormance.",
    },
    {
      title: "Urnes qui ne se forment pas chez les Nepenthes",
      url: "/pages/conseils.html",
      category: "Problèmes et solutions",
      excerpt:
        "Causes et solutions lorsque vos Nepenthes ne développent pas d'urnes malgré une croissance normale des feuilles.",
    },
    {
      title: "Feuilles jaunissantes chez les plantes carnivores",
      url: "/pages/conseils.html",
      category: "Problèmes et solutions",
      excerpt:
        "Diagnostic et remèdes pour les différentes causes de jaunissement du feuillage chez vos plantes carnivores.",
    },
    {
      title: "Moisissures et champignons dans le substrat",
      url: "/pages/conseils.html",
      category: "Problèmes et solutions",
      excerpt:
        "Comment prévenir et traiter les problèmes de moisissures qui peuvent apparaître dans le substrat humide des plantes carnivores.",
    },
    {
      title: "Guide de culture Darlingtonia",
      url: "/pages/applications-culture.html",
      category: "Applications",
      excerpt:
        "Application interactive pour maîtriser la culture réputée difficile du Darlingtonia californica avec des conseils précis adaptés à votre environnement.",
    },
    {
      title: "Calculateur de substrats",
      url: "/pages/applications-culture.html",
      category: "Outils numériques",
      excerpt:
        "Outil interactif pour déterminer les proportions idéales de composants de substrat selon vos plantes carnivores.",
    },
    {
      title: "Conservation des plantes carnivores",
      url: "/pages/about.html",
      category: "Écologie",
      excerpt:
        "L'importance de cultiver des plantes carnivores issues de reproduction contrôlée pour préserver les populations sauvages menacées.",
    },
    {
      title: "Rôle des tourbières dans le climat",
      url: "/pages/sphaignes.html",
      category: "Écologie",
      excerpt:
        "Comment les tourbières à sphaignes constituent d'importants puits de carbone et leur rôle crucial face au changement climatique.",
    },
    {
      title: "Visite virtuelle de la serre",
      url: "/pages/about.html#our-greenhouse",
      category: "Expérience",
      excerpt:
        "Découvrez en images les différentes sections de ma serre spécialisée pour les plantes carnivores.",
    },
    {
      title: "Témoignages de visiteurs",
      url: "/pages/about.html",
      category: "Expérience",
      excerpt:
        "Ce que disent les passionnés qui ont visité ma collection et participé à mes ateliers sur les plantes carnivores.",
    },
    {
      title: "Ateliers et formations",
      url: "/pages/events.html",
      category: "Expérience",
      excerpt:
        "Calendrier des ateliers pratiques pour apprendre à cultiver, rempoter et multiplier vos plantes carnivores.",
    },
    {
      title: "Photographie de plantes carnivores",
      url: "/pages/conseils.html",
      category: "Multimédia",
      excerpt:
        "Conseils pour capturer la beauté et les détails fascinants de vos plantes carnivores en photographie.",
    },
    {
      title: "Podcasts sur les plantes carnivores",
      url: "/pages/conseils.html",
      category: "Multimédia",
      excerpt:
        "Sélection d'émissions audio dédiées aux plantes carnivores, parfaites pour approfondir vos connaissances.",
    },
    {
      title: "Histoire des Gloutonnes",
      url: "/pages/about.html",
      category: "À propos",
      excerpt:
        "L'histoire de ma passion pour les plantes carnivores depuis l'âge de 10 ans et la création des Gloutonnes.",
    },
    {
      title: "Charles Bussers - Fondateur",
      url: "/pages/about.html#founder-story",
      category: "À propos",
      excerpt:
        "Découvrez le parcours du fondateur des Gloutonnes et sa passion dévorante pour les plantes carnivores.",
    },
    {
      title: "Origine des plantes carnivores",
      url: "/pages/guides.html",
      category: "Information",
      excerpt:
        "Comment et pourquoi ces plantes fascinantes ont développé des adaptations pour capturer et digérer des proies.",
    },
    {
      title: "Comment commander des plantes",
      url: "/pages/contact.html",
      category: "Commandes",
      excerpt:
        "Processus pour commander des plantes carnivores chez Les Gloutonnes via WhatsApp, email ou téléphone.",
    },
    {
      title: "Livraison et expédition des plantes",
      url: "/pages/contact.html",
      category: "Commandes",
      excerpt:
        "Informations sur les modalités d'expédition des plantes carnivores en Belgique et à l'international.",
    },
    {
      title: "Emballage et protection des plantes",
      url: "/pages/contact.html",
      category: "Commandes",
      excerpt:
        "Comment les plantes sont soigneusement emballées pour garantir leur arrivée en parfait état.",
    },
    {
      title: "FAQ - Questions fréquentes",
      url: "/pages/faq.html",
      category: "Information",
      excerpt:
        "Réponses aux questions les plus fréquemment posées sur les plantes carnivores et leur culture.",
    },
    {
      title: "Les fruits des myrtilliers sont-ils comestibles?",
      url: "/pages/plantesdetourbiere.html",
      category: "FAQ",
      excerpt:
        "Oui : Vaccinium myrtillus et les canneberges produisent des baies comestibles ; voir les fiches arbustes de la page tourbière.",
    },
    {
      title: "Les plantes de tourbière nuisent-elles aux carnivores?",
      url: "/pages/plantesdetourbiere.html",
      category: "FAQ",
      excerpt:
        "Bien choisies et non envahissantes, elles cohabitent bien ; éviter les rhizomes agressifs trop près des carnivores basses.",
    },
    {
      title: "Offres spéciales et promotions",
      url: "/pages/events.html",
      category: "Tarifs",
      excerpt:
        "Informations sur les offres saisonnières, les promotions lors d'événements et les réductions pour achats groupés.",
    },
    {
      title: "Tarifs des visites guidées",
      url: "/pages/contact.html#visit-us",
      category: "Tarifs",
      excerpt:
        "Détails sur les tarifs des visites individuelles et en groupe de la serre des Gloutonnes.",
    },
    {
      title: "Fiches techniques téléchargeables",
      url: "/bonus/index.html",
      category: "Ressources",
      excerpt:
        "Collection de fiches techniques détaillées pour chaque genre de plante carnivore, disponibles en téléchargement.",
    },
    {
      title: "Calendrier annuel d'entretien",
      url: "/bonus/index.html",
      category: "Ressources",
      excerpt:
        "Calendrier à imprimer avec les tâches d'entretien mois par mois pour chaque type de plante carnivore.",
    },
    {
      title: "Galerie des Dionaea en fleurs",
      url: "/pages/galerie.html",
      category: "Galerie photos",
      excerpt:
        "Collection de photos de Dionées en fleurs montrant la beauté particulière de cette phase de leur développement.",
    },
    {
      title: "Photos des urnes de Nepenthes",
      url: "/pages/galerie.html",
      category: "Galerie photos",
      excerpt:
        "Galerie dédiée aux urnes spectaculaires des différentes espèces et hybrides de Nepenthes.",
    },
    {
      title: "Images de la serre des Gloutonnes",
      url: "/pages/galerie.html",
      category: "Galerie photos",
      excerpt:
        "Visite virtuelle en images des différentes sections de la serre spécialisée des Gloutonnes.",
    },
    {
      title: "Livraison en Belgique",
      url: "/pages/contact.html",
      category: "Zones de service",
      excerpt:
        "Détails sur les modalités de livraison à travers toute la Belgique et les délais à prévoir.",
    },
    {
      title: "Expédition internationale",
      url: "/pages/contact.html",
      category: "Zones de service",
      excerpt:
        "Informations sur les possibilités d'expédition vers d'autres pays européens et les réglementations associées.",
    },
    {
      title: "Retrait sur place à Verlaine",
      url: "/pages/contact.html#find-us",
      category: "Zones de service",
      excerpt:
        "Comment venir chercher vos plantes directement à la serre de Verlaine et les avantages de cette option.",
    },
    {
      title: "Randonnées pour observer des plantes carnivores",
      url: "/pages/rando.html",
      category: "Exploration nature",
      excerpt:
        "Découvrez les plus beaux sites naturels de Belgique pour observer des plantes carnivores et sphaignes dans leur habitat sauvage.",
    },
    {
      title: "Hautes Fagnes - Traversée Eupen à Botrange",
      url: "/pages/rando.html#eupen-botrange",
      category: "Randonnées carnivores",
      excerpt:
        "Longue traversée vers le Signal de Botrange : tourbières, sphaignes et Drosera à chercher depuis les caillebotis.",
    },
    {
      title: "Fagne de la Poleûr",
      url: "/pages/rando.html#fagne-poleur",
      category: "Randonnées carnivores",
      excerpt:
        "Tourbière entre Spa et Stavelot : Drosera et sphaignes possibles depuis les caillebotis (observation non garantie).",
    },
    {
      title: "Réserve naturelle De Liereman",
      url: "/pages/rando.html#de-liereman",
      category: "Randonnées carnivores",
      excerpt:
        "Mosaïque de landes et tourbières en Campine flamande avec Drosera intermedia, Drosera rotundifolia et Utricularia minor.",
    },
    {
      title: "Étangs de Virelles",
      url: "/pages/rando.html#etangs-virelles",
      category: "Randonnées carnivores",
      excerpt:
        "Haut lieu ornithologique à Chimay ; utriculaires et sphaignes possibles en périphérie, plus faciles avec guide Aquascope.",
    },
    {
      title: "Carte des sites d'observation des plantes carnivores",
      url: "/pages/rando.html",
      category: "Écotourisme",
      excerpt:
        "Sites naturels accessibles en Wallonie, Flandre et Bruxelles pour observer des plantes carnivores sauvages.",
    },
    {
      title: "Producteurs de plantes carnivores recommandés",
      url: "/pages/producteurs.html",
      category: "Recommandations",
      excerpt:
        "Sélection rigoureuse de pépiniéristes spécialisés en plantes carnivores en France et en Belgique.",
    },
    {
      title: "Les Petits Jardins d'Agathe",
      url: "/pages/producteurs.html#agathe",
      category: "Producteurs de confiance",
      excerpt:
        "Pépinière artisanale en Charente-Maritime spécialisée dans l'hybridation de Sarracenia (lespetitsjardinsdagathe.com).",
    },
    {
      title: "Philippe & Hélène Depiets",
      url: "/pages/producteurs.html#depiets",
      category: "Producteurs de confiance",
      excerpt:
        "Producteurs en Charente-Maritime (lesplantescarnivores.com) : large gamme, du courant au rare.",
    },
    {
      title: "Carnivore de Sologne",
      url: "/pages/producteurs.html#sologne",
      category: "Producteurs de confiance",
      excerpt:
        "Boutique en ligne spécialisée proposant un large choix de plantes carnivores cultivées et expédiées avec soin.",
    },
    {
      title: "Les Dents de la Terre",
      url: "/pages/producteurs.html#dentsdelaterre",
      category: "Producteurs de confiance",
      excerpt:
        "Fondée par Enzo Defer : carnivores de collection, formations ; portes ouvertes en avril et juillet.",
    },
    {
      title: "Carnivorose",
      url: "/pages/producteurs.html#carnivorose",
      category: "Producteurs de confiance",
      excerpt:
        "Producteur professionnel (@carnivorose_), antenne Est de l'association Dionée — Instagram.",
    },
    {
      title: "Trouver des plantes carnivores de qualité",
      url: "/pages/producteurs.html",
      category: "Achat et approvisionnement",
      excerpt:
        "Guide pour repérer des producteurs fiables qui cultivent leurs plantes dans le respect de l'environnement.",
    },
    {
      title: "Collection de Dionaea muscipula",
      url: "/pages/collection-dionaea.html",
      category: "Culture & Conseils",
      excerpt:
        "Explorez ma collection complète de plus de 120 cultivars de Dionaea muscipula (plantes attrape-mouches) avec leurs caractéristiques uniques.",
    },
    {
      title: "Sphaignes des Hautes Fagnes",
      url: "/pages/sphaignes.html",
      category: "Culture & Conseils",
      excerpt:
        "Découvrez les espèces de sphaignes des Hautes Fagnes et leur rôle dans les tourbières et auprès des plantes carnivores.",
    },
    {
      title: "Page d'accueil Les Gloutonnes",
      url: "/",
      category: "Accueil",
      excerpt:
        "Bienvenue sur le site des Gloutonnes, collection spécialisée de plantes carnivores en Belgique. Plus de 120 cultivars de Dionaea, Sarracenia, Nepenthes et autres espèces.",
    },
    {
      title: "Recherche sur le site",
      url: "/pages/recherche.html",
      category: "Navigation",
      excerpt:
        "Utilisez notre moteur de recherche pour trouver rapidement des informations sur les plantes carnivores, guides de culture, conseils et produits.",
    },
    {
      title: "Plan du site complet",
      url: "/pages/sitemap.html",
      category: "Navigation",
      excerpt:
        "Vue d'ensemble de toutes les pages du site Les Gloutonnes, organisées par catégories pour faciliter votre navigation.",
    },
    {
      title: "Les Gloutonnes Search",
      url: "https://www.lesgloutonnes.be/gloutonnesearch/",
      category: "Applications",
      excerpt:
        "Comparateur de prix et moteur de recherche de plantes carnivores chez les producteurs partenaires.",
    }
  ];

  // Filtrer les résultats selon la requête
  return siteData.filter((item) => {
    return (
      item.title.toLowerCase().includes(query) ||
      item.excerpt.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  });
}
