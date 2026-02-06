"use client";

import { useEffect, useState, useRef } from "react";
import { FaSearch, FaChevronDown, FaAngleLeft, FaAngleRight, FaEnvelope, FaUserPlus, FaLock, FaEdit, FaTrash, FaUser, FaUsers, FaFilter, FaTimes, FaCheck } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Cookies from "js-cookie";
import { UsuarioI } from "@/utils/types/usuario";
import { PermissaoI } from "@/utils/types/permissoes";
import { getTranslatedPermission, getTranslatedCategory } from "@/utils/permissoeTranslations";
import { FaShield } from "react-icons/fa6";

type CampoOrdenacao = "nome" | "funcao" | "dataCriacao" | "none";
type DirecaoOrdenacao = "asc" | "desc";

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
  },
};

interface PermissaoAgrupada {
  [categoria: string]: (PermissaoI & { concedida: boolean })[];
}

interface PermissoesUsuarioResponse {
  permissoes: (PermissaoI & { concedida: boolean })[];
  permissoesPersonalizadas: boolean;
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioI[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaAtivada, setEmpresaAtivada] = useState<boolean>(false);
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioI | null>(null);
  const [loading, setLoading] = useState(true);
  const [modoDark, setModoDark] = useState(false);
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const usuariosPorPagina = 12;
  const { t, i18n } = useTranslation("usuarios");
  const router = useRouter();

  const [modalConviteAberto, setModalConviteAberto] = useState(false);
  const [modalMensagemAberto, setModalMensagemAberto] = useState(false);
  const [modalEditarUsuario, setModalEditarUsuario] = useState<UsuarioI | null>(null);
  const [modalPermissoes, setModalPermissoes] = useState<UsuarioI | null>(null);

  const [emailConvite, setEmailConvite] = useState("");
  const [isEnviando, setIsEnviando] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioI | null>(null);
  const [tituloMensagem, setTituloMensagem] = useState("");
  const [descricaoMensagem, setDescricaoMensagem] = useState("");
  const [novoTipo, setNovoTipo] = useState("FUNCIONARIO");

  const [permissoesUsuario, setPermissoesUsuario] = useState<(PermissaoI & { concedida: boolean })[]>([]);
  const [permissoesAgrupadas, setPermissoesAgrupadas] = useState<PermissaoAgrupada>({});
  const [permissoesPersonalizadas, setPermissoesPersonalizadas] = useState(false);
  const [todasMarcadas, setTodasMarcadas] = useState(false);

  const [campoOrdenacao, setCampoOrdenacao] = useState<CampoOrdenacao>("none");
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>("asc");
  const [menuFiltrosAberto, setMenuFiltrosAberto] = useState(false);
  const [filtroFuncao, setFiltroFuncao] = useState<string | null>(null);

  const [permissoesUsuarioLogado, setPermissoesUsuarioLogado] = useState<Record<string, boolean>>({});
  const [usuariosEditaveis, setUsuariosEditaveis] = useState<Record<string, boolean>>({});
  const [usuariosGerenciáveis, setUsuariosGerenciáveis] = useState<Record<string, boolean>>({});
  const [usuariosExcluiveis, setUsuariosExcluiveis] = useState<Record<string, boolean>>({});

  const menuFiltrosRef = useRef<HTMLDivElement>(null);
  const temaAtual = modoDark ? cores.dark : cores.light;


