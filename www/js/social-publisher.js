/**
 * ASSISTANT PUBLICATION IA COMPLET - LES GLOUTONNES
 * Version complète avec IA avancée intégrée
 * VERSION AMÉLIORÉE avec optimisations, sauvegarde intelligente, retry, etc.
 */

// Configuration
const CONFIG = {
  maxChars: 2200,
  optimalLength: 150,
  metaUrls: {
    facebook: 'https://business.facebook.com/latest/composer?business_id=908228643375757&asset_id=107692491677696&platform=Facebook',
    instagram: 'https://business.facebook.com/latest/composer?business_id=908228643375757&asset_id=107692491677696&platform=Instagram'
  }
};

// ================================
// UTILITAIRES AMÉLIORÉS
// ================================

/**
 * Fetch avec retry automatique
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                return response;
            }
            
            if (response.status >= 500 && i < maxRetries - 1) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return response;
        } catch (error) {
            if (i === maxRetries - 1 || error.name === 'AbortError') {
                throw error;
            }
            
            const delay = 1000 * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Configuration avancée de l'IA
const AI_CONFIG = {
  analysis: {
    minEngagementWords: ['salut', 'hello', 'bonjour', 'coucou'],
    questionWords: ['pourquoi', 'comment', 'que pensez', 'avis', 'expérience'],
    emotionalWords: ['incroyable', 'magnifique', 'wow', 'sublime', 'fascinant'],
    callToActionWords: ['commentaire', 'partage', 'tag', 'réagis', 'dis-moi'],
    plantSpecies: {
      'dionaea': ['dionaea muscipula', 'venus flytrap', 'attrape-mouche', 'dionaea'],
      'sarracenia': ['sarracenia', 'trumpet pitcher', 'trompette'],
      'drosera': ['drosera', 'sundew', 'rossolis'],
      'nepenthes': ['nepenthes', 'tropical pitcher'],
      'pinguicula': ['pinguicula', 'butterwort', 'grassette'],
      'cephalotus': ['cephalotus', 'albany pitcher'],
      'heliamphora': ['heliamphora', 'marsh pitcher']
    }
  },
  improvements: {
    tone: {
      friendly: ['Salut les passionnés ! 🌱', 'Hello la communauté ! 👋', 'Coucou les amoureux des carnivores ! 💚'],
      excited: ['🤩 INCROYABLE !', '🔥 JE SUIS SOUS LE CHARME !', '✨ DÉCOUVERTE FANTASTIQUE !'],
      questioning: ['Et vous, qu\'en pensez-vous ?', 'Partagez votre expérience !', 'Qui connaît cette espèce ?']
    },
    engagement: {
      hooks: [
        'Tu ne vas pas croire ce qui vient d\'arriver...',
        'Prépare-toi à être émerveillé !',
        'Cette découverte va te faire tomber !',
        'Attention, coup de cœur en approche !'
      ],
      closers: [
        'Dis-moi en commentaire ce que tu en penses ! 👇',
        'Tag un ami qui va adorer ça ! 🏷️',
        'Partage si tu as aimé cette découverte ! 🔄',
        'Réagis avec ton emoji préféré ! ❤️'
      ]
    }
  }
};

// Templates de démarrage
const TEMPLATES = {
  newPlant: {
    title: "🌱 Nouvelle plante",
    content: "Salut les passionnés ! 🌱\n\nJe viens de recevoir cette magnifique [NOM_PLANTE] et je suis complètement sous le charme ! Regardez-moi ces [CARACTÉRISTIQUE]...\n\nQu'en pensez-vous ? Connaissez-vous cette espèce ?\n\n"
  },
  tip: {
    title: "💡 Conseil/Astuce", 
    content: "💡 ASTUCE DU JOUR 💡\n\n[CONSEIL] pour vos plantes carnivores !\n\nPersonnellement, j'ai découvert cette technique il y a quelques mois et ça a complètement changé [RÉSULTAT].\n\nEt vous, quelle est votre meilleure astuce ?\n\n#conseil"
  },
  showcase: {
    title: "📸 Mise en avant",
    content: "🤩 COUP DE CŒUR 🤩\n\nJe ne pouvais pas ne pas partager cette beauté avec vous ! Ma [PLANTE] est juste... WOW !\n\n[DESCRIPTION_ÉMOTIONNELLE]\n\nDites-moi dans les commentaires : quelle est votre plante carnivore préférée ?\n\n#beautiful"
  },
  question: {
    title: "❓ Question communauté",
    content: "❓ QUESTION POUR LA COMMUNAUTÉ ❓\n\n[VOTRE_QUESTION] ?\n\nJ'aimerais vraiment connaître vos expériences et vos avis ! Chaque retour m'aide à mieux comprendre ces plantes fascinantes.\n\nPartagez vos réponses en commentaires ! 👇\n\n#communauté"
  }
};

// État de l'application
let appState = {
  currentText: '',
  currentHashtags: '',
  lastSave: null,
  engagementScore: 0,
  isInitialized: false
};

// ===============================
// CLASSE IA AVANCÉE
// ===============================
class AdvancedAI {
  constructor() {
    this.context = {};
    this.improveHistory = [];
  }

  analyzeContent(text) {
    const analysis = {
      sentiment: this.analyzeSentiment(text),
      structure: this.analyzeStructure(text),
      engagement: this.analyzeEngagement(text),
      plants: this.detectPlants(text),
      tone: this.analyzeTone(text),
      suggestions: []
    };

    analysis.suggestions = this.generateSuggestions(analysis);
    return analysis;
  }

  analyzeSentiment(text) {
    const positive = ['magnifique', 'incroyable', 'super', 'génial', 'wow', 'sublime', 'fantastique'];
    const negative = ['problème', 'mort', 'malade', 'triste', 'difficile'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positive.forEach(word => {
      if (text.toLowerCase().includes(word)) positiveScore++;
    });
    
    negative.forEach(word => {
      if (text.toLowerCase().includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  analyzeStructure(text) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
    
    return {
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      avgSentenceLength: sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length || 0,
      hasGreeting: /^(salut|hello|bonjour|coucou)/i.test(text),
      hasQuestion: text.includes('?'),
      hasEmojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/u.test(text),
      hasCallToAction: AI_CONFIG.analysis.callToActionWords.some(word => 
        text.toLowerCase().includes(word)
      )
    };
  }

  analyzeEngagement(text) {
    let score = 0;
    const factors = [];
    
    if (text.length >= 100 && text.length <= 300) {
      score += 20;
      factors.push('Longueur optimale');
    }
    
    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount > 0) {
      score += Math.min(questionCount * 10, 20);
      factors.push(`${questionCount} question(s)`);
    }
    
    const emojiCount = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/gu) || []).length;
    if (emojiCount >= 2 && emojiCount <= 5) {
      score += 15;
      factors.push('Émojis équilibrés');
    }
    
    AI_CONFIG.analysis.callToActionWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        score += 5;
        factors.push('Call-to-action');
      }
    });
    
    if (text.includes('vous') || text.includes('votre') || text.includes('vos')) {
      score += 10;
      factors.push('Ton personnel');
    }
    
    return { score: Math.min(score, 100), factors };
  }

  detectPlants(text) {
    const detected = [];
    const textLower = text.toLowerCase();
    
    Object.entries(AI_CONFIG.analysis.plantSpecies).forEach(([key, variations]) => {
      variations.forEach(variation => {
        if (textLower.includes(variation.toLowerCase())) {
          detected.push({
            species: key,
            variation: variation,
            confidence: variation.length / textLower.length
          });
        }
      });
    });
    
    return detected.sort((a, b) => b.confidence - a.confidence);
  }

  analyzeTone(text) {
    const textLower = text.toLowerCase();
    
    if (/[!]{2,}|wow|incroyable|magnifique/.test(textLower)) {
      return 'excited';
    }
    if (/\?|avis|pensez|expérience/.test(textLower)) {
      return 'questioning';
    }
    if (/salut|hello|bonjour/.test(textLower)) {
      return 'friendly';
    }
    
    return 'neutral';
  }

  generateSuggestions(analysis) {
    const suggestions = [];
    
    if (!analysis.structure.hasGreeting) {
      suggestions.push({
        type: 'greeting',
        priority: 'high',
        message: 'Ajouter une salutation personnelle'
      });
    }
    
    if (!analysis.structure.hasQuestion) {
      suggestions.push({
        type: 'engagement',
        priority: 'medium',
        message: 'Ajouter une question pour engager'
      });
    }
    
    if (!analysis.structure.hasCallToAction) {
      suggestions.push({
        type: 'cta',
        priority: 'high',
        message: 'Ajouter un appel à l\'action'
      });
    }
    
    if (analysis.plants.length > 0) {
      suggestions.push({
        type: 'plant-specific',
        priority: 'medium',
        message: `Optimiser pour ${analysis.plants[0].species}`
      });
    }
    
    if (analysis.sentiment === 'neutral' && analysis.tone === 'neutral') {
      suggestions.push({
        type: 'emotion',
        priority: 'medium',
        message: 'Rendre plus émotionnel'
      });
    }
    
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  improveTextIntelligently(text) {
    const analysis = this.analyzeContent(text);
    let improved = text;
    const improvements = [];
    
    if (!analysis.structure.hasGreeting) {
      const greetings = AI_CONFIG.improvements.tone.friendly;
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      improved = `${greeting}\n\n${improved}`;
      improvements.push('Salutation ajoutée');
    }
    
    if (!analysis.structure.hasEmojis) {
      improved = this.addContextualEmojis(improved, analysis.plants);
      improvements.push('Émojis contextuels ajoutés');
    }
    
    if (!analysis.structure.hasQuestion) {
      const question = this.addQuestion(analysis.plants);
      improved = `${improved}\n\n${question}`;
      improvements.push('Question d\'engagement ajoutée');
    }
    
    if (!analysis.structure.hasCallToAction) {
      const ctas = AI_CONFIG.improvements.engagement.closers;
      const cta = ctas[Math.floor(Math.random() * ctas.length)];
      improved = `${improved}\n\n${cta}`;
      improvements.push('Appel à l\'action ajouté');
    }
    
    if (analysis.structure.paragraphs < 2 && improved.length > 100) {
      improved = this.improveStructure(improved);
      improvements.push('Structure améliorée');
    }
    
    this.improveHistory.push({
      original: text,
      improved: improved,
      analysis: analysis,
      improvements: improvements,
      timestamp: new Date()
    });
    
    return {
      text: improved,
      improvements: improvements,
      analysis: analysis
    };
  }

  addContextualEmojis(text, plants) {
    let improved = text;
    
    if (plants.length > 0) {
      const plantEmojis = {
        dionaea: '🪤',
        sarracenia: '🏺',
        drosera: '💧',
        nepenthes: '🌿',
        pinguicula: '🌸'
      };
      
      plants.forEach(plant => {
        const emoji = plantEmojis[plant.species];
        if (emoji && !improved.includes(emoji)) {
          improved = improved.replace(plant.variation, `${plant.variation} ${emoji}`);
        }
      });
    }
    
    if (!plants.length && !improved.includes('🌱')) {
      improved = improved.replace(/plante/i, 'plante 🌱');
    }
    
    return improved;
  }

  addQuestion(plants) {
    if (plants.length > 0) {
      const species = plants[0].species;
      const questions = [
        `Tu cultives aussi des ${species} ?`,
        `Quelle est ton expérience avec les ${species} ?`,
        `As-tu des conseils pour les ${species} ?`,
        `Connais-tu d'autres variétés de ${species} ?`
      ];
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    const generalQuestions = [
      'Et toi, quelle est ta carnivore préférée ?',
      'Tu as déjà eu ce genre d\'expérience ?',
      'Qu\'en penses-tu ?',
      'Partage ton avis en commentaire !'
    ];
    return generalQuestions[Math.floor(Math.random() * generalQuestions.length)];
  }

  improveStructure(text) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    if (sentences.length > 3) {
      const mid = Math.floor(sentences.length / 2);
      return sentences.slice(0, mid).join(' ') + '\n\n' + sentences.slice(mid).join(' ');
    }
    return text;
  }

  generateVariants(text) {
    const analysis = this.analyzeContent(text);
    const variants = [];
    
    // Variant 1: Plus émotionnel
    let emotional = text;
    if (analysis.sentiment !== 'positive') {
      const emotions = AI_CONFIG.improvements.tone.excited;
      emotional = emotions[Math.floor(Math.random() * emotions.length)] + ' ' + emotional;
    }
    variants.push({ type: 'Émotionnel', text: emotional });
    
    // Variant 2: Plus professionnel
    let professional = text
      .replace(/!/g, '.')
      .replace(/wow|génial|super/gi, 'remarquable');
    variants.push({ type: 'Professionnel', text: professional });
    
    // Variant 3: Plus engageant
    let engaging = text;
    if (!analysis.structure.hasQuestion) {
      engaging += '\n\n' + this.addQuestion(analysis.plants);
    }
    variants.push({ type: 'Engageant', text: engaging });
    
    return variants;
  }

  suggestSmartHashtags(text, currentHashtags) {
    const analysis = this.analyzeContent(text);
    const suggestions = new Set();
    
    analysis.plants.forEach(plant => {
      const plantHashtags = {
        dionaea: ['#dionaea', '#venusflytrap', '#carnivorousplants'],
        sarracenia: ['#sarracenia', '#pitcherplant', '#carnivorousplants'],
        drosera: ['#drosera', '#sundew', '#carnivorousplants'],
        nepenthes: ['#nepenthes', '#tropical', '#carnivorousplants'],
        pinguicula: ['#pinguicula', '#butterwort', '#carnivorousplants']
      };
      
      if (plantHashtags[plant.species]) {
        plantHashtags[plant.species].forEach(tag => suggestions.add(tag));
      }
    });
    
    if (analysis.sentiment === 'positive') {
      suggestions.add('#beautiful');
      suggestions.add('#stunning');
    }
    
    const now = new Date();
    const month = now.getMonth();
    if (month >= 2 && month <= 4) suggestions.add('#spring');
    if (month >= 5 && month <= 7) suggestions.add('#summer');
    if (month >= 8 && month <= 10) suggestions.add('#autumn');
    if (month >= 11 || month <= 1) suggestions.add('#winter');
    
    return Array.from(suggestions).filter(tag => 
      !currentHashtags.toLowerCase().includes(tag.toLowerCase())
    );
  }
}

// Instance globale de l'IA
window.advancedAI = new AdvancedAI();

// ===============================
// INITIALISATION
// ===============================
document.addEventListener('DOMContentLoaded', function() {
  if (appState.isInitialized) return;
  
  // Initialisation Assistant Publication IA
  
  setupEventListeners();
  loadLastDraft();
  updateAllPreviews();
  
  appState.isInitialized = true;
  // Assistant Publication IA prêt
});

function setupEventListeners() {
  const contentField = document.getElementById('post-content');
  const hashtagsField = document.getElementById('custom-hashtags');
  
  if (contentField) {
    contentField.addEventListener('input', function() {
      appState.currentText = this.value;
      updateCharCounter();
      updateEngagementScore();
      updateAllPreviews();
      autoDetectHashtags();
      autoSave();
      
      // Analyse temps réel optimisée (avec debounce)
      clearTimeout(window.realTimeAnalysisTimeout);
      window.realTimeAnalysisTimeout = setTimeout(() => {
        updateRealTimeInsights();
      }, 500); // Réduit à 500ms grâce à l'analyse incrémentale
    });
  }
  
  if (hashtagsField) {
    hashtagsField.addEventListener('input', function() {
      appState.currentHashtags = this.value;
      updateAllPreviews();
      autoSave();
    });
  }
  
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
      switch(e.key) {
        case 's':
          e.preventDefault();
          saveDraft();
          break;
        case 'Enter':
          e.preventDefault();
          quickPublish();
          break;
      }
    }

  });
}

// ===============================
// TEMPLATES
// ===============================
function loadTemplate(templateKey) {
  const template = TEMPLATES[templateKey];
  if (!template) return;
  
  const contentField = document.getElementById('post-content');
  if (contentField) {
    contentField.value = template.content;
    appState.currentText = template.content;
    
    const firstPlaceholder = template.content.match(/\[([^\]]+)\]/);
    if (firstPlaceholder) {
      setTimeout(() => {
        const start = template.content.indexOf(firstPlaceholder[0]);
        const end = start + firstPlaceholder[0].length;
        contentField.setSelectionRange(start, end);
        contentField.focus();
      }, 100);
    }
    
    updateCharCounter();
    updateEngagementScore();
    updateAllPreviews();
    updateRealTimeInsights();
    
    showMessage(`Template "${template.title}" chargé ! Personnalise-le maintenant.`, 'success');
  }
}

// ===============================
// FONCTIONS IA AVANCÉES
// ===============================
function improveTextAdvanced() {
  const contentField = document.getElementById('post-content');
  const currentText = contentField.value.trim();
  
  if (!currentText) {
    showMessage("Écris d'abord du contenu pour que je puisse l'analyser et l'améliorer de manière intelligente !", 'warning');
    return;
  }
  
  setButtonProcessing('improveTextAdvanced', true);
  showMessage("🤖 Analyse intelligente en cours...", 'info');
  
  setTimeout(() => {
    const result = window.advancedAI.improveTextIntelligently(currentText);
    
    contentField.value = result.text;
    appState.currentText = result.text;
    updateCharCounter();
    updateEngagementScore();
    updateAllPreviews();
    updateRealTimeInsights();
    
    const improvementsText = result.improvements.join(', ');
    showMessage(`✨ Améliorations appliquées : ${improvementsText}`, 'success');
    
    showVariants(result.text);
    setButtonProcessing('improveTextAdvanced', false);
  }, 1500);
}


function generateVariantsAdvanced() {
  const currentText = appState.currentText.trim();
  
  if (!currentText) {
    showMessage("Écris d'abord du contenu !", 'warning');
    return;
  }
  
  setButtonProcessing('generateVariantsAdvanced', true);
  showMessage("🤖 Génération de variantes intelligentes...", 'info');
  
  setTimeout(() => {
    const analysis = window.advancedAI.analyzeContent(currentText);
    const variants = [];
    
    // 1. VARIANTE ÉMOTIONNELLE
    let emotionalVariant = currentText;
    
    // Ajouter ouverture émotionnelle
    if (!emotionalVariant.match(/^[🔥😍🤩✨]/)) {
      const emotionalOpeners = ['🔥 WOW ! ', '🤩 INCROYABLE ! ', '😍 MAGNIFIQUE ! '];
      const opener = emotionalOpeners[Math.floor(Math.random() * emotionalOpeners.length)];
      emotionalVariant = opener + emotionalVariant;
    }
    
    // Intensifier les mots
    emotionalVariant = emotionalVariant
      .replace(/\bbelle?\b/gi, 'MAGNIFIQUE')
      .replace(/\bbien\b/gi, 'FANTASTIQUE')
      .replace(/\bsuper\b/gi, 'EXTRAORDINAIRE');
    
    // Ajouter CTA émotionnel
    if (!analysis.structure.hasCallToAction) {
      emotionalVariant += '\n\nDIS-MOI que tu ressens la même chose ! 🔥';
    }
    
    variants.push({
      type: '🔥 Émotionnel',
      text: emotionalVariant
    });
    
    // 2. VARIANTE ÉDUCATIVE
    let educationalVariant = currentText;
    
    // Ajouter ouverture éducative
    const eduOpeners = ['🎓 Le saviez-vous ? ', '📚 Fait intéressant : ', '💡 Info utile : '];
    const eduOpener = eduOpeners[Math.floor(Math.random() * eduOpeners.length)];
    
    if (analysis.plants.length > 0) {
      const plant = analysis.plants[0].species;
      let plantInfo = '';
      
      if (plant === 'dionaea') {
        plantInfo = 'Les Dionaea ferment leurs pièges en 0,3 seconde grâce à des poils sensoriels.';
      } else if (plant === 'sarracenia') {
        plantInfo = 'Les Sarracenia utilisent des enzymes pour digérer leurs proies.';
      } else if (plant === 'drosera') {
        plantInfo = 'Les Drosera produisent des gouttelettes collantes pour capturer les insectes.';
      }
      
      if (plantInfo) {
        educationalVariant = eduOpener + plantInfo + '\n\n' + educationalVariant;
      }
    }
    
    // Ajouter CTA éducatif
    if (!analysis.structure.hasCallToAction) {
      educationalVariant += '\n\nPartagez vos expériences de culture ! 📚';
    }
    
    variants.push({
      type: '🎓 Éducatif',
      text: educationalVariant
    });
    
    // 3. VARIANTE QUESTION/INTERACTION
    let interactiveVariant = currentText;
    
    // Ajouter questions multiples
    const questions = ['Qui cultive aussi ces plantes ? 🙋‍♀️'];
    
    if (analysis.plants.length > 0) {
      const plant = analysis.plants[0].species;
      questions.push(`Quelle est votre variété de ${plant} préférée ? 🌱`);
    }
    
    questions.push('Débutant ou expert en carnivores ? 📊');
    
    interactiveVariant += '\n\n' + questions.join('\n');
    interactiveVariant += '\n\n👇 Répondez en commentaire ! J\'adore vous lire !';
    
    variants.push({
      type: '❓ Interactif',
      text: interactiveVariant
    });
    
    // AFFICHAGE SIMPLE
    showVariantsSimple(variants);
    
    setButtonProcessing('generateVariantsAdvanced', false);
    showMessage(`📝 ${variants.length} variantes créées !`, 'success');
    
    window.currentVariants = variants;
  }, 1500);
}

function showVariantsSimple(variants) {
  const variantsContainer = document.getElementById('text-variants');
  const variantsList = document.getElementById('variants-list');
  
  if (!variantsContainer || !variantsList) return;
  
  let variantsHTML = `<h5>📝 Variantes disponibles</h5>`;
  
  variants.forEach((variant, index) => {
    variantsHTML += `
      <div class="variant-item">
        <div class="variant-header">
          <h6>${variant.type}</h6>
          <button onclick="selectVariant(${index})" class="select-variant-btn">Utiliser</button>
        </div>
        <div class="variant-content">${variant.text}</div>
      </div>
    `;
  });
  
  variantsList.innerHTML = variantsHTML;
  variantsContainer.style.display = 'block';
}

function selectVariant(index) {
  if (window.currentVariants && window.currentVariants[index]) {
    const contentField = document.getElementById('post-content');
    contentField.value = window.currentVariants[index].text;
    appState.currentText = window.currentVariants[index].text;
    updateCharCounter();
    updateEngagementScore();
    updateAllPreviews();
    updateRealTimeInsights();
    
    showMessage(`✅ Variante "${window.currentVariants[index].type}" appliquée !`, 'success');
    
    // Cacher les variantes après sélection
    const variantsContainer = document.getElementById('text-variants');
    if (variantsContainer) {
      variantsContainer.style.display = 'none';
    }
  }
}

function suggestHashtagsAI() {
  const currentText = appState.currentText.trim();
  const currentHashtags = appState.currentHashtags;
  
  if (!currentText) {
    showMessage("Écris d'abord du contenu !", 'warning');
    return;
  }
  
  setButtonProcessing('suggestHashtagsAI', true);
  showMessage("🤖 IA en cours d'analyse pour hashtags ultra-ciblés...", 'info');
  
  setTimeout(() => {
    const analysis = window.advancedAI.analyzeContent(currentText);
    const suggestions = [];
    const explanations = [];
    
    // 1. HASHTAGS ESSENTIELS (toujours nécessaires)
    if (!currentHashtags.toLowerCase().includes('#plantescarnivores')) {
      suggestions.push('#PlantesCarnivoRes');
      explanations.push('Essential pour ta niche');
    }
    if (!currentHashtags.toLowerCase().includes('#lesgloutonnes')) {
      suggestions.push('#LesGloutonnes');
      explanations.push('Ta marque personnelle');
    }
    
    // 2. HASHTAGS SPÉCIFIQUES AUX PLANTES DÉTECTÉES
    analysis.plants.forEach(plant => {
      const plantHashtags = {
        dionaea: {
          tags: ['#dionaea', '#venusflytrap', '#dionaeamuscipula'],
          reason: 'Spécifique à cette espèce iconique'
        },
        sarracenia: {
          tags: ['#sarracenia', '#pitcherplant', '#trompette'],
          reason: 'Populaire chez les collectionneurs'
        },
        drosera: {
          tags: ['#drosera', '#sundew', '#rossolis'],
          reason: 'Grande communauté de fans'
        },
        nepenthes: {
          tags: ['#nepenthes', '#tropical', '#pitcherplant'],
          reason: 'Plantes tropicales très recherchées'
        },
        pinguicula: {
          tags: ['#pinguicula', '#butterwort', '#grassette'],
          reason: 'Niche spécialisée mais engagée'
        }
      };
      
      if (plantHashtags[plant.species]) {
        const plantData = plantHashtags[plant.species];
        plantData.tags.forEach(tag => {
          if (!currentHashtags.toLowerCase().includes(tag.toLowerCase())) {
            suggestions.push(tag);
            explanations.push(plantData.reason);
          }
        });
      }
    });
    
    // 3. HASHTAGS SELON LE TYPE DE CONTENU
    const contentType = detectContentType(currentText, analysis);
    const contentHashtags = {
      newPlant: {
        tags: ['#nouveauté', '#collection', '#acquisition'],
        reason: 'Attire ceux qui cherchent des nouveautés'
      },
      tip: {
        tags: ['#conseil', '#tips', '#culture'],
        reason: 'Communauté avide de conseils'
      },
      showcase: {
        tags: ['#beautiful', '#stunning', '#photography'],
        reason: 'Hashtags visuels pour plus de likes'
      },
      question: {
        tags: ['#communauté', '#question', '#expérience'],
        reason: 'Encourage les réponses'
      },
      problem: {
        tags: ['#aide', '#problème', '#diagnostic'],
        reason: 'Attire les experts qui aident'
      }
    };
    
    if (contentHashtags[contentType]) {
      const typeData = contentHashtags[contentType];
      typeData.tags.forEach(tag => {
        if (!currentHashtags.toLowerCase().includes(tag.toLowerCase())) {
          suggestions.push(tag);
          explanations.push(typeData.reason);
        }
      });
    }
    
    // 4. HASHTAGS SAISONNIERS INTELLIGENTS
    const now = new Date();
    const month = now.getMonth();
    const seasonalTags = getSeasonalHashtags(month);
    seasonalTags.forEach(tag => {
      if (!currentHashtags.toLowerCase().includes(tag.toLowerCase())) {
        suggestions.push(tag);
        explanations.push('Trending saisonnier');
      }
    });
    
    // 5. HASHTAGS COMMUNAUTÉ SELON LE TON
    if (analysis.tone === 'questioning') {
      ['#help', '#advice', '#community'].forEach(tag => {
        if (!currentHashtags.toLowerCase().includes(tag.toLowerCase())) {
          suggestions.push(tag);
          explanations.push('Parfait pour les questions');
        }
      });
    }
    
    if (analysis.sentiment === 'positive') {
      ['#passion', '#love', '#amazing'].forEach(tag => {
        if (!currentHashtags.toLowerCase().includes(tag.toLowerCase())) {
          suggestions.push(tag);
          explanations.push('Amplifie l\'émotion positive');
        }
      });
    }
    
    // 6. HASHTAGS ENGAGEMENT SELON L'HEURE
    const hour = now.getHours();
    if (hour >= 12 && hour <= 14) {
      suggestions.push('#lunchbreak');
      explanations.push('Peak time midi');
    } else if (hour >= 19 && hour <= 21) {
      suggestions.push('#eveningvibes');
      explanations.push('Moment détente soir');
    }
    
    // 7. LIMITATION INTELLIGENTE (max 8 suggestions)
    const finalSuggestions = suggestions.slice(0, 8);
    const finalExplanations = explanations.slice(0, 8);
    
    if (finalSuggestions.length === 0) {
      showMessage("✅ Tes hashtags sont déjà parfaitement optimisés !", 'success');
      setButtonProcessing('suggestHashtagsAI', false);
      return;
    }
    
    // 8. AFFICHAGE AVEC EXPLICATIONS
    const autoDetectionDiv = document.getElementById('auto-detection');
    autoDetectionDiv.innerHTML = `
      <div class="ai-hashtag-analysis">
        <h6>🤖 <strong>Analyse IA de ton contenu :</strong></h6>
        <div class="content-analysis">
          <span class="analysis-tag">📝 Type: ${contentType}</span>
          <span class="analysis-tag">🎭 Sentiment: ${analysis.sentiment}</span>
          <span class="analysis-tag">🎵 Ton: ${analysis.tone}</span>
          ${analysis.plants.length > 0 ? `<span class="analysis-tag">🌱 Plantes: ${analysis.plants.map(p => p.species).join(', ')}</span>` : ''}
        </div>
      </div>
      
      <div class="ai-hashtag-suggestions-enhanced">
        <h6>🎯 <strong>Hashtags stratégiques recommandés :</strong></h6>
        ${finalSuggestions.map((tag, index) => `
          <div class="smart-hashtag-item" onclick="toggleHashtag('${tag}')">
            <span class="hashtag-text">${tag}</span>
            <span class="hashtag-reason">${finalExplanations[index]}</span>
          </div>
        `).join('')}
      </div>
      
      <div class="hashtag-performance">
        <p class="ai-explanation">
          🚀 <strong>Impact prévu :</strong> +${Math.min(finalSuggestions.length * 5, 30)}% de portée
          avec ces hashtags ultra-ciblés !
        </p>
      </div>
    `;
    
    setButtonProcessing('suggestHashtagsAI', false);
    showMessage(`🎯 ${finalSuggestions.length} hashtags stratégiques trouvés !`, 'success');
  }, 2000);
}

// Fonctions utilitaires
function detectContentType(text, analysis) {
  const textLower = text.toLowerCase();
  
  if (textLower.includes('nouveau') || textLower.includes('reçu') || textLower.includes('acquisition')) {
    return 'newPlant';
  }
  if (textLower.includes('conseil') || textLower.includes('astuce') || textLower.includes('tip')) {
    return 'tip';
  }
  if (textLower.includes('magnifique') || textLower.includes('regardez') || textLower.includes('photo')) {
    return 'showcase';
  }
  if (analysis.structure.hasQuestion || textLower.includes('avis') || textLower.includes('expérience')) {
    return 'question';
  }
  if (textLower.includes('problème') || textLower.includes('aide') || textLower.includes('malade')) {
    return 'problem';
  }
  
  return 'general';
}

function getSeasonalHashtags(month) {
  if (month >= 2 && month <= 4) return ['#spring', '#printemps', '#croissance'];
  if (month >= 5 && month <= 7) return ['#summer', '#été', '#soleil'];
  if (month >= 8 && month <= 10) return ['#autumn', '#automne', '#couleurs'];
  return ['#winter', '#hiver', '#dormance'];
}

function optimizeForPlants() {
  const text = appState.currentText.trim();
  
  if (!text) {
    showMessage("Écris d'abord du contenu !", 'warning');
    return;
  }
  
  const analysis = window.advancedAI.analyzeContent(text);
  
  if (analysis.plants.length === 0) {
    showMessage("Aucune plante détectée dans ton texte. Mentionne le nom d'une plante carnivore pour que je puisse optimiser !", 'info');
    return;
  }
  
  setButtonProcessing('optimizeForPlants', true);
  
  setTimeout(() => {
    let optimized = text;
    const mainPlant = analysis.plants[0];
    
    const optimizations = {
      dionaea: {
        keywords: ['piège', 'fermeture', 'mécanisme', 'déclenchement'],
        tips: 'Mentionne le mécanisme de fermeture unique !',
        hashtags: ['#dionaea', '#venusflytrap', '#mechanism']
      },
      sarracenia: {
        keywords: ['couleurs', 'piège passif', 'nectar', 'opercule'],
        tips: 'Parle des magnifiques couleurs et du piège passif !',
        hashtags: ['#sarracenia', '#pitcherplant', '#colors']
      },
      drosera: {
        keywords: ['gouttelettes', 'collant', 'brillant', 'tentacules'],
        tips: 'Décris les gouttelettes brillantes et collantes !',
        hashtags: ['#drosera', '#sundew', '#dewdrops']
      }
    };
    
    const plantOptim = optimizations[mainPlant.species];
    
    if (plantOptim) {
      if (!plantOptim.keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        optimized += `\n\n✨ ${plantOptim.tips}`;
      }
      
      const currentHashtags = appState.currentHashtags.toLowerCase();
      const missingHashtags = plantOptim.hashtags.filter(tag => 
        !currentHashtags.includes(tag.toLowerCase())
      );
      
      if (missingHashtags.length > 0) {
        const hashtagsField = document.getElementById('custom-hashtags');
        const newHashtags = appState.currentHashtags + ' ' + missingHashtags.join(' ');
        hashtagsField.value = newHashtags.trim();
        appState.currentHashtags = newHashtags.trim();
        updateAllPreviews();
      }
    }
    
    const contentField = document.getElementById('post-content');
    contentField.value = optimized;
    appState.currentText = optimized;
    updateCharCounter();
    updateEngagementScore();
    updateAllPreviews();
    updateRealTimeInsights();
    
    setButtonProcessing('optimizeForPlants', false);
    showMessage(`🌱 Contenu optimisé pour ${mainPlant.species} !`, 'success');
  }, 1500);
}

// ===============================
// ANALYSE TEMPS RÉEL
// ===============================
// Cache pour analyse incrémentale
let lastAnalyzedText = '';
let analysisCache = {};

function getTextDiff(oldText, newText) {
    // Simple diff : retourner les caractères ajoutés
    if (oldText.length >= newText.length) {
        return newText;
    }
    return newText.slice(oldText.length);
}

function updateIncrementalAnalysis(diff, oldAnalysis) {
    // Analyser seulement la nouvelle partie
    const newAnalysis = window.advancedAI?.analyzeContent(diff) || {};
    
    // Fusionner avec l'analyse précédente de manière intelligente
    if (oldAnalysis) {
        // Mettre à jour les métriques
        const newWordCount = diff.split(/\s+/).filter(w => w.length > 0).length;
        const newCharCount = diff.length;
        
        return {
            ...oldAnalysis,
            // Mettre à jour les compteurs
            wordCount: (oldAnalysis.wordCount || 0) + newWordCount,
            charCount: (oldAnalysis.charCount || 0) + newCharCount,
            // Recalculer le sentiment si le nouveau texte est significatif
            sentiment: diff.length > 20 ? newAnalysis.sentiment || oldAnalysis.sentiment : oldAnalysis.sentiment,
            // Fusionner les plantes détectées
            plants: [...(oldAnalysis.plants || []), ...(newAnalysis.plants || [])]
                .filter((p, i, arr) => arr.findIndex(pp => pp.species === p.species) === i), // Dédupliquer
            // Mettre à jour la structure
            structure: {
                ...oldAnalysis.structure,
                ...newAnalysis.structure,
                // Si le nouveau texte contient quelque chose, mettre à jour
                hasGreeting: oldAnalysis.structure?.hasGreeting || newAnalysis.structure?.hasGreeting || false,
                hasQuestion: oldAnalysis.structure?.hasQuestion || newAnalysis.structure?.hasQuestion || false,
                hasCallToAction: oldAnalysis.structure?.hasCallToAction || newAnalysis.structure?.hasCallToAction || false,
                hasEmojis: oldAnalysis.structure?.hasEmojis || newAnalysis.structure?.hasEmojis || false
            }
        };
    }
    
    return newAnalysis;
}

function updateRealTimeInsights() {
  const text = appState.currentText.trim();
  
  if (!text) {
    lastAnalyzedText = '';
    analysisCache = {};
    return;
  }
  
  // Ne pas réanalyser si pas de changement significatif
  if (text === lastAnalyzedText) {
    return;
  }
  
  const diff = getTextDiff(lastAnalyzedText, text);
  
  let analysis;
  
  // Si changement mineur (< 10 caractères) et cache disponible, mise à jour incrémentale
  if (diff.length < 10 && analysisCache.full && lastAnalyzedText) {
    analysis = updateIncrementalAnalysis(diff, analysisCache.full);
    analysisCache.full = analysis;
  } else {
    // Analyse complète avec debounce pour éviter trop de calculs
    clearTimeout(window.analysisTimeout);
    window.analysisTimeout = setTimeout(() => {
        const fullAnalysis = window.advancedAI.analyzeContent(text);
        analysisCache.full = fullAnalysis;
        analysis = fullAnalysis;
        updateUIWithAnalysis(analysis);
    }, 500);
    
    // Utiliser le cache en attendant
    if (analysisCache.full) {
        analysis = analysisCache.full;
    } else {
        // Analyse immédiate si pas de cache
        analysis = window.advancedAI.analyzeContent(text);
        analysisCache.full = analysis;
    }
  }
  
  lastAnalyzedText = text;
  updateUIWithAnalysis(analysis);
}

function updateUIWithAnalysis(analysis) {
    // Section sentiment/ton/plantes désactivée - ne fait rien
    // Afficher conseils contextuels uniquement
    showContextualTips(analysis);
}

function showContextualTips(analysis) {
  const tipsContainer = document.getElementById('ai-tips');
  const tipsContent = document.getElementById('ai-tips-content');
  
  if (!tipsContainer || !tipsContent) return;
  
  const tips = [];
  const currentScore = appState.engagementScore || 0;
  let missingPoints = 0;
  
  // Analyse pour atteindre 100%
  if (!analysis.structure.hasGreeting) {
    tips.push("❌ Ajoute une salutation chaleureuse (+10 points)");
    missingPoints += 10;
  }
  
  if (!analysis.structure.hasQuestion) {
    tips.push("❌ Pose une question pour engager (+15 points)");
    missingPoints += 15;
  }
  
  if (!analysis.structure.hasCallToAction) {
    tips.push("❌ Ajoute un appel à l'action clair (+20 points)");
    missingPoints += 20;
  }
  
  if (!analysis.structure.hasEmojis || analysis.sentiment === 'neutral') {
    tips.push("❌ Ajoute 2-3 emojis pour plus d'émotion (+10 points)");
    missingPoints += 10;
  }
  
  const hashtagCount = appState.currentHashtags.split(' ').filter(h => h.trim().startsWith('#')).length;
  if (hashtagCount < 5) {
    tips.push("❌ Ajoute plus de hashtags stratégiques (+10 points)");
    missingPoints += 10;
  }
  
  const textLength = appState.currentText.length;
  if (textLength < 100 || textLength > 300) {
    tips.push("❌ Ajuste la longueur (150-300 caractères optimal) (+5 points)");
    missingPoints += 5;
  }
  
  if (analysis.plants.length > 0 && !analysis.structure.hasQuestion) {
    tips.push(`❌ Tu mentionnes ${analysis.plants[0].species}, demande l'expérience des followers ! (+10 points)`);
    missingPoints += 10;
  }
  
  // Calcul du score potentiel
  const targetScore = Math.min(100, currentScore + missingPoints);
  
  if (tips.length > 0) {
    tipsContent.innerHTML = `
      <div class="ai-insights" style="margin-bottom: 1rem; background: linear-gradient(135deg, #5b0092, #ff9100); color: white; padding: 1rem; border-radius: 8px;">
        <div class="insight-item" style="color: white; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
          <span class="insight-label" style="color: white;">🎯 OBJECTIF :</span>
          <span class="insight-value" style="background: transparent; color: white; border: none;">100% d'engagement</span>
        </div>
        <div class="insight-item" style="color: white;">
          <span class="insight-label" style="color: white;">📊 Score actuel :</span>
          <span class="insight-value" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);">${currentScore}%</span>
        </div>
        <div class="insight-item" style="color: white;">
          <span class="insight-label" style="color: white;">🚀 Score possible :</span>
          <span class="insight-value" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);">${targetScore}%</span>
        </div>
      </div>
      
      <div style="margin-bottom: 1rem;">
        <h6 style="color: #5b0092; margin-bottom: 0.75rem; font-weight: 600;">📝 Pour atteindre 100% :</h6>
        ${tips.map(tip => `<div>${tip}</div>`).join('')}
      </div>
      
      ${targetScore >= 100 ? `
        <div class="ai-insights" style="background: #28a745; color: white; padding: 0.75rem; border-radius: 6px; text-align: center;">
          <div style="font-weight: 600;">🎉 Applique ces conseils pour un engagement parfait !</div>
        </div>
      ` : ''}
    `;
    tipsContainer.style.display = 'block';
  } else if (currentScore >= 90) {
    tipsContent.innerHTML = `
      <div class="ai-insights" style="background: #28a745; color: white; padding: 1rem; border-radius: 8px; text-align: center;">
        <div class="insight-item" style="color: white; justify-content: center;">
          <span style="font-size: 1.1rem; font-weight: 600;">🔥 EXCELLENT ! Score : ${currentScore}%</span>
        </div>
        <div style="margin-top: 0.5rem; opacity: 0.9;">Ton contenu est déjà très bien optimisé ! 🌱</div>
      </div>
    `;
    tipsContainer.style.display = 'block';
  } else {
    tipsContainer.style.display = 'none';
  }
}

// ===============================
// ASSISTANT IA CLASSIQUE (AMÉLIORÉ)
// ===============================
function improveText() {
  const contentField = document.getElementById('post-content');
  const currentText = contentField.value.trim();
  
  if (!currentText) {
    showMessage("Écris d'abord du contenu pour que je puisse l'améliorer !", 'warning');
    return;
  }
  
  let improved = currentText;
  
  if (!improved.toLowerCase().startsWith('salut') && 
      !improved.toLowerCase().startsWith('hello') && 
      !improved.toLowerCase().startsWith('bonjour')) {
    improved = "Salut les passionnés ! 🌱\n\n" + improved;
  }
  
  if (!/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(improved)) {
    improved = improved.replace(/^(.+)/, '🌱 $1');
  }
  
  if (!improved.includes('?') && 
      !improved.toLowerCase().includes('qu\'en pensez') && 
      !improved.toLowerCase().includes('et vous')) {
    improved += "\n\nEt vous, qu'en pensez-vous ? 🤔";
  }
  
  contentField.value = improved;
  appState.currentText = improved;
  updateCharCounter();
  updateEngagementScore();
  updateAllPreviews();
  updateRealTimeInsights();
  
  showMessage("✨ Texte amélioré ! Plus engageant et naturel.", 'success');
}

function addEmojis() {
  const contentField = document.getElementById('post-content');
  let text = contentField.value;
  
  if (!text.trim()) {
    showMessage("Écris d'abord du contenu pour ajouter des emojis !", 'warning');
    return;
  }
  
  const emojiMap = {
    'plante': '🌱',
    'carnivore': '🦷',
    'dionaea': '🪤',
    'sarracenia': '🏺',
    'drosera': '💧',
    'piège': '🪤',
    'insecte': '🦟',
    'mouche': '🪰',
    'eau': '💧',
    'soleil': '☀️',
    'lumière': '💡',
    'nouveau': '✨',
    'belle': '😍',
    'magnifique': '🤩',
    'incroyable': '😮',
    'conseil': '💡',
    'astuce': '💡',
    'question': '❓',
    'merci': '🙏',
    'super': '🔥',
    'génial': '🔥'
  };
  
  let emojiCount = 0;
  for (const [word, emoji] of Object.entries(emojiMap)) {
    const regex = new RegExp(`\\b${word}s?\\b`, 'gi');
    if (text.match(regex) && !text.includes(emoji) && emojiCount < 3) {
      text = text.replace(regex, match => match + ' ' + emoji);
      emojiCount++;
    }
  }
  
  contentField.value = text;
  appState.currentText = text;
  updateAllPreviews();
  updateRealTimeInsights();
  
  showMessage(`😊 ${emojiCount} emoji(s) ajouté(s) !`, 'success');
}

function makeEngaging() {
  const contentField = document.getElementById('post-content');
  let text = contentField.value.trim();
  
  if (!text) {
    showMessage("Écris d'abord du contenu !", 'warning');
    return;
  }
  
  setButtonProcessing('makeEngaging', true);
  showMessage("🧠 Analyse IA en cours pour optimiser l'engagement...", 'info');
  
  setTimeout(() => {
    const analysis = window.advancedAI.analyzeContent(text);
    let improved = text;
    const improvements = [];
    let addedPoints = 0;
    
    // 1. Ajouter salutation si manquante (+10 points)
    if (!analysis.structure.hasGreeting) {
      const greetings = ['Salut les passionnés ! 🌱', 'Hello la communauté ! 👋', 'Coucou les amoureux des carnivores ! 💚'];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      improved = `${greeting}\n\n${improved}`;
      improvements.push('Salutation chaleureuse ajoutée');
      addedPoints += 10;
    }
    
    // 2. Ajouter question engageante si manquante (+15 points)
    if (!analysis.structure.hasQuestion) {
      let question;
      if (analysis.plants.length > 0) {
        const species = analysis.plants[0].species;
        const plantQuestions = [
          `Et toi, tu cultives aussi des ${species} ?`,
          `Quelle est ton expérience avec les ${species} ?`,
          `As-tu des conseils pour les ${species} ?`,
          `Tu connais d'autres variétés de ${species} ?`
        ];
        question = plantQuestions[Math.floor(Math.random() * plantQuestions.length)];
      } else {
        const generalQuestions = [
          'Et toi, quelle est ta carnivore préférée ?',
          'Tu as déjà eu ce genre d\'expérience ?',
          'Qu\'en penses-tu ?',
          'Raconte-moi ton expérience en commentaire !'
        ];
        question = generalQuestions[Math.floor(Math.random() * generalQuestions.length)];
      }
      improved = `${improved}\n\n${question}`;
      improvements.push('Question d\'engagement ajoutée');
      addedPoints += 15;
    }
    
    // 3. Ajouter appel à l'action si manquant (+20 points)
    if (!analysis.structure.hasCallToAction) {
      const ctas = [
        '👇 Dis-moi en commentaire ce que tu en penses !',
        '💬 Partage ton expérience dans les commentaires !',
        '🔄 Partage si ça t\'a plu !',
        '⭐ Tag un ami passionné de plantes !',
        '❤️ Réagis si tu as aimé cette découverte !'
      ];
      const cta = ctas[Math.floor(Math.random() * ctas.length)];
      improved = `${improved}\n\n${cta}`;
      improvements.push('Appel à l\'action puissant ajouté');
      addedPoints += 20;
    }
    
    // 4. Optimiser les emojis (+10 points)
    if (!analysis.structure.hasEmojis || analysis.sentiment === 'neutral') {
      // Ajouter emojis contextuels selon les plantes détectées
      analysis.plants.forEach(plant => {
        const plantEmojis = {
          dionaea: '🪤',
          sarracenia: '🏺', 
          drosera: '💧',
          nepenthes: '🌿',
          pinguicula: '🌸'
        };
        
        const emoji = plantEmojis[plant.species];
        if (emoji && !improved.includes(emoji)) {
          improved = improved.replace(
            new RegExp(plant.variation, 'i'), 
            `${plant.variation} ${emoji}`
          );
        }
      });
      
      // Ajouter emojis d'émotion si contenu positif
      if (analysis.sentiment === 'positive' && !improved.match(/^[🔥😍🤩✨]/)) {
        if (improved.toLowerCase().includes('incroyable') || improved.toLowerCase().includes('magnifique')) {
          improved = '🤩 ' + improved;
        } else {
          improved = '✨ ' + improved;
        }
      }
      
      improvements.push('Emojis contextuels optimisés');
      addedPoints += 10;
    }
    
    // 5. Optimiser hashtags automatiquement (+10 points)
    const currentHashtags = appState.currentHashtags;
    const hashtagCount = currentHashtags.split(' ').filter(h => h.trim().startsWith('#')).length;
    
    if (hashtagCount < 5) {
      const suggestions = window.advancedAI.suggestSmartHashtags(improved, currentHashtags);
      const neededHashtags = suggestions.slice(0, 5 - hashtagCount);
      
      if (neededHashtags.length > 0) {
        const hashtagsField = document.getElementById('custom-hashtags');
        const newHashtags = currentHashtags + ' ' + neededHashtags.join(' ');
        hashtagsField.value = newHashtags.trim();
        appState.currentHashtags = newHashtags.trim();
        improvements.push(`${neededHashtags.length} hashtags stratégiques ajoutés`);
        addedPoints += 10;
      }
    }
    
    // 6. Optimiser la longueur (+5 points)
    if (improved.length < 100) {
      if (analysis.plants.length > 0) {
        improved += `\n\nCette plante me fascine toujours autant ! 🌱`;
      } else {
        improved += `\n\nJ'adore partager ces découvertes avec vous ! 💚`;
      }
      improvements.push('Longueur optimisée');
      addedPoints += 5;
    }
    
    // Appliquer les améliorations
    contentField.value = improved;
    appState.currentText = improved;
    updateCharCounter();
    updateEngagementScore();
    updateAllPreviews();
    updateRealTimeInsights();
    
    setButtonProcessing('makeEngaging', false);
    
    const newScore = appState.engagementScore;
    showMessage(`🔥 +${addedPoints} points ! Score : ${newScore}% | ${improvements.join(', ')}`, 'success');
    
    // Si proche de 100%, encourager
    if (newScore >= 90) {
      setTimeout(() => {
        showMessage('🎉 Excellent ! Ton contenu est maintenant ultra-engageant !', 'success');
      }, 2000);
    }
  }, 1500);
}

function fixGrammar() {
  const contentField = document.getElementById('post-content');
  let text = contentField.value;
  
  if (!text.trim()) {
    showMessage("Aucun texte à corriger !", 'warning');
    return;
  }
  
  setButtonProcessing('fixGrammar', true);
  showMessage("🤖 Correction grammaticale intelligente en cours...", 'info');
  
  setTimeout(() => {
    let corrected = text;
    const corrections = [];
    
    // 1. CORRECTIONS D'ESPACES ET PONCTUATION
    const spaceCorrections = [
      // Espaces multiples
      [/\s{2,}/g, ' ', 'Espaces multiples normalisés'],
      
      // Espaces avant ponctuation
      [/\s+([,.!?;:])/g, '$1', 'Espaces avant ponctuation supprimés'],
      
      // Espaces après ponctuation
      [/([.!?])\s*([A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ])/g, '$1 $2', 'Espaces après ponctuation ajustés'],
      
      // Points de suspension
      [/\.{2,}/g, '...', 'Points de suspension corrigés'],
      
      // Espaces en début/fin
      [/^\s+|\s+$/g, '', 'Espaces début/fin supprimés']
    ];
    
    spaceCorrections.forEach(([regex, replacement, description]) => {
      if (regex.test(corrected)) {
        corrected = corrected.replace(regex, replacement);
        corrections.push(description);
      }
    });
    
    // 2. CORRECTIONS TYPOGRAPHIQUES FRANÇAISES
    const typographyCorrections = [
      // Apostrophes droites → courbes
      [/'/g, "'", 'Apostrophes typographiques'],
      
      // Guillemets
      [/"([^"]+)"/g, '« $1 »', 'Guillemets français'],
      
      // Espaces insécables avant ! ? : ;
      [/\s+([!?:;])/g, ' $1', 'Espaces insécables'],
      
      // Majuscules après points
      [/([.!?])\s+([a-zàâäéèêëïîôöùûüÿç])/g, (match, punct, letter) => {
        return `${punct} ${letter.toUpperCase()}`;
      }, 'Majuscules après ponctuation']
    ];
    
    typographyCorrections.forEach(([regex, replacement, description]) => {
      const before = corrected;
      corrected = corrected.replace(regex, replacement);
      if (before !== corrected) {
        corrections.push(description);
      }
    });
    
    // 3. CORRECTIONS GRAMMATICALES COURANTES
    const grammarCorrections = [
      // À/A
      [/\ba\s+(partir|cause|côté|travers|propos|partir)\b/gi, 'à $1', 'À/A corrigé'],
      [/\bà\s+(avoir|faire|dire|aller|voir)\b/gi, 'a $1', 'À/A corrigé'],
      
      // Ça/Ca
      [/\bca\b/g, 'ça', 'Ça corrigé'],
      
      // Et/Est
      [/\best\s+est\b/gi, 'et est', 'Et/Est corrigé'],
      
      // Ces/Ses/C'est/S'est
      [/\bc'est\s+(mes|tes|ses|nos|vos|leurs)\b/gi, 'ce sont $1', 'C\'est/Ce sont'],
      [/\bsait\s+(que|comment|pourquoi|où|quand)\b/gi, 'sais $1', 'Sait/Sais corrigé'],
      
      // Leur/Leurs
      [/\bleur\s+([a-zàâäéèêëïîôöùûüÿç]+s)\b/gi, 'leurs $1', 'Leur/Leurs corrigé'],
      
      // Tout/Tous
      [/\btout\s+les\b/gi, 'tous les', 'Tout/Tous corrigé'],
      
      // Ou/Où
      [/\bou\s+(est|sont|se trouve|se trouvent)\b/gi, 'où $1', 'Ou/Où corrigé'],
      
      // Accord des participes passés courants
      [/\b(j'ai|tu as|il a|elle a|on a)\s+(mangé|regardé|acheté|trouvé|aimé)s\b/gi, '$1 $2', 'Participe passé avec avoir'],
      
      // Pluriels oubliés
      [/\bdes\s+([a-zàâäéèêëïîôöùûüÿç]+[^s])\b/gi, (match, word) => {
        // Exceptions : mots déjà au pluriel, invariables
        const invariables = ['eau', 'feu', 'lieu', 'bleu', 'pneu', 'jeu'];
        if (invariables.includes(word)) return match;
        return `des ${word}s`;
      }, 'Pluriels après "des"']
    ];
    
    grammarCorrections.forEach(([regex, replacement, description]) => {
      const before = corrected;
      corrected = corrected.replace(regex, replacement);
      if (before !== corrected) {
        corrections.push(description);
      }
    });
    
    // 4. CORRECTIONS SPÉCIFIQUES PLANTES CARNIVORES
    const plantCorrections = [
      // Noms d'espèces
      [/\bdionaea\s+muscipula\b/gi, 'Dionaea muscipula', 'Nom d\'espèce en italique'],
      [/\bsarracenia\s+([a-z]+)/gi, 'Sarracenia $1', 'Genre Sarracenia'],
      [/\bdrosera\s+([a-z]+)/gi, 'Drosera $1', 'Genre Drosera'],
      [/\bnepenthes\s+([a-z]+)/gi, 'Nepenthes $1', 'Genre Nepenthes'],
      [/\bpinguicula\s+([a-z]+)/gi, 'Pinguicula $1', 'Genre Pinguicula'],
      
      // Termes techniques
      [/\bvénus\s+flytrap\b/gi, 'Venus flytrap', 'Nom commun anglais'],
      [/\battrap[e]?[\s-]?mouche/gi, 'attrape-mouche', 'Orthographe française'],
      [/\bpitcher[\s-]?plant/gi, 'pitcher plant', 'Terme anglais'],
      
      // Fautes courantes
      [/\bcarnivoor/gi, 'carnivore', 'Orthographe carnivore'],
      [/\binsektivoor/gi, 'insectivore', 'Orthographe insectivore']
    ];
    
    plantCorrections.forEach(([regex, replacement, description]) => {
      const before = corrected;
      corrected = corrected.replace(regex, replacement);
      if (before !== corrected) {
        corrections.push(description);
      }
    });
    
    // 5. CORRECTIONS DE STYLE ET LISIBILITÉ
    const styleCorrections = [
      // Répétitions de mots
      [/\b(\w+)\s+\1\b/gi, '$1', 'Répétitions supprimées'],
      
      // Abréviations réseaux sociaux
      [/\btt\b/gi, 'tout', 'Abréviation développée'],
      [/\bqqun\b/gi, 'quelqu\'un', 'Abréviation développée'],
      [/\bqq\b/gi, 'quelque', 'Abréviation développée'],
      [/\btjs\b/gi, 'toujours', 'Abréviation développée'],
      [/\bslt\b/gi, 'salut', 'Abréviation développée'],
      [/\bbjr\b/gi, 'bonjour', 'Abréviation développée'],
      
      // Émoticons texte → emojis
      [/:\)/g, '😊', 'Émoticône convertie'],
      [/:\(/g, '😞', 'Émoticône convertie'],
      [/:D/g, '😄', 'Émoticône convertie'],
      [/;\)/g, '😉', 'Émoticône convertie'],
      
      // Langage SMS
      [/\bC\b/gi, 'c\'est', 'Langage SMS corrigé'],
      [/\bG\b/gi, 'j\'ai', 'Langage SMS corrigé'],
      [/\bK\b/gi, 'que', 'Langage SMS corrigé']
    ];
    
    styleCorrections.forEach(([regex, replacement, description]) => {
      const before = corrected;
      corrected = corrected.replace(regex, replacement);
      if (before !== corrected) {
        corrections.push(description);
      }
    });
    
    // 6. MAJUSCULE EN DÉBUT DE TEXTE
    if (corrected.length > 0) {
      const firstChar = corrected.charAt(0);
      if (firstChar !== firstChar.toUpperCase()) {
        corrected = firstChar.toUpperCase() + corrected.slice(1);
        corrections.push('Majuscule initiale ajoutée');
      }
    }
    
    // APPLICATION DES CORRECTIONS
    contentField.value = corrected;
    appState.currentText = corrected;
    updateAllPreviews();
    updateRealTimeInsights();
    
    setButtonProcessing('fixGrammar', false);
    
    if (corrections.length > 0) {
      const uniqueCorrections = [...new Set(corrections)];
      showMessage(`✅ ${uniqueCorrections.length} correction(s) appliquée(s) !`, 'success');
      
      // Détail des corrections en console pour debug
      // Corrections appliquées
    } else {
      showMessage('✅ Aucune correction nécessaire ! Ton texte est déjà parfait.', 'info');
    }
  }, 1000);
}

function smartEmojisPlacement() {
  const contentField = document.getElementById('post-content');
  let text = contentField.value;
  
  if (!text.trim()) {
    showMessage("Écris d'abord du contenu !", 'warning');
    return;
  }
  
  setButtonProcessing('smartEmojisPlacement', true);
  showMessage("🤖 Analyse intelligente des emojis en cours...", 'info');
  
  setTimeout(() => {
    const analysis = window.advancedAI.analyzeContent(text);
    let improved = text;
    const addedEmojis = [];
    
    // 1. EMOJIS SPÉCIFIQUES AUX PLANTES CARNIVORES
    const plantEmojiMap = {
      // Dionaea et variantes
      'dionaea': '🪤', 'venus flytrap': '🪤', 'attrape-mouche': '🪤', 'muscipula': '🪤',
      
      // Sarracenia
      'sarracenia': '🏺', 'pitcher plant': '🏺', 'trompette': '🏺', 'trumpet': '🏺',
      
      // Drosera
      'drosera': '💧', 'sundew': '💧', 'rossolis': '💧', 'gouttelettes': '💧',
      
      // Nepenthes
      'nepenthes': '🌿', 'tropical': '🌿',
      
      // Pinguicula
      'pinguicula': '🌸', 'butterwort': '🌸', 'grassette': '🌸',
      
      // Autres carnivores
      'cephalotus': '🫖', 'heliamphora': '🏔️', 'utricularia': '🔬',
      
      // Termes généraux
      'carnivore': '🦷', 'piège': '🪤', 'proie': '🦟', 'insecte': '🐛', 'mouche': '🪰'
    };
    
    // 2. EMOJIS CONTEXTUELS POUR PLANTES
    const plantContextMap = {
      'racine': '🌱', 'feuille': '🍃', 'fleur': '🌺', 'tige': '🌿',
      'croissance': '📈', 'pousse': '🌱', 'bourgeon': '🌱',
      'eau': '💧', 'arrosage': '💧', 'humidité': '💧',
      'soleil': '☀️', 'lumière': '💡', 'éclairage': '💡',
      'substrat': '🪨', 'terre': '🪨', 'tourbe': '🪨', 'sphaigne': '🌿',
      'pot': '🪴', 'rempotage': '🪴', 'plantation': '🪴'
    };
    
    // 3. EMOJIS ÉMOTIONNELS ET D'ENGAGEMENT
    const emotionMap = {
      'magnifique': '🤩', 'superbe': '🤩', 'sublime': '🤩', 'splendide': '🤩',
      'incroyable': '😍', 'fantastique': '😍', 'merveilleux': '😍',
      'génial': '🔥', 'super': '🔥', 'top': '🔥', 'parfait': '🔥',
      'nouveau': '✨', 'nouvelle': '✨', 'découverte': '✨', 'acquisition': '✨',
      'collection': '📚', 'collectionneur': '📚', 'passion': '❤️', 'passionné': '❤️',
      'conseil': '💡', 'astuce': '💡', 'tips': '💡', 'aide': '💡',
      'problème': '😰', 'souci': '😰', 'difficile': '😰', 'aide': '🆘',
      'merci': '🙏', 'thanks': '🙏', 'reconnaissance': '🙏'
    };
    
    // 4. EMOJIS SAISONNIERS ET TEMPORELS
    const now = new Date();
    const month = now.getMonth();
    const seasonalMap = {
      'printemps': month >= 2 && month <= 4 ? '🌸' : '🌱',
      'été': month >= 5 && month <= 7 ? '☀️' : '🌿',
      'automne': month >= 8 && month <= 10 ? '🍂' : '🌿',
      'hiver': month >= 11 || month <= 1 ? '❄️' : '🌿',
      'dormance': '😴', 'repos': '😴'
    };
    
    // 5. EMOJIS D'INTERACTION SOCIALE
    const socialMap = {
      'partage': '🔄', 'partagez': '🔄', 'share': '🔄',
      'commentaire': '💬', 'comment': '💬', 'avis': '💬',
      'question': '❓', 'pourquoi': '❓', 'comment': '❓',
      'expérience': '🎯', 'vécu': '🎯', 'retour': '🎯',
      'communauté': '👥', 'groupe': '👥', 'ensemble': '👥',
      'ami': '👨‍👩‍👧‍👦', 'amis': '👨‍👩‍👧‍👦', 'famille': '👨‍👩‍👧‍👦'
    };
    
    // FONCTION D'APPLICATION INTELLIGENTE DES EMOJIS
    function applyEmojiMap(text, emojiMap, category) {
      let modifiedText = text;
      const textLower = text.toLowerCase();
      
      Object.entries(emojiMap).forEach(([word, emoji]) => {
        // Recherche le mot exact (avec limites de mots)
        const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`, 'gi');
        const matches = textLower.match(regex);
        
        if (matches && !modifiedText.includes(emoji)) {
          // Ajoute l'emoji après la première occurrence du mot
          modifiedText = modifiedText.replace(regex, (match) => {
            addedEmojis.push(`${match} → ${emoji} (${category})`);
            return `${match} ${emoji}`;
          });
          
          // Une seule occurrence par emoji pour éviter la surcharge
          return false;
        }
      });
      
      return modifiedText;
    }
    
    // APPLICATION PROGRESSIVE DES EMOJIS
    
    // 1. Plantes carnivores spécifiques (priorité haute)
    improved = applyEmojiMap(improved, plantEmojiMap, 'Plante');
    
    // 2. Contexte jardinage (priorité moyenne)
    improved = applyEmojiMap(improved, plantContextMap, 'Culture');
    
    // 3. Émotions et engagement (priorité haute)
    improved = applyEmojiMap(improved, emotionMap, 'Émotion');
    
    // 4. Saisonnier (priorité basse)
    improved = applyEmojiMap(improved, seasonalMap, 'Saison');
    
    // 5. Social et interaction (priorité moyenne)
    improved = applyEmojiMap(improved, socialMap, 'Social');
    
    // 6. OPTIMISATION SELON L'ANALYSE IA
    
    // Ajouter emoji d'ouverture selon sentiment
    if (analysis.sentiment === 'positive' && !improved.match(/^[🔥😍🤩✨🌱]/)) {
      if (improved.toLowerCase().includes('incroyable') || improved.toLowerCase().includes('magnifique')) {
        improved = '🤩 ' + improved;
        addedEmojis.push('🤩 (Ouverture enthousiaste)');
      } else if (improved.toLowerCase().includes('nouveau') || improved.toLowerCase().includes('découverte')) {
        improved = '✨ ' + improved;
        addedEmojis.push('✨ (Ouverture découverte)');
      } else {
        improved = '🌱 ' + improved;
        addedEmojis.push('🌱 (Ouverture thématique)');
      }
    }
    
    // Ajouter emoji de question si question présente
    if (analysis.structure.hasQuestion && !improved.match(/[🤔❓]/)) {
      improved = improved.replace(/\?/g, ' ? 🤔');
      addedEmojis.push('🤔 (Question engageante)');
    }
    
    // Ajouter emoji de call-to-action
    if (analysis.structure.hasCallToAction) {
      if (improved.toLowerCase().includes('commentaire') && !improved.includes('💬')) {
        improved = improved.replace(/commentaire/gi, 'commentaire 💬');
        addedEmojis.push('💬 (Call-to-action)');
      }
      if (improved.toLowerCase().includes('partage') && !improved.includes('🔄')) {
        improved = improved.replace(/partage/gi, 'partage 🔄');
        addedEmojis.push('🔄 (Call-to-action)');
      }
    }
    
    // APPLICATION ET FEEDBACK
    contentField.value = improved;
    appState.currentText = improved;
    updateAllPreviews();
    updateRealTimeInsights();
    
    setButtonProcessing('smartEmojisPlacement', false);
    
    if (addedEmojis.length > 0) {
      showMessage(`😊 ${addedEmojis.length} emoji(s) intelligents ajoutés !`, 'success');
      
      // Affichage détaillé optionnel
      setTimeout(() => {
        // Emojis ajoutés
      }, 500);
    } else {
      showMessage('✅ Ton contenu a déjà des emojis optimaux !', 'info');
    }
  }, 1500);
}

// ===============================
// HASHTAGS INTELLIGENTS
// ===============================
function toggleHashtag(hashtag) {
  const hashtagsField = document.getElementById('custom-hashtags');
  if (!hashtagsField) return;
  
  const currentHashtags = hashtagsField.value;
  const hashtagSpan = document.querySelector(`[onclick*="toggleHashtag('${hashtag}')"], [onclick*='toggleHashtag("${hashtag}")']`);
  
  if (currentHashtags.includes(hashtag)) {
    const newHashtags = currentHashtags
      .split(' ')
      .filter(tag => tag.trim() !== hashtag)
      .join(' ')
      .trim();
    
    hashtagsField.value = newHashtags;
    appState.currentHashtags = newHashtags;
    
    if (hashtagSpan) {
      hashtagSpan.classList.remove('selected');
      hashtagSpan.innerHTML = hashtag;
    }
    
    showMessage(`${hashtag} retiré`, 'info');
  } else {
    const newHashtags = currentHashtags.trim() + (currentHashtags.trim() ? ' ' : '') + hashtag;
    hashtagsField.value = newHashtags;
    appState.currentHashtags = newHashtags;
    
    if (hashtagSpan) {
      hashtagSpan.classList.add('selected');
      hashtagSpan.innerHTML = `✓ ${hashtag}`;
    }
    
    showMessage(`${hashtag} ajouté`, 'success');
  }
  
  updateAllPreviews();
  autoSave();
  
  if (hashtagSpan) {
    hashtagSpan.style.transform = 'scale(1.1)';
    setTimeout(() => {
      hashtagSpan.style.transform = 'scale(1)';
    }, 200);
  }
}

/**
 * Extraction avancée de hashtags avec suggestions contextuelles
 */
