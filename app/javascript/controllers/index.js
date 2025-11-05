// Importação do Stimulus Application
import { Application } from "@hotwired/stimulus";
// Importação de carregamento de controllers
import { eagerLoadControllersFrom } from "@hotwired/stimulus-loading";
// Criação da instância da aplicação Stimulus
const application = Application.start();

// Carrega todos os controllers do Stimulus a partir do diretório atual
eagerLoadControllersFrom("controllers", application);

export { application };