  const [stats, setStats] = useState({
    total: 0,
    proprietarios: 0,
    admins: 0,
    funcionarios: 0,
  });

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
      return;
    }

    const initialize = async () => {
      setLoading(true);

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
              headers: { "user-id": usuarioValor }
            });
            if (response.ok) {
              const dados: { permissoes: { chave: string; concedida: boolean }[] } = await response.json();
              const permissoesUsuarioObj: Record<string, boolean> = {};
              dados.permissoes.forEach((permissao) => {
                permissoesUsuarioObj[permissao.chave] = permissao.concedida;
              });
              setPermissoesUsuarioLogado(permissoesUsuarioObj);
            } else {
              const permissoesParaVerificar = ["usuarios_criar", "usuarios_editar", "usuarios_excluir", "usuarios_visualizar", "usuarios_gerenciar_permissoes"];
              const permissoes: Record<string, boolean> = {};
              for (const permissao of permissoesParaVerificar) {
                const temPermissao = await usuarioTemPermissao(permissao);
                permissoes[permissao] = temPermissao;
              }
              setPermissoesUsuarioLogado(permissoes);
            }
          } catch (error) {
            console.error("Erro ao carregar permissões:", error);
          }
        };

        const responseUsuario = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuario/${usuarioValor}`, {
          headers: { "user-id": usuarioValor },
        });

        if (!responseUsuario.ok) {
          console.error("Erro ao buscar os dados do usuário");
          setLoading(false);
          return;
        }

        const usuario = await responseUsuario.json();
        setUsuarioLogado(usuario);
        setEmpresaId(usuario.empresaId);

        if (usuario.empresaId) {
          const ativada = await verificarAtivacaoEmpresa(usuario.empresaId);
          setEmpresaAtivada(ativada);

          if (ativada) {
            const responseUsuarios = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuario`, {
              headers: {
                "content-Type": "application/json",
                Authorization: `Bearer ${Cookies.get("token")}`,
              },
            });

            if (responseUsuarios.ok) {
              const todosUsuarios = await responseUsuarios.json();
              const usuariosDaEmpresa = todosUsuarios
                .filter((u: UsuarioI) => u.empresaId === usuario.empresaId)
                .sort((a: UsuarioI, b: UsuarioI) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              setUsuarios(usuariosDaEmpresa);

              const proprietarios = usuariosDaEmpresa.filter((u: UsuarioI) => u.tipo === "PROPRIETARIO").length;
              const admins = usuariosDaEmpresa.filter((u: UsuarioI) => u.tipo === "ADMIN").length;
              const funcionarios = usuariosDaEmpresa.filter((u: UsuarioI) => u.tipo === "FUNCIONARIO").length;

              setStats({
                total: usuariosDaEmpresa.length,
                proprietarios,
                admins,
                funcionarios,
              });
            }
          }
        }

        await carregarPermissoes();

      } catch (error) {
        console.error("Erro na inicialização:", error);
      } finally {
        setLoading(false);
      }
    };

    function handleClickOutside(event: MouseEvent) {
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
      
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      
      .animate-fade-in-up {
        animation: fadeInUp 0.6s ease-out forwards;
      }
      
      .card-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
        
      .card-hover:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
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
    `;
    document.head.appendChild(style);

    initialize();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.head.removeChild(style);
    };
  }, [modoDark]);

  useEffect(() => {
    const carregarTodasPermissoes = async () => {
      const editaveis: Record<string, boolean> = {};
      const gerenciáveis: Record<string, boolean> = {};
      const excluiveis: Record<string, boolean> = {};

      for (const usuario of usuarios) {
        editaveis[usuario.id] = await podeEditar(usuario);
        gerenciáveis[usuario.id] = await podeGerenciarPermissoesUsuario(usuario);
        excluiveis[usuario.id] = await podeExcluir(usuario);
      }

      setUsuariosEditaveis(editaveis);
      setUsuariosGerenciáveis(gerenciáveis);
      setUsuariosExcluiveis(excluiveis);
    };

    if (usuarios.length > 0 && usuarioLogado) {
      carregarTodasPermissoes();
    }
  }, [usuarios, usuarioLogado]);

  useEffect(() => {
    if (permissoesUsuario.length > 0) {
      const todasConcedidas = permissoesUsuario.every((p) => p.concedida);
      const nenhumaConcedida = permissoesUsuario.every((p) => !p.concedida);

      if (todasConcedidas) {
        setTodasMarcadas(true);
      } else if (nenhumaConcedida) {
        setTodasMarcadas(false);
      }
    }
  }, [permissoesUsuario]);

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
    } catch (error) {
      console.error("Erro ao verificar permissão:", error);
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

  const podeEditar = async (targetUser: UsuarioI): Promise<boolean> => {
    if (!usuarioLogado || usuarioLogado.id === targetUser.id) return false;

    if (usuarioLogado.tipo === "PROPRIETARIO") return true;

    if (usuarioLogado.tipo === "ADMIN") {
      if (targetUser.tipo !== "FUNCIONARIO") return false;

      const temPermissao = await usuarioTemPermissao("usuarios_editar");
      return temPermissao;
    }

    return false;
  };

  const podeGerenciarPermissoesUsuario = async (targetUser: UsuarioI): Promise<boolean> => {
    if (!usuarioLogado || usuarioLogado.id === targetUser.id) return false;

    if (usuarioLogado.tipo === "PROPRIETARIO") return true;

    if (usuarioLogado.tipo === "ADMIN") {
      if (targetUser.tipo === "PROPRIETARIO") return false;

      const temPermissao = await usuarioTemPermissao("usuarios_gerenciar_permissoes");
      return temPermissao && targetUser.tipo === "FUNCIONARIO";
    }

    return false;
  };

  const podeExcluir = async (targetUser: UsuarioI): Promise<boolean> => {
    if (!usuarioLogado || usuarioLogado.id === targetUser.id) return false;

    if (usuarioLogado.tipo === "PROPRIETARIO") return true;

    if (usuarioLogado.tipo === "ADMIN") {
      if (targetUser.tipo !== "FUNCIONARIO") return false;
      return await usuarioTemPermissao("usuarios_excluir");
    }

    return false;
  };


  const podeAlterarCargo = async (targetUser: UsuarioI, novoTipo: string): Promise<boolean> => {
    if (!usuarioLogado) return false;

    if (usuarioLogado.tipo === "PROPRIETARIO") return true;

    if (usuarioLogado.tipo === "ADMIN") {
      if (targetUser.tipo === "PROPRIETARIO") return false;

      if (novoTipo === "ADMIN" || novoTipo === "PROPRIETARIO") return false;

      if (targetUser.tipo !== "FUNCIONARIO") return false;

      const temPermissao = await usuarioTemPermissao("usuarios_editar");
      return temPermissao;
    }

    return false;
  };

  const podeVisualizar = usuarioLogado?.tipo === "PROPRIETARIO" || permissoesUsuarioLogado.usuarios_visualizar;
  const podeCriar = usuarioLogado?.tipo === "PROPRIETARIO" || permissoesUsuarioLogado.usuarios_criar;

  const ordenarUsuarios = (usuarios: UsuarioI[], campo: CampoOrdenacao, direcao: DirecaoOrdenacao) => {
    if (campo === "none") return [...usuarios];

    return [...usuarios].sort((a, b) => {
      let valorA, valorB;

      switch (campo) {
        case "nome":
          valorA = a.nome.toLowerCase();
          valorB = b.nome.toLowerCase();
          break;
        case "funcao":
          valorA = a.tipo.toLowerCase();
          valorB = b.tipo.toLowerCase();
          break;
        case "dataCriacao":
          valorA = new Date(a.createdAt).getTime();
          valorB = new Date(b.createdAt).getTime();
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

  const formatarData = (dataString: string | Date) => {
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const translateRole = (role: string) => {
    return t(`roles.${role}`, { defaultValue: role });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "PROPRIETARIO":
        return modoDark ? "from-emerald-500 to-green-500" : "from-emerald-600 to-green-600";
      case "ADMIN":
        return modoDark ? "from-blue-500 to-indigo-500" : "from-blue-600 to-indigo-600";
      case "FUNCIONARIO":
        return modoDark ? "from-slate-500 to-gray-400" : "from-slate-400 to-gray-300";
      default:
        return modoDark ? "from-slate-500 to-slate-400" : "from-slate-400 to-slate-300";
    }
  };


  const enviarConvite = async () => {
    handleAcaoProtegida(async () => {
      setIsEnviando(true);
      try {
        const usuarioSalvo = localStorage.getItem("client_key");
        if (!usuarioSalvo) return false;

        const usuarioId = usuarioSalvo.replace(/"/g, "");

        const temPermissaoCriar = await usuarioTemPermissao("usuarios_criar");

        if (!temPermissaoCriar) {
          Swal.fire({
            title: t("modal.permissaoNegada.titulo") || "Permissão Negada",
            text: t("modal.permissaoNegada.textoConvite") || "Você não tem permissão para convidar usuários.",
            icon: "warning",
            confirmButtonColor: "#013C3C",
            confirmButtonText: t("modal.botaoOk") || "OK",
          });
          return;
        }

        const resEmpresa = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/empresa/usuario/${usuarioId}`, {
          headers: {
            "user-id": usuarioId,
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });
        const empresa = await resEmpresa.json();

        const resTodosUsuarios = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuario`, {
          headers: {
            "user-id": usuarioId,
          },
        });
        const todosUsuarios: UsuarioI[] = await resTodosUsuarios.json();

        const usuarioConvidado = todosUsuarios.find((u) => u.email === emailConvite);

        if (usuarioConvidado && usuarioConvidado.empresaId) {
          Swal.fire({
            title: t("modal.usuarioVinculado.titulo"),
            text: t("modal.usuarioVinculado.texto"),
            icon: "warning",
            confirmButtonText: t("modal.botaoOk"),
            confirmButtonColor: "#013C3C",
          });
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/convites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "user-id": usuarioId || "",
          },
          body: JSON.stringify({ email: emailConvite, empresaId: empresa.id }),
        });

        if (response.ok) {
          Swal.fire({
            title: t("modal.conviteEnviado.titulo"),
            text: t("modal.conviteEnviado.texto", { nome: usuarioLogado?.nome, email: emailConvite }),
            icon: "success",
            confirmButtonText: t("modal.botaoOk"),
            confirmButtonColor: "#013C3C",
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });
          setEmailConvite("");
          setModalConviteAberto(false);
        } else {
          Swal.fire({
            title: t("modal.erro.titulo") || "Erro",
            text: t("modal.erro.enviarConvite") || "Erro ao enviar convite.",
            icon: "error",
            confirmButtonColor: "#013C3C",
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          title: t("modal.erro.titulo") || "Erro",
          text: t("modal.erro.enviarConvite") || "Erro ao enviar convite.",
          icon: "error",
          confirmButtonColor: "#013C3C",
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
      } finally {
        setIsEnviando(false);
      }
    });
  };

  const enviarNotificacao = async () => {
    handleAcaoProtegida(async () => {
      setIsEnviando(true);
      try {
        let mensagemErro = "";

        if (!usuarioSelecionado) {
          mensagemErro += `• ${t("modal.preenchaCamposObrigatorios.usuario")}\n`;
        }

        if (!tituloMensagem.trim()) {
          mensagemErro += `• ${t("modal.preenchaCamposObrigatorios.tituloMensagem")}\n`;
        }

        if (!descricaoMensagem.trim()) {
          mensagemErro += `• ${t("modal.preenchaCamposObrigatorios.descricaoMensagem")}\n`;
        }

        if (mensagemErro) {
          Swal.fire({
            title: t("modal.preenchaCamposObrigatorios.titulo"),
            html: t("modal.preenchaCamposObrigatorios.texto", { campos: mensagemErro.replace(/\n/g, " ") }),
            icon: "warning",
            confirmButtonColor: "#013C3C",
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });
          setIsEnviando(false);
          return;
        }

        if (usuarioSelecionado && usuarioSelecionado.id === usuarioLogado?.id) {
          Swal.fire({
            title: "Não é possível enviar para si mesmo",
            text: "Você não pode enviar mensagens para você mesmo.",
            icon: "warning",
            confirmButtonColor: "#013C3C",
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });
          setIsEnviando(false);
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/notificacao`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titulo: tituloMensagem.trim(),
            descricao: descricaoMensagem.trim(),
            usuarioId: usuarioSelecionado ? usuarioSelecionado.id : undefined,
            nomeRemetente: usuarioLogado?.nome,
          }),
        });

        const data = await response.json();

        if (response.status === 201) {
          Swal.fire({
            title: "Mensagem enviada",
            text: `Mensagem enviada para ${usuarioSelecionado ? usuarioSelecionado.nome : ""}`,
            icon: "success",
            confirmButtonColor: "#013C3C",
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });
          setTituloMensagem("");
          setDescricaoMensagem("");
          setUsuarioSelecionado(null);
          setModalMensagemAberto(false);
        } else {
          Swal.fire({
            title: "Erro ao enviar",
            text: data.message || "Ocorreu um erro ao enviar a mensagem.",
            icon: "error",
            confirmButtonColor: "#013C3C",
            background: modoDark ? temaAtual.card : "#FFFFFF",
            color: modoDark ? temaAtual.texto : temaAtual.texto,
          });
        }
      } catch (err) {
        console.error("Erro ao enviar notificação:", err);
        Swal.fire({
          title: "Erro",
          text: "Ocorreu um erro interno ao tentar enviar a mensagem.",
          icon: "error",
          confirmButtonColor: "#013C3C",
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
      } finally {
        setIsEnviando(false);
      }
    });
  };

  const confirmarRemocaoUsuario = async (usuario: UsuarioI) => {
    const podeExcluirUsuario = await podeExcluir(usuario);
    if (!podeExcluirUsuario) {
      Swal.fire({
        title: t("modal.permissaoNegada.titulo") || "Permissão Negada",
        text: t("modal.permissaoNegada.textoExcluir") || "Você não tem permissão para excluir este usuário.",
        icon: "warning",
        confirmButtonColor: "#013C3C",
        background: modoDark ? temaAtual.card : "#FFFFFF",
        color: modoDark ? temaAtual.texto : temaAtual.texto,
      });
      return;
    }

    Swal.fire({
      title: t("modal.confirmacaoRemocao.titulo"),
      text: t("modal.confirmacaoRemocao.texto", { nome: usuario.nome }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("modal.confirmacaoRemocao.confirmar"),
      cancelButtonText: t("modal.confirmacaoRemocao.cancelar"),
      background: modoDark ? temaAtual.card : "#FFFFFF",
      color: modoDark ? temaAtual.texto : temaAtual.texto,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const usuarioSalvo = localStorage.getItem("client_key");
          if (!usuarioSalvo) {
            Swal.fire(t("modal.erro.titulo"), t("modal.erro.usuarioNaoEncontrado"), "error");
            return;
          }

          const usuarioId = usuarioSalvo.replace(/"/g, "");

          const res = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuario/${usuario.id}/remover-empresa`, {
            method: "PUT",
            headers: {
              "user-id": usuarioId || "",
            },
          });

          if (res.ok) {
            Swal.fire(t("modal.removido"), t("modal.confirmacaoRemocao.sucesso", { nome: usuario.nome }), "success");
            setModalEditarUsuario(null);
            setUsuarios((prev) => prev.filter((u) => u.id !== usuario.id));
          } else {
            try {
              const errorData = await res.json();
              Swal.fire(t("modal.erro.titulo"), errorData.mensagem || t("modal.confirmacaoRemocao.erro"), "error");
            } catch {
              Swal.fire(t("modal.erro.titulo"), t("modal.confirmacaoRemocao.erro"), "error");
            }
          }
        } catch (err) {
          console.error("Erro ao remover usuário:", err);
          Swal.fire(t("modal.erro.titulo"), t("modal.erro.removerUsuario"), "error");
        }
      }
    });
  };

  const carregarPermissoesUsuario = async (usuarioId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuarios/${usuarioId}/permissoes`);
      if (response.ok) {
        const dados: PermissoesUsuarioResponse = await response.json();
        setPermissoesUsuario(dados.permissoes);
        setPermissoesPersonalizadas(dados.permissoesPersonalizadas);

        const agrupadas = dados.permissoes.reduce((acc, permissao) => {
          if (!acc[permissao.categoria]) {
            acc[permissao.categoria] = [];
          }
          acc[permissao.categoria].push(permissao);
          return acc;
        }, {} as PermissaoAgrupada);

        setPermissoesAgrupadas(agrupadas);
      }
    } catch (error) {
      console.error("Erro ao carregar permissões do usuário:", error);
    }
  };

  const toggleTodasPermissoes = () => {
    const novoEstado = !todasMarcadas;
    setTodasMarcadas(novoEstado);

    setPermissoesUsuario((prev) => prev.map((p) => ({ ...p, concedida: novoEstado })));

    setPermissoesAgrupadas((prev) => {
      const novoAgrupado = { ...prev };
      Object.keys(novoAgrupado).forEach((categoria) => {
        novoAgrupado[categoria] = novoAgrupado[categoria].map((p) => ({ ...p, concedida: novoEstado }));
      });
      return novoAgrupado;
    });
  };

  const atualizarPermissao = (permissaoId: string, concedida: boolean) => {
    setPermissoesUsuario((prev) => prev.map((p) => (p.id === permissaoId ? { ...p, concedida } : p)));

    setPermissoesAgrupadas((prev) => {
      const novoAgrupado = { ...prev };
      Object.keys(novoAgrupado).forEach((categoria) => {
        novoAgrupado[categoria] = novoAgrupado[categoria].map((p) => (p.id === permissaoId ? { ...p, concedida } : p));
      });
      return novoAgrupado;
    });
  };

  const salvarPermissoes = async () => {
    if (!modalPermissoes) return;

    try {
      const permissoesParaSalvar = permissoesUsuario.map((p) => ({
        permissaoId: p.id,
        concedida: p.concedida,
      }));

      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuarios/${modalPermissoes.id}/permissoes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissoes: permissoesParaSalvar,
          ativarPersonalizacao: true,
        }),
      });

      if (response.ok) {
        Swal.fire({
          title: t("modal.permissoesSalvas"),
          icon: "success",
          confirmButtonColor: "#013C3C",
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
        setModalPermissoes(null);
      }
    } catch (error) {
      console.error("Erro ao salvar permissões:", error);
      Swal.fire({
        title: t("modal.erroSalvarPermissoes"),
        icon: "error",
        confirmButtonColor: "#013C3C",
        background: modoDark ? temaAtual.card : "#FFFFFF",
        color: modoDark ? temaAtual.texto : temaAtual.texto,
      });
    }
  };

  const redefinirPermissoesPadrao = async () => {
    if (!modalPermissoes) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuarios/${modalPermissoes.id}/permissoes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          permissoes: [],
          ativarPersonalizacao: false,
        }),
      });

      if (response.ok) {
        Swal.fire({
          title: t("modal.permissoesRedefinidas"),
          icon: "success",
          confirmButtonColor: "#013C3C",
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
        setModalPermissoes(null);
        carregarPermissoesUsuario(modalPermissoes.id);
      }
    } catch (error) {
      console.error("Erro ao redefinir permissões:", error);
      Swal.fire({
        title: t("modal.erroRedefinirPermissoes"),
        icon: "error",
        confirmButtonColor: "#013C3C",
        background: modoDark ? temaAtual.card : "#FFFFFF",
        color: modoDark ? temaAtual.texto : temaAtual.texto,
      });
    }
  };

  const renderizarPermissoesPorCategoria = () => {
    if (Object.keys(permissoesAgrupadas).length === 0) {
      return (
        <p className="text-center py-4" style={{ color: temaAtual.placeholder }}>
          Nenhuma permissão encontrada
        </p>
      );
    }

    return Object.entries(permissoesAgrupadas).map(([categoria, permissoesDaCategoria]) => (
      <div key={categoria} className="mb-6">
        <h3
          className="text-lg font-semibold mb-3 border-b pb-2"
          style={{
            color: temaAtual.texto,
            borderColor: temaAtual.borda,
          }}
        >
          {getTranslatedCategory(categoria, i18n.language)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {permissoesDaCategoria.map((permissao) => (
            <div
              key={permissao.id}
              className="flex items-start gap-3 p-3 border rounded-lg"
              style={{
                backgroundColor: temaAtual.card,
                borderColor: temaAtual.borda,
              }}
            >
              <input
                type="checkbox"
                checked={permissao.concedida}
                onChange={(e) => atualizarPermissao(permissao.id, e.target.checked)}
                className="mt-1 rounded cursor-pointer"
                style={{
                  accentColor: temaAtual.primario,
                }}
              />
              <div className="flex-1">
                <div className="font-medium" style={{ color: temaAtual.texto }}>
                  {getTranslatedPermission(permissao.chave, "nome", i18n.language)}
                </div>
                <div className="text-xs mt-1" style={{ color: temaAtual.placeholder }}>
                  {getTranslatedPermission(permissao.chave, "descricao", i18n.language)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ));
  };

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const buscaMatch = usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busca.toLowerCase());

    const funcaoMatch = filtroFuncao ? usuario.tipo === filtroFuncao : true;

    return buscaMatch && funcaoMatch;
  });
  const usuariosOrdenados = ordenarUsuarios(usuariosFiltrados, campoOrdenacao, direcaoOrdenacao);
  const indexUltimoUsuario = paginaAtual * usuariosPorPagina;
  const indexPrimeiroUsuario = indexUltimoUsuario - usuariosPorPagina;
  const usuariosAtuais = usuariosOrdenados.slice(indexPrimeiroUsuario, indexUltimoUsuario);
  const totalPaginas = Math.ceil(usuariosOrdenados.length / usuariosPorPagina);

  const mudarPagina = (novaPagina: number) => {
    setPaginaAtual(novaPagina);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen" style={{ backgroundColor: temaAtual.fundo }}>
        <p style={{ color: temaAtual.texto }}>{t("carregando")}</p>
      </div>
    );
  }

  const bgGradient = modoDark
    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    : "bg-gradient-to-br from-slate-200 via-blue-50 to-slate-200";

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
                  {t("titulo")} <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{t("usuarios")}</span>
                </h1>
                <p className={`text-lg ${textSecondary} max-w-2xl mx-auto`}>{t("subtitulo")}</p>
              </div>
            </section>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                {
                  label: t("stats.total"),
                  value: stats.total,
                  icon: FaUsers,
                  color: "from-blue-500 to-cyan-500",
                  bgColor: modoDark ? "bg-blue-500/10" : "bg-blue-50",
                },
                {
                  label: t("stats.proprietarios"),
                  value: stats.proprietarios,
                  icon: FaShield,
                  color: "from-green-500 to-green-500",
                  bgColor: modoDark ? "bg-green-500/10" : "bg-green-500",
                },
                {
                  label: t("stats.admins"),
                  value: stats.admins,
                  icon: FaUser,
                  color: "from-blue-500 to-emerald-500",
                  bgColor: modoDark ? "bg-green-500/10" : "bg-green-50",
                },
                {
                  label: t("stats.funcionarios"),
                  value: stats.funcionarios,
                  icon: FaUsers,
                  color: "from-gray-500 to-slate-400",
                  bgColor: modoDark ? "bg-slate-500/10" : "bg-slate-50",
                },
              ].map((stat, index) => (
                <div key={index} className="gradient-border animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className={`p-4 rounded-[15px] ${bgStats} backdrop-blur-sm`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>{stat.value}</div>
                        <div className={textMuted}>{stat.label}</div>
                      </div>
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`text-xl bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
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
            <div className="flex flex-col lg:flex-row gap-4 mb-6 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                <div className="relative flex-1 max-w-md">
                  <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-20 transition-opacity duration-300`}></div>
                  <div className={`relative flex items-center ${bgCard} rounded-xl px-4 py-3 border ${borderColor} backdrop-blur-sm`}>
                    <FaSearch className={`${modoDark ? "text-blue-400" : "text-blue-500"} mr-3 text-sm`} />
                    <input
                      type="text"
                      placeholder={t("buscarUsuario")}
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
                          <div className="space-y-3">
                            <div>
                              <div className={`text-xs font-medium ${textMuted} mb-2`}>{t("filtros.ordenarPor")}</div>
                              <div className="flex flex-col gap-1">
                                {[
                                  { valor: "nome", label: t("filtros.nome") },
                                  { valor: "funcao", label: t("filtros.funcao") },
                                  { valor: "dataCriacao", label: t("filtros.dataCriacao") },
                                ].map((campo) => (
                                  <button
                                    key={campo.valor}
                                    onClick={() => {
                                      if (campoOrdenacao === campo.valor) {
                                        setDirecaoOrdenacao(direcaoOrdenacao === "asc" ? "desc" : "asc");
                                      } else {
                                        setCampoOrdenacao(campo.valor as CampoOrdenacao);
                                        setDirecaoOrdenacao("asc");
                                      }
                                    }}
                                    className={`flex items-center justify-between px-2 py-1 rounded-lg cursor-pointer text-xs transition-all ${campoOrdenacao === campo.valor ? `${bgSelected} text-blue-600 font-medium` : `${bgHover} ${textPrimary}`}`}
                                  >
                                    <span>{campo.label}</span>
                                    {campoOrdenacao === campo.valor && (
                                      <span className="text-xs">{direcaoOrdenacao === "asc" ? "↑" : "↓"}</span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className={`text-xs font-medium ${textMuted} mb-2`}>{t("filtros.funcao")}</div>
                              <div className="space-y-1">
                                {["PROPRIETARIO", "ADMIN", "FUNCIONARIO"].map((funcao) => (
                                  <label key={funcao} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={filtroFuncao === funcao}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setFiltroFuncao(funcao);
                                        } else {
                                          setFiltroFuncao(null);
                                        }
                                      }}
                                      className="rounded cursor-pointer"
                                      style={{ accentColor: temaAtual.primario }}
                                    />
                                    <span className={`text-xs ${textPrimary}`}>{translateRole(funcao)}</span>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {filtroFuncao && (
                              <button
                                onClick={() => setFiltroFuncao(null)}
                                className={`px-4 py-3 ${modoDark ? "bg-red-500/10 hover:bg-red-500/20" : "bg-red-50 hover:bg-red-100"} border ${modoDark ? "border-red-500/30" : "border-red-200"} rounded-xl ${modoDark ? "text-red-400" : "text-red-500"} transition-all duration-300 flex items-center gap-2 text-sm`}
                              >
                                <FaTimes className="text-xs" />
                                {t("limpar")}
                              </button>
                            )}
                            {(filtroFuncao || campoOrdenacao !== "none") && (
                              <button
                                onClick={() => {
                                  setFiltroFuncao(null);
                                  setCampoOrdenacao("none");
                                  setDirecaoOrdenacao("asc");
                                }}
                                className={`w-full px-3 cursor-pointer py-2 ${modoDark ? "bg-red-500/10 hover:bg-red-500/20" : "bg-red-50 hover:bg-red-100"} border ${modoDark ? "border-red-500/30" : "border-red-200"} rounded-lg ${modoDark ? "text-red-400" : "text-red-500"} transition-all duration-300 text-xs font-medium`}
                              >
                                {t("filtros.limparFiltros")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {totalPaginas > 1 && (
                    <div className={`flex items-center gap-1 ${bgCard} border ${borderColor} rounded-xl px-3 py-2`}>
                      <button onClick={() => mudarPagina(paginaAtual - 1)} disabled={paginaAtual === 1} className={`p-1 cursor-pointer rounded-lg transition-all duration-300 ${paginaAtual === 1 ? `${textMuted} cursor-not-allowed` : `${textPrimary} ${bgHover} hover:scale-105`}`}>
                        <FaAngleLeft className="text-sm" />
                      </button>

                      <span className={`${textPrimary} text-sm mx-2`}>
                        {paginaAtual}/{totalPaginas}
                      </span>

                      <button onClick={() => mudarPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas} className={`p-1 cursor-pointer rounded-lg transition-all duration-300 ${paginaAtual === totalPaginas ? `${textMuted} cursor-not-allowed` : `${textPrimary} ${bgHover} hover:scale-105`}`}>
                        <FaAngleRight className="text-sm" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 lg:mt-0">
                {podeCriar && empresaAtivada && (
                  <>
                    <button
                      onClick={() => handleAcaoProtegida(() => setModalMensagemAberto(true))}
                      className="px-4 py-3 bg-gradient-to-r cursor-pointer from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl transition-all duration-300 font-semibold text-white flex items-center gap-2 hover:scale-105 shadow-lg shadow-green-500/25 text-sm"
                    >
                      <FaEnvelope className="text-sm" />
                      {t("enviarMensagem")}
                    </button>
                    <button
                      onClick={() => handleAcaoProtegida(() => setModalConviteAberto(true))}
                      className="px-4 py-3 bg-gradient-to-r cursor-pointer from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all duration-300 font-semibold text-white flex items-center gap-2 hover:scale-105 shadow-lg shadow-blue-500/25 text-sm"
                    >
                      <FaUserPlus className="text-sm" />
                      {t("convidarUsuario")}
                    </button>
                  </>
                )}
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className={`${bgCard} rounded-xl p-4 animate-pulse border ${borderColor}`}>
                    <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded-full h-24 w-24 mx-auto mb-3`}></div>
                    <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-3 mb-2`}></div>
                    <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-3 w-2/3 mb-3`}></div>
                    <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-6 mb-2`}></div>
                    <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-2 mb-1`}></div>
                    <div className={`${modoDark ? "bg-slate-700" : "bg-slate-200"} rounded h-2 w-3/4`}></div>
                  </div>
                ))}
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <div className="text-center py-12">
                <div className={`w-24 h-24 mx-auto mb-4 ${bgCard} rounded-full flex items-center justify-center border ${borderColor}`}>
                  <FaUsers className={`text-2xl ${textMuted}`} />
                </div>
                <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>{t("nenhumUsuarioEncontrado")}</h3>
                <p className={`${textMuted} mb-4 text-sm`}>{t("comeceConvidando")}</p>
                {podeCriar && empresaAtivada && (
                  <button onClick={() => setModalConviteAberto(true)} className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded-xl transition-all duration-300 font-semibold text-white flex items-center gap-2 mx-auto hover:scale-105 text-sm">
                    <FaUserPlus />
                    {t("convidarPrimeiroUsuario")}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {usuariosAtuais.map((usuario) => {
                  return (
                    <div
                      key={usuario.id}
                      className={`${modoDark
                        ? "bg-slate-800/50"
                        : "bg-gradient-to-br from-blue-100/30 to-cyan-100/30"
                        } rounded-xl border ${modoDark ? "border-blue-500/20" : "border-blue-200"
                        } p-4 transition-all duration-300 hover:shadow-lg backdrop-blur-sm`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${getRoleColor(usuario.tipo)}`}>
                              <span className="text-lg font-bold text-white">
                                {usuario.nome.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="md:hidden">
                              <div className={`px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRoleColor(usuario.tipo)} text-white`}>
                                {translateRole(usuario.tipo)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                            <div>
                              <h3 className={`font-bold ${textPrimary} line-clamp-1 text-sm`}>{usuario.nome}</h3>
                              <p className={`${textMuted} text-xs line-clamp-2 mt-1`}>{usuario.email}</p>
                            </div>
                            <div className="hidden md:block">
                              <div className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getRoleColor(usuario.tipo)} text-white`}>
                                {translateRole(usuario.tipo)}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className={textMuted}>{t("criadoEm")}: </span>
                              <span className={textPrimary}>{formatarData(usuario.createdAt)}</span>
                            </div>
                            <div>
                              <span className={textMuted}>{t("ultimaAtualizacao")}: </span>
                              <span className={textPrimary}>{formatarData(usuario.updatedAt)}</span>
                            </div>
                            <div>
                              <span className={textMuted}>{t("status")}: </span>
                              <span className={`font-medium bg-gradient-to-r ${getRoleColor(usuario.tipo)} bg-clip-text text-transparent`}>
                                {translateRole(usuario.tipo)}
                              </span>
                            </div>
                            <div>
                              <span className={textMuted}>{t("acesso")}: </span>
                              <span className={`${usuario.empresaId ? "text-green-500" : "text-red-500"} font-medium`}>
                                {usuario.empresaId ? t("ativo") : t("inativo")}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 min-w-[120px]">
                          {usuariosEditaveis[usuario.id] && usuario.id !== usuarioLogado?.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalEditarUsuario(usuario);
                                setNovoTipo(usuario.tipo);
                              }}
                              className="px-2 py-1 rounded-lg cursor-pointer bg-green-600 hover:bg-green-700 text-white text-xs transition-all duration-300 flex items-center justify-center gap-1"
                            >
                              <FaEdit className="text-xs" />
                              {t("editar")}
                            </button>
                          )}

                          {usuariosGerenciáveis[usuario.id] && usuario.id !== usuarioLogado?.id && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                setModalPermissoes(usuario);
                                await carregarPermissoesUsuario(usuario.id);
                              }}
                              className="px-2 py-1 rounded-lg cursor-pointer bg-cyan-600 hover:bg-cyan-700 text-white text-xs transition-all duration-300 flex items-center justify-center gap-1"
                            >
                              <FaLock className="text-xs" />
                              {t("permissoes")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {totalPaginas > 1 && (
              <div className="flex justify-center items-center gap-3 mt-6">
                <button
                  onClick={() => mudarPagina(paginaAtual - 1)}
                  disabled={paginaAtual === 1}
                  className={`p-2 rounded-xl transition-all duration-300 ${paginaAtual === 1
                    ? `${modoDark ? "bg-slate-800/30" : "bg-slate-100"} ${textMuted} cursor-not-allowed`
                    : `${modoDark ? "bg-blue-500/10 hover:bg-blue-500/20" : "bg-blue-50 hover:bg-blue-100"} ${textPrimary} border ${borderColor} hover:scale-105`
                    }`}
                >
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
                      <button
                        key={pagina}
                        onClick={() => mudarPagina(pagina)}
                        className={`px-3 py-1 rounded-xl transition-all duration-300 text-sm ${pagina === paginaAtual
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25 scale-105"
                          : `${bgCard} ${bgHover} ${textPrimary} border ${borderColor} hover:scale-105`
                          }`}
                      >
                        {pagina}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => mudarPagina(paginaAtual + 1)}
                  disabled={paginaAtual === totalPaginas}
                  className={`p-2 rounded-xl transition-all duration-300 ${paginaAtual === totalPaginas
                    ? `${modoDark ? "bg-slate-800/30" : "bg-slate-100"} ${textMuted} cursor-not-allowed`
                    : `${modoDark ? "bg-blue-500/10 hover:bg-blue-500/20" : "bg-blue-50 hover:bg-blue-100"} ${textPrimary} border ${borderColor} hover:scale-105`
                    }`}
                >
                  <FaAngleRight className="text-sm" />
                </button>
              </div>
            )}
            {modalConviteAberto && (
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                <div className={`${modoDark ? "bg-slate-800 border-blue-500/30 shadow-blue-500/20" : "bg-white border-blue-200 shadow-blue-200"} border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-sm`} onClick={(e) => e.stopPropagation()}>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className={`text-xl font-bold ${textPrimary}`}>{t("modal.convidarUsuario")}</h2>
                      <button
                        onClick={() => {
                          setModalConviteAberto(false);
                          setEmailConvite("");
                        }}
                        className={`p-2 cursor-pointer ${bgHover} rounded-lg transition-colors ${textMuted} hover:${textPrimary}`}
                      >
                        <FaTimes className="text-lg" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>
                          {t("modal.emailUsuario")} <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          value={emailConvite}
                          onChange={(e) => setEmailConvite(e.target.value)}
                          placeholder="email@exemplo.com"
                          className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} placeholder-${modoDark ? "gray-400" : "slate-500"} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm`}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-blue-500/20">
                        <button
                          onClick={() => {
                            setModalConviteAberto(false);
                            setEmailConvite("");
                          }}
                          className={`px-4 py-2 cursor-pointer ${bgCard} ${bgHover} border ${borderColor} ${textPrimary} rounded-xl transition-all duration-300 hover:scale-105 text-sm`}
                        >
                          {t("modal.cancelar")}
                        </button>
                        <button
                          onClick={enviarConvite}
                          disabled={isEnviando}
                          className={`px-4 py-2 cursor-pointer bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm`}
                        >
                          {isEnviando ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              {t("modal.enviando")}
                            </>
                          ) : (
                            <>
                              <FaUserPlus className="text-xs" />
                              {t("modal.enviarConvite")}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {modalMensagemAberto && (
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                <div className={`${modoDark ? "bg-slate-800 border-blue-500/30 shadow-blue-500/20" : "bg-white border-blue-200 shadow-blue-200"} border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-sm`} onClick={(e) => e.stopPropagation()}>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className={`text-xl font-bold ${textPrimary}`}>{t("modal.enviarMensagem")}</h2>
                      <button
                        onClick={() => {
                          setModalMensagemAberto(false);
                          setTituloMensagem("");
                          setDescricaoMensagem("");
                          setUsuarioSelecionado(null);
                        }}
                        className={`p-2 cursor-pointer ${bgHover} rounded-lg transition-colors ${textMuted} hover:${textPrimary}`}
                      >
                        <FaTimes className="text-lg" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>
                          {t("modal.de")}
                        </label>
                        <input
                          type="text"
                          value={usuarioLogado?.nome || ""}
                          readOnly
                          className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} opacity-70 cursor-not-allowed text-sm`}
                        />
                      </div>

                      <div>
                        <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>
                          {t("modal.para")} <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={usuarioSelecionado?.id || ""}
                          onChange={(e) => setUsuarioSelecionado(usuarios.find((u) => u.id === e.target.value) || null)}
                          className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 cursor-pointer text-sm`}
                        >
                          <option value="">{t("selecioneUsuario")}</option>
                          {usuarios
                            .filter((usuario) => usuario.id !== usuarioLogado?.id)
                            .map((usuario) => (
                              <option key={usuario.id} value={usuario.id}>
                                {usuario.nome} - {usuario.email}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>
                          {t("modal.tituloMensagem")} <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder={t("modal.tituloMensagemPlaceholder")}
                          value={tituloMensagem}
                          onChange={(e) => setTituloMensagem(e.target.value)}
                          className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} placeholder-${modoDark ? "gray-400" : "slate-500"} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 text-sm`}
                        />
                      </div>

                      <div>
                        <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>
                          {t("modal.descricaoMensagem")} <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          placeholder={t("modal.descricaoMensagemPlaceholder")}
                          value={descricaoMensagem}
                          onChange={(e) => setDescricaoMensagem(e.target.value)}
                          rows={4}
                          className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} placeholder-${modoDark ? "gray-400" : "slate-500"} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-150 resize-none overflow-hidden text-sm`}
                          style={{ minHeight: '80px' }}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t border-blue-500/20">
                        <button
                          onClick={() => {
                            setModalMensagemAberto(false);
                            setTituloMensagem("");
                            setDescricaoMensagem("");
                            setUsuarioSelecionado(null);
                          }}
                          className={`px-4 py-2 cursor-pointer ${bgCard} ${bgHover} border ${borderColor} ${textPrimary} rounded-xl transition-all duration-300 hover:scale-105 text-sm`}
                        >
                          {t("modal.cancelar")}
                        </button>
                        <button
                          onClick={enviarNotificacao}
                          disabled={isEnviando}
                          className={`px-4 py-2 cursor-pointer bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm`}
                        >
                          {isEnviando ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              {t("modal.enviando")}
                            </>
                          ) : (
                            <>
                              <FaEnvelope className="text-xs" />
                              {t("modal.enviarMensagem")}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {modalEditarUsuario && (
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                <div className={`${modoDark ? "bg-slate-800 border-blue-500/30 shadow-blue-500/20" : "bg-white border-blue-200 shadow-blue-200"} border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto backdrop-blur-sm`} onClick={(e) => e.stopPropagation()}>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className={`text-xl font-bold ${textPrimary}`}>{t("modal.editarUsuario")}</h2>
                      <button
                        onClick={() => setModalEditarUsuario(null)}
                        className={`p-2 cursor-pointer ${bgHover} rounded-lg transition-colors ${textMuted} hover:${textPrimary}`}
                      >
                        <FaTimes className="text-lg" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className={`${textPrimary} mb-3`}>
                          {t("modal.usuario")}: <strong>{modalEditarUsuario.nome}</strong>
                        </p>
                      </div>

                      <div>
                        <label className={`block ${textPrimary} mb-2 font-medium text-sm`}>
                          {t("modal.alterarCargo")}
                        </label>
                        <select
                          value={novoTipo}
                          onChange={(e) => setNovoTipo(e.target.value)}
                          className={`w-full ${bgInput} border ${borderColor} rounded-xl px-3 py-2 ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 cursor-pointer text-sm`}
                        >
                          <option value="FUNCIONARIO">{t("modal.funcionario")}</option>
                          {usuarioLogado?.tipo === "PROPRIETARIO" && (
                            <option value="ADMIN">{t("modal.admin")}</option>
                          )}
                          {usuarioLogado?.tipo === "PROPRIETARIO" && (
                            <option value="PROPRIETARIO">{t("modal.proprietario")}</option>
                          )}
                        </select>
                      </div>

                      <div className="flex flex-wrap justify-between gap-2 pt-4 border-t border-blue-500/20">
                        <div>
                          {usuariosExcluiveis[modalEditarUsuario.id] && (
                            <button
                              onClick={() => confirmarRemocaoUsuario(modalEditarUsuario)}
                              className={`px-3 py-2 cursor-pointer ${modoDark ? "bg-red-500/10 hover:bg-red-500/20" : "bg-red-50 hover:bg-red-100"} border ${modoDark ? "border-red-500/30" : "border-red-200"} ${modoDark ? "text-red-400" : "text-red-500"} rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-1 text-sm`}
                            >
                              <FaTrash className="text-xs" />
                              {t("modal.remover")}
                            </button>
                          )}
                        </div>

                        <div className="flex gap-2 flex-wrap justify-end">
                          <button
                            onClick={() => setModalEditarUsuario(null)}
                            className={`px-4 py-2 cursor-pointer ${bgCard} ${bgHover} border ${borderColor} ${textPrimary} rounded-xl transition-all duration-300 hover:scale-105 text-sm`}
                          >
                            {t("modal.cancelar")}
                          </button>

                          {usuariosGerenciáveis[modalEditarUsuario.id] && (
                            <button
                              onClick={async () => {
                                if (!modalEditarUsuario) return;
                                const podeGerenciar = await podeGerenciarPermissoesUsuario(modalEditarUsuario);
                                if (!podeGerenciar) {
                                  Swal.fire(t("modal.erroPermissao.titulo"), t("modal.erroPermissao.texto"), "warning");
                                  return;
                                }
                                setModalPermissoes(modalEditarUsuario);
                                await carregarPermissoesUsuario(modalEditarUsuario.id);
                              }}
                              className={`px-4 py-2 cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-1 text-sm`}
                            >
                              <FaLock className="text-xs" />
                              {t("gerenciarPermissoes")}
                            </button>
                          )}

                          <button
                            onClick={async () => {
                              if (!usuarioLogado || !modalEditarUsuario) return;

                              const podeAlterar = await podeAlterarCargo(modalEditarUsuario, novoTipo);
                              if (!podeAlterar) {
                                Swal.fire(t("modal.erroPermissao.titulo"), t("modal.erroPermissao.texto"), "warning");
                                return;
                              }

                              const res = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuario/${modalEditarUsuario.id}`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ tipo: novoTipo }),
                              });

                              if (res.ok) {
                                Swal.fire({
                                  title: t("modal.cargoAtualizado"),
                                  text: t("modal.cargoAtualizadoSucesso"),
                                  icon: "success",
                                  confirmButtonColor: "#013C3C",
                                  background: modoDark ? temaAtual.card : "#FFFFFF",
                                  color: modoDark ? temaAtual.texto : temaAtual.texto,
                                });
                                setModalEditarUsuario(null);
                                window.location.reload();
                              } else {
                                Swal.fire({
                                  title: t("modal.erro.titulo"),
                                  text: t("modal.erro.alterarCargo"),
                                  icon: "error",
                                  confirmButtonColor: "#013C3C",
                                  background: modoDark ? temaAtual.card : "#FFFFFF",
                                  color: modoDark ? temaAtual.texto : temaAtual.texto,
                                });
                              }
                            }}
                            className="px-4 py-2 cursor-pointer bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-1 text-sm"
                          >
                            <FaCheck className="text-xs" />
                            {t("modal.salvarCargo")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {modalPermissoes && (
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}>
                <div className={`${modoDark ? "bg-slate-800 border-blue-500/30 shadow-blue-500/20" : "bg-white border-blue-200 shadow-blue-200"} border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-sm`} onClick={(e) => e.stopPropagation()}>
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className={`text-xl font-bold ${textPrimary}`}>
                        {t("modal.permissoesUsuario")} - {modalPermissoes.nome}
                      </h2>
                      <button
                        onClick={() => setModalPermissoes(null)}
                        className={`p-2 cursor-pointer ${bgHover} rounded-lg transition-colors ${textMuted} hover:${textPrimary}`}
                      >
                        <FaTimes className="text-lg" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={permissoesPersonalizadas}
                          onChange={(e) => setPermissoesPersonalizadas(e.target.checked)}
                          className="rounded cursor-pointer"
                          style={{
                            accentColor: temaAtual.primario,
                          }}
                        />
                        <span className={textPrimary}>{t("modal.permissoesPersonalizadas")}</span>
                      </label>

                      {permissoesPersonalizadas && (
                        <button
                          onClick={toggleTodasPermissoes}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer ${todasMarcadas ? "bg-blue-500 text-white" : `${bgCard} ${textPrimary} border ${borderColor}`}`}
                        >
                          <input
                            type="checkbox"
                            checked={todasMarcadas}
                            onChange={toggleTodasPermissoes}
                            className="rounded cursor-pointer"
                            style={{
                              accentColor: temaAtual.primario,
                            }}
                          />
                          {todasMarcadas ? t("modal.desmarcarTodas") : t("modal.marcarTodas")}
                        </button>
                      )}
                    </div>

                    <p className={`text-sm mb-4 ${textMuted}`}>
                      {t("modal.permissoesPersonalizadasDescricao")}
                    </p>

                    {permissoesPersonalizadas ? (
                      <>
                        <div className="mb-6 max-h-96 overflow-y-auto pr-2">
                          {renderizarPermissoesPorCategoria()}
                        </div>

                        <div className="flex justify-between gap-2 pt-4 border-t border-blue-500/20">
                          <button
                            onClick={redefinirPermissoesPadrao}
                            className={`px-4 py-2 cursor-pointer ${bgCard} ${bgHover} border ${borderColor} ${textPrimary} rounded-xl transition-all duration-300 hover:scale-105 text-sm`}
                          >
                            {t("modal.redefinirPadrao")}
                          </button>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setModalPermissoes(null)}
                              className={`px-4 py-2 cursor-pointer ${bgCard} ${bgHover} border ${borderColor} ${textPrimary} rounded-xl transition-all duration-300 hover:scale-105 text-sm`}
                            >
                              {t("modal.cancelar")}
                            </button>
                            <button
                              onClick={salvarPermissoes}
                              className="px-4 py-2 cursor-pointer bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 hover:scale-105 text-sm"
                            >
                              {t("modal.salvarPermissoes")}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-end gap-2 pt-4 border-t border-blue-500/20">
                        <button
                          onClick={() => setModalPermissoes(null)}
                          className={`px-4 py-2 cursor-pointer ${bgCard} ${bgHover} border ${borderColor} ${textPrimary} rounded-xl transition-all duration-300 hover:scale-105 text-sm`}
                        >
                          {t("modal.cancelar")}
                        </button>
                        <button
                          onClick={async () => {
                            await redefinirPermissoesPadrao();
                            setModalPermissoes(null);
                          }}
                          className="px-4 py-2 cursor-pointer bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 hover:scale-105 text-sm"
                        >
                          {t("modal.confirmar")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}