async function extractHashtagsAdvanced(text) {
    const hashtags = new Set();
    
    // 1. Hashtags explicites dans le texte
    const explicit = text.match(/#\w+/g) || [];
    explicit.forEach(h => hashtags.add(h.toLowerCase()));
    
    // 2. Suggestions basées sur le contenu (analyse IA)
    const contentHashtags = suggestHashtagsFromContent(text);
    contentHashtags.forEach(h => hashtags.add(h.toLowerCase()));
    
    // 3. Hashtags populaires depuis l'API (si disponible)
    try {
        const popular = await getPopularHashtags();
        popular.slice(0, 3).forEach(h => hashtags.add(h.toLowerCase()));
    } catch (error) {
        // Impossible de charger hashtags populaires (silencieux)
    }
    
    // 4. Hashtags par défaut
    const defaults = ['#PlantesCarnivoRes', '#LesGloutonnes'];
    defaults.forEach(h => hashtags.add(h.toLowerCase()));
    
    // Retourner array limité à 15
    return Array.from(hashtags).slice(0, 15);
}

/**
 * Suggestions de hashtags basées sur le contenu
 */
function suggestHashtagsFromContent(text) {
    const suggestions = [];
    const lowerText = text.toLowerCase();
    
    // Mots-clés à détecter avec leurs hashtags associés
    const keywords = {
        'plante': ['#PlantesCarnivoRes', '#CarnivorousPlants'],
        'carnivore': ['#PlantesCarnivoRes', '#CarnivorousPlants'],
        'dionaea': ['#Dionaea', '#VenusFlyTrap', '#DionaeaMuscipula'],
        'venus': ['#VenusFlyTrap', '#Dionaea'],
        'sarra': ['#Sarracenia', '#PitcherPlant'],
        'sarracenia': ['#Sarracenia', '#PitcherPlant'],
        'drosera': ['#Drosera', '#Sundew', '#Rossolis'],
        'nepenthes': ['#Nepenthes', '#TropicalPitcher'],
        'pinguicula': ['#Pinguicula', '#Butterwort'],
        'atelier': ['#Atelier', '#Workshop'],
        'conseil': ['#Conseil', '#Tips', '#Astuce'],
        'astuce': ['#Astuce', '#Tips', '#Conseil'],
        'nouveauté': ['#Nouveauté', '#Nouveau', '#Collection'],
        'nouveau': ['#Nouveau', '#Nouveauté'],
        'bourse': ['#BoursePlantes', '#PlantMarket'],
        'marché': ['#Marché', '#Market'],
        'question': ['#Question', '#Communauté'],
        'communauté': ['#Communauté', '#Community'],
        'belle': ['#Beautiful', '#Stunning'],
        'magnifique': ['#Magnifique', '#Beautiful'],
        'conseil': ['#Conseil', '#Tips'],
        'culture': ['#Culture', '#Growing'],
        'soin': ['#Soin', '#Care'],
        'eau': ['#Water', '#Eau'],
        'lumière': ['#Light', '#Lumière']
    };
    
    Object.entries(keywords).forEach(([keyword, tags]) => {
        if (lowerText.includes(keyword)) {
            tags.forEach(tag => suggestions.push(tag));
        }
    });
    
    // Détection saisonnière
    const now = new Date();
    const month = now.getMonth();
    if (month >= 2 && month <= 4) suggestions.push('#Spring', '#Printemps');
    if (month >= 5 && month <= 7) suggestions.push('#Summer', '#Été');
    if (month >= 8 && month <= 10) suggestions.push('#Autumn', '#Automne');
    if (month >= 11 || month <= 1) suggestions.push('#Winter', '#Hiver');
    
    // Détection de sentiment
    if (lowerText.includes('wow') || lowerText.includes('incroyable') || lowerText.includes('magnifique')) {
        suggestions.push('#Amazing', '#Stunning', '#Beautiful');
    }
    
    if (lowerText.includes('conseil') || lowerText.includes('astuce') || lowerText.includes('tip')) {
        suggestions.push('#Tips', '#Advice', '#Conseil');
    }
    
    return suggestions;
}

/**
 * Récupérer les hashtags populaires depuis l'API
 */
async function getPopularHashtags() {
    try {
        const response = await fetchWithRetry(
            '../api/social-api.php?action=get_hashtag_stats&key=gloutonnes2025&limit=10&order_by=usage_count'
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
            return result.data.map(h => h.hashtag || h.hashtag_name || h.tag);
        }
        return [];
    } catch (error) {
        // Erreur chargement hashtags populaires (silencieux)
        return [];
    }
}

/**
 * Auto-détection améliorée avec extraction avancée
 */
async function autoDetectHashtags() {
  const text = appState.currentText;
  const detectionDiv = document.getElementById('auto-detection');
  
  if (!detectionDiv) return;
  
  if (!text.trim()) {
    detectionDiv.innerHTML = '<p>🤖 L\'IA analysera ton texte et proposera des hashtags pertinents automatiquement</p>';
    return;
  }
  
  // Utiliser l'extraction avancée
  const suggestions = await extractHashtagsAdvanced(text);
  
  // Filtrer ceux déjà présents
  const currentHashtagsLower = appState.currentHashtags.toLowerCase();
  const uniqueSuggestions = suggestions.filter(tag => 
    !currentHashtagsLower.includes(tag.toLowerCase())
  );
  
  if (uniqueSuggestions.length > 0) {
    detectionDiv.innerHTML = `
      <p>🤖 <strong>Hashtags suggérés (${uniqueSuggestions.length}) :</strong></p>
      <div class="suggested-hashtags" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
        ${uniqueSuggestions.slice(0, 10).map(tag => 
          `<span class="suggested-hashtag" onclick="toggleHashtag('${tag}')">${tag}</span>`
        ).join('')}
      </div>
    `;
  } else {
    detectionDiv.innerHTML = '<p>✅ Parfait ! Tu as déjà tous les hashtags recommandés pour ce contenu.</p>';
  }
}

// ===============================
// SCORES ET MÉTRIQUES
// ===============================
function updateCharCounter() {
  const counter = document.getElementById('char-counter');
  if (!counter) return;
  
  const length = appState.currentText.length;
  counter.textContent = `${length} / ${CONFIG.maxChars} caractères`;
  
  if (length > CONFIG.maxChars) {
    counter.style.color = '#dc3545';
  } else if (length > CONFIG.maxChars * 0.9) {
    counter.style.color = '#ffc107';
  } else {
    counter.style.color = '#666';
  }
}

function updateEngagementScore() {
  const text = appState.currentText.toLowerCase();
  let score = 0;
  let reasons = [];
  
  if (text.length >= 50 && text.length <= 300) {
    score += 20;
    reasons.push('✅ Longueur optimale');
  }
  
  if (text.includes('?')) {
    score += 15;
    reasons.push('✅ Contient une question');
  }
  
  if (/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/u.test(text)) {
    score += 10;
    reasons.push('✅ Contient des emojis');
  }
  
  if (text.includes('salut') || text.includes('hello') || text.includes('bonjour')) {
    score += 10;
    reasons.push('✅ Salutation personnelle');
  }
  
  if (text.includes('vous') || text.includes('votre') || text.includes('vos')) {
    score += 15;
    reasons.push('✅ S\'adresse directement');
  }
  
  if (text.includes('commentaire') || text.includes('partage') || text.includes('tag')) {
    score += 20;
    reasons.push('✅ Call-to-action présent');
  }
  
  if (appState.currentHashtags.split(' ').filter(h => h.trim().startsWith('#')).length >= 3) {
    score += 10;
    reasons.push('✅ Hashtags suffisants');
  }
  
  appState.engagementScore = Math.min(100, score);
  
  const scoreElement = document.getElementById('engagement-score');
  if (scoreElement) {
    const scoreSpan = scoreElement.querySelector('span');
    if (scoreSpan) {
      let scoreText, scoreColor;
      if (score >= 80) {
        scoreText = `${score}% - Excellent ! 🔥`;
        scoreColor = '#28a745';
      } else if (score >= 60) {
        scoreText = `${score}% - Très bien 👍`;
        scoreColor = '#ffc107';
      } else if (score >= 40) {
        scoreText = `${score}% - Correct 📊`;
        scoreColor = '#17a2b8';
      } else {
        scoreText = `${score}% - À améliorer 💪`;
        scoreColor = '#dc3545';
      }
      
      scoreSpan.textContent = scoreText;
      scoreSpan.style.color = scoreColor;
      scoreSpan.title = reasons.join('\n');
    }
  }
}

function updatePredictedMetrics() {
  const engagementEl = document.getElementById('predicted-engagement');
  const reachEl = document.getElementById('predicted-reach');
  
  if (!engagementEl || !reachEl) return;
  
  const text = appState.currentText.trim();
  const hashtagCount = appState.currentHashtags.split(' ').filter(h => h.trim().startsWith('#')).length;
  
  if (!text) {
    engagementEl.textContent = 'Aucun contenu';
    reachEl.textContent = '0-50';
    return;
  }
  
  // Analyse IA du contenu
  const analysis = window.advancedAI.analyzeContent(text);
  
  // Calcul du score d'engagement avancé
  let engagementScore = 0;
  let reachMultiplier = 1;
  
  // Facteurs d'engagement
  if (analysis.structure.hasGreeting) engagementScore += 15;
  if (analysis.structure.hasQuestion) engagementScore += 20;
  if (analysis.structure.hasCallToAction) engagementScore += 25;
  if (analysis.structure.hasEmojis) engagementScore += 10;
  
  // Sentiment et ton
  if (analysis.sentiment === 'positive') engagementScore += 15;
  if (analysis.tone === 'excited') engagementScore += 10;
  if (analysis.tone === 'friendly') engagementScore += 8;
  
  // Plantes mentionnées (niche spécialisée = plus d'engagement)
  if (analysis.plants.length > 0) {
    engagementScore += 15;
    reachMultiplier += 0.3;
  }
  
  // Longueur optimale
  const length = text.length;
  if (length >= 150 && length <= 300) {
    engagementScore += 10;
  } else if (length < 100) {
    engagementScore -= 5;
  }
  
  // Hashtags
  if (hashtagCount >= 5) {
    engagementScore += 10;
    reachMultiplier += 0.4;
  } else if (hashtagCount >= 3) {
    engagementScore += 5;
    reachMultiplier += 0.2;
  }
  
  // Timing actuel
  const now = new Date();
  const hour = now.getHours();
  if ((hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21)) {
    engagementScore += 5;
    reachMultiplier += 0.2;
  }
  
  // Calcul final
  const finalScore = Math.min(100, Math.max(0, engagementScore));
  
  // Prédiction d'engagement
  let engagementLevel, engagementEmoji, engagementColor;
  if (finalScore >= 80) {
    engagementLevel = 'Excellent';
    engagementEmoji = '🔥';
    engagementColor = '#28a745';
  } else if (finalScore >= 65) {
    engagementLevel = 'Très bon';
    engagementEmoji = '👍';
    engagementColor = '#28a745';
  } else if (finalScore >= 50) {
    engagementLevel = 'Bon';
    engagementEmoji = '📈';
    engagementColor = '#ffc107';
  } else if (finalScore >= 35) {
    engagementLevel = 'Moyen';
    engagementEmoji = '📊';
    engagementColor = '#ffc107';
  } else {
    engagementLevel = 'Faible';
    engagementEmoji = '💪';
    engagementColor = '#dc3545';
  }
  
  // Calcul de la portée
  let baseReach = 200;
  const finalReach = Math.round(baseReach * reachMultiplier);
  const reachRange = `${Math.round(finalReach * 0.8)}-${Math.round(finalReach * 1.4)}`;
  
  // Mise à jour de l'affichage
  engagementEl.innerHTML = `${engagementLevel} ${engagementEmoji}`;
  engagementEl.style.color = engagementColor;
  engagementEl.title = `Score calculé: ${finalScore}%`;
  
  reachEl.textContent = reachRange;
  reachEl.style.color = finalScore >= 65 ? '#28a745' : finalScore >= 45 ? '#ffc107' : '#dc3545';
  
  // Ajout d'indicateurs visuels supplémentaires avec classes existantes
  updatePerformanceIndicators(finalScore, analysis, hashtagCount);
}

function updatePerformanceIndicators(score, analysis, hashtagCount) {
  const performanceContainer = document.querySelector('.performance-predictor');
  if (!performanceContainer) return;
  
  // Chercher ou créer la section des indicateurs détaillés
  let detailsSection = performanceContainer.querySelector('.ai-contextual-tips');
  if (!detailsSection) {
    detailsSection = document.createElement('div');
    detailsSection.className = 'ai-contextual-tips'; // Utilise classe existante
    detailsSection.style.marginTop = '1rem';
    performanceContainer.appendChild(detailsSection);
  }
  
  // Facteurs de performance
  const factors = [];
  if (analysis.structure.hasQuestion) factors.push('Question engageante ✅');
  if (analysis.structure.hasCallToAction) factors.push('Call-to-action ✅');
  if (analysis.plants.length > 0) factors.push(`${analysis.plants.length} plante(s) détectée(s) 🌱`);
  if (hashtagCount >= 5) factors.push(`${hashtagCount} hashtags ✅`);
  if (analysis.sentiment === 'positive') factors.push('Sentiment positif 😊');
  
  detailsSection.innerHTML = `
    <h5>📊 Prédictions IA détaillées</h5>
    
    ${factors.length > 0 ? `
      <div id="ai-tips-content">
        <div style="margin-bottom: 0.5rem; font-weight: 600; color: #5b0092;">✨ Facteurs positifs détectés :</div>
        ${factors.map(factor => `<div>${factor}</div>`).join('')}
      </div>
    ` : ''}
    
    <div class="ai-insights" style="margin-top: 1rem;">
      <div class="insight-item">
        <span class="insight-label">🎯 Score d'optimisation :</span>
        <span class="insight-value" style="background: ${getScoreColor(score)}; color: white; font-weight: 600;">${score}%</span>
      </div>
    </div>
  `;
}

function getScoreColor(score) {
  if (score >= 80) return '#28a745';
  if (score >= 65) return '#28a745';
  if (score >= 45) return '#ffc107';
  return '#dc3545';
}

// ===============================
// APERÇUS
// ===============================
function updateAllPreviews() {
  updateFacebookPreview();
  updateInstagramPreview();
  updatePredictedMetrics();
  updateOptimalTiming();
  updateHashtagVisualState();
}

function updateFacebookPreview() {
  const preview = document.getElementById('facebook-preview');
  const hashtags = document.getElementById('facebook-hashtags');
  
  if (preview) {
    const content = appState.currentText || 'Ton contenu apparaîtra ici...';
    preview.textContent = content;
  }
  
  if (hashtags) {
    const tags = appState.currentHashtags || '#PlantesCarnivoRes #LesGloutonnes';
    hashtags.textContent = tags;
  }
}

function updateInstagramPreview() {
  const preview = document.getElementById('instagram-preview');
  const hashtags = document.getElementById('instagram-hashtags');
  
  if (preview) {
    const content = appState.currentText || 'Ton contenu apparaîtra ici...';
    preview.textContent = content;
  }
  
  if (hashtags) {
    const tags = appState.currentHashtags || '#PlantesCarnivoRes #LesGloutonnes';
    hashtags.textContent = tags;
  }
}

function updateHashtagVisualState() {
  const currentHashtags = appState.currentHashtags;
  
  document.querySelectorAll('.hashtag-list span, .suggested-hashtag, .ai-suggested-hashtag').forEach(span => {
    const onclick = span.getAttribute('onclick');
    if (onclick && onclick.includes('toggleHashtag')) {
      const hashtagMatch = onclick.match(/toggleHashtag\(['"]([^'"]+)['"]\)/);
      if (hashtagMatch) {
        const hashtag = hashtagMatch[1];
        
        if (currentHashtags.includes(hashtag)) {
          span.classList.add('selected');
          if (!span.innerHTML.includes('✓')) {
            span.innerHTML = `✓ ${hashtag}`;
          }
        } else {
          span.classList.remove('selected');
          span.innerHTML = hashtag;
        }
      }
    }
  });
}

// ===============================
// ACTIONS DE PUBLICATION
// ===============================
function formatContentForPlatform(platform) {
  const text = appState.currentText.trim();
  const hashtags = appState.currentHashtags.trim();
  
  if (!text) {
    showMessage('⚠️ Écris d\'abord du contenu !', 'warning');
    return '';
  }
  
  let formattedContent = text;
  
  if (platform === 'facebook') {
    if (hashtags) {
      formattedContent += '\n\n' + hashtags;
    }
  } else if (platform === 'instagram') {
    if (hashtags) {
      formattedContent += '\n\n' + hashtags;
      
      const igHashtags = ['#plantsofinstagram', '#plantlover', '#botanical'];
      const currentTags = hashtags.toLowerCase();
      igHashtags.forEach(tag => {
        if (!currentTags.includes(tag.toLowerCase())) {
          formattedContent += ' ' + tag;
        }
      });
    }
  } else {
    if (hashtags) {
      formattedContent += '\n\n' + hashtags;
    }
  }
  
  return formattedContent;
}

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {
      fallbackCopyToClipboard(text);
    });
  } else {
    fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  textArea.setSelectionRange(0, 99999);
  
  try {
    document.execCommand('copy');
  } catch (err) {
    showMessage('❌ Copie manuelle nécessaire', 'error');
  }
  
  document.body.removeChild(textArea);
}

