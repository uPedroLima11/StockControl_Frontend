'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  FaArrowLeft,
  FaUpload,
  FaCheck,
  FaExclamationTriangle,
  FaQuestionCircle,
  FaMagic,
  FaDownload,
  FaFileExcel,
  FaFileCsv,
  FaInfoCircle,
  FaEye,
  FaEyeSlash,
  FaChevronDown,
  FaChevronUp,
  FaSearch
} from 'react-icons/fa';
import { ConversorPlanilha, COLUNAS_TEMPLATE } from '@/../lib/conversorPlanilha';
import Swal from 'sweetalert2';

export default function ConversorPage() {
  const router = useRouter();
  const { t } = useTranslation('conversor');
  const [etapa, setEtapa] = useState<'upload' | 'mapeamento' | 'preview' | 'concluido'>('upload');
  const [colunasOriginais, setColunasOriginais] = useState<string[]>([]);
  const [dadosOriginais, setDadosOriginais] = useState<Record<string, any>[]>([]);
  const [mapeamento, setMapeamento] = useState<Record<string, string | null>>({});
  const [dadosConvertidos, setDadosConvertidos] = useState<Record<string, any>[]>([]);
  const [estatisticas, setEstatisticas] = useState<any>(null);
  const [arquivoNome, setArquivoNome] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setMostrarInfo] = useState<string | null>(null);
  const [modoDark, setModoDark] = useState(false);
  const [mostrarValoresOriginais, setMostrarValoresOriginais] = useState(true);
  const [buscaPreview, setBuscaPreview] = useState('');
  const [produtosExpandidos, setProdutosExpandidos] = useState<number[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const produtosPorPagina = 10;

  useEffect(() => {
    const temaSalvo = localStorage.getItem('modoDark');
    const ativado = temaSalvo === 'true';
    setModoDark(ativado);

    const handleThemeChange = (e: CustomEvent) => {
      setModoDark(e.detail.modoDark);
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange as EventListener);
    };
  }, []);

  const tema = useMemo(() => {
    if (modoDark) {
      return {
        bg: '#0F172A',
        card: '#1E293B',
        texto: '#F1F5F9',
        textSecondary: '#CBD5E1',
        border: '#334155',
        borderLight: '#475569',
        hover: '#334155',
        input: 'bg-[#334155] border-[#475569] text-[#F1F5F9]',
        buttonPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white',
        buttonSecondary: 'bg-[#334155] hover:bg-[#475569] text-[#F1F5F9] border-[#475569]',
        success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
        error: 'bg-red-500/20 text-red-400 border border-red-500/30',
        warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
        info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        cardGreen: 'bg-emerald-500/10 border-emerald-500/20',
        cardYellow: 'bg-amber-500/10 border-amber-500/20',
        cardBlue: 'bg-blue-500/10 border-blue-500/20',
        cardPurple: 'bg-purple-500/10 border-purple-500/20',
        bgInput: '#334155',
        bgCard: '#1E293B',
        textInput: '#F1F5F9',
        borderInput: '#475569'
      };
    } else {
      return {
        bg: '#F8FAFC',
        card: '#FFFFFF',
        texto: '#0F172A',
        textSecondary: '#475569',
        border: '#E2E8F0',
        borderLight: '#CBD5E1',
        hover: '#F1F5F9',
        input: 'bg-white border-[#E2E8F0] text-[#0F172A]',
        buttonPrimary: 'bg-gradient-to-r from-emerald-800 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white',
        buttonSecondary: 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A] border-[#E2E8F0]',
        success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        error: 'bg-red-100 text-red-700 border border-red-200',
        warning: 'bg-amber-100 text-amber-700 border border-amber-200',
        info: 'bg-blue-100 text-blue-700 border border-blue-200',
        cardGreen: 'bg-emerald-50 border-emerald-200',
        cardYellow: 'bg-amber-50 border-amber-200',
        cardBlue: 'bg-blue-50 border-blue-200',
        cardPurple: 'bg-purple-50 border-purple-200',
        bgInput: '#FFFFFF',
        bgCard: '#FFFFFF',
        textInput: '#0F172A',
        borderInput: '#E2E8F0'
      };
    }
  }, [modoDark]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement> | File) => {
    let file: File;

    if (event instanceof File) {
      file = event;
    } else {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      file = files[0];
    }

    const extensao = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(extensao || '')) {
      Swal.fire({
        icon: 'error',
        title: t('erros.formato_nao_suportado'),
        text: t('erros.use_formatos'),
        background: modoDark ? '#132F4C' : '#FFFFFF',
        color: modoDark ? '#FFFFFF' : '#0F172A',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: t('erros.arquivo_muito_grande'),
        text: t('erros.tamanho_maximo'),
        background: modoDark ? '#132F4C' : '#FFFFFF',
        color: modoDark ? '#FFFFFF' : '#0F172A',
      });
      return;
    }

    setIsProcessing(true);
    setArquivoNome(file.name);

    try {
      const resultado = await ConversorPlanilha.processarArquivo(file);

      const colunasFiltradas = resultado.colunasOriginais.filter(coluna => {
        const colunaLower = coluna.toLowerCase();
        return !colunaLower.includes('foto') &&
          !colunaLower.includes('imagem') &&
          !colunaLower.includes('fornecedor') &&
          !colunaLower.includes('supplier') &&
          !colunaLower.includes('categoria') &&
          !colunaLower.includes('category');
      });

      setColunasOriginais(colunasFiltradas);
      setDadosOriginais(resultado.dadosOriginais);

      const mapeamentoSugerido = ConversorPlanilha.sugerirMapeamento(colunasFiltradas);
      setMapeamento(mapeamentoSugerido);

      const { dadosConvertidos: previewData, estatisticas: previewStats } =
        ConversorPlanilha.converterDados(resultado.dadosOriginais.slice(0, 10), mapeamentoSugerido);

      setDadosConvertidos(previewData);
      setEstatisticas(previewStats);
      setEtapa('mapeamento');

    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: t('erros.erro_processar_arquivo'),
        text: error.message || t('erros.erro_desconhecido'),
        background: modoDark ? '#132F4C' : '#FFFFFF',
        color: modoDark ? '#FFFFFF' : '#0F172A',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [modoDark, t]);

  const handleMapeamentoChange = (colunaTemplate: string, colunaOriginal: string | null) => {
    const novoMapeamento = { ...mapeamento, [colunaTemplate]: colunaOriginal };
    setMapeamento(novoMapeamento);

    const { dadosConvertidos: novosDados, estatisticas: novasEstatisticas } =
      ConversorPlanilha.converterDados(dadosOriginais.slice(0, 10), novoMapeamento);

    setDadosConvertidos(novosDados);
    setEstatisticas(novasEstatisticas);
  };

  const handleAutoComplete = () => {
    const novoMapeamento = ConversorPlanilha.sugerirMapeamento(colunasOriginais);
    setMapeamento(novoMapeamento);

    const { dadosConvertidos: novosDados, estatisticas: novasEstatisticas } =
      ConversorPlanilha.converterDados(dadosOriginais.slice(0, 10), novoMapeamento);

    setDadosConvertidos(novosDados);
    setEstatisticas(novasEstatisticas);
  };

  const handleConverterTudo = () => {
    const { dadosConvertidos: todosDados, estatisticas: todasEstatisticas } =
      ConversorPlanilha.converterDados(dadosOriginais, mapeamento);

    setDadosConvertidos(todosDados);
    setEstatisticas(todasEstatisticas);
    setEtapa('preview');
    setPaginaAtual(1);
  };

  const handleBaixarTemplate = () => {
    ConversorPlanilha.baixarCSV(dadosConvertidos, `stockcontrol_convertido_${Date.now()}.csv`);
    setEtapa('concluido');
  };

  const handleVoltarInicio = () => {
    setEtapa('upload');
    setColunasOriginais([]);
    setDadosOriginais([]);
    setMapeamento({});
    setDadosConvertidos([]);
    setEstatisticas(null);
    setArquivoNome('');
    setBuscaPreview('');
    setProdutosExpandidos([]);
  };

  const handleArrasteSolte = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const toggleProdutoExpandido = (index: number) => {
    setProdutosExpandidos(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const produtosFiltrados = dadosConvertidos.filter(produto => {
    if (!buscaPreview) return true;

    const buscaLower = buscaPreview.toLowerCase();
    return (
      produto.Nome?.toLowerCase().includes(buscaLower) ||
      produto.Descricao?.toLowerCase().includes(buscaLower)
    );
  });

  const totalPaginas = Math.ceil(produtosFiltrados.length / produtosPorPagina);
  const indexUltimoProduto = paginaAtual * produtosPorPagina;
  const indexPrimeiroProduto = indexUltimoProduto - produtosPorPagina;
  const produtosPaginados = produtosFiltrados.slice(indexPrimeiroProduto, indexUltimoProduto);

  const renderEtapaUpload = () => (
    <div className="max-w-5xl mx-auto px-3 sm:px-4">
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center p-2 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 mb-3 sm:mb-4">
          <div className="text-2xl sm:text-3xl">🔄</div>
        </div>
        <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
          {t('titulo')}
        </h1>
        <p className={`text-sm sm:text-lg ${tema.textSecondary} mb-1 max-w-2xl mx-auto`}>
          {t('subtitulo')}
        </p>
        <p className={`text-xs ${tema.textSecondary} max-w-xl mx-auto`}>
          {t('seguranca')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
        <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 ${tema.card} border-2 border-dashed ${tema.border} transition-all duration-300 hover:border-emerald-500 hover:shadow-lg`}
          style={{ backgroundColor: tema.bgCard }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleArrasteSolte}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <div className="text-center cursor-pointer">
            <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl ${modoDark ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' : 'bg-gradient-to-br from-emerald-100 to-teal-100'} flex items-center justify-center`}>
              <FaUpload className={`text-xl sm:text-2xl ${modoDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
            </div>
            <h3 className={`text-lg sm:text-xl font-bold mb-1.5 sm:mb-2 ${tema.texto}`}>
              {t('upload.comece_aqui')}
            </h3>
            <p className={`text-xs sm:text-sm mb-3 sm:mb-4 ${tema.textSecondary}`}>
              {t('upload.arraste_clique')}
            </p>
            <div className={`px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl inline-block ${tema.buttonPrimary} font-semibold text-xs sm:text-sm transition-transform hover:scale-105`}>
              {t('upload.selecionar_arquivo')}
            </div>
            <input
              id="fileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-700/30">
              <p className={`font-semibold mb-1.5 text-xs sm:text-sm ${tema.texto}`}>{t('upload.formatos')}</p>
              <div className="flex justify-center gap-2 sm:gap-3">
                <div className={`px-2 py-1 rounded ${modoDark ? 'bg-slate-700/50' : 'bg-slate-100'} text-xs`}>
                  <FaFileCsv className={`inline mr-1 ${modoDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>CSV</span>
                </div>
                <div className={`px-2 py-1 rounded ${modoDark ? 'bg-slate-700/50' : 'bg-slate-100'} text-xs`}>
                  <FaFileExcel className={`inline mr-1 ${modoDark ? 'text-green-400' : 'text-green-600'}`} />
                  <span>Excel</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 ${tema.card} border ${tema.border}`}
          style={{ backgroundColor: tema.bgCard }}>
          <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${tema.texto}`}>
            <div className={`p-1.5 rounded-lg ${modoDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <FaInfoCircle className={`text-sm ${modoDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
            </div>
            {t('upload.como_funciona')}
          </h3>

          <div className="space-y-3">
            {[
              { icone: '📤', titulo: t('upload.passo1_titulo'), descricao: t('upload.passo1_desc') },
              { icone: '🎯', titulo: t('upload.passo2_titulo'), descricao: t('upload.passo2_desc') },
              { icone: '✏️', titulo: t('upload.passo3_titulo'), descricao: t('upload.passo3_desc') },
              { icone: '💾', titulo: t('upload.passo4_titulo'), descricao: t('upload.passo4_desc') }
            ].map((passo, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg ${modoDark ? 'bg-emerald-500/20' : 'bg-emerald-100'} flex items-center justify-center`}>
                  <span className="text-xs">{passo.icone}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm mb-0.5 ${tema.texto} truncate`}>{passo.titulo}</h4>
                  <p className={`text-xs ${tema.textSecondary}`}>{passo.descricao}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`mt-4 sm:mt-6 p-2.5 sm:p-3 rounded-lg border ${tema.border}`}>
            <div className="flex items-center gap-2">
              <FaCheck className={`text-xs ${modoDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-xs ${tema.texto} truncate`}>{t('upload.formatos_suportados')}</p>
                <p className={`text-xs ${tema.textSecondary} truncate`}>{t('upload.exemplos_formatos')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-6 sm:mt-8 rounded-xl sm:rounded-2xl p-4 sm:p-6 ${tema.card} border ${tema.border}`}
        style={{ backgroundColor: tema.bgCard }}>
        <h3 className={`text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2 ${tema.texto}`}>
          <div className={`p-1.5 rounded-lg ${modoDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
            <FaExclamationTriangle className={`text-sm ${modoDark ? 'text-amber-400' : 'text-amber-500'}`} />
          </div>
          {t('upload.campos_template')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {COLUNAS_TEMPLATE.map((coluna) => (
            <div key={coluna.id} className={`p-2.5 sm:p-3 rounded-lg ${coluna.obrigatorio ? tema.cardYellow : tema.cardGreen} transition-colors hover:opacity-90 cursor-pointer border`}
              style={{
                backgroundColor: coluna.obrigatorio ?
                  (modoDark ? 'rgba(245, 158, 11, 0.1)' : 'rgb(254, 252, 232)') :
                  (modoDark ? 'rgba(16, 185, 129, 0.1)' : 'rgb(240, 253, 244)')
              }}
              onClick={() => setMostrarInfo(coluna.id)}>
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold text-sm truncate ${tema.texto}`}>{coluna.id}</span>
                {coluna.obrigatorio ? (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 whitespace-nowrap">
                    {t('upload.obrigatorio')}
                  </span>
                ) : (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${modoDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-700'} whitespace-nowrap`}>
                    {t('upload.opcional')}
                  </span>
                )}
              </div>
              <p className={`text-xs ${modoDark ? 'text-slate-300' : 'text-slate-600'} line-clamp-2`}>{coluna.descricao}</p>
              {coluna.maxCaracteres && (
                <div className={`mt-1 text-[10px] ${modoDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('upload.max_caracteres')}: {coluna.maxCaracteres}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEtapaMapeamento = () => {
    const colunasTemplates = COLUNAS_TEMPLATE;

    return (
      <div className="max-w-full mx-auto px-3 sm:px-4">
        <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 ${tema.card} border ${tema.border}`}
          style={{ backgroundColor: tema.bgCard }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleVoltarInicio}
                className={`p-1.5 sm:p-2 cursor-pointer rounded-lg flex items-center gap-1.5 ${tema.buttonSecondary} transition-colors hover:opacity-90 text-xs sm:text-sm border ${tema.border}`}
                style={{ backgroundColor: modoDark ? '#334155' : '#F1F5F9', color: modoDark ? '#F1F5F9' : '#0F172A' }}
              >
                <FaArrowLeft className="text-xs" /> {t('botoes.voltar')}
              </button>
              <div className="min-w-0 flex-1">
                <h2 className={`text-base sm:text-lg font-bold truncate ${tema.texto}`}>{t('mapeamento.titulo')}</h2>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${tema.success} truncate max-w-[120px] sm:max-w-none border`}
                    style={{ backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)' }}>
                    <span className={modoDark ? 'text-emerald-300' : 'text-emerald-800'}>{arquivoNome.length > 15 ? arquivoNome.substring(0, 15) + '...' : arquivoNome}</span>
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${tema.info} border`}
                    style={{ backgroundColor: modoDark ? 'rgba(59, 130, 246, 0.2)' : 'rgb(219, 234, 254)' }}>
                    <span className={modoDark ? 'text-blue-300' : 'text-blue-700'}>{dadosOriginais.length} {t('mapeamento.itens')}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-0">
              <button
                onClick={handleAutoComplete}
                className={`cursor-pointer px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 ${tema.buttonPrimary} font-medium text-xs sm:text-sm transition-colors hover:opacity-90 whitespace-nowrap border`}
              >
                <FaMagic className="text-xs" /> {t('botoes.auto')}
              </button>

              <button
                onClick={handleConverterTudo}
                className={`cursor-pointer px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${tema.buttonPrimary} font-medium text-xs sm:text-sm transition-colors hover:opacity-90 whitespace-nowrap border`}
              >
                {t('botoes.converter')} →
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-3 sm:gap-4">
          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${tema.card} flex flex-col h-fit border ${tema.border}`}
            style={{ backgroundColor: tema.bgCard }}>
            <div className="flex justify-between items-center mb-3">
              <h3 className={`text-sm sm:text-base font-bold flex items-center gap-1.5 ${tema.texto}`}>
                <div className={`p-1 rounded ${modoDark ? 'bg-emerald-500/20' : 'bg-emerald-100'} border ${modoDark ? 'border-emerald-500/30' : 'border-emerald-200'}`}>
                  <span className="text-xs">📄</span>
                </div>
                {t('mapeamento.suas_colunas')}
              </h3>
              <button
                onClick={() => setMostrarValoresOriginais(!mostrarValoresOriginais)}
                className={`p-1 cursor-pointer rounded ${tema.hover} ${tema.texto} transition-colors border ${tema.border}`}
                style={{ backgroundColor: tema.hover, color: tema.texto }}
                title={mostrarValoresOriginais ? t('mapeamento.ocultar_exemplos') : t('mapeamento.mostrar_exemplos')}
              >
                {mostrarValoresOriginais ? <FaEyeSlash className="text-xs" /> : <FaEye className="text-xs" />}
              </button>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[280px] pr-1">
              {colunasOriginais.map((coluna) => {
                const colunaLower = coluna.toLowerCase();
                const deveOcultar = colunaLower.includes('foto') ||
                  colunaLower.includes('imagem') ||
                  colunaLower.includes('fornecedor') ||
                  colunaLower.includes('supplier') ||
                  colunaLower.includes('categoria') ||
                  colunaLower.includes('category');

                if (deveOcultar) return null;

                return (
                  <div
                    key={coluna}
                    className={`p-2 rounded border cursor-pointer transition-colors hover:border-emerald-500`}
                    style={{
                      backgroundColor: tema.hover,
                      borderColor: tema.border,
                      color: tema.texto
                    }}
                    onClick={() => {
                      const colunaTemplateNaoMapeada = colunasTemplates.find(
                        ct => !mapeamento[ct.id] || mapeamento[ct.id] === ''
                      );
                      if (colunaTemplateNaoMapeada) {
                        handleMapeamentoChange(colunaTemplateNaoMapeada.id, coluna);
                      }
                    }}
                  >
                    <div className="font-medium text-xs sm:text-sm mb-1 truncate" style={{ color: tema.texto }}>{coluna}</div>
                    {mostrarValoresOriginais && dadosOriginais[0]?.[coluna] !== undefined && (
                      <div className="text-xs opacity-60 truncate" style={{ color: tema.textSecondary }}>
                        {String(dadosOriginais[0][coluna]).substring(0, 25) || t('mapeamento.vazio')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 ${tema.card} lg:col-span-2 border ${tema.border}`}
            style={{ backgroundColor: tema.bgCard }}>
            <h3 className={`text-sm sm:text-base font-bold mb-3 flex items-center gap-1.5 ${tema.texto}`}>
              <div className={`p-1 rounded ${modoDark ? 'bg-emerald-500/20' : 'bg-emerald-100'} border ${modoDark ? 'border-emerald-500/30' : 'border-emerald-200'}`}>
                <span className="text-xs">🎯</span>
              </div>
              {t('mapeamento.titulo_mapeamento')}
            </h3>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium text-xs sm:text-sm ${tema.texto}`}>
                        {t('mapeamento.colunas.nome')}<span className="text-red-500 ml-0.5">*</span>
                      </span>
                      <button
                        onClick={() => setMostrarInfo('Nome')}
                        className={`p-0.5 ${tema.textSecondary} hover:text-emerald-500`}
                        style={{ color: tema.textSecondary }}
                        title={t('mapeamento.mais_informacoes')}
                      >
                        <FaQuestionCircle className="text-[10px]" />
                      </button>
                    </div>
                    {mapeamento['Nome'] && (
                      <button
                        onClick={() => handleMapeamentoChange('Nome', null)}
                        className={`cursor-pointer px-1.5 py-0.5 rounded text-xs transition-colors hover:opacity-90 border`}
                        style={{
                          backgroundColor: modoDark ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 226, 226)',
                          color: modoDark ? '#FCA5A5' : '#DC2626',
                          borderColor: modoDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'
                        }}
                      >
                        {t('botoes.limpar')}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={mapeamento['Nome'] || ''}
                      onChange={(e) => handleMapeamentoChange('Nome', e.target.value || null)}
                      className={`w-full cursor-pointer p-1.5 sm:p-2 rounded text-xs sm:text-sm pr-6 appearance-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent border`}
                      style={{
                        backgroundColor: tema.bgInput,
                        color: tema.textInput,
                        borderColor: tema.borderInput
                      }}
                    >
                      <option value="">-- {t('mapeamento.selecione')} --</option>
                      {colunasOriginais.filter(col => {
                        const colLower = col.toLowerCase();
                        return !colLower.includes('foto') &&
                          !colLower.includes('imagem') &&
                          !colLower.includes('fornecedor') &&
                          !colLower.includes('supplier') &&
                          !colLower.includes('categoria') &&
                          !colLower.includes('category');
                      }).map((coluna) => (
                        <option key={coluna} value={coluna} className="truncate" style={{
                          backgroundColor: tema.bgCard,
                          color: tema.texto
                        }}>
                          {coluna}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs" />
                  </div>

                  {mapeamento['Nome'] && (
                    <div className={`p-1.5 rounded border`}
                      style={{
                        backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                        borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                      }}>
                      <div className="font-medium text-[10px] sm:text-xs flex items-center gap-1">
                        <span>✅</span> {t('mapeamento.mapeado_para')} <span className={`font-bold ${modoDark ? 'text-emerald-400' : 'text-emerald-800'}`}>{t('mapeamento.colunas.nome')}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium text-xs sm:text-sm ${tema.texto}`}>
                        {t('mapeamento.colunas.descricao')}<span className="text-red-500 ml-0.5">*</span>
                      </span>
                      <button
                        onClick={() => setMostrarInfo('Descricao')}
                        className={`p-0.5 ${tema.textSecondary} hover:text-emerald-500`}
                        style={{ color: tema.textSecondary }}
                        title={t('mapeamento.mais_informacoes')}
                      >
                        <FaQuestionCircle className="text-[10px]" />
                      </button>
                    </div>
                    {mapeamento['Descricao'] && (
                      <button
                        onClick={() => handleMapeamentoChange('Descricao', null)}
                        className={`cursor-pointer px-1.5 py-0.5 rounded text-xs transition-colors hover:opacity-90 border`}
                        style={{
                          backgroundColor: modoDark ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 226, 226)',
                          color: modoDark ? '#FCA5A5' : '#DC2626',
                          borderColor: modoDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'
                        }}
                      >
                        {t('botoes.limpar')}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={mapeamento['Descricao'] || ''}
                      onChange={(e) => handleMapeamentoChange('Descricao', e.target.value || null)}
                      className={`w-full cursor-pointer p-1.5 sm:p-2 rounded text-xs sm:text-sm pr-6 appearance-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent border`}
                      style={{
                        backgroundColor: tema.bgInput,
                        color: tema.textInput,
                        borderColor: tema.borderInput
                      }}
                    >
                      <option value="">-- {t('mapeamento.selecione')} --</option>
                      {colunasOriginais.filter(col => {
                        const colLower = col.toLowerCase();
                        return !colLower.includes('foto') &&
                          !colLower.includes('imagem') &&
                          !colLower.includes('fornecedor') &&
                          !colLower.includes('supplier') &&
                          !colLower.includes('categoria') &&
                          !colLower.includes('category');
                      }).map((coluna) => (
                        <option key={coluna} value={coluna} className="truncate" style={{
                          backgroundColor: tema.bgCard,
                          color: tema.texto
                        }}>
                          {coluna}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs" />
                  </div>

                  {mapeamento['Descricao'] && (
                    <div className={`p-1.5 rounded border`}
                      style={{
                        backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                        borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                      }}>
                      <div className="font-medium text-[10px] sm:text-xs flex items-center gap-1">
                        <span>✅</span> {t('mapeamento.mapeado_para')} <span className={`font-bold ${modoDark ? 'text-emerald-400' : 'text-emerald-800'}`}>{t('mapeamento.colunas.descricao')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium text-xs sm:text-sm ${tema.texto}`}>
                        {t('mapeamento.colunas.preco')}
                      </span>
                      <button
                        onClick={() => setMostrarInfo('Preco')}
                        className={`p-0.5 ${tema.textSecondary} hover:text-emerald-500`}
                        style={{ color: tema.textSecondary }}
                        title={t('mapeamento.mais_informacoes')}
                      >
                        <FaQuestionCircle className="text-[10px]" />
                      </button>
                    </div>
                    {mapeamento['Preco'] && (
                      <button
                        onClick={() => handleMapeamentoChange('Preco', null)}
                        className={`cursor-pointer px-1.5 py-0.5 rounded text-xs transition-colors hover:opacity-90 border`}
                        style={{
                          backgroundColor: modoDark ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 226, 226)',
                          color: modoDark ? '#FCA5A5' : '#DC2626',
                          borderColor: modoDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'
                        }}
                      >
                        {t('botoes.limpar')}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={mapeamento['Preco'] || ''}
                      onChange={(e) => handleMapeamentoChange('Preco', e.target.value || null)}
                      className={`w-full cursor-pointer p-1.5 sm:p-2 rounded text-xs sm:text-sm pr-6 appearance-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent border`}
                      style={{
                        backgroundColor: tema.bgInput,
                        color: tema.textInput,
                        borderColor: tema.borderInput
                      }}
                    >
                      <option value="">-- {t('mapeamento.selecione')} --</option>
                      {colunasOriginais.filter(col => {
                        const colLower = col.toLowerCase();
                        return !colLower.includes('foto') &&
                          !colLower.includes('imagem') &&
                          !colLower.includes('fornecedor') &&
                          !colLower.includes('supplier') &&
                          !colLower.includes('categoria') &&
                          !colLower.includes('category');
                      }).map((coluna) => (
                        <option key={coluna} value={coluna} className="truncate" style={{
                          backgroundColor: tema.bgCard,
                          color: tema.texto
                        }}>
                          {coluna}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs" />
                  </div>

                  {mapeamento['Preco'] && (
                    <div className={`p-1.5 rounded border`}
                      style={{
                        backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                        borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                      }}>
                      <div className="font-medium text-[10px] sm:text-xs flex items-center gap-1">
                        <span>✅</span> {t('mapeamento.mapeado_para')} <span className={`font-bold ${modoDark ? 'text-emerald-400' : 'text-emerald-800'}`}>{t('mapeamento.colunas.preco')}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-medium text-xs sm:text-sm ${tema.texto}`}>
                        {t('mapeamento.colunas.quantidade')}
                      </span>
                      <button
                        onClick={() => setMostrarInfo('Quantidade')}
                        className={`p-0.5 ${tema.textSecondary} hover:text-emerald-500`}
                        style={{ color: tema.textSecondary }}
                        title={t('mapeamento.mais_informacoes')}
                      >
                        <FaQuestionCircle className="text-[10px]" />
                      </button>
                    </div>
                    {mapeamento['Quantidade'] && (
                      <button
                        onClick={() => handleMapeamentoChange('Quantidade', null)}
                        className={`cursor-pointer px-1.5 py-0.5 rounded text-xs transition-colors hover:opacity-90 border`}
                        style={{
                          backgroundColor: modoDark ? 'rgba(239, 68, 68, 0.2)' : 'rgb(254, 226, 226)',
                          color: modoDark ? '#FCA5A5' : '#DC2626',
                          borderColor: modoDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'
                        }}
                      >
                        {t('botoes.limpar')}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <select
                      value={mapeamento['Quantidade'] || ''}
                      onChange={(e) => handleMapeamentoChange('Quantidade', e.target.value || null)}
                      className={`w-full cursor-pointer p-1.5 sm:p-2 rounded text-xs sm:text-sm pr-6 appearance-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent border`}
                      style={{
                        backgroundColor: tema.bgInput,
                        color: tema.textInput,
                        borderColor: tema.borderInput
                      }}
                    >
                      <option value="">-- {t('mapeamento.selecione')} --</option>
                      {colunasOriginais.filter(col => {
                        const colLower = col.toLowerCase();
                        return !colLower.includes('foto') &&
                          !colLower.includes('imagem') &&
                          !colLower.includes('fornecedor') &&
                          !colLower.includes('supplier') &&
                          !colLower.includes('categoria') &&
                          !colLower.includes('category');
                      }).map((coluna) => (
                        <option key={coluna} value={coluna} className="truncate" style={{
                          backgroundColor: tema.bgCard,
                          color: tema.texto
                        }}>
                          {coluna}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-1.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-xs" />
                  </div>

                  {mapeamento['Quantidade'] && (
                    <div className={`p-1.5 rounded border`}
                      style={{
                        backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                        borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                      }}>
                      <div className="font-medium text-[10px] sm:text-xs flex items-center gap-1">
                        <span>✅</span> {t('mapeamento.mapeado_para')} <span className={`font-bold ${modoDark ? 'text-emerald-400' : 'text-emerald-800'}`}>{t('mapeamento.colunas.quantidade')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`mt-3 sm:mt-4 rounded-xl sm:rounded-2xl p-3 sm:p-4 ${tema.card} border ${tema.border}`}
          style={{ backgroundColor: tema.bgCard }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm sm:text-base font-bold flex items-center gap-1.5 ${tema.texto}`}>
              <div className={`p-1 rounded ${modoDark ? 'bg-emerald-500/20' : 'bg-emerald-100'} border ${modoDark ? 'border-emerald-500/30' : 'border-emerald-200'}`}>
                <span className="text-xs">👁️</span>
              </div>
              {t('mapeamento.previa')}
            </h3>

            {estatisticas && (
              <div className="flex gap-1.5">
                <div className={`px-1.5 py-0.5 rounded text-xs border`}
                  style={{
                    backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                    borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                  }}>
                  <span className={modoDark ? 'text-emerald-300' : 'text-emerald-800'}>{estatisticas.convertidos} ✓</span>
                </div>
                {estatisticas.comErros > 0 && (
                  <div className={`px-1.5 py-0.5 rounded text-xs border`}
                    style={{
                      backgroundColor: modoDark ? 'rgba(245, 158, 11, 0.2)' : 'rgb(254, 252, 232)',
                      borderColor: modoDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'
                    }}>
                    <span className={modoDark ? 'text-amber-300' : 'text-amber-800'}>{estatisticas.comErros} ⚠️</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="overflow-hidden rounded border" style={{ borderColor: tema.border }}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[300px]">
                  <thead>
                    <tr className={`border-b`} style={{
                      borderColor: tema.border,
                      backgroundColor: modoDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(241, 245, 249, 0.5)'
                    }}>
                      <th className="p-1.5 text-left font-medium text-xs" style={{ color: tema.texto }}>{t('mapeamento.colunas.nome')}</th>
                      <th className="p-1.5 text-left font-medium text-xs" style={{ color: tema.texto }}>{t('mapeamento.colunas.descricao')}</th>
                      <th className="p-1.5 text-left font-medium text-xs" style={{ color: tema.texto }}>{t('mapeamento.colunas.preco')}</th>
                      <th className="p-1.5 text-left font-medium text-xs" style={{ color: tema.texto }}>{t('mapeamento.colunas.quantidade')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosConvertidos.slice(0, 5).map((linha, idx) => (
                      <tr key={idx} className={`border-b`}
                        style={{
                          borderColor: tema.border,
                          backgroundColor: linha._erros ?
                            (modoDark ? 'rgba(245, 158, 11, 0.05)' : 'rgb(254, 252, 232)') : 'transparent'
                        }}>
                        <td className="p-1.5">
                          <div className="font-medium text-xs truncate max-w-[100px]" style={{ color: tema.texto }}>{linha.Nome || '-'}</div>
                        </td>
                        <td className="p-1.5">
                          <div className="text-xs opacity-75 truncate max-w-[120px]" style={{ color: tema.textSecondary }}>
                            {linha.Descricao?.substring(0, 20) || '-'}
                            {linha.Descricao && linha.Descricao.length > 20 && '...'}
                          </div>
                        </td>
                        <td className="p-1.5">
                          <div className="text-xs font-medium">
                            {linha.Preco > 0 ? (
                              <span className="text-emerald-500">
                                R$ {linha.Preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-slate-400">R$ 0,00</span>
                            )}
                          </div>
                        </td>
                        <td className="p-1.5">
                          <div className="text-xs" style={{ color: tema.texto }}>{linha.Quantidade || 0}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <div className="text-xs opacity-75" style={{ color: tema.textSecondary }}>
                {t('mapeamento.mostrando')} {Math.min(5, dadosConvertidos.length)} {t('mapeamento.de')} {dadosOriginais.length} {t('mapeamento.produtos')}
              </div>
              <button
                onClick={handleConverterTudo}
                className={`cursor-pointer px-3 py-1.5 rounded-lg font-medium text-xs transition-colors hover:opacity-90 border`}
                style={{
                  background: 'linear-gradient(to right, #059669, #0d9488)',
                  color: 'white',
                  borderColor: modoDark ? 'rgba(5, 150, 105, 0.3)' : '#10B981'
                }}
              >
                {t('botoes.converter_todos')} ({dadosOriginais.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEtapaPreview = () => {
    const ProdutoCard = ({ produto, index }: { produto: Record<string, any>, index: number }) => {
      const globalIndex = indexPrimeiroProduto + index;
      const isExpandido = produtosExpandidos.includes(globalIndex);

      return (
        <div className={`rounded-lg overflow-hidden border transition-colors ${produto._temErros ? modoDark ? 'border-amber-500/50 bg-amber-500/5' : 'border-amber-300 bg-amber-50' : ''}`}
          style={{
            backgroundColor: tema.bgCard,
            borderColor: produto._temErros ?
              (modoDark ? 'rgba(245, 158, 11, 0.5)' : '#FBBF24') :
              tema.border
          }}>
          <div
            className="p-2.5 cursor-pointer transition-colors flex items-center justify-between"
            style={{
              backgroundColor: 'transparent',
              color: tema.texto
            }}
            onClick={() => toggleProdutoExpandido(globalIndex)}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className={`w-6 h-6 rounded flex-shrink-0 flex items-center justify-center border`}
                style={{
                  backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                  borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                  color: modoDark ? '#34D399' : '#059669'
                }}>
                <span className="font-bold text-xs">{globalIndex + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`font-medium text-sm truncate`} style={{ color: tema.texto }}>
                  {produto.Nome || t('preview.sem_nome')}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {produto.Preco > 0 ? (
                    <span className="px-1.5 py-0.5 rounded text-xs border"
                      style={{
                        backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                        color: modoDark ? '#34D399' : '#059669',
                        borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                      }}>
                      R$ {produto.Preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-xs border"
                      style={{
                        backgroundColor: modoDark ? 'rgba(100, 116, 139, 0.2)' : 'rgb(241, 245, 249)',
                        color: modoDark ? '#CBD5E1' : '#64748B',
                        borderColor: modoDark ? 'rgba(100, 116, 139, 0.3)' : '#E2E8F0'
                      }}>
                      {t('preview.sem_preco')}
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 rounded text-xs border"
                    style={{
                      backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                      color: modoDark ? '#34D399' : '#059669',
                      borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                    }}>
                    {produto.Quantidade || 0} {t('preview.un')}
                  </span>
                  {produto._temErros && (
                    <span className="px-1.5 py-0.5 rounded text-xs flex items-center gap-0.5 border"
                      style={{
                        backgroundColor: modoDark ? 'rgba(245, 158, 11, 0.2)' : 'rgb(254, 252, 232)',
                        color: modoDark ? '#FBBF24' : '#D97706',
                        borderColor: modoDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'
                      }}>
                      <FaExclamationTriangle className="text-[10px]" /> {t('preview.avisos')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 ml-1">
              {isExpandido ? <FaChevronUp style={{ color: tema.textSecondary }} /> : <FaChevronDown style={{ color: tema.textSecondary }} />}
            </div>
          </div>

          {isExpandido && (
            <div className="border-t p-2.5" style={{ borderColor: tema.border }}>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] opacity-60 mb-0.5" style={{ color: tema.textSecondary }}>{t('mapeamento.colunas.nome')}</div>
                    <div className={`text-sm font-medium`} style={{ color: tema.texto }}>{produto.Nome || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] opacity-60 mb-0.5" style={{ color: tema.textSecondary }}>{t('mapeamento.colunas.descricao')}</div>
                    <div className={`text-xs`} style={{ color: tema.textSecondary }}>{produto.Descricao || '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] opacity-60 mb-0.5" style={{ color: tema.textSecondary }}>{t('mapeamento.colunas.preco')}</div>
                    <div className={`text-sm font-medium ${produto.Preco > 0 ? 'text-emerald-500' : ''}`} style={{ color: produto.Preco > 0 ? '#10B981' : tema.texto }}>
                      {produto.Preco > 0 ? `R$ ${produto.Preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] opacity-60 mb-0.5" style={{ color: tema.textSecondary }}>{t('mapeamento.colunas.quantidade')}</div>
                    <div className={`text-sm font-medium`} style={{ color: tema.texto }}>{produto.Quantidade || 0} {t('preview.un')}</div>
                  </div>
                </div>
              </div>

              {produto._erros && produto._erros.length > 0 && (
                <div className={`mt-2.5 p-2 rounded border`}
                  style={{
                    backgroundColor: modoDark ? 'rgba(245, 158, 11, 0.2)' : 'rgb(254, 252, 232)',
                    borderColor: modoDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'
                  }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <FaExclamationTriangle className="text-xs" style={{ color: modoDark ? '#FBBF24' : '#D97706' }} />
                    <span className="text-xs font-semibold" style={{ color: modoDark ? '#FBBF24' : '#D97706' }}>{t('preview.avisos')}:</span>
                  </div>
                  <ul className="space-y-0.5 text-[10px]" style={{ color: modoDark ? '#FBBF24' : '#D97706' }}>
                    {produto._erros.slice(0, 2).map((erro: string, i: number) => (
                      <li key={i}>• {erro}</li>
                    ))}
                    {produto._erros.length > 2 && (
                      <li className="text-[10px] opacity-75">+ {produto._erros.length - 2} {t('preview.mais')}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="max-w-full mx-auto px-3 sm:px-4">
        <div className={`rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 ${tema.card} border ${tema.border}`}
          style={{ backgroundColor: tema.bgCard }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setEtapa('mapeamento')}
                className={`p-1.5 sm:p-2 rounded-lg flex items-center gap-1.5 transition-colors hover:opacity-90 text-xs sm:text-sm border ${tema.border}`}
                style={{
                  backgroundColor: modoDark ? '#334155' : '#F1F5F9',
                  color: modoDark ? '#F1F5F9' : '#0F172A',
                  borderColor: tema.border
                }}
              >
                <FaArrowLeft className="text-xs" /> {t('botoes.ajustar')}
              </button>
              <div>
                <h2 className={`text-base sm:text-lg font-bold`} style={{ color: tema.texto }}>{t('preview.titulo')}</h2>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded-full text-xs border`}
                    style={{
                      backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                      borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                    }}>
                    <span style={{ color: modoDark ? '#34D399' : '#059669' }}>{dadosConvertidos.length} {t('preview.produtos')}</span>
                  </span>
                  {estatisticas?.comErros > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-full text-xs border`}
                      style={{
                        backgroundColor: modoDark ? 'rgba(245, 158, 11, 0.2)' : 'rgb(254, 252, 232)',
                        borderColor: modoDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A'
                      }}>
                      <span style={{ color: modoDark ? '#FBBF24' : '#D97706' }}>{estatisticas.comErros} {t('preview.avisos')}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 sm:gap-2 mt-2 sm:mt-0">
              <button
                onClick={handleVoltarInicio}
                className={`px-2 cursor-pointer sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors hover:opacity-90 border ${tema.border}`}
                style={{
                  backgroundColor: modoDark ? '#334155' : '#F1F5F9',
                  color: modoDark ? '#F1F5F9' : '#0F172A',
                  borderColor: tema.border
                }}
              >
                {t('botoes.nova')}
              </button>
              <button
                onClick={handleBaixarTemplate}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center gap-1.5 font-medium text-xs sm:text-sm transition-colors hover:opacity-90 border`}
                style={{
                  background: 'linear-gradient(to right, #059669, #0d9488)',
                  color: 'white',
                  borderColor: modoDark ? 'rgba(5, 150, 105, 0.3)' : '#10B981'
                }}
              >
                <FaDownload className="text-xs" /> {t('botoes.baixar')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <div className={`rounded-lg p-2 text-center border ${tema.border}`} style={{ backgroundColor: tema.bgCard }}>
            <div className="text-base sm:text-xl font-bold text-emerald-500">{dadosConvertidos.length}</div>
            <div className="text-[10px] sm:text-xs opacity-75 mt-0.5" style={{ color: tema.textSecondary }}>{t('preview.total')}</div>
          </div>
          <div className={`rounded-lg p-2 text-center border ${tema.border}`} style={{ backgroundColor: tema.bgCard }}>
            <div className="text-base sm:text-xl font-bold text-emerald-500">
              {dadosConvertidos.filter(p => p.Nome && p.Descricao).length}
            </div>
            <div className="text-[10px] sm:text-xs opacity-75 mt-0.5" style={{ color: tema.textSecondary }}>{t('preview.completo')}</div>
          </div>
          <div className={`rounded-lg p-2 text-center border ${tema.border}`} style={{ backgroundColor: tema.bgCard }}>
            <div className="text-base sm:text-xl font-bold text-amber-500">
              {dadosConvertidos.filter(p => p.Preco > 0).length}
            </div>
            <div className="text-[10px] sm:text-xs opacity-75 mt-0.5" style={{ color: tema.textSecondary }}>{t('preview.com_preco')}</div>
          </div>
          <div className={`rounded-lg p-2 text-center border ${tema.border}`} style={{ backgroundColor: tema.bgCard }}>
            <div className="text-base sm:text-xl font-bold text-cyan-500">
              {dadosConvertidos.filter(p => p._temErros).length}
            </div>
            <div className="text-[10px] sm:text-xs opacity-75 mt-0.5" style={{ color: tema.textSecondary }}>{t('preview.com_avisos')}</div>
          </div>
        </div>

        <div className={`rounded-lg p-2 sm:p-2.5 mb-3 border ${tema.border}`} style={{ backgroundColor: tema.bgCard }}>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <FaSearch className={`absolute left-2 top-1/2 transform -translate-y-1/2 text-xs`} style={{ color: tema.textSecondary }} />
              <input
                type="text"
                placeholder={t('preview.buscar_placeholder')}
                value={buscaPreview}
                onChange={(e) => setBuscaPreview(e.target.value)}
                className={`w-full pl-6 pr-3 py-1.5 rounded focus:ring-1 focus:ring-emerald-500 text-xs sm:text-sm border`}
                style={{
                  backgroundColor: tema.bgInput,
                  color: tema.textInput,
                  borderColor: tema.borderInput
                }}
              />
            </div>
            <button
              onClick={() => setBuscaPreview('')}
              className={`cursor-pointer px-2 py-1.5 rounded text-xs whitespace-nowrap border ${tema.border}`}
              style={{
                backgroundColor: modoDark ? '#334155' : '#F1F5F9',
                color: modoDark ? '#F1F5F9' : '#0F172A',
                borderColor: tema.border
              }}
            >
              {t('botoes.limpar')}
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          {produtosPaginados.length === 0 ? (
            <div className={`rounded-lg p-4 text-center border ${tema.border}`} style={{ backgroundColor: tema.bgCard }}>
              <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center border`}
                style={{
                  backgroundColor: modoDark ? 'rgba(30, 41, 59, 0.5)' : 'rgb(241, 245, 249)',
                  borderColor: modoDark ? '#334155' : '#E2E8F0'
                }}>
                <FaSearch className={`text-lg`} style={{ color: tema.textSecondary }} />
              </div>
              <h3 className={`text-sm font-bold mb-1`} style={{ color: tema.texto }}>{t('preview.nenhum_produto')}</h3>
              <p className={`text-xs`} style={{ color: tema.textSecondary }}>{t('preview.ajuste_filtros')}</p>
            </div>
          ) : (
            produtosPaginados.map((produto, index) => (
              <ProdutoCard
                key={indexPrimeiroProduto + index}
                produto={produto}
                index={index}
              />
            ))
          )}
        </div>

        {totalPaginas > 1 && (
          <div className={`rounded-lg p-2 mb-3 border ${tema.border}`} style={{ backgroundColor: tema.bgCard }}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className={`text-xs`} style={{ color: tema.textSecondary }}>
                {t('preview.pagina')} {paginaAtual} {t('preview.de')} {totalPaginas} • {produtosFiltrados.length} {t('preview.itens')}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className={`p-1 rounded text-xs border ${tema.border} ${paginaAtual === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    backgroundColor: modoDark ? '#334155' : '#F1F5F9',
                    color: modoDark ? '#F1F5F9' : '#0F172A',
                    borderColor: tema.border
                  }}
                >
                  <FaArrowLeft />
                </button>

                {Array.from({ length: Math.min(3, totalPaginas) }, (_, i) => {
                  let pagina = i + 1;
                  if (paginaAtual > 2 && paginaAtual < totalPaginas - 1) {
                    pagina = paginaAtual - 1 + i;
                  } else if (paginaAtual >= totalPaginas - 1) {
                    pagina = totalPaginas - 2 + i;
                  }

                  if (pagina < 1 || pagina > totalPaginas) return null;

                  return (
                    <button
                      key={pagina}
                      onClick={() => setPaginaAtual(pagina)}
                      className={`px-1.5 py-0.5 rounded text-xs border ${pagina === paginaAtual ? '' : tema.border}`}
                      style={{
                        backgroundColor: pagina === paginaAtual ?
                          (modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)') :
                          (modoDark ? '#334155' : '#F1F5F9'),
                        color: pagina === paginaAtual ?
                          (modoDark ? '#34D399' : '#059669') :
                          (modoDark ? '#F1F5F9' : '#0F172A'),
                        borderColor: pagina === paginaAtual ?
                          (modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0') :
                          tema.border
                      }}
                    >
                      {pagina}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className={`p-1 rounded text-xs border ${tema.border} ${paginaAtual === totalPaginas ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    backgroundColor: modoDark ? '#334155' : '#F1F5F9',
                    color: modoDark ? '#F1F5F9' : '#0F172A',
                    borderColor: tema.border
                  }}
                >
                  <FaArrowLeft className="rotate-180" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleVoltarInicio}
            className={`px-3 py-2 cursor-pointer rounded-lg font-medium text-xs flex-1 sm:flex-none border ${tema.border}`}
            style={{
              backgroundColor: modoDark ? '#334155' : '#F1F5F9',
              color: modoDark ? '#F1F5F9' : '#0F172A',
              borderColor: tema.border
            }}
          >
            ← {t('botoes.nova_conversao')}
          </button>
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => setEtapa('mapeamento')}
              className={`px-3 py-2 rounded-lg font-medium text-xs flex-1 border ${tema.border}`}
              style={{
                backgroundColor: modoDark ? '#334155' : '#F1F5F9',
                color: modoDark ? '#F1F5F9' : '#0F172A',
                borderColor: tema.border
              }}
            >
              {t('botoes.ajustar_mapeamento')}
            </button>
            <button
              onClick={handleBaixarTemplate}
              className={`px-3 py-2 rounded-lg flex items-center justify-center gap-1.5 font-medium text-xs flex-1 border`}
              style={{
                background: 'linear-gradient(to right, #059669, #0d9488)',
                color: 'white',
                borderColor: modoDark ? 'rgba(5, 150, 105, 0.3)' : '#10B981'
              }}
            >
              <FaDownload className="text-xs" /> {t('botoes.baixar_csv')}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEtapaConcluido = () => (
    <div className="max-w-full mx-auto px-4 sm:max-w-md">
      <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 ${tema.card} text-center border ${tema.border}`}
        style={{ backgroundColor: tema.bgCard }}>
        <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full flex items-center justify-center border`}
          style={{
            backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
            borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
          }}>
          <div className="text-2xl">🎉</div>
        </div>

        <h2 className={`text-lg sm:text-xl font-bold mb-2`} style={{ color: tema.texto }}>
          {t('concluido.titulo')}
        </h2>

        <p className={`text-sm mb-4`} style={{ color: tema.textSecondary }}>
          {t('concluido.mensagem')}
          <br />
          <code className="text-xs px-2 py-0.5 rounded inline-block border" style={{
            backgroundColor: modoDark ? 'rgba(30, 41, 59, 0.5)' : 'rgb(241, 245, 249)',
            borderColor: tema.border,
            color: tema.texto
          }}>
            {arquivoNome}
          </code>
        </p>

        <div className="space-y-2 mb-4">
          <div className={`p-2 rounded-lg border ${tema.border}`} style={{ backgroundColor: tema.hover }}>
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded border`}
                style={{
                  backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                  borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                }}>
                <FaFileCsv className={`text-sm`} style={{ color: modoDark ? '#34D399' : '#059669' }} />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-sm`} style={{ color: tema.texto }}>{t('concluido.template_pronto')}</h4>
                <p className={`text-xs`} style={{ color: tema.textSecondary }}>{t('concluido.csv_baixado')}</p>
              </div>
            </div>
          </div>

          <div className={`p-2 rounded-lg border ${tema.border}`} style={{ backgroundColor: tema.hover }}>
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded border`}
                style={{
                  backgroundColor: modoDark ? 'rgba(16, 185, 129, 0.2)' : 'rgb(209, 250, 229)',
                  borderColor: modoDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'
                }}>
                <FaFileExcel className={`text-sm`} style={{ color: modoDark ? '#34D399' : '#059669' }} />
              </div>
              <div className="text-left">
                <h4 className={`font-bold text-sm`} style={{ color: tema.texto }}>{t('concluido.proximo_passo')}</h4>
                <p className={`text-xs`} style={{ color: tema.textSecondary }}>{t('concluido.importe_pagina')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleVoltarInicio}
            className={`px-4 py-2 cursor-pointer rounded-lg font-medium text-sm border ${tema.border}`}
            style={{
              backgroundColor: modoDark ? '#334155' : '#F1F5F9',
              color: modoDark ? '#F1F5F9' : '#0F172A',
              borderColor: tema.border
            }}
          >
            {t('botoes.converter_outra')}
          </button>
          <button
            onClick={() => router.push('/produtos')}
            className={`px-4 py-2 rounded-lg font-medium text-sm border`}
            style={{
              background: 'linear-gradient(to right, #059669, #0d9488)',
              color: 'white',
              borderColor: modoDark ? 'rgba(5, 150, 105, 0.3)' : '#10B981'
            }}
          >
            {t('botoes.ir_produtos')}
          </button>
        </div>

        <div className={`mt-4 pt-3 border-t`} style={{ borderColor: tema.border }}>
          <p className={`text-xs`} style={{ color: tema.textSecondary }}>
            <strong>{t('concluido.dica')}:</strong> {t('concluido.problemas_volte')}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-4 sm:pb-8`} style={{ backgroundColor: tema.bg, color: tema.texto }}>
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
        {etapa === 'upload' && renderEtapaUpload()}
        {etapa === 'mapeamento' && renderEtapaMapeamento()}
        {etapa === 'preview' && renderEtapaPreview()}
        {etapa === 'concluido' && renderEtapaConcluido()}

        {isProcessing && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
            <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center border ${tema.border}`}
              style={{ backgroundColor: tema.bgCard }}>
              <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-emerald-500 mx-auto mb-2 sm:mb-3"></div>
              <h3 className={`text-sm sm:text-base font-bold`} style={{ color: tema.texto }}>{t('processando')}</h3>
              <p className={`mt-1 text-xs`} style={{ color: tema.textSecondary }}>{t('analisando')} {dadosOriginais.length} {t('produtos')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}