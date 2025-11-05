Rails.application.routes.draw do

  # Rotas Públicas
  root 'public#landing' # Define a landing page como a página inicial (sem login)

  # Páginas Públicas
  get '/terms', to: 'public#terms', as: :terms_of_use
  get '/privacy', to: 'public#privacy', as: :privacy_policy
  get '/profiles', to: 'public#profiles', as: :public_profiles



  devise_for :users

  resources :users do
    collection do
      get :nearby
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check
end