function copyForFacebook() {
  const content = formatContentForPlatform('facebook');
  copyToClipboard(content);
  showMessage('📘 Contenu Facebook copié !', 'success');
}

function copyForInstagram() {
  const content = formatContentForPlatform('instagram');
  copyToClipboard(content);
  showMessage('📷 Contenu Instagram copié !', 'success');
}

function copyForBoth() {
  const content = formatContentForPlatform('both');
  copyToClipboard(content);
  showMessage('📋 Contenu universel copié !', 'success');
}

function quickPublish() {
  if (!appState.currentText.trim()) {
    showMessage('⚠️ Écris d\'abord du contenu !', 'warning');
    return;
  }
  
  const content = formatContentForPlatform('both');
  copyToClipboard(content);
  
  window.open(CONFIG.metaUrls.facebook, '_blank');
  setTimeout(() => {
    window.open(CONFIG.metaUrls.instagram, '_blank');
  }, 1000);
  
  showMessage('🚀 Contenu copié et Meta Business Suite ouvert !', 'success');
}

// ===============================
// SAUVEGARDE ET RÉCUPÉRATION
// ===============================
function autoSave() {
  if (appState.currentText.trim()) {
    clearTimeout(window.autoSaveTimeout);
    window.autoSaveTimeout = setTimeout(() => {
      saveDraft(true);
    }, 10000);
  }
}

