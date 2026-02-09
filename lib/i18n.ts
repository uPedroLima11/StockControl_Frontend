import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import settingsEn from '../public/locales/en/settings.json';
import sidebarEn from '../public/locales/en/sidebar.json';
import settingsPt from '../public/locales/pt/settings.json';
import sidebarPt from '../public/locales/pt/sidebar.json';
import dashboardPt from '../public/locales/pt/dashboard.json';
import dashboardEn from '../public/locales/en/dashboard.json';
import produtosPt from '../public/locales/pt/produtos.json';
import produtosEn from '../public/locales/en/produtos.json';
import usuariosPt from '../public/locales/pt/usuarios.json';
import usuariosEn from '../public/locales/en/usuarios.json';
import contaPt from '../public/locales/pt/conta.json';
import contaEn from '../public/locales/en/conta.json';
import empresaPt from '../public/locales/pt/empresa.json';
import empresaEn from '../public/locales/en/empresa.json';
import criarempresaPt from '../public/locales/pt/criarempresa.json';
import criarempresaEn from '../public/locales/en/criarempresa.json';
import vendasPt from '../public/locales/pt/vendas.json';
import vendasEn from '../public/locales/en/vendas.json';
import ativacaoEn from '../public/locales/en/ativacao.json';
import ativacaoPt from '../public/locales/pt/ativacao.json';
import fornecedoresPt from '../public/locales/pt/fornecedores.json';
import fornecedoresEn from '../public/locales/en/fornecedores.json';
import suporteEn from '../public/locales/en/suporte.json';
import suportePt from '../public/locales/pt/suporte.json';
import logsPt from '../public/locales/pt/logs.json';
import logsEn from '../public/locales/en/logs.json';
import esqueciEn from '../public/locales/en/esqueci.json';
import esqueciPt from '../public/locales/pt/esqueci.json';
import alteracaoPt from '../public/locales/pt/alteracao.json';
import alteracaoEn from '../public/locales/en/alteracao.json';
import clientesPt from '../public/locales/pt/clientes.json';
import clientesEn from '../public/locales/en/clientes.json';
import exportacoesEn from '../public/locales/en/exportacoes.json';
import exportacoesPt from '../public/locales/pt/exportacoes.json';
import estoquePt from '../public/locales/pt/estoque.json';
import estoqueEn from '../public/locales/en/estoque.json';
import pedidosEn from '../public/locales/en/pedidos.json';
import pedidosPt from '../public/locales/pt/pedidos.json';
import ajudaPt from '../public/locales/pt/ajuda.json';
import ajudaEn from '../public/locales/en/ajuda.json';
import landingpt from '../public/locales/pt/landing.json';
import landingen from '../public/locales/en/landing.json';
import navbarpt from '../public/locales/pt/navbar.json';
import navbaren from '../public/locales/en/navbar.json';
import loginpt from '../public/locales/pt/login.json';
import loginen from '../public/locales/en/login.json';
import registroen from '../public/locales/en/registro.json';
import registropt from '../public/locales/pt/registro.json';
import verificacao from '../public/locales/pt/verificacao.json';
import verificacaoen from '../public/locales/en/verificacao.json';
import notificacoesen from '../public/locales/en/notificacoes.json';
import notificacoespt from '../public/locales/pt/notificacoes.json';
import errospt from '../public/locales/pt/erros.json';
import errosen from '../public/locales/en/erros.json';
import conversorpt from '../public/locales/pt/conversor.json';
import conversoren from '../public/locales/en/conversor.json';



if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'pt',
      supportedLngs: ['pt', 'en'],
      ns: ['settings', 'sidebar', 'conversor', 'dashboard', 'erros', 'notificacoes', 'verificacao', 'login', 'registro', 'navbar', 'landing', 'ajuda', 'pedidos', 'produtos', 'usuarios', 'conta', 'empresa', 'criarempresa', 'vendas', 'ativacao', 'fornecedores', 'suporte', 'logs', 'esqueci', 'alteracao', 'clientes', 'exportacoes', 'estoque'],
      defaultNS: 'settings',
      resources: {
        en: {
          settings: settingsEn,
          sidebar: sidebarEn,
          dashboard: dashboardEn,
          produtos: produtosEn,
          usuarios: usuariosEn,
          conta: contaEn,
          exportacoes: exportacoesEn,
          empresa: empresaEn,
          criarempresa: criarempresaEn,
          vendas: vendasEn,
          ativacao: ativacaoEn,
          fornecedores: fornecedoresEn,
          suporte: suporteEn,
          logs: logsEn,
          esqueci: esqueciEn,
          alteracao: alteracaoEn,
          clientes: clientesEn,
          estoque: estoqueEn,
          pedidos: pedidosEn,
          ajuda: ajudaEn,
          landing: landingen,
          navbar: navbaren,
          login: loginen,
          registro: registroen,
          verificacao: verificacaoen,
          notificacoes: notificacoesen,
          erros: errosen,
          conversor: conversoren

        },
        pt: {
          settings: settingsPt,
          exportacoes: exportacoesPt,
          sidebar: sidebarPt,
          dashboard: dashboardPt,
          produtos: produtosPt,
          usuarios: usuariosPt,
          conta: contaPt,
          empresa: empresaPt,
          criarempresa: criarempresaPt,
          vendas: vendasPt,
          ativacao: ativacaoPt,
          fornecedores: fornecedoresPt,
          suporte: suportePt,
          logs: logsPt,
          esqueci: esqueciPt,
          alteracao: alteracaoPt,
          clientes: clientesPt,
          estoque: estoquePt,
          pedidos: pedidosPt,
          ajuda: ajudaPt,
          landing: landingpt,
          navbar: navbarpt,
          login: loginpt,
          registro: registropt,
          verificacao: verificacao,
          notificacoes: notificacoespt,
          erros: errospt,
          conversor: conversorpt
        },
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
