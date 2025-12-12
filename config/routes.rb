Rails.application.routes.draw do
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

   # Adiciona a rota para o perfil público (show)
  # Isso cria a rota GET /users/:id que será mapeada para UsersController#show
  resources :users, only: [:show]

  # Matches e mensagens dentro do chat
  resources :matches, only: [:index, :show] do
    # ALTERADO conforme solicitado (agora inclui :index e :create)
    resources :messages, only: [:index, :create]
  end

  # Autenticação (Devise)
  devise_for :users

  # Users (exibição e atualização)
  resources :users, only: [:show, :update]

  # Meu Perfil
  resource :profile, controller: 'users', only: [:edit, :update]

  # Logout rápido
  devise_scope :user do
    delete "/logout", to: "devise/sessions#destroy", as: :logout
  end

  # ActionCable (acrescentado conforme pedido)
  mount ActionCable.server => '/cable'

  # Health check
  get "up" => "rails/health#show", as: :rails_health_check

   # Rota para exclusão de foto do álbum
  delete 'album_photos/:id', to: 'album_photos#destroy', as: :delete_album_photo
  
end