// Sauvegarde intelligente avec queue
let lastSavedContent = '';
let saveQueue = [];

const debouncedServerSave = debounce(async () => {
    if (saveQueue.length === 0) return;
    
    const latest = saveQueue[saveQueue.length - 1];
    
    try {
        await saveDraftToServer(latest);
        saveQueue = [];
        lastSavedContent = latest.content;
        // Sauvegarde réussie
    } catch (error) {
        // Erreur sauvegarde (silencieux)
        // Garder en queue pour retry plus tard
    }
}, 5000);

async function saveDraft(silent = false) {
  const draftData = {
    content: appState.currentText,
    hashtags: appState.currentHashtags,
    timestamp: new Date().toISOString(),
    engagementScore: appState.engagementScore
  };
  
  // Sauvegarde LocalStorage (backup local)
  try {
    localStorage.setItem('gloutonnes_draft', JSON.stringify(draftData));
  } catch (error) {
    // Erreur sauvegarde LocalStorage (silencieux)
  }
  
  // Ne sauvegarder que si changement significatif (> 10 caractères)
  const diff = getTextDiff(lastSavedContent, appState.currentText);
  if (diff.length < 10 && lastSavedContent) {
    return; // Pas de changement significatif
  }
  
  // Ajouter à la queue
  saveQueue.push({
    content: appState.currentText,
    hashtags: appState.currentHashtags,
    timestamp: Date.now()
  });
  
  // Garder seulement les 5 dernières sauvegardes en queue
  if (saveQueue.length > 5) {
    saveQueue.shift();
  }
  
  // Sauvegarde serveur avec debounce
  debouncedServerSave();
  
  if (!silent) {
    showMessage('💾 Sauvegarde en cours...', 'info');
  }
}

