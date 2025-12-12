# config/routes.rb

Rails.application.routes.draw do
  # =================================================================
  # 1. AUTENTICAÇÃO (DEVISE) - MOVIDO PARA O TOPO PARA EVITAR CONFLITOS
  # =================================================================
  devise_for :users

  # Logout rápido (mantido aqui, logo após o Devise)
  devise_scope :user do
    delete "/logout", to: "devise/sessions#destroy", as: :logout
  end

  # =================================================================
  # 2. ROTAS PÚBLICAS E GERAIS
  # =================================================================
  get "notifications/index"

  # Página inicial pública
  root "public#landing"

  # Páginas públicas
  get "/terms",    to: "public#terms",   as: :terms_of_use
  get "/privacy",  to: "public#privacy", as: :privacy_policy
  get "/profiles", to: "public#profiles", as: :public_profiles

  # Descoberta (mapa)
  get "/discover", to: "users#discover", as: :discover

  # Nova tela de Descoberta (Lead/Swipe)
  get "/lead", to: "users#lead", as: :lead
  post "/lead", to: "users#lead"
  post "/lead/reject", to: "users#reject", as: :reject_user

  # Endpoint JSON para busca de usuários próximos
  get "/users/nearby", to: "users#nearby"

  resources :notifications, only: [:index]

  # Likes (curtidas)
  resources :likes, only: [:create, :destroy]

  # Matches e mensagens dentro do chat
  resources :matches, only: [:index, :show] do
    resources :messages, only: [:index, :create]
  end

  # =================================================================
  # 3. ROTAS DE USUÁRIOS (CONSOLIDADAS)
  # =================================================================

  # Users (exibição e atualização)
  # CONSOLIDADO: O 'show' e 'update' estavam separados, agora estão juntos.
  # O 'show' é o perfil público.
  resources :users, only: [:show, :update]

  # Meu Perfil (Rota customizada para edição do usuário logado)
  # O 'resource' cria as rotas /profile/edit e PATCH /profile
  resource :profile, controller: 'users', only: [:edit, :update]

  # Rota para exclusão de foto do álbum
  delete 'album_photos/:id', to: 'album_photos#destroy', as: :delete_album_photo

  # =================================================================
  # 4. OUTRAS ROTAS
  # =================================================================

  # ActionCable
  mount ActionCable.server => '/cable'

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

end
