"use client";

import { ProdutoI } from "@/utils/types/produtos";
import { ClienteI } from "@/utils/types/clientes";
import { useEffect, useState, useRef } from "react";
import { FaSearch, FaShoppingCart, FaRegTrashAlt, FaAngleLeft, FaAngleRight, FaLock, FaPlus, FaMinus, FaUser, FaChartLine, FaHistory, FaBox, FaCheck, FaChevronDown, FaTh, FaList } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { VendaI } from "@/utils/types/vendas";
import { cores } from "@/utils/cores";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Swal from "sweetalert2";
import Cookies from "js-cookie";

export default function Vendas() {
  const [produtos, setProdutos] = useState<ProdutoI[]>([]);
  const [vendas, setVendas] = useState<VendaI[]>([]);
  const [clientes, setClientes] = useState<ClienteI[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [carrinho, setCarrinho] = useState<{ produto: ProdutoI; quantidade: number }[]>([]);
  const [busca, setBusca] = useState("");
  const [modoDark, setModoDark] = useState(false);
  const [totalVendas, setTotalVendas] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [permissoesUsuario, setPermissoesUsuario] = useState<Record<string, boolean>>({});
  const [empresaAtivada, setEmpresaAtivada] = useState<boolean>(false);
  const [stats, setStats] = useState({
    totalVendas: 0,
    produtosVendidos: 0,
    clientesAtendidos: 0,
    ticketMedio: 0,
  });
  const [showTooltipFinalizar, setShowTooltipFinalizar] = useState(false);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { t, i18n } = useTranslation("vendas");
  const [cotacaoDolar, setCotacaoDolar] = useState(5.0);

  type TipoVisualizacao = "cards" | "lista";
  const [tipoVisualizacao, setTipoVisualizacao] = useState<TipoVisualizacao>("cards");

  const produtosPorPagina = 12;
  const router = useRouter();
  const menuClientesRef = useRef<HTMLDivElement>(null);
  const [menuClientesAberto, setMenuClientesAberto] = useState(false);

  const temaAtual = modoDark ? cores.dark : cores.light;

  const formatarMoeda = (valor: number) => {
    if (i18n.language === "en") {
      return `$${(valor / cotacaoDolar).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const mostrarPreco = (preco: number) => {
    if (i18n.language === "en") {
      return `$${(preco / cotacaoDolar).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `R$ ${preco.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const converterPrecoParaReal = (preco: number) => {
    if (i18n.language === "en") {
      return preco * cotacaoDolar;
    }
    return preco;
  };

  const [valoresInput, setValoresInput] = useState<Record<string, string>>({});
  const [inputEmFoco, setInputEmFoco] = useState<string | null>(null);

  useEffect(() => {
    const visualizacaoSalva = localStorage.getItem("vendas_visualizacao") as TipoVisualizacao;
    if (visualizacaoSalva && (visualizacaoSalva === "cards" || visualizacaoSalva === "lista")) {
      setTipoVisualizacao(visualizacaoSalva);
    }
  }, []);

  useEffect(() => {
    const novosValores: Record<string, string> = {};
    carrinho.forEach(item => {
      novosValores[item.produto.id] = item.quantidade.toString();
    });
    setValoresInput(novosValores);
  }, [carrinho]);

  const alterarVisualizacao = (novoTipo: TipoVisualizacao) => {
    setTipoVisualizacao(novoTipo);
    localStorage.setItem("vendas_visualizacao", novoTipo);
  };

  const usuarioTemPermissao = async (permissaoChave: string): Promise<boolean> => {
    try {
      const usuarioSalvo = localStorage.getItem("client_key");
      if (!usuarioSalvo) return false;

      const usuarioId = usuarioSalvo.replace(/"/g, "");
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuarios/${usuarioId}/tem-permissao/${permissaoChave}`, {
        headers: {
          "user-id": usuarioId,
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.temPermissao;
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
      return false;
    }
  };

  // Função para carregar produtos aptos para venda (com estoque > 0)
  const carregarProdutosAptosParaVenda = async (empresaIdParam: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/produtos`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      
      if (response.ok) {
        const todosProdutos: ProdutoI[] = await response.json();
        // Filtra apenas produtos da empresa, com estoque > 0, não arquivados e ativos
        const produtosAptos = todosProdutos.filter((p) => 
          p.empresaId === empresaIdParam && 
          p.quantidade > 0 && 
          p.ativo !== false && 
          !p.arquivado
        );
        setProdutos(produtosAptos);
        return produtosAptos;
      }
      return [];
    } catch (error) {
      console.error("Erro ao carregar produtos aptos:", error);
      return [];
    }
  };

  useEffect(() => {
    const temaSalvo = localStorage.getItem("modoDark");
    const ativado = temaSalvo === "true";
    setModoDark(ativado);

    const handleThemeChange = (e: CustomEvent) => {
      setModoDark(e.detail.modoDark);
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const token = Cookies.get("token");

    if (!token) {
      window.location.href = "/login";
    }

    const carregarPermissoes = async (usuarioId: string) => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuarios/${usuarioId}/permissoes`, {
          headers: {
            "user-id": usuarioId,
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });

        if (response.ok) {
          const dados: { permissoes: { chave: string; concedida: boolean }[]; permissoesPersonalizadas: boolean } = await response.json();

          const permissoesUsuarioObj: Record<string, boolean> = {};
          dados.permissoes.forEach((permissao) => {
            permissoesUsuarioObj[permissao.chave] = permissao.concedida;
          });

          setPermissoesUsuario(permissoesUsuarioObj);
        } else {
          const permissoesParaVerificar = ["vendas_realizar", "vendas_visualizar"];

          const permissoes: Record<string, boolean> = {};

          for (const permissao of permissoesParaVerificar) {
            const temPermissao = await usuarioTemPermissao(permissao);
            permissoes[permissao] = temPermissao;
          }

          setPermissoesUsuario(permissoes);
        }
      } catch (error) {
        console.error("Erro ao carregar permissões:", error);
      }
    };

    const initialize = async () => {
      const carrinhoSalvo = localStorage.getItem("carrinhoVendas");
      if (carrinhoSalvo) {
        try {
          const carrinhoParseado = JSON.parse(carrinhoSalvo);
          setCarrinho(carrinhoParseado);
        } catch (err) {
          console.error("Erro ao parsear carrinho do localStorage", err);
          localStorage.removeItem("carrinhoVendas");
        }
      }
      const usuarioSalvo = localStorage.getItem("client_key");
      if (!usuarioSalvo) {
        setCarregando(false);
        return;
      }
      const usuarioValor = usuarioSalvo.replace(/"/g, "");

      setCarregando(true);

      await carregarPermissoes(usuarioValor);

      try {
        try {
          const valorDolar = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL");
          const cotacaoJson = await valorDolar.json();
          setCotacaoDolar(parseFloat(cotacaoJson.USDBRL.bid));
        } catch (error) {
          console.error("Erro ao buscar cotação do dólar:", error);
        }

        const responseUsuario = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuario/${usuarioValor}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });
        const usuario = await responseUsuario.json();

        if (!usuario || !usuario.empresaId) {
          setProdutos([]);
          setVendas([]);
          setTotalVendas(0);
          setCarregando(false);
          return;
        }

        setEmpresaId(usuario.empresaId);
        setTipoUsuario(usuario.tipo);

        const ativada = await verificarAtivacaoEmpresa(usuario.empresaId);
        setEmpresaAtivada(ativada);

        // Carrega apenas produtos aptos para venda
        await carregarProdutosAptosParaVenda(usuario.empresaId);

        const responseClientes = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/clientes`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });
        const clientesData = await responseClientes.json();
        const clientesDaEmpresa = clientesData.clientes?.filter((c: ClienteI) => c.empresaId === usuario.empresaId) || [];
        setClientes(clientesDaEmpresa);

        const responseVendas = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/venda/${usuario.empresaId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });
        if (!responseVendas.ok) {
          throw new Error("Erro ao carregar vendas");
        }

        const vendasData = await responseVendas.json();
        const vendasDaEmpresa = vendasData.vendas || [];

        const vendasOrdenadas = vendasDaEmpresa.sort((a: VendaI, b: VendaI) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setVendas(vendasOrdenadas);

        const produtosVendidos = vendasDaEmpresa.reduce((total: number, venda: VendaI) => total + (venda.quantidade || 0), 0);
        const clientesUnicos = new Set(vendasDaEmpresa.map((venda: VendaI) => venda.clienteId).filter(Boolean)).size;
        const totalVendasAtual = vendasDaEmpresa.reduce((total: number, venda: VendaI) => total + (venda.valorVenda || 0), 0);
        const ticketMedio = vendasDaEmpresa.length > 0 ? totalVendasAtual / vendasDaEmpresa.length : 0;

        setStats({
          totalVendas: totalVendasAtual,
          produtosVendidos,
          clientesAtendidos: clientesUnicos,
          ticketMedio,
        });

        const responseTotal = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/venda/contagem/${usuario.empresaId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });
        const totalData = await responseTotal.json();

        let total = 0;
        if (totalData?.total?._sum?.valorVenda) {
          total = totalData.total._sum.valorVenda;
        } else if (totalData?.sum) {
          total = totalData.sum;
        } else if (totalData?.total) {
          total = totalData.total;
        } else if (typeof totalData === "number") {
          total = totalData;
        }

        setTotalVendas(total);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        Swal.fire({
          icon: "error",
          title: t("erroCarregarDados"),
          text: t("tenteNovamente"),
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
        setVendas([]);
        setTotalVendas(0);
      } finally {
        setCarregando(false);
      }
    };

    initialize();

    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      
      .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
      }
      
      .animate-slide-in {
        animation: slideIn 0.4s ease-out forwards;
      }
      
      .card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
        
      .card-hover:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      }
      
      .glow-effect {
        position: relative;
        overflow: hidden;
      }
      
      .glow-effect::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        transition: left 0.5s;
      }
      
      .glow-effect:hover::before {
        left: 100%;
      }
      
      .gradient-border {
        position: relative;
        background: linear-gradient(45deg, ${modoDark ? "#3B82F6, #0EA5E9, #1E293B" : "#1976D2, #0284C7, #E2E8F0"});
        padding: 1px;
        border-radius: 16px;
      }
      
      .gradient-border > div {
        background: ${modoDark ? "#1E293B" : "#FFFFFF"};
        border-radius: 15px;
      }
      
      .scroll-custom {
        max-height: 200px;
        overflow-y: auto;
      }
      
      .scroll-custom::-webkit-scrollbar {
        width: 6px;
      }
      
      .scroll-custom::-webkit-scrollbar-track {
        background: ${modoDark ? "#1E293B" : "#F1F5F9"};
        border-radius: 3px;
      }
      
      .scroll-custom::-webkit-scrollbar-thumb {
        background: ${modoDark ? "#3B82F6" : "#94A3B8"};
        border-radius: 3px;
      }
      
      .scroll-custom::-webkit-scrollbar-thumb:hover {
        background: ${modoDark ? "#2563EB" : "#64748B"};
      }
    `;
    document.head.appendChild(style);

    const handleClickOutside = (event: MouseEvent) => {
      if (menuClientesRef.current && !menuClientesRef.current.contains(event.target as Node)) {
        setMenuClientesAberto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.head.removeChild(style);
    };
  }, [t, modoDark, totalVendas, i18n.language]);

  useEffect(() => {
    if (carrinho.length > 0) {
      localStorage.setItem("carrinhoVendas", JSON.stringify(carrinho));
    } else {
      localStorage.removeItem("carrinhoVendas");
    }
  }, [carrinho]);

  const podeVisualizar = tipoUsuario === "PROPRIETARIO" || permissoesUsuario.vendas_visualizar;
  const podeRealizarVendas = tipoUsuario === "PROPRIETARIO" || permissoesUsuario.vendas_realizar;

  const verificarAtivacaoEmpresa = async (empresaId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/empresa/empresa/${empresaId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });
      if (!response.ok) {
        throw new Error("Erro ao buscar dados da empresa");
      }
      const empresaData = await response.json();

      const ativada = empresaData.ChaveAtivacao !== null && empresaData.ChaveAtivacao !== undefined;
      setEmpresaAtivada(ativada);
      return ativada;
    } catch (error) {
      console.error("Erro ao verificar ativação da empresa:", error);
      return false;
    }
  };

  const mostrarAlertaNaoAtivada = () => {
    Swal.fire({
      title: t("empresaNaoAtivada.titulo"),
      text: t("empresaNaoAtivada.mensagem"),
      icon: "warning",
      confirmButtonText: t("empresaNaoAtivada.botao"),
      confirmButtonColor: "#3085d6",
      background: modoDark ? temaAtual.card : "#FFFFFF",
      color: modoDark ? temaAtual.texto : temaAtual.texto,
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/ativacao");
      }
    });
  };

  const handleAcaoProtegida = (acao: () => void) => {
    if (!empresaAtivada) {
      mostrarAlertaNaoAtivada();
      return;
    }
    acao();
  };

  const adicionarAoCarrinho = (produto: ProdutoI) => {
    if (!podeRealizarVendas) return;

    const itemExistente = carrinho.find((item) => item.produto.id === produto.id);

    if (itemExistente) {
      if (itemExistente.quantidade < produto.quantidade) {
        const novaQuantidade = itemExistente.quantidade + 1;
        setCarrinho(carrinho.map((item) => 
          item.produto.id === produto.id 
            ? { ...item, quantidade: novaQuantidade } 
            : item
        ));
        setValoresInput(prev => ({
          ...prev,
          [produto.id]: novaQuantidade.toString()
        }));
      } else {
        Swal.fire({
          icon: "warning",
          title: t("avisoEstoque"),
          text: t("quantidadeMaiorQueEstoque"),
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
      }
    } else {
      if (produto.quantidade > 0) {
        setCarrinho([...carrinho, { produto, quantidade: 1 }]);
        setValoresInput(prev => ({
          ...prev,
          [produto.id]: "1"
        }));
      } else {
        Swal.fire({
          icon: "warning",
          title: t("avisoEstoque"),
          text: t("produtoSemEstoque"),
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
      }
    }
  };

  const handleInputChange = (produtoId: string, valor: string) => {
    const valorNumerico = valor.replace(/[^0-9]/g, '');
    setValoresInput(prev => ({
      ...prev,
      [produtoId]: valorNumerico
    }));
  };

  const handleInputFocus = (produtoId: string, quantidadeAtual: number) => {
    setInputEmFoco(produtoId);
    setValoresInput(prev => ({
      ...prev,
      [produtoId]: quantidadeAtual.toString()
    }));
  };

  const aplicarQuantidadeInput = (produtoId: string) => {
    const valorStr = valoresInput[produtoId];
    let valorNumerico = valorStr === '' || valorStr === undefined ? 0 : parseInt(valorStr, 10);
    
    if (isNaN(valorNumerico)) {
      valorNumerico = 0;
    }

    const produto = produtos.find((p) => p.id === produtoId);
    
    setCarrinho((prevCarrinho) => {
      const itemExistente = prevCarrinho.find(item => item.produto.id === produtoId);
      let novoCarrinho;
      
      if (valorNumerico === 0) {
        if (itemExistente) {
          novoCarrinho = prevCarrinho.map((item) => {
            if (item.produto.id === produtoId) {
              return { ...item, quantidade: 0 };
            }
            return item;
          });
        } else {
          novoCarrinho = prevCarrinho;
        }
      } else {
        if (!itemExistente && produto) {
          novoCarrinho = [...prevCarrinho, { produto, quantidade: valorNumerico }];
        } else {
          novoCarrinho = prevCarrinho.map((item) => {
            if (item.produto.id === produtoId) {
              if (produto && valorNumerico > produto.quantidade) {
                Swal.fire({
                  icon: "warning",
                  title: t("avisoEstoque"),
                  text: t("quantidadeMaiorQueEstoque"),
                  background: modoDark ? temaAtual.card : "#FFFFFF",
                  color: modoDark ? temaAtual.texto : temaAtual.texto,
                });
                return { ...item, quantidade: produto.quantidade };
              }
              return { ...item, quantidade: valorNumerico };
            }
            return item;
          });
        }
      }

      setValoresInput(prev => {
        const novosValores = { ...prev };
        if (valorNumerico === 0) {
          if (itemExistente || produto) {
            novosValores[produtoId] = "0";
          }
        } else {
          novosValores[produtoId] = valorNumerico.toString();
        }
        return novosValores;
      });

      return novoCarrinho || prevCarrinho;
    });
    
    setInputEmFoco(null);
  };

  const atualizarQuantidade = (produtoId: string, novaQuantidade: number) => {
    const produto = produtos.find((p) => p.id === produtoId);
    
    setCarrinho((prevCarrinho) => {
      const itemExistente = prevCarrinho.find(item => item.produto.id === produtoId);
      let novoCarrinho;
      
      if (novaQuantidade < 0) return prevCarrinho;
      
      if (novaQuantidade === 0) {
        novoCarrinho = prevCarrinho.map((item) => {
          if (item.produto.id === produtoId) {
            return { ...item, quantidade: 0 };
          }
          return item;
        });
        setValoresInput(prev => ({
          ...prev,
          [produtoId]: "0"
        }));
      } else {
        if (!itemExistente && produto) {
          novoCarrinho = [...prevCarrinho, { produto, quantidade: novaQuantidade }];
          setValoresInput(prev => ({
            ...prev,
            [produtoId]: novaQuantidade.toString()
          }));
        } else {
          novoCarrinho = prevCarrinho.map((item) => {
            if (item.produto.id === produtoId) {
              if (produto && novaQuantidade > produto.quantidade) {
                Swal.fire({
                  icon: "warning",
                  title: t("avisoEstoque"),
                  text: t("quantidadeMaiorQueEstoque"),
                  background: modoDark ? temaAtual.card : "#FFFFFF",
                  color: modoDark ? temaAtual.texto : temaAtual.texto,
                });
                return { ...item, quantidade: produto.quantidade };
              }
              return { ...item, quantidade: novaQuantidade };
            }
            return item;
          });
          setValoresInput(prev => ({
            ...prev,
            [produtoId]: novaQuantidade.toString()
          }));
        }
      }

      return novoCarrinho || prevCarrinho;
    });
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(carrinho.filter((item) => item.produto.id !== produtoId));
    setValoresInput(prev => {
      const novosValores = { ...prev };
      delete novosValores[produtoId];
      return novosValores;
    });
  };

  const handleMouseEnterFinalizar = () => {
    if (totalCarrinho === 0) {
      tooltipTimerRef.current = setTimeout(() => {
        setShowTooltipFinalizar(true);
      }, 300);
    }
  };

  const handleMouseLeaveFinalizar = () => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    setShowTooltipFinalizar(false);
  };

  const finalizarVenda = async () => {
    const usuarioSalvo = localStorage.getItem("client_key");
    if (!usuarioSalvo) return;

    const produtosComZero = carrinho.filter((item) => item.quantidade === 0);
    
    if (produtosComZero.length > 0) {
      Swal.fire({
        icon: "warning",
        title: t("quantidadeInvalida") || "Quantidade inválida",
        text: t("quantidadeMinimaErro") || "Para finalizar a venda, todos os produtos devem ter quantidade maior que 0. Os produtos com quantidade 0 foram ajustados para 1.",
        confirmButtonColor: "#3085d6",
        background: modoDark ? temaAtual.card : "#FFFFFF",
        color: modoDark ? temaAtual.texto : temaAtual.texto,
      });
      
      setCarrinho((prevCarrinho) => {
        const carrinhoCorrigido = prevCarrinho.map((item) => {
          if (item.quantidade === 0) {
            return { ...item, quantidade: 1 };
          }
          return item;
        });
        
        const novosValores: Record<string, string> = {};
        carrinhoCorrigido.forEach(item => {
          novosValores[item.produto.id] = item.quantidade.toString();
        });
        setValoresInput(novosValores);
        
        return carrinhoCorrigido;
      });
      
      return;
    }

    const hasValidItems = carrinho.some((item) => item.quantidade > 0);

    if (!empresaId || !hasValidItems) {
      Swal.fire({
        icon: "error",
        title: t("erro"),
        text: carrinho.length === 0 ? t("carrinhoVazio") : t("quantidadeZeroErro"),
        background: modoDark ? temaAtual.card : "#FFFFFF",
        color: modoDark ? temaAtual.texto : temaAtual.texto,
      });
      return;
    }

    handleAcaoProtegida(async () => {
      try {
        setCarregando(true);
        const usuarioValor = usuarioSalvo.replace(/"/g, "");

        for (const item of carrinho.filter((i) => i.quantidade > 0)) {
          const responseSaldo = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/produtos/${item.produto.id}/saldo`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          });

          if (responseSaldo.ok) {
            const { saldo } = await responseSaldo.json();
            if (saldo < item.quantidade) {
              Swal.fire({
                icon: "error",
                title: t("estoqueInsuficiente"),
                text: `${item.produto.nome}: ${t("saldoDisponivel")} ${saldo}`,
                background: modoDark ? temaAtual.card : "#FFFFFF",
                color: modoDark ? temaAtual.texto : temaAtual.texto,
              });
              return;
            }
          }
        }

        const itemsToSell = carrinho.filter((item) => item.quantidade > 0);

        const vendasPromises = itemsToSell.map((item) => {
          const precoReal = converterPrecoParaReal(item.produto.preco);
          const valorVenda = precoReal * item.quantidade;
          const valorCompra = precoReal * 0.8 * item.quantidade;

          return fetch(`${process.env.NEXT_PUBLIC_URL_API}/venda`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "user-id": usuarioValor,
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
            body: JSON.stringify({
              empresaId,
              produtoId: Number(item.produto.id),
              quantidade: item.quantidade,
              valorVenda: valorVenda,
              valorCompra: valorCompra,
              usuarioId: usuarioValor,
              clienteId: clienteSelecionado,
              clienteNome: clientes.find((c) => c.id === clienteSelecionado)?.nome || null,
            }),
          });
        });

        await Promise.all(vendasPromises);

        await Swal.fire({
          position: "center",
          icon: "success",
          title: t("vendaSucesso"),
          showConfirmButton: false,
          timer: 1500,
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });

        // LIMPAR CARRINHO
        setCarrinho([]);
        setClienteSelecionado(null);
        localStorage.removeItem("carrinhoVendas");
        setValoresInput({});
        setInputEmFoco(null);

        // CARREGAR PRODUTOS ATUALIZADOS - APENAS APTOS PARA VENDA
        if (empresaId) {
          const produtosAtualizados = await carregarProdutosAptosParaVenda(empresaId);
          setProdutos(produtosAtualizados);
        }

        // CARREGAR VENDAS ATUALIZADAS
        if (empresaId) {
          const responseVendas = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/venda/${empresaId}`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          });
          
          if (responseVendas.ok) {
            const vendasData = await responseVendas.json();
            const vendasDaEmpresa = vendasData.vendas || [];
            const vendasOrdenadas = vendasDaEmpresa.sort((a: VendaI, b: VendaI) => 
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );
            setVendas(vendasOrdenadas);

            // ATUALIZAR ESTATÍSTICAS
            const produtosVendidos = vendasDaEmpresa.reduce((total: number, venda: VendaI) => 
              total + (venda.quantidade || 0), 0
            );
            const clientesUnicos = new Set(vendasDaEmpresa.map((venda: VendaI) => venda.clienteId).filter(Boolean)).size;
            const totalVendasAtual = vendasDaEmpresa.reduce((total: number, venda: VendaI) => 
              total + (venda.valorVenda || 0), 0
            );
            const ticketMedio = vendasDaEmpresa.length > 0 ? totalVendasAtual / vendasDaEmpresa.length : 0;

            setStats({
              totalVendas: totalVendasAtual,
              produtosVendidos,
              clientesAtendidos: clientesUnicos,
              ticketMedio,
            });
          }
        }

      } catch (err) {
        console.error("Erro ao finalizar venda:", err);
        await Swal.fire({
          icon: "error",
          title: "Erro!",
          text: t("erroFinalizarVenda"),
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
      } finally {
        setCarregando(false);
      }
    });
  };

  const produtosFiltrados = produtos.filter((produto) => 
    produto.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const indexUltimoProduto = paginaAtual * produtosPorPagina;
  const indexPrimeiroProduto = indexUltimoProduto - produtosPorPagina;
  const produtosAtuais = produtosFiltrados.slice(indexPrimeiroProduto, indexUltimoProduto);
  const totalPaginas = Math.ceil(produtosFiltrados.length / produtosPorPagina);

  const mudarPagina = (novaPagina: number) => {
    setPaginaAtual(novaPagina);
  };

  const totalCarrinho = carrinho.reduce((total, item) => {
    const precoReal = converterPrecoParaReal(item.produto.preco);
    return total + precoReal * item.quantidade;
  }, 0);

  const bgGradient = modoDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-slate-200 via-blue-50 to-slate-200";

  const textPrimary = modoDark ? "text-white" : "text-slate-900";
  const textSecondary = modoDark ? "text-gray-300" : "text-slate-600";
  const textMuted = modoDark ? "text-gray-400" : "text-slate-500";
  const bgCard = modoDark ? "bg-slate-800/50" : "bg-white/80";
  const borderColor = modoDark ? "border-blue-500/30" : "border-blue-200";
  const bgInput = modoDark ? "bg-slate-700/50" : "bg-gray-100";
  const bgHover = modoDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50";
  const bgStats = modoDark ? "bg-slate-800/50" : "bg-white/80";

  if (!podeVisualizar) {
    return (
      <div className={`min-h-screen ${bgGradient} flex items-center justify-center px-4`}>
        <div className="text-center">
          <div className={`w-24 h-24 mx-auto mb-6 ${modoDark ? "bg-red-500/20" : "bg-red-100"} rounded-full flex items-center justify-center`}>
            <FaLock className={`text-3xl ${modoDark ? "text-red-400" : "text-red-500"}`} />
          </div>
          <h1 className={`text-2xl font-bold ${textPrimary} mb-4`}>{t("acessoRestrito")}</h1>
          <p className={textSecondary}>{t("acessoRestritoMensagem")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgGradient}`}>
      <div className="flex">
        <div className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 py-8 w-full max-w-7xl mx-auto">
            <section className={`relative py-8 rounded-3xl mb-6 overflow-hidden ${modoDark ? "bg-slate-800/30" : "bg-white/30"} backdrop-blur-sm border ${borderColor}`}>
              <div className="absolute inset-0">
                <div className={`absolute top-0 left-10 w-32 h-32 ${modoDark ? "bg-blue-500/20" : "bg-blue-200/50"} rounded-full blur-3xl animate-float`}></div>
                <div className={`absolute bottom-0 right-10 w-48 h-48 ${modoDark ? "bg-slate-700/20" : "bg-slate-300/50"} rounded-full blur-3xl animate-float`} style={{ animationDelay: "2s" }}></div>
                <div className={`absolute top-1/2 left-1/2 w-24 h-24 ${modoDark ? "bg-cyan-500/20" : "bg-cyan-200/50"} rounded-full blur-3xl animate-float`} style={{ animationDelay: "4s" }}></div>
              </div>

              <div className="relative z-10 text-center">
                <h1 className={`text-3xl md:text-4xl font-bold ${textPrimary} mb-3`}>
                  {t("titulo")} <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{t("vendas")}</span>
                </h1>
                <p className={`text-lg ${textSecondary} max-w-2xl mx-auto`}>{t("subtitulo")}</p>
              </div>
            </section>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: t("stats.totalVendas"),
                  value: formatarMoeda(stats.totalVendas),
                  icon: FaChartLine,
                  color: "from-blue-500 to-cyan-500",
                  bgColor: modoDark ? "bg-blue-500/10" : "bg-blue-50",
                },
                {
                  label: t("stats.produtosVendidos"),
                  value: stats.produtosVendidos.toLocaleString(i18n.language === "en" ? "en-US" : "pt-BR"),
                  icon: FaBox,
                  color: "from-green-500 to-emerald-500",
                  bgColor: modoDark ? "bg-green-500/10" : "bg-green-50",
                },
                {
                  label: t("stats.clientesAtendidos"),
                  value: stats.clientesAtendidos.toLocaleString(i18n.language === "en" ? "en-US" : "pt-BR"),
                  icon: FaUser,
                  color: "from-purple-500 to-pink-500",
                  bgColor: modoDark ? "bg-purple-500/10" : "bg-purple-50",
                },
                {
                  label: t("stats.ticketMedio"),
                  value: formatarMoeda(stats.ticketMedio),
                  icon: FaHistory,
                  color: "from-orange-500 to-red-500",
                  bgColor: modoDark ? "bg-orange-500/10" : "bg-orange-50",
                },
              ].map((stat, index) => (
                <div key={index} className="gradient-border animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className={`p-3 sm:p-4 rounded-[15px] ${bgStats} backdrop-blur-sm card-hover min-h-[90px] sm:min-h-[100px] flex flex-col justify-center`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className={`text-base sm:text-xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1 overflow-hidden whitespace-nowrap`}>
                          {stat.value}
                        </div>
                        <div className={`${textMuted} text-xs sm:text-sm truncate`}>
                          {stat.label}
                        </div>
                      </div>
                      <div className={`p-1 sm:p-2 rounded-lg ${stat.bgColor} flex-shrink-0 ml-2`}>
                        <stat.icon className={`text-base sm:text-xl bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {empresaId && !empresaAtivada && (
              <div className={`mb-4 p-4 rounded-2xl flex items-center gap-3 ${modoDark ? "bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30" : "bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200"}`}>
                <div className={`p-2 ${modoDark ? "bg-orange-500/20" : "bg-orange-100"} rounded-xl`}>
                  <FaLock className={`text-xl ${modoDark ? "text-orange-400" : "text-orange-500"}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-bold ${textPrimary} text-sm`}>{t("empresaNaoAtivada.alertaTitulo")}</p>
                  <p className={textMuted}>{t("empresaNaoAtivada.alertaMensagem")}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-20 transition-opacity duration-300`}></div>
                    <div className={`relative flex items-center ${bgCard} rounded-xl px-4 py-3 border ${borderColor} backdrop-blur-sm`}>
                      <FaSearch className={`${modoDark ? "text-blue-400" : "text-blue-500"} mr-3 text-sm`} />
                      <input
                        type="text"
                        placeholder={t("buscarProduto")}
                        value={busca}
                        onChange={(e) => {
                          setBusca(e.target.value);
                          setPaginaAtual(1);
                        }}
                        className={`bg-transparent border-none outline-none ${textPrimary} placeholder-${modoDark ? "gray-400" : "slate-500"} w-full text-sm`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 ${bgCard} border ${borderColor} rounded-xl p-1`}>
                      <button 
                        onClick={() => alterarVisualizacao("cards")} 
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          tipoVisualizacao === "cards" 
                            ? "bg-blue-500 text-white" 
                            : `${bgHover} ${textPrimary}`
                        }`}
                      >
                        <FaTh className="text-sm" />
                      </button>
                      <button 
                        onClick={() => alterarVisualizacao("lista")} 
                        className={`p-2 rounded-lg transition-all duration-300 ${
                          tipoVisualizacao === "lista" 
                            ? "bg-blue-500 text-white" 
                            : `${bgHover} ${textPrimary}`
                        }`}
                      >
                        <FaList className="text-sm" />
                      </button>
                    </div>

                    {totalPaginas > 1 && (
                      <div className={`flex items-center gap-1 ${bgCard} border ${borderColor} rounded-xl px-3 py-2`}>
                        <button 
                          onClick={() => mudarPagina(paginaAtual - 1)} 
                          disabled={paginaAtual === 1} 
                          className={`p-1 rounded-lg transition-all duration-300 ${
                            paginaAtual === 1 
                              ? `${textMuted} cursor-not-allowed` 
                              : `${textPrimary} ${bgHover} hover:scale-105`
                          }`}
                        >
                          <FaAngleLeft className="text-sm" />
                        </button>

                        <span className={`${textPrimary} text-sm mx-2`}>
                          {paginaAtual}/{totalPaginas}
                        </span>

                        <button 
                          onClick={() => mudarPagina(paginaAtual + 1)} 
                          disabled={paginaAtual === totalPaginas} 
                          className={`p-1 rounded-lg transition-all duration-300 ${
                            paginaAtual === totalPaginas 
                              ? `${textMuted} cursor-not-allowed` 
                              : `${textPrimary} ${bgHover} hover:scale-105`
                          }`}
                        >
                          <FaAngleRight className="text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {carregando ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className={`${bgCard} rounded-xl p-4 animate-pulse border ${borderColor}`}>
                        <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded-xl h-32 mb-3`}></div>
                        <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-3 mb-2`}></div>
                        <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-3 w-2/3 mb-3`}></div>
                        <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-6 mb-2`}></div>
                      </div>
                    ))}
                  </div>
                ) : produtosAtuais.length === 0 ? (
                  <div className="text-center py-12">
                    <div className={`w-24 h-24 mx-auto mb-4 ${bgCard} rounded-full flex items-center justify-center border ${borderColor}`}>
                      <FaBox className={`text-2xl ${textMuted}`} />
                    </div>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>{t("nenhumProdutoEncontrado")}</h3>
                    <p className={`${textMuted} mb-4 text-sm`}>{t("comeceAdicionando")}</p>
                  </div>
                ) : tipoVisualizacao === "cards" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {produtosAtuais.map((produto, index) => (
                      <div
                        key={produto.id}
                        className={`group ${
                          modoDark 
                            ? "bg-gradient-to-br from-blue-500/5 to-cyan-500/5" 
                            : "bg-gradient-to-br from-blue-100/30 to-cyan-100/30"
                        } rounded-xl border ${
                          modoDark 
                            ? "border-blue-500/20 hover:border-blue-500/40" 
                            : "border-blue-200 hover:border-blue-300"
                        } p-3 transition-all duration-500 card-hover backdrop-blur-sm`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                        }}
                      >
                        <div className="relative mb-2 overflow-hidden rounded-lg">
                          <Image
                            src={produto.foto || "/out.jpg"}
                            width={150}
                            height={100}
                            className="w-full h-24 object-cover transition-transform duration-500 group-hover:scale-110"
                            alt={produto.nome}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/out.jpg";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm ${
                            produto.quantidade <= 0 
                              ? "bg-red-500/90 text-white" 
                              : produto.quantidade <= 5 
                                ? "bg-yellow-500/90 text-white" 
                                : "bg-green-500/90 text-white"
                          }`}>
                            {produto.quantidade}
                          </div>
                        </div>

                        <h3 className={`font-bold ${textPrimary} mb-1 line-clamp-2 group-hover:text-blue-500 transition-colors text-xs leading-tight`}>
                          {produto.nome}
                        </h3>

                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-cyan-500">
                            {mostrarPreco(produto.preco)}
                          </span>
                          <span className={`text-xs ${
                            produto.quantidade <= 0 
                              ? "text-red-500" 
                              : produto.quantidade <= 5 
                                ? "text-yellow-500" 
                                : "text-green-500"
                          }`}>
                            {produto.quantidade} {t("unidades")}
                          </span>
                        </div>

                        {podeRealizarVendas && (
                          <button
                            onClick={() => handleAcaoProtegida(() => adicionarAoCarrinho(produto))}
                            disabled={produto.quantidade < 1}
                            className="w-full px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 text-xs font-semibold hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                              background: modoDark ? "linear-gradient(135deg, #3B82F6, #0EA5E9)" : "linear-gradient(135deg, #1976D2, #0284C7)",
                              color: "#FFFFFF",
                            }}
                          >
                            <FaShoppingCart size={12} />
                            {t("adicionar")}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {produtosAtuais.map((produto, index) => (
                      <div
                        key={produto.id}
                        className={`group flex items-center gap-3 p-3 rounded-xl border ${
                          modoDark 
                            ? "bg-slate-800/50 border-blue-500/20 hover:border-blue-500/40" 
                            : "bg-white/80 border-blue-200 hover:border-blue-300"
                        } transition-all duration-300 backdrop-blur-sm`}
                        style={{
                          animationDelay: `${index * 100}ms`,
                        }}
                      >
                        <div className="relative flex-shrink-0">
                          <Image
                            src={produto.foto || "/out.jpg"}
                            width={60}
                            height={60}
                            className="w-15 h-15 object-cover rounded-lg"
                            alt={produto.nome}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/out.jpg";
                            }}
                          />
                          <div className={`absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-xs font-bold backdrop-blur-sm ${
                            produto.quantidade <= 0 
                              ? "bg-red-500/90 text-white" 
                              : produto.quantidade <= 5 
                                ? "bg-yellow-500/90 text-white" 
                                : "bg-green-500/90 text-white"
                          }`}>
                            {produto.quantidade}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold ${textPrimary} line-clamp-1 group-hover:text-blue-500 transition-colors text-sm`}>
                            {produto.nome}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-cyan-500">
                              {mostrarPreco(produto.preco)}
                            </span>
                            <span className={`text-xs ${
                              produto.quantidade <= 0 
                                ? "text-red-500" 
                                : produto.quantidade <= 5 
                                  ? "text-yellow-500" 
                                  : "text-green-500"
                            }`}>
                              {produto.quantidade} {t("unidades")}
                            </span>
                          </div>
                        </div>

                        {podeRealizarVendas && (
                          <button
                            onClick={() => handleAcaoProtegida(() => adicionarAoCarrinho(produto))}
                            disabled={produto.quantidade < 1}
                            className="px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1 text-xs font-semibold hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                            style={{
                              background: modoDark ? "linear-gradient(135deg, #3B82F6, #0EA5E9)" : "linear-gradient(135deg, #1976D2, #0284C7)",
                              color: "#FFFFFF",
                            }}
                          >
                            <FaShoppingCart size={12} />
                            {t("adicionar")}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className={`rounded-2xl border ${borderColor} ${bgCard} backdrop-blur-sm overflow-hidden`}>
                  <div className="p-4 border-b" style={{ borderColor: temaAtual.borda }}>
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: temaAtual.texto }}>
                      <FaShoppingCart className={modoDark ? "text-blue-400" : "text-blue-500"} />
                      {t("carrinho")}
                      {carrinho.length > 0 && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          modoDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"
                        }`}>
                          {carrinho.length}
                        </span>
                      )}
                    </h2>
                  </div>

                  {carrinho.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 ${
                        modoDark ? "bg-slate-700/50" : "bg-slate-100"
                      } rounded-full flex items-center justify-center`}>
                        <FaShoppingCart className={`text-2xl ${textMuted}`} />
                      </div>
                      <p className={textMuted}>{t("carrinhoVazio")}</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="max-h-64 overflow-y-auto scroll-custom space-y-3">
                        {carrinho.map((item) => (
                          <div key={item.produto.id} className={`p-3 rounded-xl border ${borderColor} ${bgHover} transition-all duration-300`}>
                            <div className="flex items-center gap-3 mb-2">
                              <Image
                                src={item.produto.foto || "/out.jpg"}
                                width={40}
                                height={40}
                                className="rounded-lg"
                                alt={item.produto.nome}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/out.jpg";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm ${textPrimary} truncate`}>
                                  {item.produto.nome}
                                </p>
                                <p className={`text-xs ${textMuted}`}>
                                  {mostrarPreco(item.produto.preco)} × {item.quantidade}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => atualizarQuantidade(item.produto.id, item.quantidade - 1)} 
                                  className={`p-1 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 ${
                                    modoDark ? "hover:bg-slate-700" : "hover:bg-slate-200"
                                  }`}
                                >
                                  <FaMinus className={`text-xs ${textMuted}`} />
                                </button>

                                <input
                                  type="text"
                                  value={
                                    inputEmFoco === item.produto.id 
                                      ? valoresInput[item.produto.id] 
                                      : valoresInput[item.produto.id] || item.quantidade.toString()
                                  }
                                  onChange={(e) => handleInputChange(item.produto.id, e.target.value)}
                                  onFocus={() => handleInputFocus(item.produto.id, item.quantidade)}
                                  onBlur={() => aplicarQuantidadeInput(item.produto.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      aplicarQuantidadeInput(item.produto.id);
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  className={`w-14 px-2 py-1 rounded-lg text-center ${bgInput} ${
                                    item.quantidade === 0 ? "text-red-500 font-bold" : textPrimary
                                  } text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500`}
                                  inputMode="numeric"
                                  placeholder="0"
                                />

                                <button 
                                  onClick={() => atualizarQuantidade(item.produto.id, item.quantidade + 1)} 
                                  disabled={item.quantidade >= item.produto.quantidade} 
                                  className={`p-1 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    modoDark ? "hover:bg-slate-700" : "hover:bg-slate-200"
                                  }`}
                                >
                                  <FaPlus className={`text-xs ${textMuted}`} />
                                </button>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-sm ${
                                  item.quantidade === 0 ? "text-red-500" : textPrimary
                                }`}>
                                  {formatarMoeda(converterPrecoParaReal(item.produto.preco) * item.quantidade)}
                                </span>
                                <button 
                                  onClick={() => removerDoCarrinho(item.produto.id)} 
                                  className={`p-1 rounded-lg cursor-pointer transition-all duration-200 hover:scale-110 ${
                                    modoDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"
                                  }`}
                                >
                                  <FaRegTrashAlt size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t" style={{ borderColor: temaAtual.borda }}>
                        <div className="mb-4">
                          <label className={`block mb-2 text-sm font-medium ${textPrimary}`}>
                            {t("cliente")}
                          </label>
                          <div className="relative" ref={menuClientesRef}>
                            <button 
                              onClick={() => setMenuClientesAberto(!menuClientesAberto)} 
                              className={`w-full flex items-center justify-between ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} transition-all duration-300 cursor-pointer`}
                            >
                              <span className="text-sm">
                                {clienteSelecionado 
                                  ? clientes.find((c) => c.id === clienteSelecionado)?.nome 
                                  : t("naoInformarCliente")
                                }
                              </span>
                              <FaChevronDown className={`text-xs transition-transform duration-300 ${
                                menuClientesAberto ? "rotate-180" : ""
                              }`} />
                            </button>

                            {menuClientesAberto && (
                              <div className={`absolute top-full left-0 mt-2 w-full ${
                                modoDark ? "bg-slate-800/95" : "bg-white/95"
                              } border ${borderColor} rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-sm max-h-48 overflow-y-auto`}>
                                <div
                                  className={`p-2 text-sm cursor-pointer transition-all duration-200 ${bgHover} ${textPrimary}`}
                                  onClick={() => {
                                    setClienteSelecionado(null);
                                    setMenuClientesAberto(false);
                                  }}
                                >
                                  {t("naoInformarCliente")}
                                </div>
                                {clientes.map((cliente) => (
                                  <div
                                    key={cliente.id}
                                    className={`p-2 text-sm cursor-pointer transition-all duration-200 ${bgHover} ${textPrimary} ${
                                      clienteSelecionado === cliente.id 
                                        ? (modoDark ? "bg-blue-500/20" : "bg-blue-100") 
                                        : ""
                                    }`}
                                    onClick={() => {
                                      setClienteSelecionado(cliente.id);
                                      setMenuClientesAberto(false);
                                    }}
                                  >
                                    {cliente.nome}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                          <span className={textPrimary}>{t("subtotal")}:</span>
                          <span className={`text-lg font-bold ${
                            totalCarrinho === 0 ? "text-red-500" : textPrimary
                          }`}>
                            {formatarMoeda(totalCarrinho)}
                          </span>
                        </div>

                        <div className="relative">
                          <button
                            onClick={finalizarVenda}
                            disabled={carregando || totalCarrinho === 0}
                            onMouseEnter={handleMouseEnterFinalizar}
                            onMouseLeave={handleMouseLeaveFinalizar}
                            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${
                              totalCarrinho === 0 
                                ? "opacity-70 cursor-not-allowed hover:scale-100" 
                                : "hover:scale-105"
                            } ${
                              modoDark 
                                ? "bg-gradient-to-r from-gray-600 to-gray-700" 
                                : "bg-gradient-to-r from-gray-400 to-gray-500"
                            }`}
                            style={{
                              ...(totalCarrinho > 0 && {
                                background: modoDark 
                                  ? "linear-gradient(135deg, #10B981, #059669)" 
                                  : "linear-gradient(135deg, #10B981, #059669)"
                              }),
                              color: "#FFFFFF",
                            }}
                          >
                            {carregando ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {t("processando")}
                              </>
                            ) : (
                              <>
                                <FaCheck size={14} />
                                {t("finalizarVenda")}
                              </>
                            )}
                          </button>
                          
                          {showTooltipFinalizar && totalCarrinho === 0 && (
                            <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${
                              modoDark 
                                ? "bg-slate-800 text-white border border-slate-700" 
                                : "bg-gray-900 text-white"
                            } shadow-lg z-50`}>
                              {t("tooltipFinalizarVenda") || "Para finalizar a venda, todos os produtos devem ter quantidade maior que 0"}
                              <div className={`absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 ${
                                modoDark ? "bg-slate-800 border-slate-700" : "bg-gray-900"
                              }`}></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className={`rounded-2xl border ${borderColor} ${bgCard} backdrop-blur-sm overflow-hidden`}>
                  <div className="p-4 border-b" style={{ borderColor: temaAtual.borda }}>
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: temaAtual.texto }}>
                      <FaHistory className={modoDark ? "text-purple-400" : "text-purple-500"} />
                      {t("vendasRecentes")}
                    </h2>
                  </div>

                  {vendas.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 ${
                        modoDark ? "bg-slate-700/50" : "bg-slate-100"
                      } rounded-full flex items-center justify-center`}>
                        <FaHistory className={`text-2xl ${textMuted}`} />
                      </div>
                      <p className={textMuted}>{t("semVendas")}</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-3">
                        {vendas.slice(0, 5).map((venda) => (
                          <div key={venda.id} className={`p-3 rounded-xl border ${borderColor} ${bgHover} transition-all duration-300`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm ${textPrimary} truncate`}>
                                  {venda.produto?.nome || "Produto desconhecido"}
                                </p>
                                <p className={`text-xs ${textMuted}`}>
                                  {venda.cliente?.nome || t("clienteNaoInformado")}
                                </p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                modoDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600"
                              }`}>
                                {venda.quantidade}x
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs ${textMuted}`}>
                                {venda.createdAt ? new Date(venda.createdAt).toLocaleDateString() : "Data desconhecida"}
                              </span>
                              <span className={`font-bold text-sm ${textPrimary}`}>
                                {formatarMoeda(venda.valorVenda || 0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}