function getTextDiff(oldText, newText) {
    if (oldText.length >= newText.length) {
        return newText;
    }
    return newText.slice(oldText.length);
}

async function saveDraftToServer(data) {
    const formData = new FormData();
    formData.append('action', 'save_draft');
    formData.append('key', 'gloutonnes2025');
    formData.append('content', data.content);
    formData.append('hashtags', data.hashtags);
    
    const response = await fetchWithRetry('../api/social-api.php', {
        method: 'POST',
        body: formData
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message || 'Erreur serveur');
    }
    
    appState.lastSave = new Date();
    appState.serverDraftId = result.data.draft_id;
    
    return result;
}

async function loadLastDraft() {
  // Essayer d'abord de charger depuis le serveur
  try {
    const response = await fetch('../api/social-api.php?action=get_drafts&key=gloutonnes2025&limit=1');
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      const serverDraft = result.data[0];
      const contentField = document.getElementById('post-content');
      const hashtagsField = document.getElementById('custom-hashtags');
      
      if (contentField) {
        contentField.value = serverDraft.content || '';
        appState.currentText = serverDraft.content || '';
      }
      
      if (hashtagsField) {
        hashtagsField.value = serverDraft.hashtags || '';
        appState.currentHashtags = serverDraft.hashtags || '';
      }
      
      appState.serverDraftId = serverDraft.id;
      
      updateCharCounter();
      updateEngagementScore();
      updateAllPreviews();
      updateRealTimeInsights();
      
      const draftDate = new Date(serverDraft.updated_at);
      const age = Math.round((new Date() - draftDate) / (1000 * 60));
      showMessage(`📋 Brouillon serveur récupéré (sauvé il y a ${age} min)`, 'info');
      return;
    }
  } catch (error) {
    // Erreur chargement brouillon serveur (silencieux)
  }
  
  // Fallback: charger depuis LocalStorage
  try {
    const savedDraft = localStorage.getItem('gloutonnes_draft');
    if (savedDraft) {
      const draftData = JSON.parse(savedDraft);
      
      const draftAge = new Date() - new Date(draftData.timestamp);
      if (draftAge < 24 * 60 * 60 * 1000) {
        const contentField = document.getElementById('post-content');
        const hashtagsField = document.getElementById('custom-hashtags');
        
        if (contentField) {
          contentField.value = draftData.content || '';
          appState.currentText = draftData.content || '';
        }
        
        if (hashtagsField) {
          hashtagsField.value = draftData.hashtags || '';
          appState.currentHashtags = draftData.hashtags || '';
        }
        
        updateCharCounter();
        updateEngagementScore();
        updateAllPreviews();
        updateRealTimeInsights();
        
        const age = Math.round(draftAge / (1000 * 60));
        showMessage(`📋 Brouillon local récupéré (sauvé il y a ${age} min)`, 'info');
      }
    }
  } catch (error) {
    // Erreur chargement brouillon local (silencieux)
  }
}

