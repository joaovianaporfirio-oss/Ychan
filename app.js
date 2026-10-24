/**
 * Ychan - Aplicação Principal
 * Imageboard minimalista retrô com CMS e persistência em LocalStorage
 */

// Hashes criptográficos SHA-256 (credenciais secretas protegidas)
const MOD_AUTH_HASH = {
  userHash: "598bad22c131df61d0cf1b48a2c5e3ab4d78f69988208c9ea1ea54ae2eb23d4a",
  passHash: "08da77334e07ab9e0eb95c21403e796e10482a42b81cefad18a16bea73f602b6"
};

// Chaves de armazenamento LocalStorage
const STORAGE_KEYS = {
  BOARDS: "ychan_boards_v1",
  THREADS: "ychan_threads_v1",
  AUTH: "ychan_auth_session",
  NEXT_ID: "ychan_next_id"
};

class YchanApp {
  constructor() {
    this.currentBoardSlug = "b";
    this.activeThreadId = null; // null = board view / catalog view; number = thread detail view
    this.viewMode = "board"; // 'board' | 'catalog'
    this.currentAttachment = null; // { url, fileName, fileSize }
    this.isModerator = false;
    
    this.initData();
    this.checkSession();
    this.bindEvents();
    this.handleRouting();
    window.addEventListener("hashchange", () => this.handleRouting());
  }

