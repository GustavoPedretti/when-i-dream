/**
 * When I Dream - Web Application Logic
 * Comprehensive Game State, Role Randomizer, Directional Scoring & Navigation Management
 */

// Official Role Distribution Table (When I Dream Rulebook)
const ROLE_DISTRIBUTIONS = {
  4: { fairies: 1, boogeymen: 1, sandmen: 2, totalSpirits: 4 },
  5: { fairies: 2, boogeymen: 1, sandmen: 2, totalSpirits: 5 },
  6: { fairies: 3, boogeymen: 2, sandmen: 1, totalSpirits: 6 },
  7: { fairies: 3, boogeymen: 2, sandmen: 2, totalSpirits: 7 },
  8: { fairies: 4, boogeymen: 3, sandmen: 1, totalSpirits: 8 },
  9: { fairies: 4, boogeymen: 3, sandmen: 2, totalSpirits: 9 },
  10: { fairies: 5, boogeymen: 4, sandmen: 1, totalSpirits: 10 }
};

// Role Metadata for Display
const ROLE_DEFINITIONS = {
  dreamer: {
    name: 'O Sonhador',
    badge: '🌙 O SONHADOR',
    alignment: 'O Viajante Cego',
    icon: '🌙',
    avatar: '😴',
    themeClass: 'dreamer',
    instruction: 'Vende os olhos e escute as pistas! Tente adivinhar as palavras. Ao acordar, conte a história do seu sonho!',
    goal: '1 ponto por carta correta + 2 pontos se lembrar de todas as cartas na história.'
  },
  fairy: {
    name: 'Fada do Sonho',
    badge: '🧚‍♀️ FADA DO SONHO',
    alignment: 'Luz & Verdade',
    icon: '🧚‍♀️',
    avatar: '✨',
    themeClass: 'fairy',
    instruction: 'Ajude o Sonhador! Dê pistas verdadeiras e precisas para fazê-lo acertar a palavra ativa.',
    goal: 'Ganha 1 ponto por cada carta correta da rodada.'
  },
  boogeyman: {
    name: 'Bicho-Papão',
    badge: '👹 BICHO-PAPÃO',
    alignment: 'Trevas & Confusão',
    icon: '👹',
    avatar: '😈',
    themeClass: 'boogeyman',
    instruction: 'Engane o Sonhador! Dê pistas falsas ou enganosas para induzi-lo ao erro sem ser descoberto.',
    goal: 'Ganha 1 ponto por cada carta errada da rodada.'
  },
  sandman: {
    name: 'O Sandman',
    badge: '⏳ O SANDMAN',
    alignment: 'Equilíbrio Cósmico',
    icon: '⏳',
    avatar: '🔮',
    themeClass: 'sandman',
    instruction: 'Busque o equilíbrio supremo! Dê pistas para manter o número de acertos e erros exatamente igualados.',
    goal: 'Ganha bônus se houver empate exato de acertos e erros (ou diferença de no máximo 1).'
  }
};

class WhenIDreamApp {
  constructor() {
    // Game Deck Configuration
    this.deck = [];
    this.deckIndex = 0;
    this.roundHistory = [];
    this.currentCard = null;
    this.currentRotation = 0;
    this.isCardAnimating = false;

    // Timer State
    this.roundDuration = 120; // default 2 min (120s)
    this.timeRemaining = 120;
    this.timerInterval = null;
    this.isPaused = false;
    this.urgentThreshold = 15; // seconds

    // Navigation & Screen State
    // activeTab: 'GAME' | 'ROLES' | 'RULES'
    // gameState: 'LOBBY' | 'PLAYING' | 'PAUSED' | 'SUMMARY'
    this.activeTab = 'GAME';
    this.gameState = 'LOBBY';

    // Players & Roles State
    this.players = this.loadPlayers();
    this.activeSonhador = null;
    this.dealtRoles = [];

    // DOM Elements Initialization
    this.initDOMElements();
    this.initStars();
    this.initDeck();
    this.bindEvents();
    this.updateSoundButtonUI();
    this.renderPlayerChips();
    this.updateRoleDistributionPreview();
  }

  // Load players from localStorage or use pleasant defaults
  loadPlayers() {
    try {
      const saved = localStorage.getItem('wid_players_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) return parsed;
      }
    } catch (e) {}
    return ['Pedro', 'Mariana', 'Lucas', 'Beatriz', 'Gabriel'];
  }

