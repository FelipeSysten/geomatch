class PublicController < ApplicationController
  def landing
    # Renderiza a página de boas-vindas (landing page)
  end

  def terms
    # Renderiza os termos de uso
  end

  def privacy
    # Renderiza a política de privacidade
  end

  def profiles
    # Renderiza a listagem pública dos perfis
    # Exemplo: Limita os perfis a 10 no máximo, mostrando apenas informações básicas
    @users = User.limit(10).select(:username, :created_at)
  end
end