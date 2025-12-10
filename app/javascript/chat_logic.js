import consumer from "./channels/consumer";

document.addEventListener('DOMContentLoaded', () => {
  const chatWindow = document.getElementById('chat-window');
  const messageInput = document.getElementById('message-input');
  const newMessageForm = document.getElementById('new-message-form');

  if (!chatWindow || !messageInput || !newMessageForm) return;

  const matchId = chatWindow.dataset.matchId;
  const currentUserId = parseInt(chatWindow.dataset.currentUserId, 10);

  let typingTimer;
  const TYPING_TIMEOUT = 3000;

  // =======================================================
  //   SUBSCRIPTION
  // =======================================================
  const matchChannel = consumer.subscriptions.create(
    { channel: "MatchChannel", match_id: matchId },
    {
      connected() {
        console.log("Conectado ao match", matchId);
      },

      received(data) {

        // -------------------------
        //    INDICADOR DE DIGITAÇÃO
        // -------------------------
        if (Object.prototype.hasOwnProperty.call(data, "typing")) {

          // ignora se for o próprio usuário
          if (data.user_id == currentUserId) return;

          updateTypingIndicator(data);
          return; // <- MUITO IMPORTANTE
        }

        // -------------------------
        //     MENSAGEM RECEBIDA
        // -------------------------
        if (data.message) {
          replaceOrAppend(data.message);
        }
      },

      // envia indicação "digitando"
      sendTypingStatus(isTyping) {
        this.perform("receive", { typing: isTyping });
      }
    }
  );

  // =======================================================
  //   ATUALIZA TYPING INDICATOR
  // =======================================================
  function updateTypingIndicator(data) {
    const typing = document.getElementById("typing-indicator");

    if (data.typing === true) {
      typing.innerHTML = `
        <div class="typing-user">
          <img src="${data.user_avatar || '/assets/avatarfoto.jpg'}" class="typing-avatar">
          <span>${data.user_name || "Usuário"} está digitando</span>
          <span class="dots"><span></span><span></span><span></span></span>
        </div>
      `;
      typing.style.display = "block";
    } else {
      typing.style.display = "none";
    }
  }

  // =======================================================
  //   CAPTURA DE "ESTÁ DIGITANDO"
  // =======================================================
  messageInput.addEventListener("input", () => {
    matchChannel.sendTypingStatus(true);

    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      matchChannel.sendTypingStatus(false);
    }, TYPING_TIMEOUT);
  });

  // =======================================================
  //   SUBMIT DA MENSAGEM
  // =======================================================
  newMessageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const content = messageInput.value.trim();
    if (!content) return;

    // cria mensagem temporária
    const tempId = `temp-${Date.now()}`;

    appendMessageToDOM({
      id: tempId,
      content,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      sending: true
    });

    messageInput.value = "";
    matchChannel.sendTypingStatus(false);

   // envia para backend
    fetch(newMessageForm.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ message: { content } }),
    })
    .then(async (response) => {
      if (!response.ok) {
        // Se der erro 500 ou 400, forçamos o erro para cair no catch
        const text = await response.text(); 
        console.error("Erro do servidor:", text); // VAI MOSTRAR O ERRO NO CONSOLE
        throw new Error("Erro na resposta do servidor");
      }
      return response; // Se não retornar JSON, pode ser response.text() ou apenas response
    })
    .catch((error) => {
      console.error(error);
      markMessageFailed(tempId);
    });
  });
  
  // =======================================================
  //   SUBSTITUI TEMP OU INSERE NOVA
  // =======================================================
  function replaceOrAppend(message) {
    // encontra mensagem temporária correspondente
    const temp = document.querySelector(
      `.message[data-sending="true"][data-content="${CSS.escape(message.content)}"]`
    );

    if (temp) {
      temp.id = `msg-${message.id}`;
      temp.dataset.sending = "false";
      return;
    }

    appendMessageToDOM(message);
  }

  // =======================================================
  //   APPEND NO DOM
  // =======================================================
  function appendMessageToDOM(message) {
    // evita duplicado
    if (document.getElementById(`msg-${message.id}`)) return;

    const el = document.createElement("div");

    el.className = `message ${message.sender_id === currentUserId ? "sent" : "received"}`;
    el.id = `msg-${message.id}`;
    el.dataset.sending = message.sending ? "true" : "false";
    el.dataset.content = message.content;

    el.innerHTML = `
      <div class="message-inner">
        ${message.sender_id !== currentUserId
          ? `<img class="avatar" src="${message.avatar_url || '/assets/avatarfoto.jpg'}">`
          : ""
        }
        <div class="bubble">
          <div class="meta">
            ${message.sender_id !== currentUserId ? `<strong class="name">${message.user_name || ""}</strong>` : ""}
            <small class="time">${new Date(message.created_at).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}</small>
          </div>
          <p class="content">${escapeHtml(message.content)}</p>
        </div>
      </div>
    `;

    chatWindow.appendChild(el);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // =======================================================
  //   FUNÇÕES ÚTEIS
  // =======================================================
  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function markMessageFailed(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("failed");
  }
});
