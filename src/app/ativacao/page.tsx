"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCheckCircle, FaLock, FaShoppingCart, FaKey, FaRocket } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { cores } from "@/utils/cores";
import Link from "next/link";
import Swal from "sweetalert2";
import Cookies from "js-cookie";
import { FaShield } from "react-icons/fa6";

type TipoUsuario = "FUNCIONARIO" | "ADMIN" | "PROPRIETARIO";

export default function AtivacaoPage() {
  const [codigo, setCodigo] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario | null>(null);
  const [loading, setLoading] = useState(false);
  const [modoDark, setModoDark] = useState(false);
  const [empresaAtivada, setEmpresaAtivada] = useState(false);
  const { t } = useTranslation("ativacao");
  const [, setStatusAtivacao] = useState<{
    ativada: boolean;
    chave: string | null;
    dataAtivacao: Date | null;
  }>({ ativada: false, chave: null, dataAtivacao: null });
  const router = useRouter();

  const temaAtual = modoDark ? cores.dark : cores.light;
  const bgGradient = modoDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-slate-200 via-blue-50 to-slate-200";
  const textPrimary = modoDark ? "text-white" : "text-slate-900";
  const textSecondary = modoDark ? "text-gray-300" : "text-slate-600";
  const textMuted = modoDark ? "text-gray-400" : "text-slate-500";
  const bgCard = modoDark ? "bg-slate-800/50" : "bg-white/80";
  const borderColor = modoDark ? "border-blue-500/30" : "border-blue-200";
  const bgInput = modoDark ? "bg-slate-700/50" : "bg-gray-100";

  useEffect(() => {
    const temaSalvo = localStorage.getItem("modoDark");
    const ativado = temaSalvo === "true";
    setModoDark(ativado);

    const handleThemeChange = (e: CustomEvent) => {
      setModoDark(e.detail.modoDark);
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);

    const token = Cookies.get("token");
    if (!token) {
      window.location.href = "/login";
    }

    const checkUsuarioEStatus = async () => {
      try {
        const userId = localStorage.getItem("client_key")?.replace(/"/g, "");
        if (!userId) {
          router.push("/login");
          return;
        }

        const userRes = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/usuario/${userId}`);
        const userData = await userRes.json();
        if (!userRes.ok) throw new Error(t("erroBuscarUsuario"));
        setTipoUsuario(userData.tipo);

        const empresaRes = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/empresa/usuario/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });
        const empresaData = await empresaRes.json();
        if (!empresaRes.ok) throw new Error(t("erroBuscarEmpresa"));
        setEmpresaId(empresaData.id);

        const statusRes = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/empresa/status-ativacao/${empresaData.id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        });
        const statusData = await statusRes.json();
        if (statusRes.ok) {
          setStatusAtivacao(statusData);
          setEmpresaAtivada(statusData.ativada);
        }
      } catch (error: unknown) {
        console.error("Erro ao verificar status:", error);
      }
    };

    checkUsuarioEStatus();

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, [router, t]);

  useEffect(() => {
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
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [modoDark]);

  const handleAtivar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!codigo.trim()) {
        throw new Error(t("erroCodigoVazio"));
      }

      const chaveRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!chaveRegex.test(codigo)) {
        throw new Error(t("erroCodigoInvalido"));
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_URL_API}/chave/${codigo}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(t("chaveNaoEncontrada") || "Código de ativação não existe");
        } else if (res.status === 400) {
          if (responseData.mensagem?.includes("já foi utilizada")) {
            throw new Error(t("chaveJaUtilizada") || "Este código de ativação já foi utilizado por outra empresa");
          }
          if (responseData.mensagem?.includes("já possui uma chave")) {
            throw new Error(t("empresaJaAtivada") || "Esta empresa já possui uma chave de ativação");
          }
          throw new Error(responseData.mensagem || t("erroAtivacao"));
        }
        throw new Error(responseData.mensagem || t("erroAtivacao"));
      }

      Swal.fire({
        icon: "success",
        title: t("empresaAtivada") || "Empresa ativada!",
        text: t("empresaAtivadaMensagem") || "Sua empresa foi ativada com sucesso.",
        confirmButtonColor: temaAtual.primario,
        background: modoDark ? temaAtual.card : "#FFFFFF",
        color: modoDark ? temaAtual.texto : temaAtual.texto,
      });

      setEmpresaAtivada(true);
      setStatusAtivacao((prev) => ({ ...prev, ativada: true }));
    } catch (error: unknown) {
      console.error("Erro completo:", error);

      if (error instanceof Error) {
        let mensagemErro = error.message;

        if (error.message.includes("não encontrada")) {
          mensagemErro = t("chaveNaoEncontrada") || "Código de ativação não existe";
        } else if (error.message.includes("já foi utilizada")) {
          mensagemErro = t("chaveJaUtilizada") || "Este código de ativação já foi utilizado por outra empresa";
        } else if (error.message.includes("já possui uma chave")) {
          mensagemErro = t("empresaJaAtivada") || "Esta empresa já possui uma chave de ativação";
        }

        Swal.fire({
          icon: "error",
          title: "Erro na ativação",
          text: mensagemErro,
          confirmButtonColor: temaAtual.erro,
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: t("erroGenerico") || "Erro desconhecido ao ativar empresa",
          confirmButtonColor: temaAtual.erro,
          background: modoDark ? temaAtual.card : "#FFFFFF",
          color: modoDark ? temaAtual.texto : temaAtual.texto,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (tipoUsuario && tipoUsuario !== "PROPRIETARIO") {
    return (
      <div className={`min-h-screen ${bgGradient} flex items-center justify-center px-4`}>
        <div className="gradient-border animate-fade-in-up">
          <div className={`p-8 rounded-[15px] ${bgCard} backdrop-blur-sm text-center`}>
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
              <FaLock className="text-white text-3xl" />
            </div>
            <h2 className={`text-2xl font-bold ${textPrimary} mb-4`}>{t("acessoRestrito")}</h2>
            <p className={`text-lg ${textSecondary} mb-6`}>{t("apenasProprietarios")}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer hover:scale-105"
              style={{
                background: modoDark ? "linear-gradient(135deg, #3B82F6, #0EA5E9)" : "linear-gradient(135deg, #1976D2, #0284C7)",
                color: "#FFFFFF",
              }}
            >
              {t("voltarDashboard")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (empresaAtivada && tipoUsuario === "PROPRIETARIO") {
    return (
      <div className={`min-h-screen ${bgGradient} flex items-center justify-center px-4`}>
        <div className="gradient-border animate-fade-in-up">
          <div className={`p-8 rounded-[15px] ${bgCard} backdrop-blur-sm text-center`}>
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <FaCheckCircle className="text-white text-3xl" />
            </div>
            <h2 className={`text-2xl font-bold ${textPrimary} mb-4`}>{t("empresaJaAtivada")}</h2>
            <p className={`text-lg ${textSecondary} mb-6`}>{t("empresaJaAtivadaMensagem")}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer hover:scale-105"
              style={{
                background: modoDark ? "linear-gradient(135deg, #10B981, #059669)" : "linear-gradient(135deg, #10B981, #059669)",
                color: "#FFFFFF",
              }}
            >
              {t("voltarDashboard")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgGradient}`}>
      <div className="flex">
        <div className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
            <section className={`relative py-8 rounded-3xl mb-6 overflow-hidden ${bgCard} backdrop-blur-sm border ${borderColor}`}>
              <div className="absolute inset-0">
                <div className={`absolute top-0 left-10 w-32 h-32 ${modoDark ? "bg-blue-500/20" : "bg-blue-200/50"} rounded-full blur-3xl animate-float`}></div>
                <div className={`absolute bottom-0 right-10 w-48 h-48 ${modoDark ? "bg-slate-700/20" : "bg-slate-300/50"} rounded-full blur-3xl animate-float`} style={{ animationDelay: "2s" }}></div>
                <div className={`absolute top-1/2 left-1/2 w-24 h-24 ${modoDark ? "bg-cyan-500/20" : "bg-cyan-200/50"} rounded-full blur-3xl animate-float`} style={{ animationDelay: "4s" }}></div>
              </div>

              <div className="relative z-10 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                  <FaKey className="text-white text-3xl" />
                </div>
                <h1 className={`text-3xl md:text-4xl font-bold ${textPrimary} mb-3`}>
                  {t("ativacaoTitulo")} <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{t("licenca")}</span>
                </h1>
                <p className={`text-lg ${textSecondary} max-w-2xl mx-auto`}>{t("ativacaoDescricao")}</p>
              </div>
            </section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="gradient-border animate-fade-in-up">
                  <div className={`p-6 rounded-[15px] ${bgCard} backdrop-blur-sm`}>
                    <h2 className={`text-xl font-bold ${textPrimary} mb-6 flex items-center gap-2`}>
                      <FaRocket className={modoDark ? "text-blue-400" : "text-blue-500"} />
                      {t("ativarSuaEmpresa")}
                    </h2>

                    <form onSubmit={handleAtivar} className="space-y-6">
                      <div>
                        <label className={`block mb-3 text-sm font-medium items-center ${textPrimary}`}>
                          <FaKey className="inline mr-2 text-sm" />
                          {t("codigoAtivacao")}
                        </label>
                        <div className="relative">
                          <input
                            id="codigo"
                            type="text"
                            value={codigo}
                            onChange={(e) => setCodigo(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all duration-300 ${bgInput} ${textPrimary} placeholder-${modoDark ? "gray-400" : "slate-500"} pr-10`}
                            style={{
                              border: `1px solid ${temaAtual.borda}`,
                            }}
                            placeholder={t("codigoAtivacaoPlaceholder")}
                            required
                            disabled={loading}
                            onFocus={(e) => {
                              e.target.style.borderColor = temaAtual.primario;
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = temaAtual.borda;
                            }}
                          />
                          <FaKey className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${textMuted}`} />
                        </div>
                        <p className={`mt-2 text-xs ${textMuted}`}>
                          {t("codigoAtivacaoAjuda")}
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-3 md:py-2 rounded-xl font-semibold transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm md:text-base"
                        style={{
                          background: loading
                            ? (modoDark ? "#4B5563" : "#9CA3AF")
                            : modoDark ? "linear-gradient(135deg, #3B82F6, #0EA5E9)" : "linear-gradient(135deg, #1976D2, #0284C7)",
                          color: "#FFFFFF",
                        }}
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            {t("ativando")}
                          </>
                        ) : (
                          <>
                            <FaShield className="text-sm" />
                            {t("ativarEmpresa")}
                          </>
                        )}
                      </button>
                    </form>
                    <div className="mt-6 pt-6 border-t" style={{ borderColor: temaAtual.borda }}>
                      <p className={`text-sm text-center mb-3 ${textMuted}`}>
                        {t("naoEfetuouPagamento")}
                      </p>
                      <Link
                        href="https://wa.me/+5553981118789"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 cursor-pointer hover:scale-105 ${bgInput} ${textPrimary} text-xs md:text-sm`}
                        style={{
                          border: `1px solid ${temaAtual.borda}`,
                        }}
                      >
                        <FaShoppingCart className={modoDark ? "text-green-400" : "text-green-500"} />
                        <span className="font-medium">{t("cliqueAqui")}</span>
                        <span className="hidden sm:inline">{t("paraComprarAtivacao")}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className={`rounded-2xl border ${borderColor} ${bgCard} backdrop-blur-sm overflow-hidden`}>
                  <div className="p-4 border-b" style={{ borderColor: temaAtual.borda }}>
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: temaAtual.texto }}>
                      <FaCheckCircle className={modoDark ? "text-green-400" : "text-green-500"} />
                      {t("vantagensAtivacao")}
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className={`p-3 rounded-lg ${modoDark ? "bg-blue-500/10" : "bg-blue-50"} border ${modoDark ? "border-blue-500/20" : "border-blue-200"}`}>
                        <h3 className={`font-bold text-sm ${textPrimary} mb-1`}>{t("vantagem1.titulo")}</h3>
                        <p className={`text-xs ${textMuted}`}>{t("vantagem1.mensagem")}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${modoDark ? "bg-green-500/10" : "bg-green-50"} border ${modoDark ? "border-green-500/20" : "border-green-200"}`}>
                        <h3 className={`font-bold text-sm ${textPrimary} mb-1`}>{t("vantagem2.titulo")}</h3>
                        <p className={`text-xs ${textMuted}`}>{t("vantagem2.mensagem")}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${modoDark ? "bg-purple-500/10" : "bg-purple-50"} border ${modoDark ? "border-purple-500/20" : "border-purple-200"}`}>
                        <h3 className={`font-bold text-sm ${textPrimary} mb-1`}>{t("vantagem3.titulo")}</h3>
                        <p className={`text-xs ${textMuted}`}>{t("vantagem3.mensagem")}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className={`rounded-2xl border ${borderColor} ${bgCard} backdrop-blur-sm overflow-hidden`}>
                  <div className="p-4 border-b" style={{ borderColor: temaAtual.borda }}>
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: temaAtual.texto }}>
                      <FaShoppingCart className={modoDark ? "text-orange-400" : "text-orange-500"} />
                      {t("suporteTitulo")}
                    </h2>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <div className={`p-3 rounded-lg ${modoDark ? "bg-orange-500/10" : "bg-orange-50"} border ${modoDark ? "border-orange-500/20" : "border-orange-200"}`}>
                        <h3 className={`font-bold text-sm ${textPrimary} mb-1`}>{t("suporte1.titulo")}</h3>
                        <p className={`text-xs ${textMuted}`}>{t("suporte1.mensagem")}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${modoDark ? "bg-cyan-500/10" : "bg-cyan-50"} border ${modoDark ? "border-cyan-500/20" : "border-cyan-200"}`}>
                        <h3 className={`font-bold text-sm ${textPrimary} mb-1`}>{t("suporte2.titulo")}</h3>
                        <p className={`text-xs ${textMuted}`}>{t("suporte2.mensagem")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}