  savePlayers() {
    localStorage.setItem('wid_players_list', JSON.stringify(this.players));
  }

  initDOMElements() {
    // Navigation Tabs
    this.navBtnGame = document.getElementById('nav-btn-game');
    this.navBtnRoles = document.getElementById('nav-btn-roles');
    this.navBtnRules = document.getElementById('nav-btn-rules');
    this.logoHomeBtn = document.getElementById('logo-home-btn');

    // Screens
    this.screenLobby = document.getElementById('screen-lobby');
    this.screenGame = document.getElementById('screen-game');
    this.screenSummary = document.getElementById('screen-summary');
    this.screenRoles = document.getElementById('screen-roles');
    this.screenRules = document.getElementById('screen-rules');

    // Lobby Elements
    this.btnGotoRoles = document.getElementById('btn-goto-roles');
    this.presetBtns = document.querySelectorAll('.preset-btn');
    this.customSlider = document.getElementById('custom-time-slider');
    this.customTimeDisplay = document.getElementById('custom-time-display');
    this.btnStartDream = document.getElementById('btn-start-dream');
    this.deckTotalCount = document.getElementById('deck-total-count');

    // Game Elements
    this.timerBox = document.getElementById('timer-box');
    this.timerProgressCircle = document.getElementById('timer-progress-circle');
    this.timerDigits = document.getElementById('timer-digits');
    this.timerStatusBadge = document.getElementById('timer-status-badge');
    this.btnPauseTimer = document.getElementById('btn-pause-timer');
    this.btnEndRound = document.getElementById('btn-end-round');
    
    // Live Stats Elements
    this.roundCorrectCount = document.getElementById('round-correct-count');
    this.roundIncorrectCount = document.getElementById('round-incorrect-count');
    this.roundCardCount = document.getElementById('round-card-count');
    this.deckRemainingCount = document.getElementById('deck-remaining-count');

    // Card Elements & Directional Action Buttons
    this.cardFrame = document.getElementById('card-frame');
    this.cardImage = document.getElementById('card-image');
    this.btnCardCorrect = document.getElementById('btn-card-correct');
    this.btnCardIncorrect = document.getElementById('btn-card-incorrect');

    // History Elements
    this.historyList = document.getElementById('history-list');
    this.historyCountBadge = document.getElementById('history-count-badge');

    // Summary Elements
    this.summaryGallery = document.getElementById('summary-gallery');
    this.summaryCorrectCards = document.getElementById('summary-correct-cards');
    this.summaryIncorrectCards = document.getElementById('summary-incorrect-cards');
    this.summaryTotalCards = document.getElementById('summary-total-cards');
    this.summarySelectedCards = document.getElementById('summary-selected-cards');
    this.summaryDuration = document.getElementById('summary-duration');
    this.btnNewRound = document.getElementById('btn-new-round');
    this.btnBackToLobby = document.getElementById('btn-back-to-lobby');

    // Roles Screen Elements
    this.playerNameInput = document.getElementById('player-name-input');
    this.btnAddPlayer = document.getElementById('btn-add-player');
    this.playerChipsList = document.getElementById('player-chips-list');
    this.playerCountBadge = document.getElementById('player-count-badge');
    this.rolesDistributionPreview = document.getElementById('roles-distribution-preview');
    this.selectSonhador = document.getElementById('select-sonhador');
    this.btnDealRoles = document.getElementById('btn-deal-roles');
    this.secretRevealSection = document.getElementById('secret-reveal-section');
    this.secretCardsGrid = document.getElementById('secret-cards-grid');
    this.btnStartDreamFromRoles = document.getElementById('btn-start-dream-from-roles');
    this.btnReshuffleRoles = document.getElementById('btn-reshuffle-roles');

    // Global Header Buttons
    this.btnSoundToggle = document.getElementById('btn-sound-toggle');
    this.btnFullscreenToggle = document.getElementById('btn-fullscreen-toggle');
  }

