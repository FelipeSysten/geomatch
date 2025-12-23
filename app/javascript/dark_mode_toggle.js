// app/javascript/dark_mode_toggle.js

document.addEventListener('turbo:load', () => {
  const toggleButton = document.getElementById('theme-toggle');
  const body = document.body;
  const STORAGE_KEY = 'theme-preference';
  const DARK_MODE_CLASS = 'dark-mode';

  // 1. Função para aplicar o tema
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      body.classList.add(DARK_MODE_CLASS);
      // Atualiza o ícone do botão para o sol (indicando que o próximo clique será para o modo claro)
      if (toggleButton) {
        toggleButton.querySelector('i').className = 'fas fa-sun';
        toggleButton.querySelector('.nav-text').textContent = 'Modo Claro';
      }
    } else {
      body.classList.remove(DARK_MODE_CLASS);
      // Atualiza o ícone do botão para a lua (indicando que o próximo clique será para o modo escuro)
      if (toggleButton) {
        toggleButton.querySelector('i').className = 'fas fa-moon';
        toggleButton.querySelector('.nav-text').textContent = 'Modo Escuro';
      }
    }
  };

  // 2. Função para obter a preferência inicial
  const getPreferredTheme = () => {
    // Tenta obter a preferência do localStorage
    const storedPreference = localStorage.getItem(STORAGE_KEY);
    if (storedPreference) {
      return storedPreference;
    }

    // Se não houver no localStorage, verifica a preferência do sistema
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    // Padrão: modo claro
    return 'light';
  };

  // 3. Aplica o tema inicial ao carregar a página
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // 4. Listener para o botão de alternância
  if (toggleButton) {
    toggleButton.addEventListener('click', () => {
      const currentTheme = body.classList.contains(DARK_MODE_CLASS) ? 'dark' : 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // Aplica o novo tema
      applyTheme(newTheme);

      // Salva a nova preferência no localStorage
      localStorage.setItem(STORAGE_KEY, newTheme);
    });
  }

  // 5. Listener para mudanças na preferência do sistema (opcional, mas recomendado)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    // Se o usuário não tiver uma preferência salva, atualiza o tema automaticamente
    if (!localStorage.getItem(STORAGE_KEY)) {
      const newTheme = e.matches ? 'dark' : 'light';
      applyTheme(newTheme);
    }
  });
});
