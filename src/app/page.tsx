"use client";
import Image from "next/image";
import Link from "next/link";
import { Link as ScrollLink } from 'react-scroll';
import { useEffect, useState, useRef } from "react";
import { FaCloud, FaLock, FaUserShield, FaWhatsapp, FaArrowRight, FaCheck, FaPlay, FaPause, FaTimes, FaTruck } from "react-icons/fa";
import { MdOutlineLibraryBooks, MdInventory } from "react-icons/md";
import { HiOutlineChartBar, HiOutlineTrendingUp } from "react-icons/hi";
import { BiPackage, BiUserCheck } from "react-icons/bi";
import { Poppins } from "next/font/google";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export default function Home() {
  const [visivel, setVisivel] = useState(false);
  const [estatisticas, setEstatisticas] = useState({
    clientes: 0,
    produtos: 0,
    transacoes: 0,
    eficiencia: 0
  });
  const [recursoAtivo, setRecursoAtivo] = useState(0);
  const [videoExecutando, setVideoExecutando] = useState(true);
  const [mostrarIdiomas, setMostrarIdiomas] = useState(false);
  const referenciaVideo = useRef<HTMLVideoElement>(null);
  const { t } = useTranslation("landing");

  const recursos = [
    {
      icone: <MdInventory className="text-3xl" />,
      titulo: t("recursos.gestao.titulo"),
      descricao: t("recursos.gestao.descricao"),
      cor: "from-blue-500 to-cyan-500"
    },
    {
      icone: <HiOutlineTrendingUp className="text-3xl" />,
      titulo: t("recursos.analises.titulo"),
      descricao: t("recursos.analises.descricao"),
      cor: "from-purple-500 to-pink-500"
    },
    {
      icone: <BiUserCheck className="text-3xl" />,
      titulo: t("recursos.permissoes.titulo"),
      descricao: t("recursos.permissoes.descricao"),
      cor: "from-green-500 to-emerald-500"
    },
    {
      icone: <HiOutlineChartBar className="text-3xl" />,
      titulo: t("recursos.relatorios.titulo"),
      descricao: t("recursos.relatorios.descricao"),
      cor: "from-orange-500 to-red-500"
    },
    {
      icone: <FaTruck className="text-3xl" />,
      titulo: t("recursos.pedidos.titulo"),
      descricao: t("recursos.pedidos.descricao"),
      cor: "from-orange-500 to-red-500"
    }
  ];

  const funcionalidades = [
    {
      icone: <MdOutlineLibraryBooks />,
      titulo: t("funcionalidades.registro_completo"),
      descricao: t("funcionalidades.registro_completo_desc")
    },
    {
      icone: <FaCloud />,
      titulo: t("funcionalidades.acesso_nuvem"),
      descricao: t("funcionalidades.acesso_nuvem_desc")
    },
    {
      icone: <BiPackage />,
      titulo: t("funcionalidades.gestao_produtos"),
      descricao: t("funcionalidades.gestao_produtos_desc")
    },
    {
      icone: <HiOutlineChartBar />,
      titulo: t("funcionalidades.exportacao_dados"),
      descricao: t("funcionalidades.exportacao_dados_desc")
    },
    {
      icone: <FaLock />,
      titulo: t("funcionalidades.seguranca_maxima"),
      descricao: t("funcionalidades.seguranca_maxima_desc")
    },
    {
      icone: <FaUserShield />,
      titulo: t("funcionalidades.controle_acesso"),
      descricao: t("funcionalidades.controle_acesso_desc")
    }
  ];

  const mudarIdioma = (lng: string) => {
    i18n.changeLanguage(lng);
    setMostrarIdiomas(false);
  };



  useEffect(() => {
    const estilo = document.createElement("style");
    estilo.textContent = `
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
        50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.8); }
      }
      
      .animate-float {
        animation: float 6s ease-in-out infinite;
      }
      
      .animate-glow {
        animation: glow 3s ease-in-out infinite;
      }
      
      html::-webkit-scrollbar {
        width: 10px;
      }
      
      html::-webkit-scrollbar-track {
        background: #0A1929;
      }
      
      html::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #1976D2, #00B4D8);
        border-radius: 5px;
      }
      
      html::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #1565C0, #0096C7);
      }
    `;
    document.head.appendChild(estilo);

    setVisivel(true);

    const animarNumeros = () => {
      const duracao = 2000;
      const passos = 60;
      const duracaoPasso = duracao / passos;

      const estatisticasAlvo = {
        clientes: 250,
        produtos: 10000,
        transacoes: 50000,
        eficiencia: 98
      };

      Object.keys(estatisticasAlvo).forEach(chave => {
        let atual = 0;
        const alvo = estatisticasAlvo[chave as keyof typeof estatisticasAlvo];
        const incremento = alvo / passos;

        const temporizador = setInterval(() => {
          atual += incremento;
          if (atual >= alvo) {
            atual = alvo;
            clearInterval(temporizador);
          }
          setEstatisticas(prev => ({
            ...prev,
            [chave]: Math.floor(atual)
          }));
        }, duracaoPasso);
      });
    };

    setTimeout(animarNumeros, 1000);

    const intervaloRecurso = setInterval(() => {
      if (videoExecutando) {
        setRecursoAtivo(prev => (prev + 1) % recursos.length);
      }
    }, 4000);

    return () => {
      clearInterval(intervaloRecurso);
      document.head.removeChild(estilo);
    };
  }, [videoExecutando]);

  const alternarVideo = () => {
    if (referenciaVideo.current) {
      if (videoExecutando) {
        referenciaVideo.current.pause();
      } else {
        referenciaVideo.current.play();
      }
      setVideoExecutando(!videoExecutando);
    }
  };

  const propsScroll = {
    spy: true,
    smooth: true,
    offset: -80,
    duration: 800
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#0A1929] via-[#0F1E35] to-[#132F4C] ${poppins.className}`}>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1929] via-transparent to-[#0A1929] z-10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-20 text-center px-4 max-w-6xl mx-auto mt-24 sm:mt-0">
          <div className={`transition-all duration-1000 transform ${visivel ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6">
              {t("hero.titulo")}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> {t("hero.destaque")}</span>
              <br />
              {t("hero.subtitulo")}
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto px-2 sm:px-0">
              {t("hero.descricao")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/registro"
                className="group bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/25 flex items-center gap-3 relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                <span className="relative z-10">{t("hero.comecar_agora")}</span>
                <FaArrowRight className="group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>

              <ScrollLink
                to="pricing"
                {...propsScroll}
                className="border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/10 font-semibold text-lg px-8 py-4 rounded-2xl transition-all duration-300 hover:border-blue-400 group relative overflow-hidden cursor-pointer"
              >
                <span className="relative z-10">{t("hero.ver_planos")}</span>
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-y-[-2px] transition-all duration-500 animate-bounce">
                  ↓
                </span>
              </ScrollLink>
            </div>
          </div>

          <div className={`grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 transition-all duration-1000 delay-500 ${visivel ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {[
              { valor: estatisticas.clientes, label: t("estatisticas.clientes_ativos"), sufixo: '+' },
              { valor: estatisticas.produtos, label: t("estatisticas.produtos_gerenciados"), sufixo: '+' },
              { valor: estatisticas.transacoes, label: t("estatisticas.transacoes_mes"), sufixo: '+' },
              { valor: estatisticas.eficiencia, label: t("estatisticas.eficiencia"), sufixo: '%' }
            ].map((estatistica, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {estatistica.valor}{estatistica.sufixo}
                </div>
                <div className="text-blue-300 text-sm">{estatistica.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-blue-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-blue-400 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t("secao_recursos.titulo")}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> {t("secao_recursos.destaque")}</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {t("secao_recursos.descricao")}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl p-8 border border-blue-500/20">
                <div className={`transition-all duration-500 transform ${visivel ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}`}>
                  <div className={`text-4xl mb-4 bg-gradient-to-r ${recursos[recursoAtivo].cor} bg-clip-text text-transparent`}>
                    {recursos[recursoAtivo].icone}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {recursos[recursoAtivo].titulo}
                  </h3>
                  <p className="text-gray-300 text-lg mb-6">
                    {recursos[recursoAtivo].descricao}
                  </p>
                  <ul className="space-y-3">
                    {(Array.isArray(t("recursos.beneficios", { returnObjects: true }))
                      ? (t("recursos.beneficios", { returnObjects: true }) as string[])
                      : []
                    ).map((item: string, index: number) => (
                      <li key={index} className="flex items-center text-gray-300">
                        <FaCheck className="text-green-400 mr-3 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex justify-center mt-8 space-x-3">
                {recursos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setRecursoAtivo(index);
                      setVideoExecutando(false);
                      setTimeout(() => setVideoExecutando(true), 5000);
                    }}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${recursoAtivo === index
                      ? 'bg-blue-500 w-8'
                      : 'bg-blue-500/30 hover:bg-blue-500/50'
                      }`}
                  />
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900/50 to-blue-900/30 rounded-2xl overflow-hidden border border-blue-500/20">
                <div className="relative aspect-video">
                  <video
                    ref={referenciaVideo}
                    className="w-full h-full object-cover"
                    poster="/dashboard-preview.png"
                    muted
                    loop
                    autoPlay
                    playsInline
                    preload="metadata"
                  >
                    <source src="/dashboard_preview.mp4" type="video/mp4" />
                  </video>
                  <button
                    onClick={alternarVideo}
                    className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                  >
                    {videoExecutando ? <FaPause /> : <FaPlay />}
                  </button>
                </div>
                <div className="p-6">
                  <h4 className="text-white font-semibold mb-2">{t("recursos.dashboard.titulo")}</h4>
                  <p className="text-gray-400 text-sm">
                    {t("recursos.dashboard.descricao")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {funcionalidades.map((funcionalidade, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-blue-500/5 to-cyan-500/5 hover:from-blue-500/10 hover:to-cyan-500/10 p-6 rounded-2xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                <div className="text-blue-400 text-2xl mb-4">
                  {funcionalidade.icone}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{funcionalidade.titulo}</h3>
                <p className="text-gray-400">{funcionalidade.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-b from-[#132F4C] to-[#0A1929]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              {t("comparacao.titulo")}
              <span className="text-red-400"> {t("comparacao.caos")} </span>
              {t("comparacao.para")}
              <span className="text-green-400"> {t("comparacao.controle")}</span>
            </h2>
            <p className="text-xl text-gray-300">
              {t("comparacao.descricao")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center group">
              <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-2xl p-8 border border-red-500/20 h-full transition-all duration-500 group-hover:scale-105">
                <div className="text-5xl mb-6">😵</div>
                <h3 className="font-bold text-2xl mb-6 text-red-400">{t("comparacao.antes.titulo")}</h3>
                <ul className="space-y-4 text-gray-300 text-left">
                  {(Array.isArray(t("comparacao.antes.itens", { returnObjects: true }))
                    ? (t("comparacao.antes.itens", { returnObjects: true }) as string[])
                    : []
                  ).map((item: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <FaTimes className="text-red-400 mr-4 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center group">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-8 border border-green-500/20 h-full transition-all duration-500 group-hover:scale-105">
                <div className="text-5xl mb-6">😎</div>
                <h3 className="font-bold text-2xl mb-6 text-green-400">{t("comparacao.depois.titulo")}</h3>
                <ul className="space-y-4 text-gray-300 text-left">
                  {(Array.isArray(t("comparacao.depois.itens", { returnObjects: true }))
                    ? (t("comparacao.depois.itens", { returnObjects: true }) as string[])
                    : []
                  ).map((item: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <FaCheck className="text-green-400 mr-4 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl p-8 border border-blue-500/30">
              <h3 className="text-2xl font-bold text-white mb-6">
                {t("comparacao.mais_funcionalidades.titulo")}
              </h3>
              <div className="grid md:grid-cols-3 gap-6 text-gray-300">
                {(Array.isArray(t("comparacao.mais_funcionalidades.itens", { returnObjects: true }))
                  ? (t("comparacao.mais_funcionalidades.itens", { returnObjects: true }) as string[])
                  : []
                ).map((item: string, index: number) => (
                  <div key={index} className="flex items-center justify-center gap-3">
                    <BiPackage className="text-blue-400 text-xl" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              {t("criadores.titulo")}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> {t("criadores.destaque")}</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              {t("criadores.descricao")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="group text-center">
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-500 group-hover:scale-105">
                <div className="relative inline-block mb-6">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <Image
                    src="/linkedinphoto.png"
                    alt="Pedro Lima"
                    width={160}
                    height={160}
                    quality={100}
                    className="relative w-40 h-40 object-cover rounded-full mx-auto border-4 border-blue-500/50"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t("criadores.pedro_lima.nome")}</h3>
                <p className="text-blue-400 mb-4">{t("criadores.pedro_lima.cargo")}</p>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {t("criadores.pedro_lima.descricao")}
                </p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="https://www.linkedin.com/in/upedrolima/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com/uPedroLima11"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            <div className="group text-center">
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-3xl p-8 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-500 group-hover:scale-105">
                <div className="relative inline-block mb-6">
                  <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                  <Image
                    src="/pedrosiqueira.jpg"
                    alt="Pedro Siqueira"
                    width={160}
                    quality={100}
                    height={160}
                    className="relative w-40 h-40 object-cover rounded-full mx-auto border-4 border-cyan-500/50"
                  />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t("criadores.pedro_siqueira.nome")}</h3>
                <p className="text-cyan-400 mb-4">{t("criadores.pedro_siqueira.cargo")}</p>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {t("criadores.pedro_siqueira.descricao")}
                </p>
                <div className="flex justify-center space-x-4">
                  <a
                    href="https://www.linkedin.com/in/phasiqueira/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com/PedroHSiqueira"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full transition-all duration-300 transform hover:scale-110"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl p-8 border border-blue-500/30">
              <h3 className="text-2xl font-bold text-white mb-4">{t("criadores.equipe.titulo")}</h3>
              <p className="text-gray-300 max-w-2xl mx-auto mb-6">
                {t("criadores.equipe.descricao")}
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-gray-400">
                {(Array.isArray(t("criadores.equipe.estatisticas", { returnObjects: true }))
                  ? (t("criadores.equipe.estatisticas", { returnObjects: true }) as string[])
                  : []
                ).map((stat: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <FaCheck className="text-green-400" />
                    <span>{stat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4 bg-gradient-to-b from-[#0A1929] to-[#132F4C]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              {t("precos.titulo")}
            </h2>
            <p className="text-xl text-gray-300">
              {t("precos.descricao")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-3xl p-8 border border-blue-500/20 h-full flex flex-col">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-bold mb-4">
                    {t("precos.teste_gratis.emblema")}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t("precos.teste_gratis.titulo")}
                  </h3>
                  <div className="text-4xl font-bold text-white mb-1">
                    {t("precos.teste_gratis.preco")}
                    <span className="text-lg"> {t("precos.teste_gratis.periodo")}</span>
                  </div>
                  <p className="text-gray-400">
                    {t("precos.teste_gratis.descricao")}
                  </p>
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {(Array.isArray(t("precos.teste_gratis.funcionalidades", { returnObjects: true }))
                    ? (t("precos.teste_gratis.funcionalidades", { returnObjects: true }) as string[])
                    : []
                  ).map((funcionalidade: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <FaCheck className="text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">{funcionalidade}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="https://wa.me/+5553981118789"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 text-center block"
                >
                  {t("precos.teste_gratis.botao")}
                </a>

                <div className="text-center mt-4">
                  <p className="text-blue-300 text-sm">
                    {t("precos.teste_gratis.nota")}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-3xl p-8 border-2 border-blue-400 shadow-2xl shadow-blue-500/25 h-full flex flex-col">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-6 py-2 rounded-full text-sm font-bold">
                  {t("precos.plano_completo.emblema")}
                </div>

                <div className="text-center mb-8 mt-4">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {t("precos.plano_completo.titulo")}
                  </h3>
                  <div className="text-4xl font-bold text-white mb-1">
                    {t("precos.plano_completo.preco")}
                    <span className="text-lg"> {t("precos.plano_completo.periodo")}</span>
                  </div>
                  <p className="text-blue-100">
                    {t("precos.plano_completo.descricao")}
                  </p>
                </div>

                <ul className="space-y-4 mb-8 flex-grow">
                  {(Array.isArray(t("precos.plano_completo.funcionalidades", { returnObjects: true }))
                    ? (t("precos.plano_completo.funcionalidades", { returnObjects: true }) as string[])
                    : []
                  ).map((funcionalidade: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <FaCheck className="text-white mr-3 flex-shrink-0" />
                      <span className="text-white">{funcionalidade}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/registro"
                  className="w-full bg-white text-blue-600 hover:bg-gray-100 font-bold py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 text-center block"
                >
                  {t("precos.plano_completo.botao")}
                </Link>

                <div className="text-center mt-4">
                  <p className="text-blue-100 text-sm">
                    {t("precos.plano_completo.nota")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-400 max-w-2xl mx-auto">
              {t("precos.nota_rodape")}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t("contato.titulo")}
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            {t("contato.descricao")}
          </p>

          <a
            href="https://wa.me/+5553981118789"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-green-500/25"
          >
            <FaWhatsapp size={24} />
            {t("contato.botao")}
          </a>
        </div>
      </section>

      <footer className="bg-[#0A1929] border-t border-blue-500/20 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center mb-4">
                <Image src="/icone.png" alt="Logo StockControl" width={40} height={40} className="mr-3 filter brightness-0 invert" />
                <span className="text-white text-xl font-bold">StockControl</span>
              </div>
              <p className="text-gray-400">
                {t("rodape.descricao")}
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">{t("rodape.produto")}</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <ScrollLink
                    to="features"
                    {...propsScroll}
                    className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                  >
                    {t("rodape.recursos")}
                  </ScrollLink>
                </li>
                <li>
                  <ScrollLink
                    to="pricing"
                    {...propsScroll}
                    className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                  >
                    {t("rodape.planos")}
                  </ScrollLink>
                </li>
                <li><Link href="/demo" className="hover:text-blue-400 transition-colors">{t("rodape.demonstracao")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">{t("rodape.suporte")}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://wa.me/5553981118789" className="hover:text-blue-400 transition-colors">{t("rodape.contato")}</a></li>
                <li><Link href="/ajuda" className="hover:text-blue-400 transition-colors">{t("rodape.central_ajuda")}</Link></li>
                <li><Link href="/documentacao" className="hover:text-blue-400 transition-colors">{t("rodape.documentacao")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">{t("rodape.legal")}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/politica-privacidade" className="hover:text-blue-400 transition-colors">{t("rodape.privacidade")}</Link></li>
                <li><Link href="/termos-uso" className="hover:text-blue-400 transition-colors">{t("rodape.termos")}</Link></li>
                <li><Link href="/cookies" className="hover:text-blue-400 transition-colors">{t("rodape.cookies")}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-500/20 pt-8 text-center">
            <p className="text-gray-400">
              {t("rodape.copyright")}{" "}
              <a href="https://www.linkedin.com/in/upedrolima/" className="text-blue-400 hover:text-blue-300">
                {t("rodape.pedro_lima")}
              </a>{" "}
              {t("rodape.e")}{" "}
              <a href="https://www.linkedin.com/in/phasiqueira/" className="text-blue-400 hover:text-blue-300">
                {t("rodape.pedro_siqueira")}
              </a>
            </p>
          </div>
        </div>
      </footer>
      <div className="fixed bottom-4 right-4 z-50">
        <div className="relative">
          {mostrarIdiomas && (
            <div className="absolute bottom-14 right-0 bg-[#0A1929] border border-blue-500/20 rounded-2xl shadow-2xl p-2 min-w-[120px]">
              <button
                onClick={() => mudarIdioma("pt")}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-blue-500/10 transition-all duration-200 text-white"
              >
                <Image src="/brasil.png" alt="Português" width={24} height={18} className="rounded" />
                <span className="text-sm font-medium">Português</span>
              </button>
              <button
                onClick={() => mudarIdioma("en")}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-blue-500/10 transition-all duration-200 text-white"
              >
                <Image src="/ingles.png" alt="English" width={24} height={18} className="rounded" />
                <span className="text-sm font-medium">English</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}