  /* -------------------------------------------------------------
   * 1. Inicialização e Persistência (LocalStorage)
   * ------------------------------------------------------------- */
  initData() {
    if (!localStorage.getItem(STORAGE_KEYS.BOARDS)) {
      localStorage.setItem(STORAGE_KEYS.BOARDS, JSON.stringify(DEFAULT_BOARDS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.THREADS)) {
      localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(DEFAULT_THREADS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NEXT_ID)) {
      localStorage.setItem(STORAGE_KEYS.NEXT_ID, "5000");
    }
  }

  getBoards() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOARDS)) || [];
    } catch (e) {
      console.error("Erro ao ler boards:", e);
      return [];
    }
  }

  saveBoards(boards) {
    localStorage.setItem(STORAGE_KEYS.BOARDS, JSON.stringify(boards));
    this.renderNavBoards();
  }

  getThreads() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.THREADS)) || [];
    } catch (e) {
      console.error("Erro ao ler threads:", e);
      return [];
    }
  }

  saveThreads(threads) {
    try {
      localStorage.setItem(STORAGE_KEYS.THREADS, JSON.stringify(threads));
    } catch (e) {
      this.showToast("Aviso: Memória local cheia para novas imagens. Tente imagens menores.", "danger");
      console.error("Erro ao salvar threads no LocalStorage:", e);
    }
  }

  getNextPostId() {
    const nextId = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_ID) || "5000", 10);
    localStorage.setItem(STORAGE_KEYS.NEXT_ID, (nextId + 1).toString());
    return nextId.toString();
  }

  /* -------------------------------------------------------------
   * 2. Roteamento Simples Baseado em Hash (#/board ou #/thread)
   * ------------------------------------------------------------- */
  handleRouting() {
    const hash = window.location.hash.replace("#", "") || "";
    const parts = hash.split("/").filter(Boolean);

    if (parts[0] === "thread" && parts[1]) {
      const threadId = parts[1];
      const threads = this.getThreads();
      const thread = threads.find(t => t.id === threadId);
      if (thread) {
        this.currentBoardSlug = thread.boardSlug;
        this.activeThreadId = threadId;
        this.renderAll();
        return;
      }
    }

    if (parts[0] === "catalog" && parts[1]) {
      this.currentBoardSlug = parts[1];
      this.activeThreadId = null;
      this.viewMode = "catalog";
      this.renderAll();
      return;
    }

    if (parts[0]) {
      const boards = this.getBoards();
      const board = boards.find(b => b.slug === parts[0]);
      if (board) {
        this.currentBoardSlug = board.slug;
        this.activeThreadId = null;
        this.viewMode = "board";
        this.renderAll();
        return;
      }
    }

    // Default: primeira board existente ou 'b'
    const boards = this.getBoards();
    this.currentBoardSlug = boards.length > 0 ? boards[0].slug : "b";
    this.activeThreadId = null;
    this.viewMode = "board";
    this.renderAll();
  }

  /* -------------------------------------------------------------
   * 3. Sessão e Autenticação de Moderador
   * ------------------------------------------------------------- */
  checkSession() {
    const session = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (session === "true") {
      this.isModerator = true;
    } else {
      this.isModerator = false;
    }
    this.updateModBarUI();
  }

  login(username, password) {
    if (username.trim() === MOD_CREDENTIALS.username && password.trim() === MOD_CREDENTIALS.password) {
      this.isModerator = true;
      localStorage.setItem(STORAGE_KEYS.AUTH, "true");
      this.updateModBarUI();
      this.closeModal("login-modal");
      this.showToast("Autenticado como Moderador com sucesso!", "success");
      this.renderAll();
      return true;
    }
    return false;
  }

  logout() {
    this.isModerator = false;
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    this.updateModBarUI();
    this.showToast("Sessão de moderador encerrada.", "success");
    this.renderAll();
  }

  updateModBarUI() {
    const modBar = document.getElementById("mod-active-bar");
    const modLoginBtn = document.getElementById("nav-mod-login-btn");
    
    if (this.isModerator) {
      if (modBar) modBar.style.display = "flex";
      if (modLoginBtn) {
        modLoginBtn.innerHTML = `🛡️ CMS Mod <span class="mod-badge">ATIVO</span>`;
      }
    } else {
      if (modBar) modBar.style.display = "none";
      if (modLoginBtn) {
        modLoginBtn.innerHTML = `🛡️ Mod Login`;
      }
    }
  }

  /* -------------------------------------------------------------
   * 4. Renderização da Interface
   * ------------------------------------------------------------- */
  renderAll() {
    this.renderNavBoards();
    this.renderBoardHeader();
    this.renderBoardControls();
    this.renderPostForm();
    this.renderContent();
  }

  renderNavBoards() {
    const navBoardsEl = document.getElementById("nav-boards-list");
    if (!navBoardsEl) return;

    const boards = this.getBoards();
    const html = boards.map(b => {
      const isActive = b.slug === this.currentBoardSlug && !this.activeThreadId;
      return `<a href="#${b.slug}" class="${isActive ? 'active' : ''}">/${b.slug}/</a>`;
    }).join(` <span class="nav-bracket">/</span> `);

    navBoardsEl.innerHTML = `<span class="nav-bracket">[</span> ${html} <span class="nav-bracket">]</span>`;
  }

  renderBoardHeader() {
    const boards = this.getBoards();
    const currentBoard = boards.find(b => b.slug === this.currentBoardSlug) || {
      slug: this.currentBoardSlug,
      name: "Board",
      description: "Discussões diversas"
    };

    const boardHeading = document.getElementById("board-heading");
    const boardSubtitle = document.getElementById("board-subtitle");

    if (boardHeading) {
      boardHeading.textContent = `/${currentBoard.slug}/ - ${currentBoard.name}`;
    }
    if (boardSubtitle) {
      boardSubtitle.textContent = currentBoard.description;
    }
  }

  renderBoardControls() {
    const container = document.getElementById("board-controls");
    if (!container) return;

    const isThreadView = !!this.activeThreadId;

    if (isThreadView) {
      container.innerHTML = `
        <div class="btn-group">
          <a href="#${this.currentBoardSlug}" class="action-btn">
            ⬅ Voltar para /${this.currentBoardSlug}/
          </a>
          <button id="toggle-form-btn" class="action-btn">
            ✍️ Responder a esta Thread
          </button>
        </div>
        <div class="btn-group">
          <a href="#catalog/${this.currentBoardSlug}" class="action-btn">
            📑 Catálogo
          </a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="btn-group">
          <button id="toggle-form-btn" class="action-btn">
            ✍️ Criar Novo Tópico
          </button>
        </div>
        <div class="btn-group">
          <button id="view-board-btn" class="action-btn ${this.viewMode === 'board' ? 'active' : ''}">
            📜 Modo Lista
          </button>
          <button id="view-catalog-btn" class="action-btn ${this.viewMode === 'catalog' ? 'active' : ''}">
            📑 Modo Catálogo
          </button>
        </div>
      `;

      // Event listeners dos botões de modo
      const viewBoardBtn = document.getElementById("view-board-btn");
      const viewCatalogBtn = document.getElementById("view-catalog-btn");
      if (viewBoardBtn) {
        viewBoardBtn.addEventListener("click", () => {
          this.viewMode = "board";
          window.location.hash = `#${this.currentBoardSlug}`;
        });
      }
      if (viewCatalogBtn) {
        viewCatalogBtn.addEventListener("click", () => {
          this.viewMode = "catalog";
          window.location.hash = `#catalog/${this.currentBoardSlug}`;
        });
      }
    }

    const toggleFormBtn = document.getElementById("toggle-form-btn");
    if (toggleFormBtn) {
      toggleFormBtn.addEventListener("click", () => {
        const formBox = document.getElementById("post-form-box");
        if (formBox) {
          formBox.classList.toggle("hidden");
          if (!formBox.classList.contains("hidden")) {
            formBox.scrollIntoView({ behavior: "smooth" });
          }
        }
      });
    }
  }

  renderPostForm() {
    const formBox = document.getElementById("post-form-box");
    if (!formBox) return;

    const isThreadView = !!this.activeThreadId;
    const formTitle = document.getElementById("form-box-title");
    const subjectRow = document.getElementById("form-subject-row");

    if (formTitle) {
      formTitle.textContent = isThreadView ? `Responder à Thread #${this.activeThreadId}` : `Criar Novo Tópico em /${this.currentBoardSlug}/`;
    }

    // Assunto é obrigatório/visível no OP, opcional em replies
    if (subjectRow) {
      subjectRow.style.display = isThreadView ? "none" : "block";
    }
  }

  renderContent() {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    const threads = this.getThreads().filter(t => t.boardSlug === this.currentBoardSlug);

    // Ordenar: fixados primeiro, depois mais recentes
    threads.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    if (this.activeThreadId) {
      this.renderThreadDetail(this.activeThreadId, mainContent);
      return;
    }

    if (this.viewMode === "catalog") {
      this.renderCatalogView(threads, mainContent);
      return;
    }

    this.renderBoardView(threads, mainContent);
  }

  /* -------------------------------------------------------------
   * 4.1 Renderização: Modo Board (Lista clássica)
   * ------------------------------------------------------------- */
  renderBoardView(threads, container) {
    if (threads.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-secondary); border: 1px dashed var(--border-dark); border-radius: 4px;">
          <p style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">Nenhum tópico criado nesta aba ainda.</p>
          <p>Seja o primeiro a iniciar uma conversa anônima!</p>
        </div>
      `;
      return;
    }

    const html = threads.map(thread => {
      const replyCount = thread.replies ? thread.replies.length : 0;
      // No modo board, exibe as últimas 3 respostas (como no 4chan)
      const visibleReplies = (thread.replies || []).slice(-3);
      const omittedCount = replyCount - visibleReplies.length;

      return `
        <div class="thread-container" id="t${thread.id}">
          <!-- Post Original (OP) -->
          <div class="op-post" id="p${thread.id}">
            <div class="post-header">
              ${thread.isPinned ? `<span class="post-badge badge-pinned">📌 FIXADO</span>` : ""}
              ${thread.isLocked ? `<span class="post-badge badge-locked">🔒 TRANCADO</span>` : ""}
              ${thread.subject ? `<span class="post-subject">${this.escapeHTML(thread.subject)}</span>` : ""}
              <span class="post-name ${thread.isMod ? 'is-mod' : ''}">${this.escapeHTML(thread.name || 'Anônimo')}</span>
              <span class="post-date">${thread.formattedDate}</span>
              <span class="post-id" onclick="app.insertReplyQuote('${thread.id}')">No.${thread.id}</span>
              <a href="#thread/${thread.id}" class="reply-btn-link">[Responder]</a>
              
              ${this.renderModActions(thread.id, true, thread.isPinned, thread.isLocked)}
            </div>

            <div class="post-body">
              ${this.renderMediaBox(thread.media)}
              <div class="post-text">${this.formatPostText(thread.text)}</div>
            </div>
          </div>

          <!-- Contador de respostas omitidas -->
          ${omittedCount > 0 ? `
            <div class="omitted-replies">
              <a href="#thread/${thread.id}">
                ${omittedCount} resposta${omittedCount > 1 ? 's' : ''} omitida${omittedCount > 1 ? 's' : ''}. Clique aqui para ver a discussão completa.
              </a>
            </div>
          ` : ""}

          <!-- Respostas Visíveis -->
          <div class="replies-container">
            ${visibleReplies.map(reply => this.renderReplyCard(reply, thread.id)).join("")}
          </div>
        </div>
      `;
    }).join("");

    container.innerHTML = html;
  }

  /* -------------------------------------------------------------
   * 4.2 Renderização: Thread Completa
   * ------------------------------------------------------------- */
  renderThreadDetail(threadId, container) {
    const threads = this.getThreads();
    const thread = threads.find(t => t.id === threadId);

    if (!thread) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--danger-color);">
          <h3>Tópico #${threadId} não encontrado ou foi excluído.</h3>
          <p><a href="#${this.currentBoardSlug}">Voltar para a lista</a></p>
        </div>
      `;
      return;
    }

    const replies = thread.replies || [];

    const html = `
      <div class="thread-container" id="t${thread.id}">
        <!-- Post Original (OP) -->
        <div class="op-post" id="p${thread.id}">
          <div class="post-header">
            ${thread.isPinned ? `<span class="post-badge badge-pinned">📌 FIXADO</span>` : ""}
            ${thread.isLocked ? `<span class="post-badge badge-locked">🔒 TRANCADO</span>` : ""}
            ${thread.subject ? `<span class="post-subject">${this.escapeHTML(thread.subject)}</span>` : ""}
            <span class="post-name ${thread.isMod ? 'is-mod' : ''}">${this.escapeHTML(thread.name || 'Anônimo')}</span>
            <span class="post-date">${thread.formattedDate}</span>
            <span class="post-id" onclick="app.insertReplyQuote('${thread.id}')">No.${thread.id}</span>
            
            ${this.renderModActions(thread.id, true, thread.isPinned, thread.isLocked)}
          </div>

          <div class="post-body">
            ${this.renderMediaBox(thread.media)}
            <div class="post-text">${this.formatPostText(thread.text)}</div>
          </div>
        </div>

        <div style="margin: 12px 0 6px 20px; font-size: 12px; color: var(--text-muted); font-weight: bold;">
          Respostas (${replies.length}):
        </div>

        <!-- Lista completa de respostas -->
        <div class="replies-container">
          ${replies.length === 0 ? `
            <div style="color: var(--text-muted); font-style: italic; padding: 10px 0;">
              Ainda não há respostas para este tópico. Seja o primeiro a opinar!
            </div>
          ` : replies.map(reply => this.renderReplyCard(reply, thread.id)).join("")}
        </div>

        <div class="thread-footer">
          <a href="#${this.currentBoardSlug}" class="action-btn">⬅ Voltar ao Board</a>
          ${thread.isLocked ? `<span style="color: var(--locked-badge); font-weight: bold;">🔒 Este tópico foi trancado pela moderação. Novas respostas desativadas.</span>` : `
            <button class="action-btn" onclick="document.getElementById('post-form-box').classList.remove('hidden'); document.getElementById('post-form-box').scrollIntoView({behavior:'smooth'});">✍️ Postar Resposta</button>
          `}
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  /* -------------------------------------------------------------
   * 4.3 Renderização: Modo Catálogo (Grade com Cards)
   * ------------------------------------------------------------- */
  renderCatalogView(threads, container) {
    if (threads.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Nenhum tópico no catálogo.</div>`;
      return;
    }

    const cardsHtml = threads.map(thread => {
      const replyCount = thread.replies ? thread.replies.length : 0;
      const thumb = thread.media ? thread.media.thumbUrl || thread.media.url : "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23bfdbfe'><text x='50%' y='55%' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%231e3a8a'>SEM IMAGEM</text></svg>";

      return `
        <div class="catalog-card" onclick="window.location.hash='#thread/${thread.id}'">
          <div class="catalog-thumb-box">
            <img src="${thumb}" class="catalog-thumb" alt="Thumbnail" />
          </div>
          <div class="catalog-meta">R: <b>${replyCount}</b> ${thread.isPinned ? '📌' : ''} ${thread.isLocked ? '🔒' : ''}</div>
          ${thread.subject ? `<div class="catalog-subject">${this.escapeHTML(thread.subject)}</div>` : ""}
          <div class="catalog-snippet">${this.escapeHTML(thread.text.substring(0, 110))}</div>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div style="margin-bottom: 12px; font-weight: bold; color: var(--title-color);">
        📑 Catálogo de Threads em /${this.currentBoardSlug}/ (${threads.length})
      </div>
      <div class="catalog-grid">${cardsHtml}</div>
    `;
  }

  /* -------------------------------------------------------------
   * 4.4 Renderização de Componentes de Post & Mídia
   * ------------------------------------------------------------- */
  renderReplyCard(reply, threadId) {
    return `
      <div class="reply-card" id="p${reply.id}">
        <div class="post-header">
          <span class="post-name ${reply.isMod ? 'is-mod' : ''}">${this.escapeHTML(reply.name || 'Anônimo')}</span>
          <span class="post-date">${reply.formattedDate}</span>
          <span class="post-id" onclick="app.insertReplyQuote('${reply.id}')">No.${reply.id}</span>
          
          ${this.renderModActions(reply.id, false, false, false, threadId)}
        </div>
        <div class="post-body">
          ${this.renderMediaBox(reply.media)}
          <div class="post-text">${this.formatPostText(reply.text)}</div>
        </div>
      </div>
    `;
  }

  renderMediaBox(media) {
    if (!media || !media.url) return "";
    return `
      <div class="post-media-box">
        <div class="post-media-meta">
          Arquivo: <a href="javascript:void(0)" onclick="app.openLightbox('${media.url}', '${this.escapeHTML(media.fileName || 'imagem')}')">${this.escapeHTML(media.fileName || 'imagem')}</a> (${media.fileSize || 'N/A'})
        </div>
        <img src="${media.thumbUrl || media.url}" class="post-thumb" alt="Anexo" onclick="app.openLightbox('${media.url}', '${this.escapeHTML(media.fileName || 'imagem')}')" />
      </div>
    `;
  }

  renderModActions(postId, isThread = false, isPinned = false, isLocked = false, parentThreadId = null) {
    if (!this.isModerator) return "";

    return `
      <div class="post-actions">
        ${isThread ? `
          <button class="mod-lock-btn" onclick="app.toggleLockThread('${postId}')" title="Trancar/Destrancar tópico">
            ${isLocked ? "🔓 Destrancar" : "🔒 Trancar"}
          </button>
          <button class="action-btn" style="font-size: 11px; padding: 1px 6px;" onclick="app.togglePinThread('${postId}')" title="Fixar/Desafixar no topo">
            ${isPinned ? "📍 Desafixar" : "📌 Fixar"}
          </button>
        ` : ""}
        <button class="mod-post-btn" onclick="app.deletePost('${postId}', ${isThread}, '${parentThreadId || ''}')" title="Excluir do fórum">
          🗑 Excluir
        </button>
      </div>
    `;
  }

  /* -------------------------------------------------------------
   * 5. Parser de Texto Retrô (Greentext & >>Quote Links)
   * ------------------------------------------------------------- */
  formatPostText(rawText) {
    if (!rawText) return "";
    const lines = rawText.split("\n");
    const parsedLines = lines.map(line => {
      let escaped = this.escapeHTML(line);

      // Greentext: linhas que começam com > (e não >>)
      if (escaped.startsWith("&gt;") && !escaped.startsWith("&gt;&gt;")) {
        return `<span class="greentext">${escaped}</span>`;
      }

      // Citação de Post: >>1234
      escaped = escaped.replace(/&gt;&gt;(\d+)/g, (match, pId) => {
        return `<a href="javascript:void(0)" class="post-quote-link" onclick="app.highlightPost('${pId}')">&gt;&gt;${pId}</a>`;
      });

      return escaped;
    });

    return parsedLines.join("<br>");
  }

  escapeHTML(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  highlightPost(postId) {
    const el = document.getElementById(`p${postId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlight");
      setTimeout(() => el.classList.remove("highlight"), 2500);
    } else {
      // Se o post não estiver visível (ex: em outra thread ou omitido), navega até a thread correspondente
      const threads = this.getThreads();
      const targetThread = threads.find(t => t.id === postId || (t.replies && t.replies.some(r => r.id === postId)));
      if (targetThread) {
        window.location.hash = `#thread/${targetThread.id}`;
        setTimeout(() => {
          const targetEl = document.getElementById(`p${postId}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
            targetEl.classList.add("highlight");
            setTimeout(() => targetEl.classList.remove("highlight"), 2500);
          }
        }, 150);
      } else {
        this.showToast(`Post >>${postId} não foi encontrado.`, "danger");
      }
    }
  }

  insertReplyQuote(postId) {
    const threads = this.getThreads();
    const thread = threads.find(t => t.id === postId || (t.replies && t.replies.some(r => r.id === postId)));

    // Se estiver em modo board e clicar em um post, entra na thread antes de citar
    if (thread && this.activeThreadId !== thread.id) {
      window.location.hash = `#thread/${thread.id}`;
      setTimeout(() => {
        const formBox = document.getElementById("post-form-box");
        if (formBox) {
          formBox.classList.remove("hidden");
          formBox.scrollIntoView({ behavior: "smooth" });
        }
        const textarea = document.getElementById("post-text-input");
        if (textarea) {
          const currentVal = textarea.value.trim();
          textarea.value = (currentVal ? currentVal + "\n" : "") + `>>${postId}\n`;
          textarea.focus();
        }
      }, 100);
      return;
    }

    const formBox = document.getElementById("post-form-box");
    if (formBox) {
      formBox.classList.remove("hidden");
      formBox.scrollIntoView({ behavior: "smooth" });
    }
    const textarea = document.getElementById("post-text-input");
    if (textarea) {
      const currentVal = textarea.value.trim();
      textarea.value = (currentVal ? currentVal + "\n" : "") + `>>${postId}\n`;
      textarea.focus();
    }
  }

  /* -------------------------------------------------------------
   * 6. Envio de Novos Posts e Threads
   * ------------------------------------------------------------- */
  submitPost() {
    const nameInput = document.getElementById("post-name-input");
    const subjectInput = document.getElementById("post-subject-input");
    const textInput = document.getElementById("post-text-input");

    const text = textInput ? textInput.value.trim() : "";
    const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Anônimo";
    const subject = subjectInput ? subjectInput.value.trim() : "";

    if (!text && !this.currentAttachment) {
      this.showToast("Por favor, digite uma mensagem ou selecione uma imagem para postar.", "danger");
      return;
    }

    const postId = this.getNextPostId();
    const now = new Date();
    const formattedDate = this.formatDate(now);

    const threads = this.getThreads();

    // Se estiver em modo Thread View, adiciona uma resposta (Reply)
    if (this.activeThreadId) {
      const threadIndex = threads.findIndex(t => t.id === this.activeThreadId);
      if (threadIndex === -1) {
        this.showToast("Erro: Tópico não encontrado.", "danger");
        return;
      }

      if (threads[threadIndex].isLocked && !this.isModerator) {
        this.showToast("Este tópico está trancado para novas respostas.", "danger");
        return;
      }

      const newReply = {
        id: postId,
        name: this.isModerator ? (name === "Anônimo" ? MOD_CREDENTIALS.username : name) : name,
        tripcode: this.isModerator ? "#ADMIN" : "",
        isMod: this.isModerator,
        timestamp: now.toISOString(),
        formattedDate: formattedDate,
        text: text,
        media: this.currentAttachment ? { ...this.currentAttachment } : null
      };

      if (!threads[threadIndex].replies) {
        threads[threadIndex].replies = [];
      }
      threads[threadIndex].replies.push(newReply);
      this.saveThreads(threads);
      this.showToast(`Resposta No.${postId} postada com sucesso!`, "success");
    } 
    // Caso contrário, cria um novo Tópico (OP)
    else {
      const newThread = {
        id: postId,
        boardSlug: this.currentBoardSlug,
        subject: subject,
        name: this.isModerator ? (name === "Anônimo" ? MOD_CREDENTIALS.username : name) : name,
        tripcode: this.isModerator ? "#ADMIN" : "",
        isMod: this.isModerator,
        isPinned: false,
        isLocked: false,
        timestamp: now.toISOString(),
        formattedDate: formattedDate,
        text: text,
        media: this.currentAttachment ? { ...this.currentAttachment } : null,
        replies: []
      };

      threads.unshift(newThread);
      this.saveThreads(threads);
      this.showToast(`Tópico No.${postId} criado com sucesso!`, "success");
    }

    // Resetar formulário
    if (textInput) textInput.value = "";
    if (subjectInput) subjectInput.value = "";
    this.removeAttachment();
    
    // Ocultar formulário após postar
    const formBox = document.getElementById("post-form-box");
    if (formBox) formBox.classList.add("hidden");

    this.renderAll();
  }

  formatDate(date) {
    const pad = n => n.toString().padStart(2, "0");
    const d = pad(date.getDate());
    const m = pad(date.getMonth() + 1);
    const y = date.getFullYear().toString().slice(-2);
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dayName = days[date.getDay()];
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${d}/${m}/${y}(${dayName})${hh}:${mm}:${ss}`;
  }

  /* -------------------------------------------------------------
   * 7. Processamento e Compressão Inteligente de Mídia
   * ------------------------------------------------------------- */
  handleFileUpload(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      this.showToast("Apenas arquivos de imagem são suportados.", "danger");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar para no máximo 800px para poupar LocalStorage
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Compressão em JPEG leve
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.78);
        const approxKb = Math.round((compressedBase64.length * 3) / 4 / 1024);

        this.currentAttachment = {
          fileName: file.name,
          fileSize: `${approxKb} KB`,
          url: compressedBase64,
          thumbUrl: compressedBase64
        };

        this.updateAttachmentPreview();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  handleUrlAttachment(url) {
    if (!url || !url.trim()) return;
    const cleanUrl = url.trim();
    this.currentAttachment = {
      fileName: cleanUrl.split("/").pop().split("?")[0] || "imagem-web.jpg",
      fileSize: "URL Externa",
      url: cleanUrl,
      thumbUrl: cleanUrl
    };
    this.updateAttachmentPreview();
  }

  removeAttachment() {
    this.currentAttachment = null;
    const fileInput = document.getElementById("post-file-input");
    const urlInput = document.getElementById("post-url-input");
    if (fileInput) fileInput.value = "";
    if (urlInput) urlInput.value = "";
    this.updateAttachmentPreview();
  }

  updateAttachmentPreview() {
    const previewContainer = document.getElementById("media-preview-container");
    const previewThumb = document.getElementById("preview-thumb");
    const previewInfo = document.getElementById("preview-info");

    if (!previewContainer) return;

    if (this.currentAttachment) {
      previewContainer.classList.remove("hidden");
      if (previewThumb) previewThumb.src = this.currentAttachment.thumbUrl;
      if (previewInfo) {
        previewInfo.textContent = `${this.currentAttachment.fileName} (${this.currentAttachment.fileSize})`;
      }
    } else {
      previewContainer.classList.add("hidden");
      if (previewThumb) previewThumb.src = "";
    }
  }

  /* -------------------------------------------------------------
   * 8. Ações de Moderação (Excluir, Trancar, Fixar)
   * ------------------------------------------------------------- */
  deletePost(postId, isThread, parentThreadId) {
    if (!this.isModerator) return;

    if (!confirm(`Tem certeza de que deseja excluir ${isThread ? 'o tópico completo e todas as respostas' : 'esta resposta'} No.${postId}?`)) {
      return;
    }

    const threads = this.getThreads();

    if (isThread) {
      const filtered = threads.filter(t => t.id !== postId);
      this.saveThreads(filtered);
      this.showToast(`Tópico No.${postId} excluído pelo moderador.`, "success");
      if (this.activeThreadId === postId) {
        window.location.hash = `#${this.currentBoardSlug}`;
      } else {
        this.renderAll();
      }
    } else {
      // Excluir resposta dentro de uma thread
      const thread = threads.find(t => t.id === parentThreadId || (t.replies && t.replies.some(r => r.id === postId)));
      if (thread && thread.replies) {
        thread.replies = thread.replies.filter(r => r.id !== postId);
        this.saveThreads(threads);
        this.showToast(`Resposta No.${postId} excluída.`, "success");
        this.renderAll();
      }
    }
  }

  toggleLockThread(threadId) {
    if (!this.isModerator) return;
    const threads = this.getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      thread.isLocked = !thread.isLocked;
      this.saveThreads(threads);
      this.showToast(`Tópico No.${threadId} agora está ${thread.isLocked ? 'TRANCADO' : 'DESTRANCADO'}.`, "success");
      this.renderAll();
    }
  }

  togglePinThread(threadId) {
    if (!this.isModerator) return;
    const threads = this.getThreads();
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      thread.isPinned = !thread.isPinned;
      this.saveThreads(threads);
      this.showToast(`Tópico No.${threadId} agora está ${thread.isPinned ? 'FIXADO' : 'DESAFIXADO'}.`, "success");
      this.renderAll();
    }
  }

  /* -------------------------------------------------------------
   * 9. Painel CMS de Administração
   * ------------------------------------------------------------- */
  openCmsModal() {
    if (!this.isModerator) {
      this.openModal("login-modal");
      return;
    }
    this.renderCmsStats();
    this.renderCmsBoardsTable();
    this.renderCmsThreadsTable();
    this.openModal("cms-modal");
  }

  renderCmsStats() {
    const boards = this.getBoards();
    const threads = this.getThreads();
    let totalReplies = 0;
    let totalImages = 0;

    threads.forEach(t => {
      if (t.media) totalImages++;
      if (t.replies) {
        totalReplies += t.replies.length;
        t.replies.forEach(r => {
          if (r.media) totalImages++;
        });
      }
    });

    const statBoards = document.getElementById("cms-stat-boards");
    const statThreads = document.getElementById("cms-stat-threads");
    const statReplies = document.getElementById("cms-stat-replies");
    const statImages = document.getElementById("cms-stat-images");

    if (statBoards) statBoards.textContent = boards.length;
    if (statThreads) statThreads.textContent = threads.length;
    if (statReplies) statReplies.textContent = totalReplies;
    if (statImages) statImages.textContent = totalImages;
  }

  renderCmsBoardsTable() {
    const tbody = document.getElementById("cms-boards-table-body");
    if (!tbody) return;

    const boards = this.getBoards();
    const threads = this.getThreads();

    const rows = boards.map(b => {
      const threadCount = threads.filter(t => t.boardSlug === b.slug).length;
      return `
        <tr>
          <td><b>/${b.slug}/</b></td>
          <td>${this.escapeHTML(b.name)}</td>
          <td>${this.escapeHTML(b.description)}</td>
          <td>${threadCount}</td>
          <td class="actions-cell">
            <button class="cms-action-btn cms-edit-btn" onclick="app.editBoard('${b.slug}')">Editar</button>
            <button class="cms-action-btn cms-delete-btn" onclick="app.deleteBoard('${b.slug}')">Excluir</button>
          </td>
        </tr>
      `;
    }).join("");

    tbody.innerHTML = rows;
  }

  renderCmsThreadsTable() {
    const tbody = document.getElementById("cms-threads-table-body");
    if (!tbody) return;

    const threads = this.getThreads();

    const rows = threads.map(t => {
      const replyCount = t.replies ? t.replies.length : 0;
      return `
        <tr>
          <td>No.${t.id}</td>
          <td>/${t.boardSlug}/</td>
          <td>${this.escapeHTML(t.subject || t.text.substring(0, 30))}</td>
          <td>${replyCount}</td>
          <td>
            ${t.isPinned ? '<span class="post-badge badge-pinned">Fixado</span>' : ''}
            ${t.isLocked ? '<span class="post-badge badge-locked">Trancado</span>' : 'Aberto'}
          </td>
          <td class="actions-cell">
            <button class="cms-action-btn cms-edit-btn" onclick="app.toggleLockThread('${t.id}'); app.renderCmsThreadsTable();">
              ${t.isLocked ? 'Destrancar' : 'Trancar'}
            </button>
            <button class="cms-action-btn cms-delete-btn" onclick="app.deletePost('${t.id}', true); app.renderCmsThreadsTable(); app.renderCmsStats();">
              Excluir
            </button>
          </td>
        </tr>
      `;
    }).join("");

    tbody.innerHTML = rows;
  }

  saveBoardForm(e) {
    e.preventDefault();
    const slugInput = document.getElementById("cms-board-slug");
    const nameInput = document.getElementById("cms-board-name");
    const descInput = document.getElementById("cms-board-desc");

    const rawSlug = slugInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const name = nameInput.value.trim();
    const desc = descInput.value.trim();

    if (!rawSlug || !name) {
      this.showToast("Preencha a sigla e o nome da board.", "danger");
      return;
    }

    const boards = this.getBoards();
    const existingIndex = boards.findIndex(b => b.slug === rawSlug);

    if (existingIndex >= 0) {
      // Atualizar existente
      boards[existingIndex].name = name;
      boards[existingIndex].description = desc;
      this.showToast(`Board /${rawSlug}/ atualizada com sucesso!`, "success");
    } else {
      // Nova board
      boards.push({
        id: rawSlug,
        slug: rawSlug,
        name: name,
        description: desc,
        createdAt: new Date().toISOString()
      });
      this.showToast(`Nova board /${rawSlug}/ criada com sucesso!`, "success");
    }

    this.saveBoards(boards);
    slugInput.value = "";
    nameInput.value = "";
    descInput.value = "";
    slugInput.removeAttribute("readonly");

    this.renderCmsBoardsTable();
    this.renderCmsStats();
    this.renderAll();
  }

  editBoard(slug) {
    const boards = this.getBoards();
    const board = boards.find(b => b.slug === slug);
    if (!board) return;

    const slugInput = document.getElementById("cms-board-slug");
    const nameInput = document.getElementById("cms-board-name");
    const descInput = document.getElementById("cms-board-desc");

    slugInput.value = board.slug;
    slugInput.setAttribute("readonly", "true");
    nameInput.value = board.name;
    descInput.value = board.description;
    nameInput.focus();
  }

  deleteBoard(slug) {
    if (!confirm(`Deseja realmente excluir a board /${slug}/ e TODAS as suas postagens?`)) {
      return;
    }

    let boards = this.getBoards();
    if (boards.length <= 1) {
      this.showToast("Você não pode excluir a única board restante.", "danger");
      return;
    }

    boards = boards.filter(b => b.slug !== slug);
    this.saveBoards(boards);

    // Remover threads associadas
    let threads = this.getThreads();
    threads = threads.filter(t => t.boardSlug !== slug);
    this.saveThreads(threads);

    this.showToast(`Board /${slug}/ excluída com sucesso.`, "success");

    if (this.currentBoardSlug === slug) {
      this.currentBoardSlug = boards[0].slug;
      window.location.hash = `#${this.currentBoardSlug}`;
    }

    this.renderCmsBoardsTable();
    this.renderCmsStats();
    this.renderAll();
  }

  resetDemoData() {
    if (!confirm("Restaurar dados padrão de demonstração? Isso recarregará as 4 abas originais e threads de exemplo.")) {
      return;
    }
    localStorage.removeItem(STORAGE_KEYS.BOARDS);
    localStorage.removeItem(STORAGE_KEYS.THREADS);
    this.initData();
    this.showToast("Dados padrão restaurados!", "success");
    this.renderCmsStats();
    this.renderCmsBoardsTable();
    this.renderCmsThreadsTable();
    this.renderAll();
  }

  /* -------------------------------------------------------------
   * 10. Modais, Lightbox e Notificações Toast
   * ------------------------------------------------------------- */
  openLightbox(url, title) {
    const modal = document.getElementById("lightbox-modal");
    const img = document.getElementById("lightbox-img");
    const caption = document.getElementById("lightbox-caption");

    if (modal && img) {
      img.src = url;
      if (caption) caption.textContent = title || "Imagem ampliada";
      modal.classList.remove("hidden");
    }
  }

  closeLightbox() {
    const modal = document.getElementById("lightbox-modal");
    if (modal) modal.classList.add("hidden");
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("hidden");
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("hidden");
  }

  showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /* -------------------------------------------------------------
   * 11. Event Listeners Globais
   * ------------------------------------------------------------- */
  bindEvents() {
    // Login Mod
    const navModLoginBtn = document.getElementById("nav-mod-login-btn");
    if (navModLoginBtn) {
      navModLoginBtn.addEventListener("click", () => {
        if (this.isModerator) {
          this.openCmsModal();
        } else {
          this.openModal("login-modal");
        }
      });
    }

    const loginForm = document.getElementById("mod-login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const userVal = document.getElementById("mod-username-input").value;
        const passVal = document.getElementById("mod-password-input").value;
        if (!this.login(userVal, passVal)) {
          this.showToast("Usuário ou senha incorretos!", "danger");
        }
      });
    }

    const openCmsBtn = document.getElementById("open-cms-btn");
    if (openCmsBtn) {
      openCmsBtn.addEventListener("click", () => this.openCmsModal());
    }

    const modLogoutBtn = document.getElementById("mod-logout-btn");
    if (modLogoutBtn) {
      modLogoutBtn.addEventListener("click", () => this.logout());
    }

    // Formulário de Postagem
    const postForm = document.getElementById("post-form");
    if (postForm) {
      postForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.submitPost();
      });
    }

    const closeFormBtn = document.getElementById("close-form-btn");
    if (closeFormBtn) {
      closeFormBtn.addEventListener("click", () => {
        document.getElementById("post-form-box").classList.add("hidden");
      });
    }

    // Upload de arquivo
    const fileInput = document.getElementById("post-file-input");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleFileUpload(e.target.files[0]);
        }
      });
    }

    // URL de Imagem
    const urlInput = document.getElementById("post-url-input");
    if (urlInput) {
      urlInput.addEventListener("change", (e) => {
        if (e.target.value.trim()) {
          this.handleUrlAttachment(e.target.value.trim());
        }
      });
    }

    const removeMediaBtn = document.getElementById("remove-media-btn");
    if (removeMediaBtn) {
      removeMediaBtn.addEventListener("click", () => this.removeAttachment());
    }

    // Lightbox fechar
    const lightboxModal = document.getElementById("lightbox-modal");
    if (lightboxModal) {
      lightboxModal.addEventListener("click", () => this.closeLightbox());
    }

    // CMS Tabs
    const cmsTabBtns = document.querySelectorAll(".cms-tab-btn");
    cmsTabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        cmsTabBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".cms-section").forEach(sec => sec.classList.remove("active"));
        const targetSec = document.getElementById(`cms-tab-${targetTab}`);
        if (targetSec) targetSec.classList.add("active");
      });
    });

    // Formulário de Nova Board no CMS
    const boardForm = document.getElementById("cms-board-form");
    if (boardForm) {
      boardForm.addEventListener("submit", (e) => this.saveBoardForm(e));
    }

    const resetDataBtn = document.getElementById("cms-reset-data-btn");
    if (resetDataBtn) {
      resetDataBtn.addEventListener("click", () => this.resetDemoData());
    }
  }
}

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  window.app = new YchanApp();
});