  // Create ambient starry background
  initStars() {
    const container = document.getElementById('stars-container');
    if (!container) return;
    container.innerHTML = '';
    const numStars = 80;

    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      const size = Math.random() * 2.5 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.setProperty('--duration', `${Math.random() * 4 + 2}s`);
      star.style.animationDelay = `${Math.random() * 5}s`;
      container.appendChild(star);
    }
  }

  // Initialize and shuffle full card deck
  initDeck() {
    if (typeof CARDS_DATA !== 'undefined' && Array.isArray(CARDS_DATA)) {
      this.deck = [...CARDS_DATA];
    } else {
      this.deck = [];
      for (let i = 1; i <= 215; i++) {
        const id = String(i).padStart(3, '0');
        this.deck.push({
          id: i,
          formattedId: id,
          filename: `carta_${id}.jpg`,
          path: `cartas_recortadas/carta_${id}.jpg`
        });
      }
    }
    this.shuffleDeck();
    if (this.deckTotalCount) {
      this.deckTotalCount.textContent = this.deck.length;
    }
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
    this.deckIndex = 0;
  }

  preloadNextCards(count = 4) {
    for (let i = 0; i < count; i++) {
      const idx = (this.deckIndex + i) % this.deck.length;
      const img = new Image();
      img.src = this.deck[idx].path;
    }
  }

  // =========================================================================
  // NAVIGATION & TAB SWITCHING
  // =========================================================================

  switchTab(tabName) {
    sounds.playTabSwitch();
    this.activeTab = tabName;

    // Update Nav Buttons
    [this.navBtnGame, this.navBtnRoles, this.navBtnRules].forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Hide all screens first
    const allScreens = [
      this.screenLobby,
      this.screenGame,
      this.screenSummary,
      this.screenRoles,
      this.screenRules
    ];
    allScreens.forEach(s => s.classList.remove('active'));

    // Show appropriate screen
    if (tabName === 'GAME') {
      if (this.gameState === 'PLAYING' || this.gameState === 'PAUSED') {
        this.screenGame.classList.add('active');
      } else if (this.gameState === 'SUMMARY') {
        this.screenSummary.classList.add('active');
      } else {
        this.screenLobby.classList.add('active');
      }
    } else if (tabName === 'ROLES') {
      this.screenRoles.classList.add('active');
      this.renderPlayerChips();
      this.updateRoleDistributionPreview();
    } else if (tabName === 'RULES') {
      this.screenRules.classList.add('active');
    }
  }

  switchGameScreen(screenState) {
    this.gameState = screenState;
    if (this.activeTab !== 'GAME') {
      this.switchTab('GAME');
      return;
    }

    this.screenLobby.classList.remove('active');
    this.screenGame.classList.remove('active');
    this.screenSummary.classList.remove('active');

    if (screenState === 'LOBBY') {
      this.screenLobby.classList.add('active');
    } else if (screenState === 'PLAYING' || screenState === 'PAUSED') {
      this.screenGame.classList.add('active');
    } else if (screenState === 'SUMMARY') {
      this.screenSummary.classList.add('active');
    }
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================

  bindEvents() {
    // Navigation tabs
    this.navBtnGame.addEventListener('click', () => this.switchTab('GAME'));
    this.navBtnRoles.addEventListener('click', () => this.switchTab('ROLES'));
    this.navBtnRules.addEventListener('click', () => this.switchTab('RULES'));
    this.logoHomeBtn.addEventListener('click', () => this.switchTab('GAME'));
    this.btnGotoRoles.addEventListener('click', () => this.switchTab('ROLES'));

    // Preset timer buttons
    this.presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sounds.playClick();
        this.presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const seconds = parseInt(btn.dataset.time, 10);
        this.roundDuration = seconds;
        this.customSlider.value = seconds;
        this.updateCustomTimeLabel(seconds);
      });
    });

    // Custom slider
    this.customSlider.addEventListener('input', (e) => {
      const seconds = parseInt(e.target.value, 10);
      this.roundDuration = seconds;
      this.updateCustomTimeLabel(seconds);
      this.presetBtns.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.time, 10) === seconds);
      });
    });

    // Start Dream / Round
    this.btnStartDream.addEventListener('click', () => {
      this.startRound();
    });

    // Directional Card Actions (Acertou / Errou)
    if (this.btnCardCorrect) {
      this.btnCardCorrect.addEventListener('click', () => {
        this.handleCardDecision(true);
      });
    }

    if (this.btnCardIncorrect) {
      this.btnCardIncorrect.addEventListener('click', () => {
        this.handleCardDecision(false);
      });
    }

    // Pause / Resume
    this.btnPauseTimer.addEventListener('click', () => {
      this.togglePause();
    });

    // End Round early
    this.btnEndRound.addEventListener('click', () => {
      if (confirm('Deseja realmente encerrar este sonho agora?')) {
        this.endRound();
      }
    });

    // Summary buttons
    this.btnNewRound.addEventListener('click', () => {
      sounds.playClick();
      this.startRound();
    });

    this.btnBackToLobby.addEventListener('click', () => {
      sounds.playClick();
      this.switchGameScreen('LOBBY');
    });

    // Sound toggle
    this.btnSoundToggle.addEventListener('click', () => {
      const muted = sounds.toggleMute();
      this.updateSoundButtonUI();
      if (!muted) sounds.playClick();
    });

    // Fullscreen toggle
    this.btnFullscreenToggle.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // =======================================================================
    // ROLES SCREEN EVENTS
    // =======================================================================

    this.btnAddPlayer.addEventListener('click', () => {
      this.addPlayerFromInput();
    });

    this.playerNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addPlayerFromInput();
      }
    });

    this.btnDealRoles.addEventListener('click', () => {
      this.dealRoles();
    });

    this.btnReshuffleRoles.addEventListener('click', () => {
      this.dealRoles();
    });

    this.btnStartDreamFromRoles.addEventListener('click', () => {
      sounds.playClick();
      this.switchTab('GAME');
      this.startRound();
    });

    // =======================================================================
    // KEYBOARD SHORTCUTS (D / Right = Acertou | A / Left = Errou)
    // =======================================================================
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

      switch (e.code) {
        // D or ArrowRight -> Acertou (Correct)
        case 'KeyD':
        case 'ArrowRight':
          e.preventDefault();
          if (this.activeTab === 'GAME') {
            if (this.gameState === 'PLAYING') {
              this.handleCardDecision(true);
            } else if (this.gameState === 'LOBBY' || this.gameState === 'SUMMARY') {
              this.startRound();
            }
          }
          break;

        // A or ArrowLeft -> Errou / Passou (Incorrect)
        case 'KeyA':
        case 'ArrowLeft':
          e.preventDefault();
          if (this.activeTab === 'GAME' && this.gameState === 'PLAYING') {
            this.handleCardDecision(false);
          }
          break;

        // Space / Enter -> Start round or default Acerto
        case 'Space':
        case 'Enter':
          e.preventDefault();
          if (this.activeTab === 'GAME') {
            if (this.gameState === 'LOBBY' || this.gameState === 'SUMMARY') {
              this.startRound();
            } else if (this.gameState === 'PLAYING') {
              this.handleCardDecision(true);
            }
          }
          break;

        case 'KeyP':
          e.preventDefault();
          if (this.gameState === 'PLAYING' || this.gameState === 'PAUSED') {
            this.togglePause();
          }
          break;

        case 'KeyM':
          e.preventDefault();
          this.btnSoundToggle.click();
          break;

        case 'KeyF':
          e.preventDefault();
          this.toggleFullscreen();
          break;
      }
    });
  }

  updateCustomTimeLabel(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.customTimeDisplay.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
  }

  updateSoundButtonUI() {
    const muted = sounds.isMuted();
    this.btnSoundToggle.innerHTML = muted ? '🔇' : '🔊';
    this.btnSoundToggle.title = muted ? 'Ativar Sons (M)' : 'Silenciar Sons (M)';
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      this.btnFullscreenToggle.innerHTML = '⛶';
      this.btnFullscreenToggle.title = 'Sair de Tela Cheia (F)';
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      this.btnFullscreenToggle.innerHTML = '⛶';
      this.btnFullscreenToggle.title = 'Tela Cheia (F)';
    }
  }

  // =========================================================================
  // ROLES & CHARACTERS MANAGEMENT
  // =========================================================================

  addPlayerFromInput() {
    const name = this.playerNameInput.value.trim();
    if (!name) return;

    if (this.players.length >= 10) {
      alert('O número máximo oficial é de 10 jogadores.');
      return;
    }

    if (this.players.some(p => p.toLowerCase() === name.toLowerCase())) {
      alert('Já existe um jogador com este nome.');
      return;
    }

    sounds.playClick();
    this.players.push(name);
    this.playerNameInput.value = '';
    this.savePlayers();
    this.renderPlayerChips();
    this.updateRoleDistributionPreview();
  }

  removePlayer(index) {
    sounds.playClick();
    this.players.splice(index, 1);
    this.savePlayers();
    this.renderPlayerChips();
    this.updateRoleDistributionPreview();
  }

  renderPlayerChips() {
    this.playerCountBadge.textContent = this.players.length;

    // Populate dropdown
    const selectedVal = this.selectSonhador.value;
    this.selectSonhador.innerHTML = `<option value="RANDOM">🎲 Sortear Aleatoriamente</option>`;
    this.players.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = `🌙 ${p}`;
      this.selectSonhador.appendChild(opt);
    });
    if (this.players.includes(selectedVal)) {
      this.selectSonhador.value = selectedVal;
    }

    if (this.players.length === 0) {
      this.playerChipsList.innerHTML = `<span style="color: var(--text-muted); font-size: 0.9rem;">Nenhum jogador adicionado ainda.</span>`;
      return;
    }

    this.playerChipsList.innerHTML = this.players.map((p, idx) => `
      <div class="player-chip">
        <span>👤 ${p}</span>
        <span class="remove-btn" data-index="${idx}" title="Remover jogador">✕</span>
      </div>
    `).join('');

    // Attach remove event listeners
    this.playerChipsList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        this.removePlayer(idx);
      });
    });
  }

  updateRoleDistributionPreview() {
    const count = this.players.length;
    const dist = ROLE_DISTRIBUTIONS[count];

    if (count < 4) {
      this.rolesDistributionPreview.innerHTML = `
        <div class="distrib-header" style="color: var(--accent-gold);">⚠️ Configuração Mínima Necessária</div>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">
          Adicione pelo menos <strong>4 jogadores</strong> (atualmente: ${count}) para aplicar as regras oficiais de distribuição de papéis (4 a 10 jogadores).
        </p>
      `;
      this.btnDealRoles.disabled = true;
      this.btnDealRoles.style.opacity = '0.5';
      return;
    }

    if (count > 10) {
      this.rolesDistributionPreview.innerHTML = `
        <div class="distrib-header" style="color: var(--accent-danger);">⚠️ Limite de Jogadores Excedido</div>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">O jogo oficial comporta de 4 a 10 jogadores.</p>
      `;
      this.btnDealRoles.disabled = true;
      this.btnDealRoles.style.opacity = '0.5';
      return;
    }

    this.btnDealRoles.disabled = false;
    this.btnDealRoles.style.opacity = '1';

    this.rolesDistributionPreview.innerHTML = `
      <div class="distrib-header">📊 Distribuição Oficial para ${count} Jogadores</div>
      <div class="distrib-badges-row">
        <div class="distrib-badge sonhador">🌙 1 Sonhador</div>
        <div class="distrib-badge fada">🧚‍♀️ ${dist.fairies} Fadas</div>
        <div class="distrib-badge bicho">👹 ${dist.boogeymen} Bichos-Papões</div>
        <div class="distrib-badge sandman">⏳ ${dist.sandmen} Sandmen</div>
      </div>
      <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.75rem;">
        * O baralho de espíritos terá ${dist.totalSpirits} cartas: cada um dos outros ${count - 1} jogadores receberá 1 espírito e <strong>1 carta permanecerá oculta no centro</strong>!
      </p>
    `;
  }

  // Deal roles secretly according to official rules
  dealRoles() {
    const count = this.players.length;
    if (count < 4 || count > 10) {
      alert('É necessário entre 4 e 10 jogadores para sortear.');
      return;
    }

    sounds.playSecretReveal();

    const dist = ROLE_DISTRIBUTIONS[count];

    // 1. Choose Sonhador
    let sonhadorIndex = 0;
    const selectedSonhador = this.selectSonhador.value;
    if (selectedSonhador === 'RANDOM' || !this.players.includes(selectedSonhador)) {
      sonhadorIndex = Math.floor(Math.random() * this.players.length);
    } else {
      sonhadorIndex = this.players.indexOf(selectedSonhador);
    }

    // 2. Build Spirit Deck according to official distribution
    const spiritDeck = [];
    for (let i = 0; i < dist.fairies; i++) spiritDeck.push('fairy');
    for (let i = 0; i < dist.boogeymen; i++) spiritDeck.push('boogeyman');
    for (let i = 0; i < dist.sandmen; i++) spiritDeck.push('sandman');

    // 3. Shuffle Spirit Deck (Fisher-Yates)
    for (let i = spiritDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [spiritDeck[i], spiritDeck[j]] = [spiritDeck[j], spiritDeck[i]];
    }

    // 4. Assign roles to players
    this.dealtRoles = [];
    let spiritIndex = 0;

    this.players.forEach((player, idx) => {
      if (idx === sonhadorIndex) {
        this.dealtRoles.push({
          player: player,
          roleKey: 'dreamer',
          role: ROLE_DEFINITIONS.dreamer
        });
      } else {
        const roleKey = spiritDeck[spiritIndex];
        spiritIndex++;
        this.dealtRoles.push({
          player: player,
          roleKey: roleKey,
          role: ROLE_DEFINITIONS[roleKey]
        });
      }
    });

    // Render Secret Pass-and-Play Cards
    this.renderSecretCards();

    // Show reveal section and scroll smoothly into view
    this.secretRevealSection.style.display = 'flex';
    this.secretRevealSection.scrollIntoView({ behavior: 'smooth' });
  }

  renderSecretCards() {
    this.secretCardsGrid.innerHTML = this.dealtRoles.map((item, index) => `
      <div class="secret-card-item" data-index="${index}">
        <div class="secret-card-inner">
          <!-- FRONT: HIDDEN / FACE DOWN -->
          <div class="secret-card-face secret-card-front">
            <div class="secret-front-avatar">${item.role.avatar}</div>
            <div class="secret-front-name">${item.player}</div>
            <span class="secret-front-tap">🌙 Toque para Revelar</span>
          </div>

          <!-- BACK: REVEALED ROLE -->
          <div class="secret-card-face secret-card-back ${item.role.themeClass}">
            <div>
              <div class="role-reveal-icon">${item.role.icon}</div>
              <div class="role-reveal-title" style="margin-top: 0.35rem;">${item.role.badge}</div>
              <div style="font-size: 0.75rem; color: var(--accent-cyan); margin-bottom: 0.5rem;">Jogador: ${item.player}</div>
              <p class="role-reveal-desc">${item.role.instruction}</p>
            </div>
            
            <button class="btn-hide-role" data-index="${index}" title="Ocultar papel para o próximo">
              🔒 Ocultar Papel
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Attach click events
    this.secretCardsGrid.querySelectorAll('.secret-card-item').forEach(cardEl => {
      cardEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-hide-role')) {
          e.stopPropagation();
          sounds.playClick();
          cardEl.classList.remove('revealed');
          return;
        }
        sounds.playClick();
        cardEl.classList.toggle('revealed');
      });
    });
  }

  // =========================================================================
  // GAME ROUND FLOW WITH DIRECTIONAL DECISION (ACERTOU / ERROU)
  // =========================================================================

  startRound() {
    // Reset round state
    this.roundHistory = [];
    this.timeRemaining = this.roundDuration;
    this.isPaused = false;
    this.isCardAnimating = false;

    // Reshuffle deck if running low
    if (this.deck.length - this.deckIndex < 20) {
      this.shuffleDeck();
    }

    // UI Updates
    this.updateTimerDisplay();
    this.updateRoundStats();
    this.updateHistoryUI();
    this.switchGameScreen('PLAYING');

    // Play round start chime
    sounds.playRoundStart();

    // Prepare and draw initial active card
    this.drawNewActiveCard();

    // Start Timer
    this.startTimer();
  }

  drawNewActiveCard() {
    if (this.gameState !== 'PLAYING') return;

    if (this.deckIndex >= this.deck.length) {
      this.shuffleDeck();
    }

    const card = this.deck[this.deckIndex];
    this.deckIndex++;

    // Random rotation: 0° or 180° (50% probability)
    const rotation = Math.random() < 0.5 ? 0 : 180;
    this.currentCard = card;
    this.currentRotation = rotation;

    this.preloadNextCards(3);

    // Render active card in frame
    this.cardFrame.classList.remove('drawing', 'swipe-right', 'swipe-left', 'rot-0', 'rot-180');
    void this.cardFrame.offsetWidth; // force reflow

    this.cardFrame.classList.add('drawing', `rot-${rotation}`);
    this.cardImage.src = card.path;
    this.cardImage.alt = `Carta ${card.formattedId}`;

    this.isCardAnimating = false;
    this.updateRoundStats();
  }

  // Handle directional decision: Right / D = Acertou (true) | Left / A = Errou (false)
  handleCardDecision(isCorrect) {
    if (this.gameState !== 'PLAYING' || !this.currentCard || this.isCardAnimating) return;

    this.isCardAnimating = true;

    // Record decision in round history
    const historyItem = {
      order: this.roundHistory.length + 1,
      card: this.currentCard,
      rotation: this.currentRotation,
      isCorrect: isCorrect,
      drawnAt: this.roundDuration - this.timeRemaining
    };
    this.roundHistory.push(historyItem);

    // Neutral card draw sound (identical for both correct/incorrect so blindfolded Dreamer cannot tell)
    sounds.playCardDraw();

    if (isCorrect) {
      this.cardFrame.classList.add('swipe-right');
    } else {
      this.cardFrame.classList.add('swipe-left');
    }

    // Update live UI
    this.updateRoundStats();
    this.updateHistoryUI();

    // Draw next card after swipe animation
    setTimeout(() => {
      this.drawNewActiveCard();
    }, 200);
  }

  updateRoundStats() {
    const correctCount = this.roundHistory.filter(i => i.isCorrect).length;
    const incorrectCount = this.roundHistory.filter(i => !i.isCorrect).length;

    if (this.roundCorrectCount) {
      this.roundCorrectCount.textContent = correctCount;
    }
    if (this.roundIncorrectCount) {
      this.roundIncorrectCount.textContent = incorrectCount;
    }
    if (this.roundCardCount) {
      this.roundCardCount.textContent = this.roundHistory.length;
    }
    if (this.deckRemainingCount) {
      this.deckRemainingCount.textContent = this.deck.length - this.deckIndex;
    }
  }

  updateHistoryUI() {
    this.historyCountBadge.textContent = this.roundHistory.length;

    if (this.roundHistory.length === 0) {
      this.historyList.innerHTML = `
        <div class="history-empty">
          <span>🌙</span>
          <span>Nenhuma carta sonhada ainda...</span>
        </div>
      `;
      return;
    }

    const itemsHtml = [...this.roundHistory].reverse().map(item => {
      const rotText = item.rotation === 0 ? 'Orientação (0°)' : 'Invertida (180°)';
      const rotIcon = item.rotation === 0 ? '⬆️' : '⬇️';
      const resultClass = item.isCorrect ? 'correct' : 'incorrect';
      const resultLabel = item.isCorrect ? '✅ Acerto' : '❌ Erro';

      return `
        <div class="history-card-item ${resultClass}">
          <div class="history-card-order">#${item.order}</div>
          <div class="history-thumb-wrap">
            <img class="history-thumb" src="${item.card.path}" style="transform: rotate(${item.rotation}deg);" alt="Carta ${item.card.formattedId}">
          </div>
          <div class="history-card-details">
            <div class="history-card-name">
              <span>Carta #${item.card.formattedId}</span>
              <span class="history-result-tag ${resultClass}">${resultLabel}</span>
            </div>
            <span class="history-card-rotation">${rotIcon} ${rotText}</span>
          </div>
        </div>
      `;
    }).join('');

    this.historyList.innerHTML = itemsHtml;
  }

  // =========================================================================
  // TIMER ENGINE
  // =========================================================================

  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.isPaused) return;

      this.timeRemaining -= 1;
      this.updateTimerDisplay();

      // Sound ticks during last 10 seconds
      if (this.timeRemaining <= 10 && this.timeRemaining > 0) {
        sounds.playTick(this.timeRemaining <= 5);
      }

      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.updateTimerDisplay();
        this.endRound();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  togglePause() {
    if (this.gameState !== 'PLAYING' && this.gameState !== 'PAUSED') return;

    sounds.playClick();
    this.isPaused = !this.isPaused;

    if (this.isPaused) {
      this.gameState = 'PAUSED';
      this.btnPauseTimer.innerHTML = '▶️ Retomar';
      this.btnPauseTimer.classList.remove('btn-primary');
      this.btnPauseTimer.classList.add('btn-success');
      this.timerStatusBadge.textContent = '⏸️ Em Pausa';
      this.timerStatusBadge.style.color = 'var(--accent-gold)';
    } else {
      this.gameState = 'PLAYING';
      this.btnPauseTimer.innerHTML = '⏸️ Pausar';
      this.btnPauseTimer.classList.remove('btn-success');
      this.btnPauseTimer.classList.add('btn-primary');
      this.timerStatusBadge.textContent = '✨ Sonhando...';
      this.timerStatusBadge.style.color = 'var(--accent-cyan)';
    }
  }

  updateTimerDisplay() {
    const mins = Math.floor(this.timeRemaining / 60);
    const secs = this.timeRemaining % 60;
    this.timerDigits.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    // SVG Progress Arc
    const circumference = 2 * Math.PI * 90;
    const progress = this.timeRemaining / this.roundDuration;
    const offset = circumference * (1 - progress);
    this.timerProgressCircle.style.strokeDashoffset = offset;

    // Urgency styling
    if (this.timeRemaining <= this.urgentThreshold) {
      this.timerBox.classList.add('urgent');
    } else {
      this.timerBox.classList.remove('urgent');
    }

    if (!this.isPaused) {
      this.timerStatusBadge.textContent = '✨ Sonhando...';
      this.timerStatusBadge.style.color = 'var(--accent-cyan)';
    }
  }

  // =========================================================================
  // END OF ROUND & SUMMARY
  // =========================================================================

  endRound() {
    this.stopTimer();
    this.gameState = 'SUMMARY';
    sounds.playRoundEnd();

    const correctCount = this.roundHistory.filter(i => i.isCorrect).length;
    const incorrectCount = this.roundHistory.filter(i => !i.isCorrect).length;

    // Populate Summary Screen counters
    if (this.summaryCorrectCards) this.summaryCorrectCards.textContent = correctCount;
    if (this.summaryIncorrectCards) this.summaryIncorrectCards.textContent = incorrectCount;
    if (this.summaryTotalCards) this.summaryTotalCards.textContent = this.roundHistory.length;
    if (this.summarySelectedCards) this.summarySelectedCards.textContent = correctCount; // pre-selected
    if (this.summaryDuration) this.summaryDuration.textContent = `${Math.floor(this.roundDuration / 60)}m ${this.roundDuration % 60}s`;

    if (this.roundHistory.length === 0) {
      this.summaryGallery.innerHTML = `
        <div class="history-empty" style="grid-column: 1 / -1;">
          <p>Nenhuma carta foi sorteada nesta rodada.</p>
        </div>
      `;
    } else {
      this.summaryGallery.innerHTML = this.roundHistory.map((item, index) => {
        const resultClass = item.isCorrect ? 'was-correct selected' : 'was-incorrect';
        const tagLabel = item.isCorrect ? '✅ Acerto' : '❌ Erro';
        const tagColor = item.isCorrect ? '#2ed573' : '#ff4757';

        return `
          <div class="gallery-item ${resultClass}" data-index="${index}" title="Clique para marcar / desmarcar">
            <div class="selection-badge">✓</div>
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
              <span class="gallery-item-order">#${item.order} (${item.rotation === 0 ? '0°' : '180°'})</span>
              <span style="font-size: 0.72rem; font-weight: 800; color: ${tagColor};">${tagLabel}</span>
            </div>
            <div class="gallery-card-frame">
              <img class="gallery-card-img" src="${item.card.path}" style="transform: rotate(${item.rotation}deg);" alt="Carta ${item.card.formattedId}">
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Carta #${item.card.formattedId}</span>
          </div>
        `;
      }).join('');

      // Add click event listener to each gallery item
      const galleryItems = this.summaryGallery.querySelectorAll('.gallery-item');
      galleryItems.forEach(item => {
        item.addEventListener('click', () => {
          sounds.playClick();
          item.classList.toggle('selected');
          const selectedCount = this.summaryGallery.querySelectorAll('.gallery-item.selected').length;
          if (this.summarySelectedCards) {
            this.summarySelectedCards.textContent = selectedCount;
          }
        });
      });
    }

    this.switchGameScreen('SUMMARY');
  }
}

// Bootstrap application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WhenIDreamApp();
});
