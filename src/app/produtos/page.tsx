"use client";

import { ProdutoI } from "@/utils/types/produtos";
import { FornecedorI } from "@/utils/types/fornecedor";
import { CategoriaI } from "@/utils/types/categoria";
import { ProdutoArquivadoI } from "@/utils/types/produtos";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  FaSearch, FaCog, FaLock, FaChevronDown, FaAngleLeft, FaAngleRight,
  FaStar, FaRegStar, FaQuestionCircle, FaTimes, FaFilter, FaBox,
  FaExclamationTriangle, FaCheck, FaPlus, FaEdit, FaTrash, FaEye,
  FaWarehouse, FaUpload, FaCheckSquare, FaRegSquare, FaTrashAlt,
  FaArchive, FaHistory
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import MovimentacaoEstoqueModal from "@/components/MovimentacaoEstoqueModal";
import ArquivarProdutoModal from "@/components/ArquivarProdutoModal";
import UploadProdutosModal from '@/components/UploadProdutosModal';
import { useProdutos } from '@/hooks/useProdutos';
import Image from "next/image";
import Swal from "sweetalert2";
import Cookies from "js-cookie";

type CampoOrdenacao = "nome" | "estoque" | "preco" | "categoria" | "fornecedor" | "none";
type DirecaoOrdenacao = "asc" | "desc";

type TipoFiltro = "preco" | "estoque" | "nome" | "categoria" | "none";
type DirecaoFiltro = "maior" | "menor" | "crescente" | "decrescente" | "none";

const cores = {
  dark: {
    fundo: "#0f172a",
    texto: "#f8fafc",
    card: "#1e293b",
    borda: "#334155",
    primario: "#3b82f6",
    secundario: "#0ea5e9",
    placeholder: "#94a3b8",
    hover: "#334155",
    ativo: "#3b82f6",
    sucesso: "#10b981",
    erro: "#ef4444",
    alerta: "#f59e0b",
    gradiente: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
  },
  light: {
    fundo: "#E0DCDC",
    texto: "#0f172a",
    card: "#ffffff",
    borda: "#e2e8f0",
    primario: "#1976D2",
    secundario: "#0284C7",
    placeholder: "#64748B",
    hover: "#f1f5f9",
    ativo: "#0284C7",
    sucesso: "#10b981",
    erro: "#EF4444",
    alerta: "#F59E0B",
    gradiente: "linear-gradient(135deg, #E0DCDC 0%, #E2E8F0 50%, #CBD5E1 100%)",
  },
};