function clearAll() {
  if (appState.currentText.trim() && !confirm('⚠️ Effacer tout le contenu ?')) {
    return;
  }
  
  const contentField = document.getElementById('post-content');
  const hashtagsField = document.getElementById('custom-hashtags');
  
  if (contentField) {
    contentField.value = '';
    appState.currentText = '';
  }
  
  if (hashtagsField) {
    hashtagsField.value = '';
    appState.currentHashtags = '';
  }
  
  updateCharCounter();
  updateEngagementScore();
  updateAllPreviews();
  updateRealTimeInsights();
  
  showMessage('🗑️ Contenu effacé', 'info');
}

// ===============================
// FONCTIONS UTILITAIRES IA
// ===============================
function setButtonProcessing(buttonType, isProcessing) {
  let button;
  
  switch(buttonType) {
    case 'improveTextAdvanced':
      button = document.querySelector('[onclick="improveTextAdvanced()"]');
      break;
    case 'optimizeForPlants':
      button = document.querySelector('[onclick="optimizeForPlants()"]');
      break;
  }
  
  if (button) {
    if (isProcessing) {
      button.classList.add('processing');
      button.disabled = true;
      button.style.pointerEvents = 'none';
    } else {
      button.classList.remove('processing');
      button.disabled = false;
      button.style.pointerEvents = 'auto';
    }
  }
  
  const assistant = document.querySelector('.ai-assistant-enhanced');
  if (assistant) {
    if (isProcessing) {
      assistant.classList.add('analyzing');
    } else {
      assistant.classList.remove('analyzing', 'improving', 'error');
    }
  }
}

