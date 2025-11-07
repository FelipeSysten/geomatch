Rails.application.routes.draw do
  # Página inicial pública
  root 'public#landing'

  # Páginas públicas
  get '/terms', to: 'public#terms', as: :terms_of_use
  get '/privacy', to: 'public#privacy', as: :privacy_policy
  get '/profiles', to: 'public#profiles', as: :public_profiles

  # Descoberta (mapa)
  get '/discover', to: 'users#discover', as: :discover

  # Endpoint JSON para busca de usuários próximos
  get '/users/nearby', to: 'users#nearby'

  devise_for :users

  resources :users, only: [:show, :update]
  
  # Health check
  get 'up' => 'rails/health#show', as: :rails_health_check
end