export default function Produtos() {
  const [produtos, setProdutos] = useState<ProdutoI[]>([]);
  const [produtosOriginais, setProdutosOriginais] = useState<ProdutoI[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaAtivada, setEmpresaAtivada] = useState<boolean>(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState<ProdutoI | null>(null);
  const [fornecedores, setFornecedores] = useState<FornecedorI[]>([]);
  const [categorias, setCategorias] = useState<CategoriaI[]>([]);
  const [tipoUsuario, setTipoUsuario] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [modoDark, setModoDark] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const produtosPorPagina = 12;
  const { t, i18n } = useTranslation("produtos");
  const router = useRouter();
  const [permissoesUsuario, setPermissoesUsuario] = useState<Record<string, boolean>>({});
  const [recarregarProdutos] = useState(0);
  const [, setTotalProdutos] = useState<number>(0);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [menuCategoriasAberto, setMenuCategoriasAberto] = useState(false);
  const [campoOrdenacao] = useState<CampoOrdenacao>("none");
  const [direcaoOrdenacao] = useState<DirecaoOrdenacao>("asc");
  const [cotacaoDolar, setCotacaoDolar] = useState(6);
  const [loading, setLoading] = useState(true);
  type TipoVisualizacao = "cards" | "lista";
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const descricaoRef = useRef<HTMLTextAreaElement>(null);
  const [tipoVisualizacao, setTipoVisualizacao] = useState<TipoVisualizacao>("cards");
  const [stats, setStats] = useState({
    total: 0,
    emEstoque: 0,
    emFalta: 0,
    noCatalogo: 0,
    arquivados: 0
  });

  const [modalArquivarAberto, setModalArquivarAberto] = useState(false);
  const [produtoParaArquivar, setProdutoParaArquivar] = useState<ProdutoI | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<'ativos' | 'arquivados'>('ativos');
  const [paginaArquivados, setPaginaArquivados] = useState(1);
  const [produtosArquivados, setProdutosArquivados] = useState<ProdutoArquivadoI[]>([]);
  const [paginacaoArquivados, setPaginacaoArquivados] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  const [menuFiltrosAberto, setMenuFiltrosAberto] = useState(false);
  const [tipoFiltroAtivo, setTipoFiltroAtivo] = useState<TipoFiltro>("none");
  const [direcaoFiltroAtivo, setDirecaoFiltroAtivo] = useState<DirecaoFiltro>("none");
  const [valorFiltro, setValorFiltro] = useState<number>(0);

  const [modalEstoqueAberto, setModalEstoqueAberto] = useState(false);
  const [produtoSelecionadoEstoque, setProdutoSelecionadoEstoque] = useState<{
    id: string;
    nome: string;
    quantidade: number;
  } | null>(null);

  const [produtosSelecionados, setProdutosSelecionados] = useState<Set<string>>(new Set());
  const [mostrarControlesSelecao, setMostrarControlesSelecao] = useState(false);
  const [produtosArquivadosSelecionados, setProdutosArquivadosSelecionados] = useState<Set<string>>(new Set());
  const [mostrarControlesSelecaoArquivados, setMostrarControlesSelecaoArquivados] = useState(false);

  const [form, setForm] = useState<ProdutoI>({
    id: "",
    nome: "",
    descricao: "",
    preco: 0,
    quantidade: 0,
    quantidadeMin: 0,
    foto: "",
    noCatalogo: false,
    fornecedorId: "",
    categoriaId: "",
    empresaId: "",
    fornecedor: undefined,
    categoria: undefined,
    empresa: "",
    usuarioId: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [nomeCaracteres, setNomeCaracteres] = useState(0);
  const [descricaoCaracteres, setDescricaoCaracteres] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuCategoriasRef = useRef<HTMLDivElement>(null);
  const menuFiltrosRef = useRef<HTMLDivElement>(null);
  const temaAtual = modoDark ? cores.dark : cores.light;

  const {
    mostrarModalExclusaoInteligente,
    arquivarProduto,
    restaurarProduto,
    excluirProduto,
    excluirMultiplosProdutos,
    listarArquivados,
    verificarVinculacoesMultiplas
  } = useProdutos();

  const adjustTextareaHeight = useCallback((textarea: HTMLTextAreaElement) => {
    requestAnimationFrame(() => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    });
  }, []);

  const handleDescricaoChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= 255) {
        setForm((prev) => ({ ...prev, descricao: value }));
        setDescricaoCaracteres(value.length);
        adjustTextareaHeight(e.target);
      }
    },
    [adjustTextareaHeight]
  );


  const atualizarEstatisticas = useCallback(async () => {
    if (!empresaId) return;

    try {
      const responseEstatisticas = await fetch(
        `${process.env.NEXT_PUBLIC_URL_API}/produtos/estatisticas/${empresaId}`,
        {
          headers: {
            "content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        }
      );

      if (responseEstatisticas.ok) {
        const estatisticas = await responseEstatisticas.json();

        const responseProdutos = await fetch(
          `${process.env.NEXT_PUBLIC_URL_API}/produtos/empresa/${empresaId}`,
          {
            headers: {
              "content-Type": "application/json",
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          }
        );

        let produtosAtivos = [];
        if (responseProdutos.ok) {
          const todosProdutos = await responseProdutos.json();
          produtosAtivos = todosProdutos.filter((p: ProdutoI) => !p.arquivado && p.ativo !== false);
        }

        const emEstoque = produtosAtivos.filter((p: ProdutoI) => p.quantidade > 0).length;
        const emFalta = produtosAtivos.filter((p: ProdutoI) => p.quantidade <= (p.quantidadeMin || 0)).length;
        const noCatalogo = produtosAtivos.filter((p: ProdutoI) => p.noCatalogo).length;

        setStats({
          total: produtosAtivos.length,
          emEstoque,
          emFalta,
          noCatalogo,
          arquivados: estatisticas.arquivados || 0
        });
      }
    } catch {
      console.error("Erro ao atualizar estatísticas:");
    }
  }, [empresaId]);

  const carregarProdutosArquivados = useCallback(async (pagina: number = 1) => {
    if (!empresaId) {
      return;
    }

    try {
      const token = Cookies.get("token");

      if (!token) {
        throw new Error('Token não encontrado');
      }

      const resultado = await listarArquivados(empresaId, pagina, 12);

      if (resultado && resultado.produtos) {
        setProdutosArquivados(resultado.produtos as ProdutoArquivadoI[]);
        setPaginacaoArquivados({
          page: resultado.paginacao?.page || pagina,
          limit: resultado.paginacao?.limit || 12,
          total: resultado.paginacao?.total || 0,
          totalPages: resultado.paginacao?.totalPages || 1,
        });

        setPaginaArquivados(pagina);

        await atualizarEstatisticas();
      } else {
        setProdutosArquivados([]);
        setPaginacaoArquivados({
          page: pagina,
          limit: 12,
          total: 0,
          totalPages: 1,
        });
        setPaginaArquivados(pagina);
      }
    } catch {
      console.error("Erro ao carregar produtos arquivados:");
      Swal.fire({
        title: "Erro de Autenticação",
        text: "Sua sessão expirou. Faça login novamente.",
        icon: "warning",
        background: modoDark ? temaAtual.card : "#FFFFFF",
        color: modoDark ? temaAtual.texto : temaAtual.texto,
        confirmButtonText: "Fazer Login",
      }).then((result) => {
        if (result.isConfirmed) {
          Cookies.remove("token");
          localStorage.removeItem("client_key");
          window.location.href = "/login";
        }
      });
    }
  }, [empresaId, listarArquivados, modoDark, temaAtual.card, temaAtual.texto, atualizarEstatisticas]);

  const confirmarArquivamento = async (motivo: string) => {
    if (!produtoParaArquivar) return;

    try {
      await arquivarProduto(produtoParaArquivar.id, motivo);

      Swal.fire({
        title: t("arquivamento.sucesso.titulo"),
        text: t("arquivamento.sucesso.mensagem"),
        icon: "success",
        background: modoDark ? temaAtual.card : "#FFFFFF",
        color: modoDark ? temaAtual.texto : temaAtual.texto,
      });

      await atualizarEstatisticas();

      if (filtroStatus === 'arquivados') {
        const resultado = await listarArquivados(empresaId!, 1, 12);
        const totalArquivados = resultado.paginacao?.total || 0;

        let novaPagina = paginaArquivados;

        if (produtosArquivados.length === 1 && paginaArquivados > 1) {
          novaPagina = paginaArquivados - 1;
        }

        const totalPaginasCalculado = Math.ceil(totalArquivados / 12);
        if (novaPagina > totalPaginasCalculado && totalPaginasCalculado > 0) {
          novaPagina = totalPaginasCalculado;
        }

        await carregarProdutosArquivados(novaPagina);
        setPaginaArquivados(novaPagina);
      } else {
        await recarregarListaProdutos();
      }

      setProdutosSelecionados(new Set());
      setProdutosArquivadosSelecionados(new Set());
      localStorage.removeItem('produtos_selecionados');
      localStorage.removeItem('produtos_arquivados_selecionados');

      setModalArquivarAberto(false);
      setProdutoParaArquivar(null);
    } catch {
      Swal.fire({
        title: t("arquivamento.erro.titulo"),
        text: t("arquivamento.erro.mensagem"),
        icon: "error",
        background: modoDark ? temaAtual.card : "#FFFFFF",
        color: modoDark ? temaAtual.texto : temaAtual.texto,
      });
    }
  };

  const handleRestaurar = async (produtoId: string) => {
    handleAcaoProtegida(async () => {
      try {
        await restaurarProduto(produtoId);

        Swal.fire({
          title: t("restauracao.sucesso.titulo"),
          text: t("restauracao.sucesso.mensagem"),
          icon: "success",
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });

        await atualizarEstatisticas();

        if (filtroStatus === 'arquivados') {
          const resultado = await listarArquivados(empresaId!, 1, 12);
          const totalArquivados = resultado.paginacao?.total || 0;

          let novaPagina = paginaArquivados;

          if (produtosArquivados.length === 1 && paginaArquivados > 1) {
            novaPagina = paginaArquivados - 1;
          }

          const totalPaginasCalculado = Math.ceil(totalArquivados / 12);
          if (novaPagina > totalPaginasCalculado && totalPaginasCalculado > 0) {
            novaPagina = totalPaginasCalculado;
          }

          await carregarProdutosArquivados(novaPagina);
          setPaginaArquivados(novaPagina);
        } else {
          await recarregarListaProdutos();
        }

        setProdutosArquivadosSelecionados(new Set());
        localStorage.removeItem('produtos_arquivados_selecionados');
      } catch {
        Swal.fire({
          title: t("restauracao.erro.titulo"),
          text: t("restauracao.erro.mensagem"),
          icon: "error",
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
      }
    });
  };

  const handleDelete = async (produto: ProdutoI) => {
    handleAcaoProtegida(async () => {
      await mostrarModalExclusaoInteligente(
        produto,
        modoDark,
        t,
        async (acao: 'excluir' | 'arquivar') => {
          if (acao === 'excluir') {
            try {
              await excluirProduto(produto.id);
              Swal.fire({
                title: t("produtoExcluidoSucesso.titulo"),
                text: t("produtoExcluidoSucesso.mensagem"),
                icon: "success",
                background: modoDark ? temaAtual.card : "#FFFFFF",
                color: modoDark ? temaAtual.texto : temaAtual.texto,
              });
              await recarregarListaProdutos();
              await atualizarEstatisticas();
            } catch {
              Swal.fire("Erro!", "Não foi possível deletar o produto.", "error");
            }
          } else if (acao === 'arquivar') {
            setProdutoParaArquivar(produto);
            setModalArquivarAberto(true);
          }
        }
      );
    });
  };

  const excluirProdutosSelecionadosMelhorada = async () => {
    if (produtosSelecionados.size === 0) return;

    handleAcaoProtegida(async () => {
      const produtosParaProcessar = Array.from(produtosSelecionados);

      try {
        const verificacoes = await verificarVinculacoesMultiplas(produtosParaProcessar);

        const produtosSemVinculacoes = verificacoes.filter(v => v.podeExcluir);
        const produtosComVinculacoes = verificacoes.filter(v => !v.podeExcluir);

        if (produtosComVinculacoes.length === 0) {
          const result = await Swal.fire({
            title: `Excluir ${produtosParaProcessar.length} produto(s)?`,
            html: `
            <div class="text-left">
              <p class="mb-3">Esta ação excluirá permanentemente os produtos selecionados e não poderá ser desfeita.</p>
              <div class="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <p class="text-sm font-medium text-blue-800 dark:text-blue-200">
                  <strong>Verificação realizada:</strong> Todos os produtos podem ser excluídos permanentemente pois não possuem vinculações.
                </p>
              </div>
              <p class="text-sm">Tem certeza que deseja continuar?</p>
            </div>
          `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Excluir permanentemente",
            cancelButtonText: "Cancelar",
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });

          if (result.isConfirmed) {
            const resultado = await excluirMultiplosProdutos(produtosParaProcessar, 'excluir');

            setProdutosSelecionados(new Set());
            localStorage.removeItem('produtos_selecionados');

            Swal.fire({
              title: 'Produtos excluídos',
              text: `${resultado.resultados.filter(r => r.sucesso).length} produto(s) excluído(s) com sucesso.`,
              icon: 'success',
              background: modoDark ? temaAtual.card : "#FFFFFF",
              color: modoDark ? temaAtual.texto : temaAtual.texto,
            });

            await recarregarListaProdutos();
            await atualizarEstatisticas();
          }
        } else if (produtosSemVinculacoes.length === 0) {
          const result = await Swal.fire({
            title: `Arquivar ${produtosParaProcessar.length} produto(s)?`,
            html: `
            <div class="text-left">
              <p class="mb-3">Todos os produtos selecionados possuem vinculações ativas e não podem ser excluídos permanentemente.</p>
              <div class="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <p class="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  <strong>Recomendação:</strong> Os produtos serão arquivados para manter o histórico completo.
                </p>
              </div>
              <p class="text-sm">Deseja arquivar os produtos selecionados?</p>
            </div>
          `,
            icon: "info",
            showCancelButton: true,
            confirmButtonColor: "#0ea5e9",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Arquivar produtos",
            cancelButtonText: "Cancelar",
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });

          if (result.isConfirmed) {
            const resultado = await excluirMultiplosProdutos(produtosParaProcessar, 'arquivar');

            setProdutosSelecionados(new Set());
            localStorage.removeItem('produtos_selecionados');

            Swal.fire({
              title: 'Produtos arquivados',
              text: `${resultado.resultados.filter(r => r.sucesso).length} produto(s) arquivado(s) com sucesso.`,
              icon: 'success',
              background: modoDark ? temaAtual.card : "#FFFFFF",
              color: modoDark ? temaAtual.texto : temaAtual.texto,
            });

            await recarregarListaProdutos();
            await atualizarEstatisticas();
          }
        } else {
          const result = await Swal.fire({
            title: 'Processar produtos selecionados',
            html: `
            <div class="text-left">
              <p class="mb-3">Foi detectada uma combinação de produtos com e sem vinculações:</p>
              <div class="space-y-3 mb-4">
                <div class="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <p class="font-semibold text-green-700 dark:text-green-300 mb-1">Produtos sem vinculações (${produtosSemVinculacoes.length}):</p>
                  <p class="text-sm text-green-600 dark:text-green-400">Podem ser excluídos permanentemente</p>
                </div>
                <div class="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <p class="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Produtos com vinculações (${produtosComVinculacoes.length}):</p>
                  <p class="text-sm text-yellow-600 dark:text-yellow-400">Serão arquivados para manter o histórico</p>
                </div>
              </div>
              <p class="text-sm">Deseja processar automaticamente de acordo com as regras acima?</p>
            </div>
          `,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Processar automaticamente",
            cancelButtonText: "Cancelar",
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
            showDenyButton: true,
            denyButtonText: "Arquivar todos",
            denyButtonColor: "#0ea5e9",
          });

          if (result.isConfirmed) {
            const resultado = await excluirMultiplosProdutos(produtosParaProcessar, 'excluir');

            setProdutosSelecionados(new Set());
            localStorage.removeItem('produtos_selecionados');

            const sucessos = resultado.resultados.filter(r => r.sucesso);
            const arquivadosAuto = resultado.resultados.filter(r => r.acao === 'ARQUIVADO_AUTO');

            let mensagem = `${sucessos.length} produto(s) processado(s) com sucesso.`;

            if (arquivadosAuto.length > 0) {
              mensagem += `<br><br><strong>${arquivadosAuto.length} produto(s) arquivado(s)</strong> por possuírem vinculações ativas.`;
            }

            Swal.fire({
              title: 'Ação concluída',
              html: mensagem,
              icon: 'success',
              background: modoDark ? temaAtual.card : "#FFFFFF",
              color: modoDark ? temaAtual.texto : temaAtual.texto,
            });

            await recarregarListaProdutos();
            await atualizarEstatisticas();
          } else if (result.isDenied) {
            const resultado = await excluirMultiplosProdutos(produtosParaProcessar, 'arquivar');

            setProdutosSelecionados(new Set());
            localStorage.removeItem('produtos_selecionados');

            Swal.fire({
              title: 'Produtos arquivados',
              text: `${resultado.resultados.filter(r => r.sucesso).length} produto(s) arquivado(s) com sucesso.`,
              icon: 'success',
              background: modoDark ? temaAtual.card : "#FFFFFF",
              color: modoDark ? temaAtual.texto : temaAtual.texto,
            });

            await recarregarListaProdutos();
            await atualizarEstatisticas();
          }
        }
      } catch {
        Swal.fire("Erro!", "Não foi possível processar os produtos.", "error");
      }
    });
  };

  const toggleSelecionarProduto = (produtoId: string) => {
    setProdutosSelecionados(prev => {
      const novoSet = new Set(prev);
      if (novoSet.has(produtoId)) {
        novoSet.delete(produtoId);
      } else {
        novoSet.add(produtoId);
      }

      if (novoSet.size > 0) {
        localStorage.setItem('produtos_selecionados', JSON.stringify(Array.from(novoSet)));
      } else {
        localStorage.removeItem('produtos_selecionados');
      }

      return novoSet;
    });
  };

  const toggleSelecionarProdutoArquivado = (produtoId: string) => {
    setProdutosArquivadosSelecionados(prev => {
      const novoSet = new Set(prev);
      if (novoSet.has(produtoId)) {
        novoSet.delete(produtoId);
      } else {
        novoSet.add(produtoId);
      }

      if (novoSet.size > 0) {
        localStorage.setItem('produtos_arquivados_selecionados', JSON.stringify(Array.from(novoSet)));
      } else {
        localStorage.removeItem('produtos_arquivados_selecionados');
      }

      return novoSet;
    });
  };

  const selecionarTodosDaPagina = () => {
    if (filtroStatus === 'arquivados') {
      const idsDaPagina = produtosArquivados.map(p => p.id);
      setProdutosArquivadosSelecionados(prev => {
        const novoSet = new Set(prev);
        idsDaPagina.forEach(id => novoSet.add(id));
        localStorage.setItem('produtos_arquivados_selecionados', JSON.stringify(Array.from(novoSet)));
        return novoSet;
      });
    } else {
      const idsDaPagina = produtosAtuais.map(p => p.id);
      setProdutosSelecionados(prev => {
        const novoSet = new Set(prev);
        idsDaPagina.forEach(id => novoSet.add(id));
        localStorage.setItem('produtos_selecionados', JSON.stringify(Array.from(novoSet)));
        return novoSet;
      });
    }
  };

  const desmarcarTodosDaPagina = () => {
    if (filtroStatus === 'arquivados') {
      const idsDaPagina = produtosArquivados.map(p => p.id);
      setProdutosArquivadosSelecionados(prev => {
        const novoSet = new Set(prev);
        idsDaPagina.forEach(id => novoSet.delete(id));
        if (novoSet.size > 0) {
          localStorage.setItem('produtos_arquivados_selecionados', JSON.stringify(Array.from(novoSet)));
        } else {
          localStorage.removeItem('produtos_arquivados_selecionados');
        }
        return novoSet;
      });
    } else {
      const idsDaPagina = produtosAtuais.map(p => p.id);
      setProdutosSelecionados(prev => {
        const novoSet = new Set(prev);
        idsDaPagina.forEach(id => novoSet.delete(id));
        if (novoSet.size > 0) {
          localStorage.setItem('produtos_selecionados', JSON.stringify(Array.from(novoSet)));
        } else {
          localStorage.removeItem('produtos_selecionados');
        }
        return novoSet;
      });
    }
  };

  const restaurarProdutosSelecionados = async () => {
    if (produtosArquivadosSelecionados.size === 0) return;

    handleAcaoProtegida(async () => {
      const result = await Swal.fire({
        title: t("confirmacaoRestauracaoMultipla.titulo", { count: produtosArquivadosSelecionados.size }),
        text: t("confirmacaoRestauracaoMultipla.mensagem"),
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#6b7280",
        confirmButtonText: t("confirmacaoRestauracaoMultipla.botaoConfirmar"),
        cancelButtonText: t("confirmacaoRestauracaoMultipla.botaoCancelar"),
        background: modoDark ? temaAtual.card : "#FFFFFF",
        color: modoDark ? temaAtual.texto : temaAtual.texto,
      });

      if (result.isConfirmed) {
        const resultados = [];
        const erros = [];

        for (const produtoId of Array.from(produtosArquivadosSelecionados)) {
          try {
            await restaurarProduto(produtoId);
            resultados.push({
              id: produtoId,
              nome: produtosArquivados.find(p => p.id === produtoId)?.nome || produtoId,
              sucesso: true
            });
          } catch {
            erros.push({
              id: produtoId,
              nome: produtosArquivados.find(p => p.id === produtoId)?.nome || produtoId,
              erro: 'Erro desconhecido'
            });
          }
        }

        setProdutosArquivadosSelecionados(new Set());
        localStorage.removeItem('produtos_arquivados_selecionados');

        const sucessos = resultados.filter(r => r.sucesso).length;

        Swal.fire({
          title: sucessos === produtosArquivadosSelecionados.size ? 'Sucesso!' : 'Ação parcialmente concluída',
          html: `
          <div class="text-left">
            <p>${sucessos} produto(s) restaurado(s) com sucesso.</p>
            ${erros.length > 0 ? `
              <div class="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <p class="font-semibold text-red-600 dark:text-red-400">Erros encontrados:</p>
                <ul class="text-sm mt-1">
                  ${erros.map(e => `<li>${e.nome}: ${e.erro}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `,
          icon: sucessos === produtosArquivadosSelecionados.size ? "success" : "warning",
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });

        await atualizarEstatisticas();

        const resultado = await listarArquivados(empresaId!, 1, 12);
        const totalArquivados = resultado.paginacao?.total || 0;

        let novaPagina = paginaArquivados;

        if (produtosArquivados.length === produtosArquivadosSelecionados.size && paginaArquivados > 1) {
          novaPagina = paginaArquivados - 1;
        }

        const totalPaginasCalculado = Math.ceil(totalArquivados / 12);
        if (novaPagina > totalPaginasCalculado && totalPaginasCalculado > 0) {
          novaPagina = totalPaginasCalculado;
        }

        await carregarProdutosArquivados(novaPagina);
        setPaginaArquivados(novaPagina);

        await recarregarListaProdutos();
      }
    });
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
    const salvos = localStorage.getItem('produtos_selecionados');
    if (salvos) {
      try {
        const ids = JSON.parse(salvos) as string[];
        setProdutosSelecionados(new Set(ids));
      } catch {
        localStorage.removeItem('produtos_selecionados');
      }
    }

    const salvosArquivados = localStorage.getItem('produtos_arquivados_selecionados');
    if (salvosArquivados) {
      try {
        const ids = JSON.parse(salvosArquivados) as string[];
        setProdutosArquivadosSelecionados(new Set(ids));
      } catch {
        localStorage.removeItem('produtos_arquivados_selecionados');
      }
    }

    const token = Cookies.get("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const initialize = async () => {
      setLoading(true);

      const tokenValido = await verificarToken();
      if (!tokenValido) {
        Cookies.remove("token");
        localStorage.removeItem("client_key");
        window.location.href = "/login";
        return;
      }

      const visualizacaoSalva = localStorage.getItem("produtos_visualizacao") as TipoVisualizacao;
      if (visualizacaoSalva && (visualizacaoSalva === "cards" || visualizacaoSalva === "lista")) {
        setTipoVisualizacao(visualizacaoSalva);
      }

      const usuarioSalvo = localStorage.getItem("client_key");
      if (!usuarioSalvo) {
        setLoading(false);
        return;
      }

      const usuarioValor = usuarioSalvo.replace(/"/g, "");

      try {
        const carregarPermissoes = async () => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuarios/${usuarioValor}/permissoes`, {
              headers: { "user-id": usuarioValor },
            });
            if (response.ok) {
              const dados: { permissoes: { chave: string; concedida: boolean }[] } = await response.json();
              const permissoesUsuarioObj: Record<string, boolean> = {};
              dados.permissoes.forEach((permissao) => {
                permissoesUsuarioObj[permissao.chave] = permissao.concedida;
              });
              setPermissoesUsuario(permissoesUsuarioObj);
            } else {
              const permissoesParaVerificar = ["produtos_criar", "produtos_editar", "produtos_excluir", "produtos_visualizar", "estoque_gerenciar"];
              const permissoes: Record<string, boolean> = {};
              for (const permissao of permissoesParaVerificar) {
                const temPermissao = await usuarioTemPermissao(permissao);
                permissoes[permissao] = temPermissao;
              }
              setPermissoesUsuario(permissoes);
            }
          } catch {
            console.error("Erro ao carregar permissões:");
          }
        };

        const responseUsuario = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuario/${usuarioValor}`, {
          headers: { "user-id": usuarioValor },
        });

        if (!responseUsuario.ok) {
          setLoading(false);
          return;
        }

        const usuario = await responseUsuario.json();
        setEmpresaId(usuario.empresaId);
        setTipoUsuario(usuario.tipo);

        if (usuario.empresaId) {
          const ativada = await verificarAtivacaoEmpresa(usuario.empresaId);
          setEmpresaAtivada(ativada);

          if (ativada) {
            const responseProdutos = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/produtos/empresa/${usuario.empresaId}`, {
              headers: {
                "content-Type": "application/json",
                Authorization: `Bearer ${Cookies.get("token")}`,
              },
            });

            if (responseProdutos.ok) {
              const todosProdutos = await responseProdutos.json();

              const produtosAtivos = todosProdutos.filter((p: ProdutoI) => !p.arquivado && p.ativo !== false);

              setProdutos(produtosAtivos);
              setProdutosOriginais(produtosAtivos);
              setTotalProdutos(produtosAtivos.length);

              const emEstoque = produtosAtivos.filter((p: ProdutoI) => p.quantidade > 0).length;
              const emFalta = produtosAtivos.filter((p: ProdutoI) => p.quantidade <= (p.quantidadeMin || 0)).length;
              const noCatalogo = produtosAtivos.filter((p: ProdutoI) => p.noCatalogo).length;

              const responseEstatisticas = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/produtos/estatisticas/${usuario.empresaId}`, {
                headers: {
                  "content-Type": "application/json",
                  Authorization: `Bearer ${Cookies.get("token")}`,
                },
              });

              let arquivados = 0;
              if (responseEstatisticas.ok) {
                const estatisticas = await responseEstatisticas.json();
                arquivados = estatisticas.arquivados || 0;
              }

              setStats({
                total: produtosAtivos.length,
                emEstoque,
                emFalta,
                noCatalogo,
                arquivados
              });
            }

            await carregarProdutosArquivados(1);

            try {
              const valorDolar = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL");
              const cotacaoJson = await valorDolar.json();
              setCotacaoDolar(parseFloat(cotacaoJson.USDBRL.bid));
            } catch {
              console.error("Erro ao buscar cotação do dólar:");
            }
          }
        }

        const [responseFornecedores, responseCategorias] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_URL_API}/fornecedor`, {
            headers: {
              "user-id": usuarioValor,
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          }),
          fetch(`${process.env.NEXT_PUBLIC_URL_API}/categorias`, {
            headers: {
              "user-id": usuarioValor,
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          }),
        ]);

        if (responseFornecedores.ok) {
          const fornecedoresData = await responseFornecedores.json();
          setFornecedores(fornecedoresData);
        }

        if (responseCategorias.ok) {
          const categoriasData = await responseCategorias.json();
          setCategorias(categoriasData);
        }

        await carregarPermissoes();
      } catch {
        console.error("Erro ao inicializar:");
      } finally {
        setLoading(false);
      }
    };

    function handleClickOutside(event: MouseEvent) {
      if (menuCategoriasRef.current && !menuCategoriasRef.current.contains(event.target as Node)) {
        setMenuCategoriasAberto(false);
      }
      if (menuFiltrosRef.current && !menuFiltrosRef.current.contains(event.target as Node)) {
        setMenuFiltrosAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

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
      
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);

    initialize();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.head.removeChild(style);
    };
  }, [modoDark, recarregarProdutos, carregarProdutosArquivados]);



  useEffect(() => {
    if (filtroStatus === 'arquivados') {
      carregarProdutosArquivados(paginaArquivados);
    }
  }, [paginaArquivados, filtroStatus, carregarProdutosArquivados]);

  useEffect(() => {
    if (produtosOriginais.length > 0) {
      let produtosFiltrados = [...produtosOriginais];

      if (tipoFiltroAtivo !== "none" && direcaoFiltroAtivo !== "none") {
        produtosFiltrados = produtosFiltrados.filter((produto) => {
          switch (tipoFiltroAtivo) {
            case "preco":
              if (direcaoFiltroAtivo === "maior") {
                return produto.preco > valorFiltro;
              } else {
                return produto.preco < valorFiltro;
              }
            case "estoque":
              if (direcaoFiltroAtivo === "maior") {
                return produto.quantidade > valorFiltro;
              } else {
                return produto.quantidade < valorFiltro;
              }
            default:
              return true;
          }
        });

        if (tipoFiltroAtivo === "nome") {
          produtosFiltrados.sort((a, b) => {
            if (direcaoFiltroAtivo === "crescente") {
              return a.nome.localeCompare(b.nome);
            } else {
              return b.nome.localeCompare(a.nome);
            }
          });
        }
      } else {
        const produtosOrdenados = ordenarProdutos(produtosOriginais, campoOrdenacao, direcaoOrdenacao);
        setProdutos(produtosOrdenados);
        return;
      }

      setProdutos(produtosFiltrados);
    }

    if (modalVisualizar) {
      let precoParaMostrar = modalVisualizar.preco;

      if (i18n.language === "en") {
        precoParaMostrar = modalVisualizar.preco / cotacaoDolar;
      }

      setForm({
        ...modalVisualizar,
        preco: parseFloat(precoParaMostrar.toFixed(2)),
        quantidade: modalVisualizar.quantidade,
        quantidadeMin: modalVisualizar.quantidadeMin || 0,
      });
      setPreview(modalVisualizar.foto || null);
      setNomeCaracteres(modalVisualizar.nome?.length || 0);
      setDescricaoCaracteres(modalVisualizar.descricao?.length || 0);

      if (descricaoRef.current) {
        requestAnimationFrame(() => {
          if (descricaoRef.current) {
            descricaoRef.current.style.height = "auto";
            descricaoRef.current.style.height = descricaoRef.current.scrollHeight + "px";
          }
        });
      }
    }
  }, [produtosOriginais, campoOrdenacao, direcaoOrdenacao, tipoFiltroAtivo, direcaoFiltroAtivo, valorFiltro, modalVisualizar, i18n.language, cotacaoDolar]);

  useEffect(() => {
    if (modalAberto && !modalVisualizar) {
      setForm({
        id: "",
        nome: "",
        descricao: "",
        preco: 0,
        quantidade: 0,
        quantidadeMin: 0,
        foto: "",
        noCatalogo: false,
        fornecedorId: "",
        categoriaId: "",
        empresaId: "",
        fornecedor: undefined,
        categoria: undefined,
        empresa: "",
        usuarioId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setNomeCaracteres(0);
      setDescricaoCaracteres(0);
      setFile(null);
      setPreview(null);
    }
  }, [modalAberto, modalVisualizar]);

  useEffect(() => {
    setMostrarControlesSelecao(produtosSelecionados.size > 0);
    setMostrarControlesSelecaoArquivados(produtosArquivadosSelecionados.size > 0);
  }, [produtosSelecionados.size, produtosArquivadosSelecionados.size]);

  const recarregarListaProdutos = useCallback(async () => {
    if (!empresaId) return;

    try {
      const responseProdutos = await fetch(
        `${process.env.NEXT_PUBLIC_URL_API}/produtos/empresa/${empresaId}`,
        {
          headers: {
            "content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        }
      );

      if (responseProdutos.ok) {
        const todosProdutos = await responseProdutos.json();
        const produtosAtivos = todosProdutos.filter((p: ProdutoI) => !p.arquivado && p.ativo !== false);

        setProdutos(produtosAtivos);
        setProdutosOriginais(produtosAtivos);
        setTotalProdutos(produtosAtivos.length);

        await atualizarEstatisticas();
      }
    } catch {
      console.error("Erro ao recarregar produtos:");
    }
  }, [empresaId, atualizarEstatisticas]);

  useEffect(() => {
    if (filtroStatus === 'arquivados') {
      carregarProdutosArquivados(1);
    } else if (filtroStatus === 'ativos') {
      recarregarListaProdutos();
      setPaginaAtual(1);
    }
  }, [filtroStatus, carregarProdutosArquivados, recarregarListaProdutos]);
  const ordenarProdutos = (produtos: ProdutoI[], campo: CampoOrdenacao, direcao: DirecaoOrdenacao) => {
    if (campo === "none") return [...produtos];

    return [...produtos].sort((a, b) => {
      let valorA, valorB;

      switch (campo) {
        case "nome":
          valorA = a.nome.toLowerCase();
          valorB = b.nome.toLowerCase();
          break;
        case "estoque":
          valorA = a.quantidade;
          valorB = b.quantidade;
          break;
        case "preco":
          valorA = a.preco;
          valorB = b.preco;
          break;
        case "categoria":
          valorA = a.categoria?.nome?.toLowerCase() || "";
          valorB = b.categoria?.nome?.toLowerCase() || "";
          break;
        case "fornecedor":
          valorA = a.fornecedor?.nome?.toLowerCase() || "";
          valorB = b.fornecedor?.nome?.toLowerCase() || "";
          break;
        default:
          return 0;
      }

      if (valorA < valorB) {
        return direcao === "asc" ? -1 : 1;
      }
      if (valorA > valorB) {
        return direcao === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const aplicarFiltroAvancado = (tipo: TipoFiltro, direcao: DirecaoFiltro, valor?: number) => {
    setTipoFiltroAtivo(tipo);
    setDirecaoFiltroAtivo(direcao);
    if (valor !== undefined) {
      setValorFiltro(valor);
    }
    setPaginaAtual(1);
    setMenuFiltrosAberto(false);
  };

  const removerTodosFiltros = () => {
    setTipoFiltroAtivo("none");
    setDirecaoFiltroAtivo("none");
    setValorFiltro(0);
    setFiltroCategoria(null);
    setPaginaAtual(1);
  };

  const alterarVisualizacao = (novoTipo: TipoVisualizacao) => {
    setTipoVisualizacao(novoTipo);
    localStorage.setItem("produtos_visualizacao", novoTipo);
  };

  const usuarioTemPermissao = async (permissaoChave: string): Promise<boolean> => {
    try {
      const usuarioSalvo = localStorage.getItem("client_key");
      if (!usuarioSalvo) return false;

      const usuarioId = usuarioSalvo.replace(/"/g, "");
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuarios/${usuarioId}/tem-permissao/${permissaoChave}`, {
        headers: {
          "user-id": usuarioId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.temPermissao;
      }
      return false;
    } catch {
      return false;
    }
  };

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
    } catch {
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

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 60) {
      setForm({ ...form, nome: value });
      setNomeCaracteres(value.length);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const uploadFotoSeparada = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("foto", file);

      const usuarioSalvo = localStorage.getItem("client_key");
      if (!usuarioSalvo) return null;
      const usuarioValor = usuarioSalvo.replace(/"/g, "");

      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/produtos/upload-foto`, {
        method: "POST",
        body: formData,
        headers: {
          "user-id": usuarioValor,
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.fotoUrl;
      } else {
        return null;
      }
    } catch {
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const toggleCatalogo = async (produtoId: string, noCatalogo: boolean) => {
    const usuarioSalvo = localStorage.getItem("client_key");
    if (!usuarioSalvo) return;
    const usuarioValor = usuarioSalvo.replace(/"/g, "");

    handleAcaoProtegida(async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/produtos/${produtoId}/catalogo`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "user-id": usuarioValor,
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
          body: JSON.stringify({ noCatalogo: !noCatalogo }),
        });

        if (response.ok) {
          const produtoAtualizado = await response.json();

          setProdutos((prevProdutos) => prevProdutos.map((p) => (p.id === produtoId ? { ...p, noCatalogo: produtoAtualizado.noCatalogo } : p)));

          if (modalVisualizar && modalVisualizar.id === produtoId) {
            setModalVisualizar((prev) => (prev ? { ...prev, noCatalogo: produtoAtualizado.noCatalogo } : null));
          }

          Swal.fire({
            position: "center",
            icon: "success",
            title: produtoAtualizado.noCatalogo ? t("produtoAdicionadoCatalogo.titulo") : t("produtoRemovidoCatalogo.titulo"),
            showConfirmButton: false,
            timer: 1500,
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });
        } else {
          Swal.fire("Erro!", "Não foi possível alterar o catálogo", "error");
        }
      } catch {
        Swal.fire("Erro!", "Erro de conexão avec le serveur", "error");
      }
    });
  };

  const handleSubmit = async () => {
    handleAcaoProtegida(async () => {
      const usuarioSalvo = localStorage.getItem("client_key");
      if (!usuarioSalvo) return;
      const usuarioValor = usuarioSalvo.replace(/"/g, "");

      if (!empresaId) {
        Swal.fire("Erro", "Empresa não identificada.", "error");
        return;
      }

      const camposObrigatorios = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        quantidadeMin: form.quantidadeMin !== 0,
      };

      const camposFaltando = Object.entries(camposObrigatorios)
        .filter(([, value]) => !value)
        .map(([campo]) => campo);

      if (camposFaltando.length > 0) {
        const camposTraduzidos = camposFaltando.map((campo) => {
          switch (campo) {
            case "nome":
              return t("nome");
            case "descricao":
              return t("descricao");
            case "quantidadeMin":
              return t("quantidadeMinima");
            default:
              return campo;
          }
        });

        Swal.fire({
          icon: "error",
          title: t("erroCamposObrigatorios.titulo") || "Campos obrigatórios",
          html: `${t("erroCamposObrigatorios.mensagem") || "Preencha os campos obrigatórios:"}<br><strong>${camposTraduzidos.join(", ")}</strong>`,
          confirmButtonColor: "#EF4444",
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
        return;
      }

      if (empresaId) {
        const empresaAtivada = await verificarAtivacaoEmpresa(empresaId);
        if (!empresaAtivada) {
          mostrarAlertaNaoAtivada();
          return;
        }
      }

      try {
        let fotoUrl = form.foto;

        if (file) {
          const uploadedUrl = await uploadFotoSeparada(file);
          if (uploadedUrl) {
            fotoUrl = uploadedUrl;
          } else {
            Swal.fire("Aviso", "Upload da foto falhou, continuando sem imagem", "warning");
          }
        }

        let precoParaSalvar = form.preco || 0;

        if (i18n.language === "en") {
          precoParaSalvar = form.preco * cotacaoDolar;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/produtos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-id": usuarioValor,
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
          body: JSON.stringify({
            nome: form.nome,
            descricao: form.descricao,
            preco: precoParaSalvar,
            quantidade: form.quantidade || 0,
            quantidadeMin: form.quantidadeMin,
            noCatalogo: form.noCatalogo,
            fornecedorId: form.fornecedorId,
            categoriaId: form.categoriaId,
            empresaId: empresaId,
            usuarioId: usuarioValor,
            fotoUrl: fotoUrl,
          }),
        });

        if (response.ok) {
          setModalAberto(false);
          setForm({
            id: "",
            nome: "",
            descricao: "",
            noCatalogo: false,
            preco: 0,
            quantidade: 0,
            quantidadeMin: 0,
            foto: "",
            fornecedorId: "",
            categoriaId: "",
            empresaId: "",
            fornecedor: undefined,
            categoria: undefined,
            empresa: "",
            usuarioId: "",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setFile(null);
          setPreview(null);

          Swal.fire({
            position: "center",
            icon: "success",
            title: t("produtoCriadoSucesso.titulo"),
            showConfirmButton: false,
            timer: 1500,
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });

          await recarregarListaProdutos();
          await atualizarEstatisticas();
        } else {
          const errorData = await response.json();
          Swal.fire("Erro!", `Erro ao cadastrar produto: ${errorData.mensagem || "Erro desconhecido"}`, "error");
        }
      } catch {
        Swal.fire("Erro!", "Erro de conexão com o servidor", "error");
      }
    });
  };

  const uploadFotoUpdate = async (file: File, produtoId: string): Promise<string | null> => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("foto", file);

      const usuarioSalvo = localStorage.getItem("client_key");
      if (!usuarioSalvo) return null;
      const usuarioValor = usuarioSalvo.replace(/"/g, "");

      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/produtos/${produtoId}/upload-foto`, {
        method: "PUT",
        body: formData,
        headers: {
          "user-id": usuarioValor,
          Authorization: `Bearer ${Cookies.get("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.fotoUrl;
      } else {
        return null;
      }
    } catch {
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async () => {
    handleAcaoProtegida(async () => {
      const usuarioSalvo = localStorage.getItem("client_key");
      if (!usuarioSalvo) return;
      const usuarioValor = usuarioSalvo.replace(/"/g, "");
      if (!modalVisualizar) return;

      const camposObrigatorios = {
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        quantidadeMin: form.quantidadeMin !== 0,
      };

      const camposFaltando = Object.entries(camposObrigatorios)
        .filter(([, value]) => !value)
        .map(([campo]) => campo);

      if (camposFaltando.length > 0) {
        const camposTraduzidos = camposFaltando.map((campo) => {
          switch (campo) {
            case "nome":
              return t("nome");
            case "descricao":
              return t("descricao");
            case "quantidadeMin":
              return t("quantidadeMinima");
            default:
              return campo;
          }
        });

        Swal.fire({
          icon: "error",
          title: t("erroCamposObrigatorios.titulo") || "Campos obrigatórios",
          html: `${t("erroCamposObrigatorios.mensagem") || "Preencha os campos obrigatórios:"}<br><strong>${camposTraduzidos.join(", ")}</strong>`,
          confirmButtonColor: "#EF4444",
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
        return;
      }

      if (empresaId) {
        const empresaAtivada = await verificarAtivacaoEmpresa(empresaId);
        if (!empresaAtivada) {
          mostrarAlertaNaoAtivada();
          return;
        }
      }

      try {
        let fotoUrl = form.foto;

        if (file) {
          const uploadedUrl = await uploadFotoUpdate(file, modalVisualizar.id);
          if (uploadedUrl) {
            fotoUrl = uploadedUrl;
          } else {
            Swal.fire("Aviso", "Upload da foto falhou, mantendo imagem anterior", "warning");
          }
        }

        let precoParaSalvar = form.preco;

        if (i18n.language === "en") {
          precoParaSalvar = form.preco * cotacaoDolar;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/produtos/${modalVisualizar.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "user-id": usuarioValor,
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
          body: JSON.stringify({
            nome: form.nome,
            descricao: form.descricao,
            preco: precoParaSalvar,
            quantidadeMin: form.quantidadeMin,
            noCatalogo: form.noCatalogo,
            fornecedorId: form.fornecedorId,
            categoriaId: form.categoriaId,
            usuarioId: usuarioValor,
            fotoUrl: fotoUrl,
          }),
        });

        if (response.ok) {
          const updatedProduto = await response.json();

          setModalVisualizar(null);
          setFile(null);
          setPreview(null);

          setProdutos(produtos.map((p) => (p.id === updatedProduto.id ? updatedProduto : p)));
          Swal.fire({
            position: "center",
            icon: "success",
            title: t("produtoAtualizadoSucesso.titulo"),
            showConfirmButton: false,
            timer: 1500,
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });
          await recarregarListaProdutos();
          await atualizarEstatisticas();
        } else {
          const errorText = await response.text();
          Swal.fire({
            icon: "error",
            title: "Erro!",
            text: `Erro ao atualizar produto: ${errorText}`,
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });
        }
      } catch {
        Swal.fire({
          icon: "error",
          title: "Erro!",
          text: "Erro inesperado ao tentar atualizar.",
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
      }
    });
  };

  const aplicarFiltroCategoria = (categoriaId: string | null) => {
    setFiltroCategoria(categoriaId);
    setPaginaAtual(1);
    setMenuCategoriasAberto(false);
  };

  const abrirModalEstoque = (produto: ProdutoI) => {
    setProdutoSelecionadoEstoque({
      id: produto.id,
      nome: produto.nome,
      quantidade: produto.quantidade,
    });
    setModalEstoqueAberto(true);
  };

  const produtosFiltrados = produtos.filter((produto) => {
    const buscaMatch = produto.nome.toLowerCase().includes(busca.toLowerCase());
    const categoriaMatch = filtroCategoria ? produto.categoriaId === filtroCategoria : true;
    return buscaMatch && categoriaMatch;
  });

  const indexUltimoProduto = paginaAtual * produtosPorPagina;
  const indexPrimeiroProduto = indexUltimoProduto - produtosPorPagina;
  const produtosAtuais = produtosFiltrados.slice(indexPrimeiroProduto, indexUltimoProduto);
  const totalPaginas = Math.ceil(produtosFiltrados.length / produtosPorPagina);

  const produtosArquivadosAtuais = produtosArquivados;

  const mudarPagina = (novaPagina: number) => {
    setPaginaAtual(novaPagina);
  };

  const nomeCategoriaSelecionada = filtroCategoria ? categorias.find((c) => String(c.id) === filtroCategoria)?.nome : null;

  const temFiltroAtivo = filtroCategoria || tipoFiltroAtivo !== "none";

  const podeUploadProdutos = tipoUsuario === "PROPRIETARIO" || permissoesUsuario.produtos_criar;
  const podeVisualizar = tipoUsuario === "PROPRIETARIO" || permissoesUsuario.produtos_visualizar;
  const podeCriar = tipoUsuario === "PROPRIETARIO" || permissoesUsuario.produtos_criar;
  const podeEditar = tipoUsuario === "PROPRIETARIO" || permissoesUsuario.produtos_editar;
  const podeExcluir = tipoUsuario === "PROPRIETARIO" || permissoesUsuario.produtos_excluir;
  const podeGerenciarCatalogo = tipoUsuario === "PROPRIETARIO" || permissoesUsuario.produtos_editar;
  const podeGerenciarEstoque = tipoUsuario === "PROPRIETARIO" || permissoesUsuario.estoque_gerenciar;
  const podeRestaurar = tipoUsuario === "PROPRIETARIO" || permissoesUsuario.produtos_editar;

  const verificarToken = async (): Promise<boolean> => {
    const token = Cookies.get("token");
    if (!token) {
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiracao = payload.exp * 1000;
      const agora = Date.now();

      if (expiracao < agora) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  if (!podeVisualizar) {
    return (
      <div className={`min-h-screen ${modoDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100"} flex items-center justify-center px-4`}>
        <div className="text-center">
          <div className={`w-24 h-24 mx-auto mb-6 ${modoDark ? "bg-red-500/20" : "bg-red-100"} rounded-full flex items-center justify-center`}>
            <FaLock className={`text-3xl ${modoDark ? "text-red-400" : "text-red-500"}`} />
          </div>
          <h1 className={`text-2xl font-bold ${modoDark ? "text-white" : "text-slate-900"} mb-4`}>{t("acessoRestrito")}</h1>
          <p className={modoDark ? "text-gray-300" : "text-slate-600"}>{t("acessoRestritoMensagem")}</p>
        </div>
      </div>
    );
  }

  const bgGradient = modoDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-slate-200 via-blue-50 to-slate-200";

  const textPrimary = modoDark ? "text-white" : "text-slate-900";
  const textSecondary = modoDark ? "text-gray-300" : "text-slate-600";
  const textMuted = modoDark ? "text-gray-400" : "text-black";
  const bgCard = modoDark ? "bg-slate-800/50" : "bg-gray-50/80";
  const borderColor = modoDark ? "border-blue-500/30" : "border-blue-400";
  const bgInput = modoDark ? "bg-slate-700/50" : "bg-gray-200";
  const bgStats = modoDark ? "bg-slate-800/50" : "bg-white/80";
  const bgHover = modoDark ? "hover:bg-slate-700/50" : "hover:bg-slate-50";
  const bgSelected = modoDark ? "bg-blue-500/20" : "bg-blue-100";

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
                  {t("titulo")} <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{t("produtos")}</span>
                </h1>
                <p className={`text-lg ${textSecondary} max-w-2xl mx-auto`}>{t("subtitulo")}</p>
              </div>
            </section>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {[
                {
                  label: t("stats.total"),
                  value: stats.total,
                  icon: FaBox,
                  color: "from-blue-500 to-cyan-500",
                  bgColor: modoDark ? "bg-blue-500/10" : "bg-blue-50",
                },
                {
                  label: t("stats.emEstoque"),
                  value: stats.emEstoque,
                  icon: FaCheck,
                  color: "from-green-500 to-emerald-500",
                  bgColor: modoDark ? "bg-green-500/10" : "bg-green-50",
                },
                {
                  label: t("stats.emFalta"),
                  value: stats.emFalta,
                  icon: FaExclamationTriangle,
                  color: "from-red-500 to-orange-500",
                  bgColor: modoDark ? "bg-red-500/10" : "bg-red-50",
                },
                {
                  label: t("stats.noCatalogo"),
                  value: stats.noCatalogo,
                  icon: FaStar,
                  color: "from-slate-500 to-slate-400",
                  bgColor: modoDark ? "bg-slate-500/10" : "bg-slate-50",
                },
                {
                  label: t("stats.arquivados"),
                  value: stats.arquivados,
                  icon: FaArchive,
                  color: "from-slate-600 to-slate-500",
                  bgColor: modoDark ? "bg-slate-600/10" : "bg-slate-100",
                },
              ].map((stat, index) => (
                <div key={index} className="gradient-border animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className={`p-3 sm:p-4 rounded-[15px] ${bgStats} backdrop-blur-sm card-hover min-h-[90px] sm:min-h-[100px] flex flex-col justify-center`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className={`text-base sm:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1 overflow-hidden whitespace-nowrap`}>
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

            {(mostrarControlesSelecao || produtosSelecionados.size > 0) && filtroStatus !== 'arquivados' && (
              <div className={`mb-4 p-4 rounded-2xl ${modoDark ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30" : "bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200"}`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${modoDark ? "bg-blue-500/20" : "bg-blue-100"} rounded-xl`}>
                      <FaCheckSquare className={`text-lg ${modoDark ? "text-blue-400" : "text-blue-500"}`} />
                    </div>
                    <div>
                      <p className={`font-bold ${textPrimary} text-sm`}>
                        {t("produtosSelecionados.titulo", { count: produtosSelecionados.size })}
                      </p>
                      <p className={textMuted}>{t("produtosSelecionados.mensagem")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={excluirProdutosSelecionadosMelhorada}
                      disabled={produtosSelecionados.size === 0}
                      className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold ${produtosSelecionados.size === 0 ? "opacity-50 cursor-not-allowed" : "hover:scale-105"} shadow-lg`}
                      style={{
                        background: modoDark ? "linear-gradient(135deg, #EF4444, #DC2626)" : "linear-gradient(135deg, #EF4444, #DC2626)",
                        color: "#FFFFFF",
                      }}
                    >
                      <FaTrashAlt size={14} />
                      {t("excluirSelecionados")} ({produtosSelecionados.size})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(mostrarControlesSelecaoArquivados || produtosArquivadosSelecionados.size > 0) && filtroStatus === 'arquivados' && podeRestaurar && (
              <div className={`mb-4 p-4 rounded-2xl ${modoDark ? "bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30" : "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"}`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${modoDark ? "bg-green-500/20" : "bg-green-100"} rounded-xl`}>
                      <FaCheckSquare className={`text-lg ${modoDark ? "text-green-400" : "text-green-500"}`} />
                    </div>
                    <div>
                      <p className={`font-bold ${textPrimary} text-sm`}>
                        {t("produtosArquivadosSelecionados.titulo", { count: produtosArquivadosSelecionados.size })}
                      </p>
                      <p className={textMuted}>{t("produtosArquivadosSelecionados.mensagem")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={restaurarProdutosSelecionados}
                      disabled={produtosArquivadosSelecionados.size === 0}
                      className={`px-4 py-2 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-semibold ${produtosArquivadosSelecionados.size === 0 ? "opacity-50 cursor-not-allowed" : "hover:scale-105"} shadow-lg`}
                      style={{
                        background: modoDark ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #10b981, #059669)",
                        color: "#FFFFFF",
                      }}
                    >
                      <FaHistory size={14} />
                      {t("restaurarSelecionados")} ({produtosArquivadosSelecionados.size})
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFiltroStatus('ativos')}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium text-sm ${filtroStatus === 'ativos'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                    : modoDark
                      ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  {t("filtros.apenasAtivos")} ({stats.total})
                </button>

                <button
                  onClick={() => {
                    setFiltroStatus('arquivados');
                    setPaginaArquivados(1); // Resetar para página 1
                  }}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium text-sm ${filtroStatus === 'arquivados'
                    ? 'bg-gradient-to-r from-slate-500 to-slate-400 text-white shadow-lg'
                    : modoDark
                      ? 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  {t("filtros.apenasArquivados")} ({stats.arquivados})
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                  <div className="relative flex-1 max-w-md">
                    <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-20 transition-opacity duration-300`}></div>
                    <div className={`relative flex items-center ${bgCard} rounded-xl px-4 py-3 border ${borderColor} backdrop-blur-sm`}>
                      <FaSearch className={`${modoDark ? "text-blue-400" : "text-blue-500"} mr-3 text-sm`} />
                      <input
                        type="text"
                        placeholder={t("buscarPlaceholder")}
                        value={busca}
                        onChange={(e) => {
                          setBusca(e.target.value);
                          setPaginaAtual(1);
                        }}
                        className={`bg-transparent border-none outline-none ${textPrimary} placeholder-${modoDark ? "gray-400" : "slate-500"} w-full text-sm`}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {filtroStatus !== 'arquivados' && (
                      <>
                        <div className="relative" ref={menuFiltrosRef}>
                          <button onClick={() => setMenuFiltrosAberto(!menuFiltrosAberto)} className={`flex items-center gap-3 ${bgCard} ${bgHover} border cursor-pointer ${borderColor} rounded-xl px-4 py-3 transition-all duration-300 backdrop-blur-sm`}>
                            <FaFilter className={modoDark ? "text-blue-400" : "text-blue-500"} />
                            <span className={`${textPrimary} text-sm`}>{t("filtros.filtrar")}</span>
                            <FaChevronDown className={`${modoDark ? "text-blue-400" : "text-blue-500"} transition-transform duration-300 text-xs ${menuFiltrosAberto ? "rotate-180" : ""}`} />
                          </button>

                          {menuFiltrosAberto && (
                            <div className={`absolute top-full left-0 mt-2 w-64 ${modoDark ? "bg-slate-800/95" : "bg-white/95"} border ${borderColor} rounded-xl shadow-2xl ${modoDark ? "shadow-blue-500/20" : "shadow-blue-200"} z-50 overflow-hidden backdrop-blur-sm`}>
                              <div className="p-3">
                                <div className={`text-sm font-semibold ${textPrimary} mb-2`}>{t("filtros.titulo")}</div>
                                <div className="mb-3">
                                  <div className={`text-xs font-medium ${textMuted} mb-2`}>{t("filtros.preco")}</div>
                                  <div className="flex gap-2 mb-2">
                                    <input type="number" placeholder={t("filtros.valor")} value={valorFiltro || ""} onChange={(e) => setValorFiltro(Number(e.target.value))} className={`flex-1 ${bgInput} border ${borderColor} rounded-lg px-2 py-1 ${textPrimary} text-xs`} />
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={() => aplicarFiltroAvancado("preco", "maior")} className={`flex-1 px-2 py-1 rounded-lg cursor-pointer text-xs transition-all ${tipoFiltroAtivo === "preco" && direcaoFiltroAtivo === "maior" ? `${bgSelected} text-blue-600 font-medium` : `${bgHover} ${textPrimary}`}`}>
                                      {t("filtros.maiorQue")}
                                    </button>
                                    <button onClick={() => aplicarFiltroAvancado("preco", "menor")} className={`flex-1 px-2 py-1 rounded-lg cursor-pointer text-xs transition-all ${tipoFiltroAtivo === "preco" && direcaoFiltroAtivo === "menor" ? `${bgSelected} text-blue-600 font-medium` : `${bgHover} ${textPrimary}`}`}>
                                      {t("filtros.menorQue")}
                                    </button>
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <div className={`text-xs font-medium ${textMuted} mb-2`}>{t("filtros.estoque")}</div>
                                  <div className="flex gap-2 mb-2">
                                    <input type="number" placeholder={t("filtros.quantidade")} value={valorFiltro || ""} onChange={(e) => setValorFiltro(Number(e.target.value))} className={`flex-1 ${bgInput} border ${borderColor} rounded-lg px-2 py-1 ${textPrimary} text-xs`} />
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={() => aplicarFiltroAvancado("estoque", "maior")} className={`flex-1 px-2 py-1 cursor-pointer rounded-lg text-xs transition-all ${tipoFiltroAtivo === "estoque" && direcaoFiltroAtivo === "maior" ? `${bgSelected} text-blue-600 font-medium` : `${bgHover} ${textPrimary}`}`}>
                                      {t("filtros.maiorQue")}
                                    </button>
                                    <button onClick={() => aplicarFiltroAvancado("estoque", "menor")} className={`flex-1 px-2 cursor-pointer py-1 rounded-lg text-xs transition-all ${tipoFiltroAtivo === "estoque" && direcaoFiltroAtivo === "menor" ? `${bgSelected} text-blue-600 font-medium` : `${bgHover} ${textPrimary}`}`}>
                                      {t("filtros.menorQue")}
                                    </button>
                                  </div>
                                </div>
                                <div className="mb-3">
                                  <div className={`text-xs font-medium ${textMuted} mb-2`}>{t("filtros.nome")}</div>
                                  <div className="flex gap-1">
                                    <button onClick={() => aplicarFiltroAvancado("nome", "crescente")} className={`flex-1 px-2 cursor-pointer py-1 rounded-lg text-xs transition-all ${tipoFiltroAtivo === "nome" && direcaoFiltroAtivo === "crescente" ? `${bgSelected} text-blue-600 font-medium` : `${bgHover} ${textPrimary}`}`}>
                                      {t("filtros.aZ")}
                                    </button>
                                    <button onClick={() => aplicarFiltroAvancado("nome", "decrescente")} className={`flex-1 cursor-pointer px-2 py-1 rounded-lg text-xs transition-all ${tipoFiltroAtivo === "nome" && direcaoFiltroAtivo === "decrescente" ? `${bgSelected} text-blue-600 font-medium` : `${bgHover} ${textPrimary}`}`}>
                                      {t("filtros.zA")}
                                    </button>
                                  </div>
                                </div>
                                {temFiltroAtivo && (
                                  <button onClick={removerTodosFiltros} className={`w-full px-3 cursor-pointer py-2 ${modoDark ? "bg-red-500/10 hover:bg-red-500/20" : "bg-red-50 hover:bg-red-100"} border ${modoDark ? "border-red-500/30" : "border-red-200"} rounded-lg ${modoDark ? "text-red-400" : "text-red-500"} transition-all duration-300 text-xs font-medium`}>
                                    {t("filtros.limparTodos")}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="relative" ref={menuCategoriasRef}>
                          <button onClick={() => setMenuCategoriasAberto(!menuCategoriasAberto)} className={`flex items-center cursor-pointer gap-3 ${bgCard} ${bgHover} border ${borderColor} rounded-xl px-4 py-3 transition-all duration-300 backdrop-blur-sm min-w-[180px]`}>
                            <FaFilter className={modoDark ? "text-blue-400" : "text-blue-500"} />
                            <span className={`${textPrimary} flex-1 text-left text-sm`}>{filtroCategoria ? nomeCategoriaSelecionada : t("filtros.todasCategorias")}</span>
                            <FaChevronDown className={`${modoDark ? "text-blue-400" : "text-blue-500"} transition-transform duration-300 text-xs ${menuCategoriasAberto ? "rotate-180" : ""}`} />
                          </button>

                          {menuCategoriasAberto && (
                            <div className={`absolute top-full left-0 mt-2 w-56 ${modoDark ? "bg-slate-800/95" : "bg-white/95"} border ${borderColor} rounded-xl shadow-2xl ${modoDark ? "shadow-blue-500/20" : "shadow-blue-200"} z-50 overflow-hidden backdrop-blur-sm`}>
                              <div className="p-2 max-h-48 overflow-y-auto scroll-custom">
                                <div className={`text-xs font-semibold ${textMuted} px-2 py-1 mb-1`}>{t("categoriasLabel")}</div>
                                {categorias.slice(0, 100).map((categoria) => (
                                  <div key={categoria.id} className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${bgHover} hover:scale-105 text-sm ${filtroCategoria === String(categoria.id) ? `${bgSelected} scale-105 font-medium` : ""}`} onClick={() => aplicarFiltroCategoria(String(categoria.id))}>
                                    <span className={textPrimary}>{t(`categorias.${categoria.nome}`, { defaultValue: categoria.nome })}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {totalPaginas > 1 && (
                          <div className={`flex items-center gap-1 ${bgCard} border ${borderColor} rounded-xl px-3 py-2`}>
                            <button onClick={() => mudarPagina(paginaAtual - 1)} disabled={paginaAtual === 1} className={`p-1 cursor-pointer  rounded-lg transition-all duration-300 ${paginaAtual === 1 ? `${textMuted} cursor-not-allowed` : `${textPrimary} ${bgHover} hover:scale-105`}`}>
                              <FaAngleLeft className="text-sm" />
                            </button>

                            <span className={`${textPrimary} text-sm mx-2`}>
                              {paginaAtual}/{totalPaginas}
                            </span>

                            <button onClick={() => mudarPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas} className={`p-1 cursor-pointer  rounded-lg transition-all duration-300 ${paginaAtual === totalPaginas ? `${textMuted} cursor-not-allowed` : `${textPrimary} ${bgHover} hover:scale-105`}`}>
                              <FaAngleRight className="text-sm" />
                            </button>
                          </div>
                        )}
                        {filtroCategoria && (
                          <button onClick={() => aplicarFiltroCategoria(null)} className={`px-4 cursor-pointer py-3 ${modoDark ? "bg-red-500/10 hover:bg-red-500/20" : "bg-red-50 hover:bg-red-100"} border ${modoDark ? "border-red-500/30" : "border-red-200"} rounded-xl ${modoDark ? "text-red-400" : "text-red-500"} transition-all duration-300 flex items-center gap-2 text-sm`}>
                            <FaTimes className="text-xs" />
                            {t("limpar")}
                          </button>
                        )}
                      </>
                    )}
                    {filtroStatus === 'arquivados' && paginacaoArquivados.totalPages > 1 && (
                      <div className={`flex items-center gap-1 ${bgCard} border ${borderColor} rounded-xl px-3 py-2`}>
                        <button onClick={() => setPaginaArquivados(prev => Math.max(1, prev - 1))} disabled={paginaArquivados === 1} className={`p-1 cursor-pointer  rounded-lg transition-all duration-300 ${paginaArquivados === 1 ? `${textMuted} cursor-not-allowed` : `${textPrimary} ${bgHover} hover:scale-105`}`}>
                          <FaAngleLeft className="text-sm" />
                        </button>

                        <span className={`${textPrimary} text-sm mx-2`}>
                          {paginaArquivados}/{paginacaoArquivados.totalPages}
                        </span>

                        <button onClick={() => setPaginaArquivados(prev => Math.min(paginacaoArquivados.totalPages, prev + 1))} disabled={paginaArquivados === paginacaoArquivados.totalPages} className={`p-1 cursor-pointer  rounded-lg transition-all duration-300 ${paginaArquivados === paginacaoArquivados.totalPages ? `${textMuted} cursor-not-allowed` : `${textPrimary} ${bgHover} hover:scale-105`}`}>
                          <FaAngleRight className="text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 lg:mt-0">
                  <div className={`hidden lg:flex items-center gap-1 ${bgCard} border ${borderColor} rounded-xl p-1`}>
                    <button onClick={() => alterarVisualizacao("cards")} className={`p-2 cursor-pointer rounded-lg transition-all duration-300 ${tipoVisualizacao === "cards" ? "bg-blue-500 text-white" : `${bgHover} ${textPrimary}`}`} title={t("visualizacao.tooltipCards")}>
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
                          <div className={`${tipoVisualizacao === "cards" ? "bg-white" : "bg-blue-500"} rounded-sm`}></div>
                          <div className={`${tipoVisualizacao === "cards" ? "bg-white" : "bg-blue-500"} rounded-sm`}></div>
                          <div className={`${tipoVisualizacao === "cards" ? "bg-white" : "bg-blue-500"} rounded-sm`}></div>
                          <div className={`${tipoVisualizacao === "cards" ? "bg-white" : "bg-blue-500"} rounded-sm`}></div>
                        </div>
                      </div>
                    </button>

                    <button onClick={() => alterarVisualizacao("lista")} className={`p-2 cursor-pointer rounded-lg transition-all duration-300 ${tipoVisualizacao === "lista" ? "bg-blue-500 text-white" : `${bgHover} ${textPrimary}`}`} title={t("visualizacao.tooltipLista")}>
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="flex flex-col gap-0.5 w-3 h-3">
                          <div className={`${tipoVisualizacao === "lista" ? "bg-white" : "bg-blue-500"} rounded-sm h-1`}></div>
                          <div className={`${tipoVisualizacao === "lista" ? "bg-white" : "bg-blue-500"} rounded-sm h-1`}></div>
                          <div className={`${tipoVisualizacao === "lista" ? "bg-white" : "bg-blue-500"} rounded-sm h-1`}></div>
                        </div>
                      </div>
                    </button>
                  </div>
                  {podeUploadProdutos && empresaAtivada && (
                    <button
                      onClick={() => handleAcaoProtegida(() => setModalUploadAberto(true))}
                      className={`cursor-pointer px-6 py-3 rounded-xl transition-all duration-300 font-semibold text-white flex items-center gap-2 hover:scale-105 shadow-lg text-sm ${modoDark
                        ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 shadow-emerald-500/25"
                        : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 shadow-emerald-400/30"
                        }`}
                    >
                      <FaUpload className="text-sm" />
                      {t("upload.produtos")}
                    </button>
                  )}
                  {podeCriar && empresaAtivada && (
                    <button onClick={() => handleAcaoProtegida(() => setModalAberto(true))} className="px-6 py-3 bg-gradient-to-r cursor-pointer from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all duration-300 font-semibold text-white flex items-center gap-2 hover:scale-105 shadow-lg shadow-blue-500/25 text-sm">
                      <FaPlus className="text-sm" />
                      {t("novoProduto")}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {filtroStatus === 'arquivados' ? (
              produtosArquivados.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`w-24 h-24 mx-auto mb-4 ${bgCard} rounded-full flex items-center justify-center border ${borderColor}`}>
                    <FaArchive className={`text-2xl ${textMuted}`} />
                  </div>
                  <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>{t("produtosArquivados.nenhum")}</h3>
                  <p className={`${textMuted} mb-4`}>{t("produtosArquivados.subtitulo")}</p>
                  <button
                    onClick={() => setFiltroStatus('ativos')}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all duration-300 font-semibold text-white flex items-center gap-2 mx-auto hover:scale-105"
                  >
                    {t("produtosArquivados.verAtivos")}
                  </button>
                </div>
              ) : (
                <>
                  {produtosArquivadosAtuais.length > 0 && (
                    <div className="mb-4 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const todosSelecionados = produtosArquivadosAtuais.every(p => produtosArquivadosSelecionados.has(p.id));
                          if (todosSelecionados) {
                            desmarcarTodosDaPagina();
                          } else {
                            selecionarTodosDaPagina();
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-sm ${modoDark ? "hover:bg-green-500/20" : "hover:bg-green-100"} ${textPrimary}`}
                      >
                        {produtosArquivadosAtuais.every(p => produtosArquivadosSelecionados.has(p.id)) ? (
                          <>
                            <FaCheckSquare className={modoDark ? "text-green-400" : "text-green-500"} />
                            <span>{t("desmarcarTodosPagina")}</span>
                          </>
                        ) : (
                          <>
                            <FaRegSquare className={modoDark ? "text-green-400" : "text-green-500"} />
                            <span>{t("selecionarTodosPagina")}</span>
                          </>
                        )}
                      </button>

                      {produtosArquivadosSelecionados.size > 0 && (
                        <button
                          onClick={() => {
                            setProdutosArquivadosSelecionados(new Set());
                            localStorage.removeItem('produtos_arquivados_selecionados');
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-sm ${modoDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"}`}
                        >
                          <FaTimes size={12} />
                          <span>{t("limparSelecao")}</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    {tipoVisualizacao === "cards" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                        {produtosArquivadosAtuais.map((produto, index) => (
                          <div
                            key={produto.id}
                            className={`group relative ${produtosArquivadosSelecionados.has(produto.id)
                              ? modoDark
                                ? "ring-2 ring-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                                : "ring-2 ring-green-400 bg-gradient-to-br from-green-100/50 to-emerald-100/50"
                              : modoDark
                                ? "bg-gradient-to-br from-green-500/5 to-emerald-500/5"
                                : "bg-gradient-to-br from-green-100/30 to-emerald-100/30"
                              } rounded-xl border ${modoDark
                                ? produtosArquivadosSelecionados.has(produto.id)
                                  ? "border-green-500/50"
                                  : "border-green-500/20 hover:border-green-500/40"
                                : produtosArquivadosSelecionados.has(produto.id)
                                  ? "border-green-400"
                                  : "border-green-200 hover:border-green-300"
                              } p-4 transition-all duration-500 card-hover backdrop-blur-sm`}
                            style={{
                              animationDelay: `${index * 100}ms`,
                            }}
                          >
                            {podeRestaurar && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelecionarProdutoArquivado(produto.id);
                                }}
                                className={`absolute top-2 left-2 z-20 p-1.5 rounded-lg transition-all duration-300 backdrop-blur-sm ${produtosArquivadosSelecionados.has(produto.id)
                                  ? "bg-green-500 text-white"
                                  : modoDark
                                    ? "bg-slate-800/80 text-gray-300 hover:bg-slate-700/80"
                                    : "bg-white/80 text-gray-600 hover:bg-white"
                                  }`}
                              >
                                {produtosArquivadosSelecionados.has(produto.id) ? (
                                  <FaCheckSquare size={14} />
                                ) : (
                                  <FaRegSquare size={14} />
                                )}
                              </button>
                            )}

                            <div className="relative mb-3 overflow-hidden rounded-lg">
                              <Image
                                src={produto.foto || "/out.jpg"}
                                width={200}
                                height={150}
                                className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                                alt={produto.nome}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/out.jpg";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${produto.quantidade <= (produto.quantidadeMin || 0) ? "bg-red-500/90 text-white" : produto.quantidade <= (produto.quantidadeMin || 0) * 2 ? "bg-yellow-500/90 text-white" : "bg-green-700 text-white"}`}>{produto.quantidade}</div>
                            </div>
                            <h3 className={`font-bold ${textPrimary} mb-1 line-clamp-2 group-hover:text-blue-500 transition-colors text-sm leading-tight`}>{produto.nome}</h3>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-lg font-bold text-cyan-500">{i18n.language === "pt" ? produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : (produto.preco / cotacaoDolar).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                            </div>

                            <div className={`space-y-1 text-xs ${textMuted} mb-2`}>
                              <div className="flex justify-between">
                                <span className="flex items-center gap-1">
                                  <FaCog className={modoDark ? "text-blue-400" : "text-blue-500"} />
                                  {t("categoria")}:
                                </span>
                                <span className={textPrimary}>{produto.categoria?.nome ? t(`categorias.${produto.categoria.nome}`, { defaultValue: produto.categoria.nome }) : "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="flex items-center gap-1">
                                  <FaWarehouse className={modoDark ? "text-green-400" : "text-green-500"} />
                                  {t("fornecedor")}:
                                </span>
                                <span className={textPrimary}>{produto.fornecedor?.nome || "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="flex items-center gap-1">
                                  <FaArchive className={modoDark ? "text-slate-400" : "text-slate-500"} />
                                  {t("produtosArquivados.dataArquivamento")}:
                                </span>
                                <span className={textPrimary}>
                                  {new Date(produto.dataArquivamento!).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="flex items-center gap-1">
                                  <FaHistory className={modoDark ? "text-orange-400" : "text-orange-500"} />
                                  {t("produtosArquivados.por")}:
                                </span>
                                <span className={textPrimary}>
                                  {produto.usuarioArquivou?.nome || 'Sistema'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2">
                              {podeRestaurar && (
                                <button
                                  onClick={() => handleRestaurar(produto.id)}
                                  className="w-full px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold hover:scale-105 shadow-lg"
                                  style={{
                                    background: modoDark ? "linear-gradient(135deg, #10b981, #059669)" : "linear-gradient(135deg, #10b981, #059669)",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  <FaHistory size={14} />
                                  {t("produtosArquivados.restaurar")}
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3 mb-6">
                        {produtosArquivadosAtuais.map((produto) => (
                          <div
                            key={produto.id}
                            className={`relative ${produtosArquivadosSelecionados.has(produto.id)
                              ? modoDark
                                ? "ring-2 ring-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                                : "ring-2 ring-green-400 bg-gradient-to-br from-green-100/50 to-emerald-100/50"
                              : modoDark
                                ? "bg-slate-800/50"
                                : "bg-gradient-to-br from-green-100/30 to-emerald-100/30"
                              } rounded-xl border ${modoDark
                                ? produtosArquivadosSelecionados.has(produto.id)
                                  ? "border-green-500/50"
                                  : "border-green-500/20"
                                : produtosArquivadosSelecionados.has(produto.id)
                                  ? "border-green-400"
                                  : "border-green-200"
                              } p-4 transition-all duration-300 hover:shadow-lg backdrop-blur-sm`}
                          >
                            {podeRestaurar && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelecionarProdutoArquivado(produto.id);
                                }}
                                className={`absolute top-4 left-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${produtosArquivadosSelecionados.has(produto.id)
                                  ? "bg-green-500 text-white"
                                  : modoDark
                                    ? "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
                                    : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                                  }`}
                              >
                                {produtosArquivadosSelecionados.has(produto.id) ? (
                                  <FaCheckSquare size={14} />
                                ) : (
                                  <FaRegSquare size={14} />
                                )}
                              </button>
                            )}

                            <div className="flex flex-col md:flex-row md:items-center gap-4 pl-12 md:pl-4">
                              <div className="flex-shrink-0">
                                <Image
                                  src={produto.foto || "/out.jpg"}
                                  width={80}
                                  height={80}
                                  className="w-20 h-20 object-cover rounded-lg"
                                  alt={produto.nome}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/out.jpg";
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                                  <div>
                                    <h3 className={`font-bold ${textPrimary} line-clamp-1 text-sm`}>{produto.nome}</h3>
                                    <p className={`${textMuted} text-xs line-clamp-2 mt-1`}>{produto.descricao}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-cyan-500">{i18n.language === "pt" ? produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : (produto.preco / cotacaoDolar).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                  <div>
                                    <span className={textMuted}>{t("categoria")}: </span>
                                    <span className={textPrimary}>{produto.categoria?.nome ? t(`categorias.${produto.categoria.nome}`, { defaultValue: produto.categoria.nome }) : "-"}</span>
                                  </div>
                                  <div>
                                    <span className={textMuted}>{t("fornecedor")}: </span>
                                    <span className={textPrimary}>{produto.fornecedor?.nome || "-"}</span>
                                  </div>
                                  <div>
                                    <span className={textMuted}>{t("produtosArquivados.dataArquivamento")}: </span>
                                    <span className={textPrimary}>
                                      {new Date(produto.dataArquivamento!).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className={textMuted}>{t("produtosArquivados.por")}: </span>
                                    <span className={textPrimary}>
                                      {produto.usuarioArquivou?.nome || 'Sistema'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 min-w-[120px]">
                                {podeRestaurar && (
                                  <button
                                    onClick={() => handleRestaurar(produto.id)}
                                    className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs transition-all duration-300 flex items-center justify-center gap-1"
                                  >
                                    <FaHistory className="text-xs" />
                                    {t("produtosArquivados.restaurar")}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {paginacaoArquivados.totalPages > 1 && (
                      <div className="flex justify-center gap-2 mt-6">
                        <button
                          onClick={() => setPaginaArquivados(prev => Math.max(1, prev - 1))}
                          disabled={paginaArquivados === 1}
                          className={`px-3 py-1 rounded-lg ${paginaArquivados === 1 ? 'opacity-50 cursor-not-allowed' : ''} ${modoDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                        >
                          <FaAngleLeft />
                        </button>

                        {[...Array(paginacaoArquivados.totalPages)].map((_, index) => {
                          const pagina = index + 1;
                          return (
                            <button
                              key={pagina}
                              onClick={() => setPaginaArquivados(pagina)}
                              className={`px-3 py-1 rounded-lg ${pagina === paginaArquivados
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                : modoDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                                }`}
                            >
                              {pagina}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setPaginaArquivados(prev => Math.min(paginacaoArquivados.totalPages, prev + 1))}
                          disabled={paginaArquivados === paginacaoArquivados.totalPages}
                          className={`px-3 py-1 rounded-lg ${paginaArquivados === paginacaoArquivados.totalPages ? 'opacity-50 cursor-not-allowed' : ''} ${modoDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                        >
                          <FaAngleRight />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )
            ) : (
              <>
                {produtosAtuais.length > 0 && (
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const todosSelecionados = produtosAtuais.every(p => produtosSelecionados.has(p.id));
                        if (todosSelecionados) {
                          desmarcarTodosDaPagina();
                        } else {
                          selecionarTodosDaPagina();
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-sm ${modoDark ? "hover:bg-blue-500/20" : "hover:bg-blue-100"} ${textPrimary}`}
                    >
                      {produtosAtuais.every(p => produtosSelecionados.has(p.id)) ? (
                        <>
                          <FaCheckSquare className={modoDark ? "text-blue-400" : "text-blue-500"} />
                          <span>{t("desmarcarTodosPagina")}</span>
                        </>
                      ) : (
                        <>
                          <FaRegSquare className={modoDark ? "text-blue-400" : "text-blue-500"} />
                          <span>{t("selecionarTodosPagina")}</span>
                        </>
                      )}
                    </button>

                    {produtosSelecionados.size > 0 && (
                      <button
                        onClick={() => {
                          setProdutosSelecionados(new Set());
                          localStorage.removeItem('produtos_selecionados');
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-sm ${modoDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"}`}
                      >
                        <FaTimes size={12} />
                        <span>{t("limparSelecao")}</span>
                      </button>
                    )}
                  </div>
                )}

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, index) => (
                      <div key={index} className={`${bgCard} rounded-xl p-4 animate-pulse border ${borderColor}`}>
                        <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded-xl h-32 mb-3`}></div>
                        <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-3 mb-2`}></div>
                        <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-3 w-2/3 mb-3`}></div>
                        <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-6 mb-2`}></div>
                        <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-2 mb-1`}></div>
                        <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-2 w-3/4`}></div>
                      </div>
                    ))}
                  </div>
                ) : produtosFiltrados.length === 0 ? (
                  <div className="text-center py-12">
                    <div className={`w-24 h-24 mx-auto mb-4 ${bgCard} rounded-full flex items-center justify-center border ${borderColor}`}>
                      <FaBox className={`text-2xl ${textMuted}`} />
                    </div>
                    <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>{t("nenhumProdutoEncontrado")}</h3>
                    <p className={`${textMuted} mb-4 text-sm`}>{filtroCategoria ? t("nenhumProdutoCategoria") : t("comeceAdicionando")}</p>
                    {podeCriar && empresaAtivada && (
                      <button onClick={() => setModalAberto(true)} className="px-6 cursor-pointer py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all duration-300 font-semibold text-white flex items-center gap-2 mx-auto hover:scale-105 text-sm">
                        <FaPlus />
                        {t("criarPrimeiroProduto")}
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {tipoVisualizacao === "cards" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                        {produtosAtuais.map((produto, index) => (
                          <div
                            key={produto.id}
                            className={`group relative ${produtosSelecionados.has(produto.id)
                              ? modoDark
                                ? "ring-2 ring-blue-500/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
                                : "ring-2 ring-blue-400 bg-gradient-to-br from-blue-100/50 to-cyan-100/50"
                              : modoDark
                                ? "bg-gradient-to-br from-blue-500/5 to-cyan-500/5"
                                : "bg-gradient-to-br from-blue-100/30 to-cyan-100/30"
                              } rounded-xl border ${modoDark
                                ? produtosSelecionados.has(produto.id)
                                  ? "border-blue-500/50"
                                  : "border-blue-500/20 hover:border-blue-500/40"
                                : produtosSelecionados.has(produto.id)
                                  ? "border-blue-400"
                                  : "border-blue-200 hover:border-blue-300"
                              } p-4 transition-all duration-500 card-hover backdrop-blur-sm`}
                            style={{
                              animationDelay: `${index * 100}ms`,
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelecionarProduto(produto.id);
                              }}
                              className={`absolute top-2 left-2 z-20 p-1.5 rounded-lg transition-all duration-300 backdrop-blur-sm ${produtosSelecionados.has(produto.id)
                                ? "bg-blue-500 text-white"
                                : modoDark
                                  ? "bg-slate-800/80 text-gray-300 hover:bg-slate-700/80"
                                  : "bg-white/80 text-gray-600 hover:bg-white"
                                }`}
                            >
                              {produtosSelecionados.has(produto.id) ? (
                                <FaCheckSquare size={14} />
                              ) : (
                                <FaRegSquare size={14} />
                              )}
                            </button>

                            <div className="relative mb-3 overflow-hidden rounded-lg">
                              <Image
                                src={produto.foto || "/out.jpg"}
                                width={200}
                                height={150}
                                className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                                alt={produto.nome}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/out.jpg";
                                }}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${produto.quantidade <= (produto.quantidadeMin || 0) ? "bg-red-500/90 text-white" : produto.quantidade <= (produto.quantidadeMin || 0) * 2 ? "bg-yellow-500/90 text-white" : "bg-green-700 text-white"}`}>{produto.quantidade}</div>
                              {podeEditar && (
                                <div className="absolute bottom-2 right-2 xl:hidden">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalVisualizar(produto);
                                      setForm(produto);
                                    }}
                                    className="cursor-pointer bg-green-600/90 hover:bg-green-700/90 text-white p-1 rounded transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
                                  >
                                    <FaEdit className="text-xs" />
                                  </button>
                                </div>
                              )}
                              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1 xl:flex">
                                <button
                                  onClick={() => {
                                    setModalVisualizar(produto);
                                    setForm(produto);
                                  }}
                                  className="flex-1 cursor-pointer bg-blue-600/90 hover:bg-blue-700/90 text-white py-1 px-2 rounded text-xs transition-all duration-300 transform hover:scale-105 backdrop-blur-sm flex items-center justify-center gap-1"
                                >
                                  <FaEye className="text-xs" />
                                  {t("ver")}
                                </button>
                                {podeEditar && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalVisualizar(produto);
                                      setForm(produto);
                                    }}
                                    className="cursor-pointer bg-green-600/90 hover:bg-green-700/90 text-white p-1 rounded transition-all duration-300 transform hover:scale-105 backdrop-blur-sm xl:flex hidden"
                                  >
                                    <FaEdit className="text-xs" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <h3 className={`font-bold ${textPrimary} mb-1 line-clamp-2 group-hover:text-blue-500 transition-colors text-sm leading-tight`}>{produto.nome}</h3>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-lg font-bold text-cyan-500">{i18n.language === "pt" ? produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : (produto.preco / cotacaoDolar).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                              {podeGerenciarCatalogo && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCatalogo(produto.id, produto.noCatalogo);
                                  }}
                                  className={`p-1 ${modoDark ? "hover:bg-yellow-500/20" : "hover:bg-yellow-100"} rounded transition-colors`}
                                >
                                  {produto.noCatalogo ? <FaStar className="text-yellow-500 text-base" /> : <FaRegStar className={`${textMuted} text-base hover:text-yellow-500`} />}
                                </button>
                              )}
                            </div>

                            <div className={`space-y-1 text-xs ${textMuted} mb-2`}>
                              <div className="flex justify-between">
                                <span className="flex items-center gap-1">
                                  <FaCog className={modoDark ? "text-blue-400" : "text-blue-500"} />
                                  {t("categoria")}:
                                </span>
                                <span className={textPrimary}>{produto.categoria?.nome ? t(`categorias.${produto.categoria.nome}`, { defaultValue: produto.categoria.nome }) : "-"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="flex items-center gap-1">
                                  <FaWarehouse className={modoDark ? "text-green-400" : "text-green-500"} />
                                  {t("fornecedor")}:
                                </span>
                                <span className={textPrimary}>{produto.fornecedor?.nome || "-"}</span>
                              </div>
                            </div>

                            <div className="mb-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className={textMuted}>{t("estoque")}</span>
                                <span className={textPrimary}>
                                  {produto.quantidade} {t("unidades")}
                                </span>
                              </div>
                              <div className={`w-full ${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded-full h-1.5`}>
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-1000 ${produto.quantidade > (produto.quantidadeMin || 0) * 2 ? "bg-gradient-to-r from-green-500 to-emerald-500" : produto.quantidade > (produto.quantidadeMin || 0) ? "bg-gradient-to-r from-yellow-500 to-orange-500" : "bg-gradient-to-r from-red-500 to-pink-500"}`}
                                  style={{
                                    width: `${Math.min((produto.quantidade / ((produto.quantidadeMin || 1) * 3)) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {podeGerenciarEstoque && (
                              <div className="mt-2">
                                <button
                                  onClick={() => abrirModalEstoque(produto)}
                                  className="w-full px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm font-semibold hover:scale-105 shadow-lg"
                                  style={{
                                    background: modoDark ? "linear-gradient(135deg, #3B82F6, #0EA5E9)" : "linear-gradient(135deg, #1976D2, #0284C7)",
                                    color: "#FFFFFF",
                                  }}
                                >
                                  <FaBox size={14} />
                                  {t("estoque")}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3 mb-6">
                        {produtosAtuais.map((produto) => (
                          <div
                            key={produto.id}
                            className={`relative ${produtosSelecionados.has(produto.id)
                              ? modoDark
                                ? "ring-2 ring-blue-500/50 bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
                                : "ring-2 ring-blue-400 bg-gradient-to-br from-blue-100/50 to-cyan-100/50"
                              : modoDark
                                ? "bg-slate-800/50"
                                : "bg-gradient-to-br from-blue-100/30 to-cyan-100/30"
                              } rounded-xl border ${modoDark
                                ? produtosSelecionados.has(produto.id)
                                  ? "border-blue-500/50"
                                  : "border-blue-500/20"
                                : produtosSelecionados.has(produto.id)
                                  ? "border-blue-400"
                                  : "border-blue-200"
                              } p-4 transition-all duration-300 hover:shadow-lg backdrop-blur-sm`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelecionarProduto(produto.id);
                              }}
                              className={`absolute top-4 left-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ${produtosSelecionados.has(produto.id)
                                ? "bg-blue-500 text-white"
                                : modoDark
                                  ? "bg-slate-800/50 text-gray-300 hover:bg-slate-700/50"
                                  : "bg-slate-100 text-gray-600 hover:bg-slate-200"
                                }`}
                            >
                              {produtosSelecionados.has(produto.id) ? (
                                <FaCheckSquare size={14} />
                              ) : (
                                <FaRegSquare size={14} />
                              )}
                            </button>

                            <div className="flex flex-col md:flex-row md:items-center gap-4 pl-12 md:pl-4">
                              <div className="flex-shrink-0">
                                <Image
                                  src={produto.foto || "/out.jpg"}
                                  width={80}
                                  height={80}
                                  className="w-20 h-20 object-cover rounded-lg"
                                  alt={produto.nome}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "/out.jpg";
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                                  <div>
                                    <h3 className={`font-bold ${textPrimary} line-clamp-1 text-sm`}>{produto.nome}</h3>
                                    <p className={`${textMuted} text-xs line-clamp-2 mt-1`}>{produto.descricao}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-cyan-500">{i18n.language === "pt" ? produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : (produto.preco / cotacaoDolar).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                                    {podeGerenciarCatalogo && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleCatalogo(produto.id, produto.noCatalogo);
                                        }}
                                        className={`p-1 ${modoDark ? "hover:bg-yellow-500/20" : "hover:bg-yellow-100"} rounded transition-colors`}
                                      >
                                        {produto.noCatalogo ? <FaStar className="text-yellow-500 text-base" /> : <FaRegStar className={`${textMuted} text-base hover:text-yellow-500`} />}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                  <div>
                                    <span className={textMuted}>{t("categoria")}: </span>
                                    <span className={textPrimary}>{produto.categoria?.nome ? t(`categorias.${produto.categoria.nome}`, { defaultValue: produto.categoria.nome }) : "-"}</span>
                                  </div>
                                  <div>
                                    <span className={textMuted}>{t("fornecedor")}: </span>
                                    <span className={textPrimary}>{produto.fornecedor?.nome || "-"}</span>
                                  </div>
                                  <div>
                                    <span className={textMuted}>{t("estoque")}: </span>
                                    <span className={textPrimary}>
                                      {produto.quantidade} {t("unidades")}
                                    </span>
                                  </div>
                                  <div>
                                    <span className={textMuted}>Status: </span>
                                    <span className={`${produto.quantidade <= (produto.quantidadeMin || 0) ? "text-red-500" : produto.quantidade <= (produto.quantidadeMin || 0) * 2 ? "text-yellow-500" : "text-green-500"} font-medium`}>{produto.quantidade <= (produto.quantidadeMin || 0) ? t("estoqueBaixo.estadoCritico") : produto.quantidade <= (produto.quantidadeMin || 0) * 2 ? t("estoqueBaixo.estadoAtencao") : t("emEstoque")}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col gap-2 min-w-[120px]">
                                <button
                                  onClick={() => {
                                    setModalVisualizar(produto);
                                    setForm(produto);
                                  }}
                                  className="px-3 py-2 rounded-lg cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs transition-all duration-300 flex items-center justify-center gap-1"
                                >
                                  <FaEye className="text-xs" />
                                  {t("ver")}
                                </button>

                                {podeEditar && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalVisualizar(produto);
                                      setForm(produto);
                                    }}
                                    className="px-3 py-2 rounded-lg cursor-pointer bg-green-600 hover:bg-green-700 text-white text-xs transition-all duration-300 flex items-center justify-center gap-1"
                                  >
                                    <FaEdit className="text-xs" />
                                    {t("editar")}
                                  </button>
                                )}

                                {podeGerenciarEstoque && (
                                  <button onClick={() => abrirModalEstoque(produto)} className="px-3 py-2 rounded-lg cursor-pointer bg-cyan-600 hover:bg-cyan-700 text-white text-xs transition-all duration-300 flex items-center justify-center gap-1">
                                    <FaBox className="text-xs" />
                                    {t("estoque")}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}

            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6 lg:hidden">
                <button onClick={() => mudarPagina(paginaAtual - 1)} disabled={paginaAtual === 1} className={`p-2 rounded-xl transition-all duration-300 ${paginaAtual === 1 ? `${modoDark ? "bg-slate-800/30" : "bg-slate-100"} ${textMuted} cursor-not-allowed` : `${modoDark ? "bg-blue-500/10 hover:bg-blue-500/20" : "bg-blue-50 hover:bg-blue-100"} ${textPrimary} border ${borderColor} hover:scale-105`}`}>
                  <FaAngleLeft className="text-sm" />
                </button>

                <div className="flex gap-1">
                  {[...Array(totalPaginas)].map((_, index) => {
                    const pagina = index + 1;
                    const mostrarPagina = pagina === 1 || pagina === totalPaginas || (pagina >= paginaAtual - 1 && pagina <= paginaAtual + 1);

                    if (!mostrarPagina) {
                      if (pagina === paginaAtual - 2 || pagina === paginaAtual + 2) {
                        return (
                          <span key={pagina} className={`px-2 py-1 ${textMuted} text-sm`}>
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button key={pagina} onClick={() => mudarPagina(pagina)} className={`px-3 py-1 rounded-xl transition-all duration-300 text-sm ${pagina === paginaAtual ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 scale-105" : `${bgCard} ${bgHover} ${textPrimary} border ${borderColor} hover:scale-105`}`}>
                        {pagina}
                      </button>
                    );
                  })}
                </div>

                <button onClick={() => mudarPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas} className={`p-2 rounded-xl transition-all duration-300 ${paginaAtual === totalPaginas ? `${modoDark ? "bg-slate-800/30" : "bg-slate-100"} ${textMuted} cursor-not-allowed` : `${modoDark ? "bg-blue-500/10 hover:bg-blue-500/20" : "bg-blue-50 hover:bg-blue-100"} ${textPrimary} border ${borderColor} hover:scale-105`}`}>
                  <FaAngleRight className="text-sm" />
                </button>
              </div>
            )}

            {(modalAberto || modalVisualizar) && (
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                <div className={`${modoDark ? "bg-slate-800 border-blue-500/30 shadow-blue-500/20" : "bg-white border-blue-200 shadow-blue-200"} border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto backdrop-blur-sm`} onClick={(e) => e.stopPropagation()}>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className={`text-xl font-bold ${textPrimary}`}>{modalVisualizar ? t("editarProduto") : t("novoProduto")}</h2>
                      <button
                        onClick={() => {
                          setModalAberto(false);
                          setModalVisualizar(null);
                          setFile(null);
                          setPreview(null);
                          if (!modalVisualizar) {
                            setForm({
                              id: "",
                              nome: "",
                              descricao: "",
                              preco: 0,
                              quantidade: 0,
                              quantidadeMin: 0,
                              foto: "",
                              noCatalogo: false,
                              fornecedorId: "",
                              categoriaId: "",
                              empresaId: "",
                              fornecedor: undefined,
                              categoria: undefined,
                              empresa: "",
                              usuarioId: "",
                              createdAt: new Date(),
                              updatedAt: new Date(),
                            });
                            setNomeCaracteres(0);
                            setDescricaoCaracteres(0);
                          }
                        }}
                        className={`p-2 cursor-pointer ${bgHover} rounded-lg transition-colors ${textMuted} hover:${textPrimary}`}
                      >
                        <FaTimes className="text-lg" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>
                          {t("nome")} <span className="text-red-400">*</span>
                        </label>
                        <input placeholder={t("nomePlaceholder")} value={form.nome || ""} onChange={handleNomeChange} className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} placeholder-${modoDark ? "gray-400" : "slate-500"} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm`} disabled={Boolean(!podeEditar && modalVisualizar)} maxLength={60} />
                        <div className={`text-right text-xs ${textMuted} mt-1`}>{nomeCaracteres}/60</div>
                      </div>
                      <div>
                        <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>
                          {t("descricao")} <span className="text-red-400">*</span>
                        </label>
                        <textarea ref={descricaoRef} placeholder={t("descricaoPlaceholder")} value={form.descricao || ""} onChange={handleDescricaoChange} rows={3} className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} placeholder-${modoDark ? "gray-400" : "slate-500"} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-150 resize-none overflow-hidden text-sm`} disabled={Boolean(!podeEditar && modalVisualizar)} maxLength={255} style={{ minHeight: "80px" }} />
                        <div className={`text-right text-xs ${textMuted} mt-1`}>{descricaoCaracteres}/255</div>
                      </div>
                      <div>
                        <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>
                          {t("preco")} {i18n.language === "pt" ? "(R$)" : "($)"}
                        </label>
                        <input placeholder={i18n.language === "pt" ? "0,00" : "0.00"} type="number" min={0} step="0.01" value={form.preco || ""} onChange={(e) => setForm({ ...form, preco: parseFloat(e.target.value) || 0 })} className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} placeholder-${modoDark ? "gray-400" : "slate-500"} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm`} disabled={Boolean(!podeEditar && modalVisualizar)} />
                      </div>
                      <div className="flex gap-2 w-full items-end">
                        <div className="flex-1">
                          <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>{t("foto")}</label>
                          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                          <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || Boolean(!podeEditar && modalVisualizar)} className={`w-full cursor-pointer ${bgInput} ${bgHover} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm h-[42px]`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                            </svg>
                            {isUploading ? t("enviando") : t("selecionarImagem")}
                          </button>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-center gap-1 mb-2">
                            <label className={`block ${textPrimary} font-medium text-sm text-center`}>
                              {t("quantidadeMinima")} <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                              <FaQuestionCircle className={`${textMuted} cursor-pointer hover:text-blue-500 transition-colors`} size={12} onClick={() => setShowTooltip(true)} />
                            </div>
                          </div>
                          {showTooltip && (
                            <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                              <div className={`${modoDark ? "bg-slate-800 border-blue-500/30" : "bg-white border-blue-200"} border rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto backdrop-blur-sm`}>
                                <div className="p-6">
                                  <div className="flex justify-between items-center mb-4">
                                    <h3 className={`text-lg font-bold ${textPrimary}`}>{t("quantidadeMinima")}</h3>
                                    <button onClick={() => setShowTooltip(false)} className={`p-2 cursor-pointer ${bgHover} rounded-lg transition-colors ${textMuted} hover:${textPrimary}`}>
                                      <FaTimes className="text-lg" />
                                    </button>
                                  </div>
                                  <div className={`${textPrimary} text-sm leading-relaxed text-center`}>{t("quantidadeMinimaTooltip")}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          <input placeholder={t("quantidadeMinimaPlaceholder")} type="number" min={0} value={form.quantidadeMin || ""} onChange={(e) => setForm({ ...form, quantidadeMin: Number(e.target.value) })} className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} placeholder-${modoDark ? "gray-400" : "slate-500"} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm`} disabled={Boolean(!podeEditar && modalVisualizar)} />
                        </div>
                      </div>
                      {(preview || form.foto) && (
                        <div className="flex flex-col">
                          <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>{t("visualizacaoLabel") || "Visualização"}</label>
                          <div className={`w-full ${bgInput} border ${borderColor} rounded-xl flex items-center justify-center p-4`}>
                            <img
                              src={preview || form.foto || ""}
                              alt="Preview"
                              className="max-w-full max-h-48 object-cover rounded-xl"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/out.jpg";
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 w-full">
                        <div className="flex-1">
                          <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>{t("fornecedor")}</label>
                          <div className="relative">
                            <select
                              value={form.fornecedorId || ""}
                              onChange={(e) => {
                                setForm({ ...form, fornecedorId: e.target.value });
                                e.target.blur();
                              }}
                              className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 cursor-pointer text-sm appearance-none`}
                              disabled={Boolean(!podeEditar && modalVisualizar)}
                              style={{
                                background: modoDark ? cores.dark.card : cores.light.card,
                              }}
                            >
                              <option value="">{t("selecionarFornecedor")}</option>
                              {fornecedores.map((f) => (
                                <option
                                  key={f.id}
                                  value={f.id}
                                  className={`${modoDark ? "bg-slate-800" : "bg-white"} ${textPrimary}`}
                                  style={{
                                    background: modoDark ? cores.dark.card : cores.light.card,
                                  }}
                                >
                                  {f.nome}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <FaChevronDown />
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>{t("categoria")}</label>
                          <div className="relative">
                            <select
                              value={form.categoriaId || ""}
                              onChange={(e) => {
                                setForm({ ...form, categoriaId: e.target.value });
                                e.target.blur();
                              }}
                              className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 cursor-pointer text-sm appearance-none`}
                              disabled={Boolean(!podeEditar && modalVisualizar)}
                              style={{
                                background: modoDark ? cores.dark.card : cores.light.card,
                              }}
                            >
                              <option value="">{t("selecionarCategoria")}</option>
                              {categorias.map((c) => (
                                <option
                                  key={c.id}
                                  value={c.id}
                                  className={`${modoDark ? "bg-slate-800" : "bg-white"} ${textPrimary}`}
                                  style={{
                                    background: modoDark ? cores.dark.card : cores.light.card,
                                  }}
                                >
                                  {t(`categorias.${c.nome}`, { defaultValue: c.nome })}
                                </option>
                              ))}
                            </select>
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                              <FaChevronDown />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="noCatalogo" checked={form.noCatalogo} onChange={(e) => setForm({ ...form, noCatalogo: e.target.checked })} className={`w-4 h-4 text-blue-500 ${modoDark ? "bg-slate-700" : "bg-white"} border-blue-500/30 rounded focus:ring-blue-500 focus:ring-2`} disabled={Boolean(!podeEditar && modalVisualizar)} />
                        <label htmlFor="noCatalogo" className={`${textPrimary} cursor-pointer text-sm`}>
                          {t("incluirNoCatalogo")}
                        </label>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-blue-500/20">
                        <div>
                          {modalVisualizar && podeExcluir && (
                            <button
                              onClick={() => handleDelete(modalVisualizar)}
                              className={`px-3 py-1.5 sm:px-4 sm:py-2 cursor-pointer ${modoDark ? "bg-red-500/10 hover:bg-red-500/20" : "bg-red-50 hover:bg-red-100"} border ${modoDark ? "border-red-500/30" : "border-red-200"} ${modoDark ? "text-red-400" : "text-red-500"} rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-1 text-xs sm:text-sm`}
                            >
                              <FaTrash className="text-xs" />
                              {t("excluir")}
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap justify-end">
                          <button
                            onClick={() => {
                              setModalAberto(false);
                              setModalVisualizar(null);
                              setFile(null);
                              setPreview(null);
                            }}
                            className={`px-3 py-1.5 sm:px-4 sm:py-2 cursor-pointer ${bgCard} ${bgHover} border ${borderColor} ${textPrimary} rounded-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm min-w-[70px] sm:min-w-0`}
                          >
                            {t("cancelar")}
                          </button>
                          {podeCriar && !modalVisualizar && (
                            <button onClick={handleSubmit} disabled={isUploading} className="px-3 py-1.5 sm:px-4 sm:py-2 cursor-pointer bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs sm:text-sm min-w-[70px] sm:min-w-0">
                              {isUploading ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  {t("enviando")}
                                </>
                              ) : (
                                <>
                                  <FaCheck className="text-xs" />
                                  {t("salvar")}
                                </>
                              )}
                            </button>
                          )}
                          {podeEditar && modalVisualizar && (
                            <button onClick={handleUpdate} disabled={isUploading} className="px-3 py-1.5 sm:px-4 sm:py-2 cursor-pointer bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs sm:text-sm min-w-[70px] sm:min-w-0">
                              {isUploading ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  {t("enviando")}
                                </>
                              ) : (
                                <>
                                  <FaCheck className="text-xs" />
                                  {t("atualizar")}
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {modalEstoqueAberto && produtoSelecionadoEstoque && (
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                <div className={`${modoDark ? "bg-slate-800 border-blue-500/30 shadow-blue-500/20" : "bg-white border-blue-200 shadow-blue-200"} border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-sm`} onClick={(e) => e.stopPropagation()}>
                  <MovimentacaoEstoqueModal
                    produto={produtoSelecionadoEstoque}
                    modoDark={modoDark}
                    empresaId={empresaId!}
                    onFecharModal={() => {
                      setModalEstoqueAberto(false);
                      setProdutoSelecionadoEstoque(null);
                    }}
                    onMovimentacaoConcluida={() => {
                      setModalEstoqueAberto(false);
                      setProdutoSelecionadoEstoque(null);
                      recarregarListaProdutos();
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UploadProdutosModal
        isOpen={modalUploadAberto}
        onClose={() => setModalUploadAberto(false)}
        onSuccess={recarregarListaProdutos}
        modoDark={modoDark}
        empresaAtivada={empresaAtivada}
        empresaId={empresaId}
      />

      {modalArquivarAberto && produtoParaArquivar && (
        <ArquivarProdutoModal
          isOpen={modalArquivarAberto}
          onClose={() => {
            setModalArquivarAberto(false);
            setProdutoParaArquivar(null);
          }}
          produto={produtoParaArquivar}
          modoDark={modoDark}
          onConfirm={confirmarArquivamento}
        />
      )}
    </div>
  );
}