function selectVariant(index) {
  if (window.currentVariants && window.currentVariants[index]) {
    const contentField = document.getElementById('post-content');
    contentField.value = window.currentVariants[index].text;
    appState.currentText = window.currentVariants[index].text;
    updateCharCounter();
    updateEngagementScore();
    updateAllPreviews();
    updateRealTimeInsights();
    
    showMessage(`✅ Variante "${window.currentVariants[index].type}" appliquée !`, 'success');
  }
}

function applySuggestion(type) {
  showMessage(`💡 Suggestion "${type}" appliquée !`, 'success');
}

function showVariants(text) {
  const variants = window.advancedAI.generateVariants(text);
  
  let variantsHTML = `
    <h5>📝 Variantes disponibles</h5>
    ${variants.map((variant, index) => `
      <div class="variant-item">
        <div class="variant-header">
          <h6>${variant.type}</h6>
          <button onclick="selectVariant(${index})" class="select-variant-btn">Utiliser</button>
        </div>
        <div class="variant-content">${variant.text}</div>
      </div>
    `).join('')}
  `;
  
  document.getElementById('text-variants').innerHTML = variantsHTML;
  document.getElementById('text-variants').style.display = 'block';
  
  window.currentVariants = variants;
}

function showAnalysisModal(content) {
  let modal = document.getElementById('analysis-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'analysis-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>🧠 Analyse IA Avancée</h3>
          <button class="close-btn" onclick="closeAnalysisModal()">&times;</button>
        </div>
        <div class="modal-body" id="analysis-modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  document.getElementById('analysis-modal-body').innerHTML = content;
  modal.style.display = 'flex';
}

function closeAnalysisModal() {
  const modal = document.getElementById('analysis-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// ===============================
// INTERFACE ET MESSAGES
// ===============================
function showMessage(message, type = 'info') {
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8'
  };
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'toast-message';
  messageDiv.textContent = message;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-weight: 500;
    z-index: 10000;
    max-width: 350px;
    word-wrap: break-word;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInRight 0.3s ease;
  `;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    messageDiv.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 300);
  }, 4000);
}


// ===============================
// EXPORTS GLOBAUX
// ===============================
window.loadTemplate = loadTemplate;
window.improveText = improveText;
window.improveTextAdvanced = improveTextAdvanced;
window.addEmojis = addEmojis;
window.smartEmojisPlacement = smartEmojisPlacement;
window.makeEngaging = makeEngaging;
window.fixGrammar = fixGrammar;
window.optimizeForPlants = optimizeForPlants;
window.generateVariantsAdvanced = generateVariantsAdvanced;
window.suggestHashtagsAI = suggestHashtagsAI;
window.toggleHashtag = toggleHashtag;
window.copyForFacebook = copyForFacebook;
window.copyForInstagram = copyForInstagram;
window.copyForBoth = copyForBoth;
window.quickPublish = quickPublish;
window.saveDraft = saveDraft;
window.clearAll = clearAll;
window.selectVariant = selectVariant;
window.applySuggestion = applySuggestion;
window.closeAnalysisModal = closeAnalysisModal;
window.updateRealTimeInsights = updateRealTimeInsights;
window.setupEventListeners = setupEventListeners;

// ===============================
// CSS ANIMATIONS ET STYLES
// ===============================
const styles = document.createElement('style');
styles.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  @keyframes hashtagSelect {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  @keyframes pulseAI {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .ai-btn.processing {
    animation: pulseAI 1s ease-in-out infinite;
    background: linear-gradient(135deg, #ff9100, #5b0092);
    color: white;
  }
  
  .ai-btn.processing::after {
    content: ' ⚡';
    animation: spin 1s linear infinite;
  }
  
  .suggested-hashtag, .ai-suggested-hashtag {
    display: inline-block;
    background: #e3f2fd;
    color: #1976d2;
    padding: 4px 8px;
    margin: 2px;
    border-radius: 12px;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  
  .suggested-hashtag:hover, .ai-suggested-hashtag:hover {
    background: #1976d2;
    color: white;
    transform: scale(1.05);
  }
  
  .suggested-hashtag.selected, .ai-suggested-hashtag.selected {
    background: #28a745;
    color: white;
    animation: hashtagSelect 0.3s ease;
  }
  
  .hashtag-list span {
    display: inline-block;
    background: #f1f1f1;
    padding: 4px 10px;
    margin: 2px;
    border-radius: 15px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  
  .hashtag-list span:hover {
    background: #ff9100;
    color: white;
    transform: scale(1.05);
  }
  
  .hashtag-list span.selected {
    background: #28a745;
    color: white;
    animation: hashtagSelect 0.3s ease;
  }
  
  .ai-suggested-hashtag::before {
    content: '🤖';
    position: absolute;
    top: -2px;
    right: -2px;
    font-size: 0.7rem;
    opacity: 0.7;
  }
  
  .ai-suggested-hashtag {
    position: relative;
    background: linear-gradient(135deg, #e3f2fd, #bbdefb);
    border: 1px solid #90caf9;
    font-weight: 500;
    overflow: hidden;
  }
  
  .ai-suggested-hashtag:hover {
    background: linear-gradient(135deg, #1976d2, #1565c0);
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
  }
  
  .toast-message {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .tip-item {
    background: rgba(255, 255, 255, 0.8);
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 0.5rem;
    border-left: 3px solid #17a2b8;
  }
  
  .tip-item:last-child {
    margin-bottom: 0;
  }
  
  .variant-item {
    background: #f8f9fa;
    border-radius: 6px;
    margin-bottom: 1rem;
    overflow: hidden;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
  }
  
  .variant-item:hover {
    border-color: #5b0092;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(91, 0, 146, 0.15);
  }
  
  .variant-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: rgba(91, 0, 146, 0.05);
    border-bottom: 1px solid #e9ecef;
  }
  
  .variant-header h5, .variant-header h6 {
    margin: 0;
    font-size: 0.9rem;
    color: #5b0092;
    font-weight: 600;
  }
  
  .select-variant-btn {
    background: #5b0092;
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  
  .select-variant-btn:hover {
    background: #7b00b8;
  }
  
  .variant-content {
    padding: 1rem;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #333;
    white-space: pre-wrap;
  }
`;
document.head.appendChild(styles);

// ===============================
// AUTO-INITIALISATION
// ===============================
if (document.readyState !== 'loading') {
  setTimeout(() => {
    if (!appState.isInitialized) {
      setupEventListeners();
      loadLastDraft();
      updateAllPreviews();
      appState.isInitialized = true;
      // Assistant Publication IA initialisé
    }
  }, 100);
}

function updateOptimalTiming() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0=dimanche, 1=lundi, etc.
  const text = appState.currentText.toLowerCase();
  
  let timing = '';
  let reason = '';
  let urgency = '';
  
  // ANALYSE DU CONTENU pour timing personnalisé
  const analysis = window.advancedAI ? window.advancedAI.analyzeContent(appState.currentText) : null;
  
  // Horaires selon le type de contenu
  let optimalHours = [12, 13, 19, 20]; // défaut
  
  if (analysis) {
    if (analysis.plants.length > 0) {
      // Posts sur plantes = matin/soir (passion jardinage)
      optimalHours = [8, 9, 18, 19, 20];
    }
    
    if (text.includes('conseil') || text.includes('astuce')) {
      // Conseils = matin (moment apprentissage)
      optimalHours = [8, 9, 10, 17, 18];
    }
    
    if (text.includes('nouveau') || text.includes('acquisition')) {
      // Nouveautés = midi/soir (moments sociaux)
      optimalHours = [12, 13, 19, 20, 21];
    }
    
    if (analysis.structure.hasQuestion) {
      // Questions = heures d'activité max
      optimalHours = [12, 13, 14, 19, 20, 21];
    }
  }
  
  // CALCUL TIMING EN TEMPS RÉEL
  const isOptimalHour = optimalHours.includes(hour);
  const isWeekend = day === 0 || day === 6;
  const isOptimalDay = day >= 2 && day <= 4; // mar-jeu
  
  if (isOptimalHour && !isWeekend) {
    timing = '🔥 MAINTENANT !';
    reason = 'C\'est le moment parfait pour publier';
    urgency = 'optimal';
  } else if (isOptimalHour && isWeekend) {
    timing = '⚡ Maintenant (weekend)';
    reason = 'Bon moment mais audience réduite le weekend';
    urgency = 'good';
  } else {
    // Calculer le prochain créneau optimal
    let nextOptimal = findNextOptimalTime(hour, day, optimalHours);
    timing = nextOptimal.text;
    reason = nextOptimal.reason;
    urgency = 'wait';
  }
  
  // AFFICHAGE AVEC COULEURS
  const timingInfoEl = document.querySelector('.timing-info');
  const timingReasonEl = document.querySelector('.timing-reason');
  const timingContainer = document.querySelector('.timing-optimizer');
  
  if (timingInfoEl && timingReasonEl && timingContainer) {
    timingInfoEl.innerHTML = `<strong>📅 ${timing}</strong>`;
    timingReasonEl.textContent = reason;
    
    // Couleurs selon urgence
    timingContainer.style.borderLeft = urgency === 'optimal' ? '4px solid #28a745' : 
                                      urgency === 'good' ? '4px solid #ffc107' : 
                                      '4px solid #ff9100';
    
    timingInfoEl.style.color = urgency === 'optimal' ? '#28a745' : 
                               urgency === 'good' ? '#ffc107' : 
                               '#ff9100';
  }
  
  // BONUS : Ajouter countdown si proche
  if (urgency === 'wait') {
    addCountdownTimer(nextOptimal.nextHour);
  }
}

function findNextOptimalTime(currentHour, currentDay, optimalHours) {
  // Trouver la prochaine heure optimale aujourd'hui
  const todayOptimal = optimalHours.find(h => h > currentHour);
  
  if (todayOptimal && currentDay >= 1 && currentDay <= 5) {
    const hoursLeft = todayOptimal - currentHour;
    return {
      text: `Dans ${hoursLeft}h (${todayOptimal}h)`,
      reason: `Attendre ${hoursLeft}h pour un engagement optimal`,
      nextHour: todayOptimal
    };
  }
  
  // Sinon, demain ou jour suivant
  if (currentDay === 5) { // vendredi
    return {
      text: 'Lundi 8h-10h',
      reason: 'Weekend moins actif, attendre lundi matin',
      nextHour: null
    };
  }
  
  if (currentDay === 6) { // samedi
    return {
      text: 'Lundi 8h-10h',
      reason: 'Weekend moins actif, attendre lundi matin',
      nextHour: null
    };
  }
  
  if (currentDay === 0) { // dimanche
    return {
      text: 'Demain 8h-10h',
      reason: 'Lundi matin = nouveau départ de semaine',
      nextHour: null
    };
  }
  
  // Jour de semaine suivant
  const firstOptimal = optimalHours[0];
  return {
    text: `Demain ${firstOptimal}h`,
    reason: 'Premier créneau optimal de demain',
    nextHour: null
  };
}

function addCountdownTimer(targetHour) {
  if (!targetHour) return;
  
  const timingReasonEl = document.querySelector('.timing-reason');
  if (!timingReasonEl) return;
  
  const now = new Date();
  const target = new Date();
  target.setHours(targetHour, 0, 0, 0);
  
  const diffMs = target - now;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours >= 0 && diffMinutes >= 0) {
    timingReasonEl.innerHTML += `<br><small>⏰ Countdown: ${diffHours}h ${diffMinutes}min</small>`;
  }
}

// Assistant Publication IA Complet - Version Ultra-Intelligente - Prêt