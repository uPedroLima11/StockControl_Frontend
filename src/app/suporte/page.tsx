"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaPaperPlane, FaCheckCircle, FaExclamationTriangle, FaHeadset, FaClock, FaEnvelope, FaPhone } from "react-icons/fa";
import { cores } from "@/utils/cores";
import Cookies from "js-cookie";

export default function Suporte() {
  const [modoDark, setModoDark] = useState(false);
  const { t } = useTranslation("suporte");
  const [carregando, setCarregando] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [tentativas, setTentativas] = useState(0);
  const temaAtual = modoDark ? cores.dark : cores.light;

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
  }, []);

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

      html::-webkit-scrollbar {
        width: 10px;
      }
      
      html::-webkit-scrollbar-track {
        background: ${modoDark ? "#132F4C" : "#F8FAFC"};
      }
      
      html::-webkit-scrollbar-thumb {
        background: ${modoDark ? "#132F4C" : "#90CAF9"}; 
        border-radius: 5px;
        border: 2px solid ${modoDark ? "#132F4C" : "#F8FAFC"};
      }
      
      html::-webkit-scrollbar-thumb:hover {
        background: ${modoDark ? "#132F4C" : "#64B5F6"}; 
      }
      
      html {
        scrollbar-width: thin;
        scrollbar-color: ${modoDark ? "#132F4C" : "#90CAF9"} ${modoDark ? "#0A1830" : "#F8FAFC"};
      }
      
      @media (max-width: 768px) {
        html::-webkit-scrollbar {
          width: 6px;
        }
        
        html::-webkit-scrollbar-thumb {
          border: 1px solid ${modoDark ? "#132F4C" : "#F8FAFC"};
          border-radius: 3px;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [modoDark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tentativas >= 3) {
      setErro(t("muitas_tentativas"));
      setTimeout(() => setErro(""), 5000);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_API || "http://localhost:3001"}/suporte`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          mensagem: mensagem.trim(),
        }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Resposta inválida do servidor");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro ${response.status}`);
      }

      if (data.success) {
        setEnviado(true);
        setNome("");
        setEmail("");
        setMensagem("");
        setTentativas(0);

        setTimeout(() => {
          setEnviado(false);
        }, 5000);
      } else {
        throw new Error(data.message || t("erro_enviar_mensagem"));
      }
    } catch (error: unknown) {
      console.error("Erro:", error);
      let errorMessage = t("erro_enviar_mensagem");
      if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message: unknown }).message === "string") {
        errorMessage = (error as { message: string }).message.includes("JSON") ? t("erro_conexao_servidor") : (error as { message: string }).message || errorMessage;
      }

      setErro(errorMessage);
      setTentativas((prev) => prev + 1);

      setTimeout(() => {
        setErro("");
      }, 5000);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTentativas(0);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const bgGradient = modoDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-slate-200 via-blue-50 to-slate-200";
  const textPrimary = modoDark ? "text-white" : "text-slate-900";
  const textSecondary = modoDark ? "text-gray-300" : "text-slate-600";
  const textMuted = modoDark ? "text-gray-400" : "text-slate-500";
  const bgCard = modoDark ? "bg-slate-800/50" : "bg-white/80";
  const borderColor = modoDark ? "border-blue-500/30" : "border-blue-200";

  return (
    <div className={`min-h-screen ${bgGradient} pb-8`}>
      <div className="px-4 sm:px-6 py-8 w-full max-w-4xl mx-auto">
        <section className={`relative py-8 rounded-3xl mb-8 overflow-hidden ${bgCard} backdrop-blur-sm border ${borderColor}`}>
          <div className="absolute inset-0">
            <div className={`absolute top-0 left-10 w-32 h-32 ${modoDark ? "bg-blue-500/20" : "bg-blue-200/50"} rounded-full blur-3xl animate-float`}></div>
            <div className={`absolute bottom-0 right-10 w-48 h-48 ${modoDark ? "bg-slate-700/20" : "bg-slate-300/50"} rounded-full blur-3xl animate-float`} style={{ animationDelay: "2s" }}></div>
            <div className={`absolute top-1/2 left-1/2 w-24 h-24 ${modoDark ? "bg-cyan-500/20" : "bg-cyan-200/50"} rounded-full blur-3xl animate-float`} style={{ animationDelay: "4s" }}></div>
          </div>

          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-4">
              <div className={`p-4 rounded-2xl ${modoDark ? "bg-blue-500/20" : "bg-blue-100"} border ${borderColor}`}>
                <FaHeadset className={`text-3xl ${modoDark ? "text-blue-400" : "text-blue-500"}`} />
              </div>
            </div>
            <h1 className={`text-3xl md:text-4xl font-bold ${textPrimary} mb-3`}>
              {t("contato_suporte")} <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">StockControl</span>
            </h1>
            <p className={`text-lg ${textSecondary} max-w-2xl mx-auto`}>
              {t("suporte_descricao")}
            </p>
          </div>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="gradient-border animate-fade-in-up">
              <div className={`p-6 rounded-[15px] ${bgCard} backdrop-blur-sm card-hover`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg ${modoDark ? "bg-blue-500/20" : "bg-blue-100"}`}>
                    <FaPaperPlane className={`text-xl ${modoDark ? "text-blue-400" : "text-blue-500"}`} />
                  </div>
                  <h2 className={`text-xl font-bold ${textPrimary}`}>{t("enviar_mensagem")}</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={`block mb-2 text-sm font-medium ${textPrimary}`}>
                        {t("nome")} *
                      </label>
                      <input
                        type="text"
                        placeholder={t("nome")}
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                        minLength={2}
                        maxLength={100}
                        className={`w-full px-4 py-3 rounded-xl border text-sm md:text-base outline-none transition-all duration-300 ${bgCard} ${textPrimary} placeholder-gray-400`}
                        style={{
                          border: `1px solid ${temaAtual.borda}`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = temaAtual.primario;
                          e.target.style.boxShadow = `0 0 0 3px ${temaAtual.primario}20`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = temaAtual.borda;
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>

                    <div>
                      <label className={`block mb-2 text-sm font-medium ${textPrimary}`}>
                        {t("email")} *
                      </label>
                      <input
                        type="email"
                        placeholder={t("email")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                        className={`w-full px-4 py-3 rounded-xl border text-sm md:text-base outline-none transition-all duration-300 ${bgCard} ${textPrimary} placeholder-gray-400`}
                        style={{
                          border: `1px solid ${temaAtual.borda}`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = temaAtual.primario;
                          e.target.style.boxShadow = `0 0 0 3px ${temaAtual.primario}20`;
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = temaAtual.borda;
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block mb-2 text-sm font-medium ${textPrimary}`}>
                      {t("mensagem")} *
                    </label>
                    <textarea
                      placeholder={t("mensagem")}
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      required
                      minLength={10}
                      maxLength={1000}
                      rows={6}
                      className={`w-full px-4 py-3 rounded-xl border text-sm md:text-base outline-none resize-none transition-all duration-300 ${bgCard} ${textPrimary} placeholder-gray-400`}
                      style={{
                        border: `1px solid ${temaAtual.borda}`,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = temaAtual.primario;
                        e.target.style.boxShadow = `0 0 0 3px ${temaAtual.primario}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = temaAtual.borda;
                        e.target.style.boxShadow = "none";
                      }}
                    ></textarea>
                    <div className={`text-right text-xs mt-2 ${textMuted}`}>
                      {mensagem.length}/1000
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={carregando || tentativas >= 3}
                    className="w-full cursor-pointer flex items-center justify-center gap-3 py-4 rounded-xl font-semibold text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed glow-effect card-hover"
                    style={{
                      background: modoDark ? "linear-gradient(135deg, #1976D2 0%, #00B4D8 100%)" : "linear-gradient(135deg, #1976D2 0%, #0284C7 100%)",
                      color: "#FFFFFF",
                    }}
                  >
                    {carregando ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        {t("processando")}
                      </div>
                    ) : tentativas >= 3 ? (
                      t("aguarde_um_minuto")
                    ) : (
                      <>
                        <FaPaperPlane className="text-sm" />
                        {t("enviar_mensagem")}
                      </>
                    )}
                  </button>

                  {enviado && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl mt-4 animate-fade-in-up`}
                      style={{
                        backgroundColor: "#10B98120",
                        border: "1px solid #10B981",
                      }}
                    >
                      <FaCheckCircle className="text-green-500 flex-shrink-0 text-xl" />
                      <div>
                        <p className={`font-medium ${textPrimary}`}>
                          {t("mensagemEnviada")}
                        </p>
                        <p className={`text-sm ${textSecondary}`}>
                          {t("equipe_entrara_contato")}
                        </p>
                      </div>
                    </div>
                  )}
                  {erro && (
                    <div className={`flex items-center gap-3 p-4 rounded-xl mt-4 animate-fade-in-up`}
                      style={{
                        backgroundColor: "#EF444420",
                        border: "1px solid #EF4444",
                      }}
                    >
                      <FaExclamationTriangle className="text-red-500 flex-shrink-0 text-xl" />
                      <div>
                        <p className={`font-medium ${textPrimary}`}>
                          {t("erro_no_envio")}
                        </p>
                        <p className={`text-sm ${textSecondary}`}>
                          {erro}
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="gradient-border animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className={`p-6 rounded-[15px] ${bgCard} backdrop-blur-sm card-hover`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${modoDark ? "bg-green-500/20" : "bg-green-100"}`}>
                    <FaEnvelope className={`text-xl ${modoDark ? "text-green-400" : "text-green-500"}`} />
                  </div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>{t("email")}</h3>
                </div>
                <p className={`text-sm ${textSecondary}`}>stockcontroldev@gmail.com</p>
                <p className={`text-xs ${textMuted} mt-2`}>{t("resposta_24h")}</p>
              </div>
            </div>

            <div className="gradient-border animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <div className={`p-6 rounded-[15px] ${bgCard} backdrop-blur-sm card-hover`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${modoDark ? "bg-blue-500/20" : "bg-blue-100"}`}>
                    <FaPhone className={`text-xl ${modoDark ? "text-blue-400" : "text-blue-500"}`} />
                  </div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>{t("telefone")}</h3>
                </div>
                <p className={`text-sm ${textSecondary}`}>(53) 98111-8789</p>
                <p className={`text-xs ${textMuted} mt-2`}>{t("atendimento_direto")}</p>
              </div>
            </div>

            <div className="gradient-border animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <div className={`p-6 rounded-[15px] ${bgCard} backdrop-blur-sm card-hover`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${modoDark ? "bg-purple-500/20" : "bg-purple-100"}`}>
                    <FaClock className={`text-xl ${modoDark ? "text-purple-400" : "text-purple-500"}`} />
                  </div>
                  <h3 className={`text-lg font-bold ${textPrimary}`}>{t("horario")}</h3>
                </div>
                <p className={`text-sm ${textSecondary}`}>{t("segunda_sexta")}</p>
                <p className={`text-sm ${textSecondary}`}>{t("horario_comercial")}</p>
                <p className={`text-xs ${textMuted} mt-2`}>{t("horario_atendimento")}</p>
              </div>
            </div>
          </div>
        </div>      
        </div>
      </div>
  );
}