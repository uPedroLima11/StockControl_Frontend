import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FaUpload,
    FaFileExcel,
    FaFileCsv,
    FaTimes,
    FaCheck,
    FaExclamationTriangle,
    FaSpinner,
    FaMagic,
    FaArrowRight,
    FaExchangeAlt,
    FaInfoCircle,
   
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import i18n from '../../lib/i18n';

interface UploadProdutosModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    modoDark: boolean;
    empresaAtivada: boolean;
    empresaId: string | null;
}

interface EstatisticasUpload {
    total: number;
    validos: number;
    comErros: number;
    criadosComSucesso: number;
    errosCriacao: number;
    erros: string[];
}

interface PreviewData {
    linha: number;
    conteudo: string;
    isCabecalho: boolean;
}

interface ProdutoUpload {
    nome: string;
}

export default function UploadProdutosModal({
    isOpen,
    onClose,
    onSuccess,
    modoDark,
    empresaAtivada,
    empresaId
}: UploadProdutosModalProps) {
    const { t } = useTranslation("produtos");
    const router = useRouter();

    const [arquivo, setArquivo] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData[]>([]);
    const [estatisticas, setEstatisticas] = useState<EstatisticasUpload | null>(null);
    const [etapa, setEtapa] = useState<'selecao' | 'preview' | 'resultado'>('selecao');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const temaAtual = modoDark
        ? {
            bg: 'bg-gray-900',
            text: 'text-white',
            border: 'border-blue-500/30',
            card: 'bg-gray-800/90',
            input: 'bg-gray-700 border-gray-600',
            hover: 'hover:bg-gray-700',
            success: 'bg-green-500/20 text-green-400',
            error: 'bg-red-500/20 text-red-400',
            warning: 'bg-yellow-500/20 text-yellow-400',
            info: 'bg-blue-500/20 text-blue-400',
            primary: 'from-emerald-600 to-teal-500',
            secondary: 'from-emerald-700 to-teal-600',
        }
        : {
            bg: 'bg-white',
            text: 'text-gray-900',
            border: 'border-blue-200',
            card: 'bg-white/90',
            input: 'bg-gray-50 border-gray-300',
            hover: 'hover:bg-gray-100',
            success: 'bg-green-100 text-green-700',
            error: 'bg-red-100 text-red-700',
            warning: 'bg-yellow-100 text-yellow-700',
            info: 'bg-blue-100 text-blue-700',
            primary: 'from-emerald-500 to-teal-400',
            secondary: 'from-emerald-600 to-teal-500',
        };

    useEffect(() => {
        if (!isOpen) {
            resetar();
        }
    }, [isOpen]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const extensoesPermitidas = ['.xlsx', '.xls', '.csv'];
        const extensao = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

        if (!extensoesPermitidas.includes(extensao)) {
            Swal.fire({
                icon: 'error',
                title: t('upload.tipoInvalido'),
                text: t('upload.formatoSuportado'),
                background: temaAtual.bg,
                color: temaAtual.text
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: t('upload.tamanhoExcedido'),
                text: t('upload.tamanhoMaximo'),
                background: temaAtual.bg,
                color: temaAtual.text
            });
            return;
        }

        setArquivo(file);

        if (extensao === '.csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                const linhas = text.split('\n').slice(0, 6); 
                setPreviewData(linhas.map((linha, idx) => ({
                    linha: idx + 1,
                    conteudo: linha,
                    isCabecalho: idx === 0
                })));
            };
            reader.readAsText(file);
        } else {
            setPreviewData([
                { linha: 1, conteudo: `Arquivo Excel: ${file.name}`, isCabecalho: true },
                { linha: 2, conteudo: 'Para ver o preview, use o conversor primeiro', isCabecalho: false }
            ]);
        }

        setEtapa('preview');
    };

    const handleDownloadTemplate = async (tipo: 'csv' | 'excel') => {
        try {
            const usuarioSalvo = localStorage.getItem('client_key');
            if (!usuarioSalvo) return;

            const usuarioValor = usuarioSalvo.replace(/"/g, '');

            const currentLang = i18n.language || 'pt';

            const endpoint = tipo === 'csv'
                ? `${process.env.NEXT_PUBLIC_URL_API}/produtos/upload/template`
                : `${process.env.NEXT_PUBLIC_URL_API}/produtos/upload/template-excel`;

            const response = await fetch(endpoint, {
                headers: {
                    'user-id': usuarioValor,
                    'Accept-Language': currentLang,
                    Authorization: `Bearer ${Cookies.get('token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = tipo === 'csv'
                    ? 'template_produtos.csv'
                    : 'template_produtos.xlsx';

                if (contentDisposition) {
                    const matches = contentDisposition.match(/filename="(.+)"/);
                    if (matches && matches[1]) {
                        filename = matches[1];
                    }
                }

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                Swal.fire({
                    icon: 'success',
                    title: tipo === 'csv' ? 'CSV baixado!' : 'Excel baixado!',
                    text: `Template ${tipo.toUpperCase()} baixado com sucesso`,
                    background: temaAtual.bg,
                    color: temaAtual.text
                });
            } else {
                throw new Error('Erro ao baixar template');
            }
        } catch (error) {
            console.error('Erro ao baixar template:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao baixar template',
                text: 'Tente novamente',
                background: temaAtual.bg,
                color: temaAtual.text
            });
        }
    };

    const handleUpload = async () => {
        if (!arquivo || !empresaAtivada || !empresaId) {
            if (!empresaAtivada) {
                Swal.fire({
                    icon: 'warning',
                    title: t('empresaNaoAtivada.titulo'),
                    text: t('empresaNaoAtivada.mensagem'),
                    background: temaAtual.bg,
                    color: temaAtual.text,
                    confirmButtonText: t('empresaNaoAtivada.botao')
                });
            }
            return;
        }

        const usuarioSalvo = localStorage.getItem('client_key');
        if (!usuarioSalvo) return;

        const usuarioValor = usuarioSalvo.replace(/"/g, '');

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('arquivo', arquivo);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_URL_API}/produtos/upload`,
                {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'user-id': usuarioValor,
                        Authorization: `Bearer ${Cookies.get('token')}`
                    }
                }
            );

            const resultado = await response.json();

            if (response.ok && resultado.success) {
                setEstatisticas({
                    total: resultado.estatisticas.total,
                    validos: resultado.estatisticas.validos,
                    comErros: resultado.estatisticas.comErros,
                    criadosComSucesso: resultado.estatisticas.criadosComSucesso,
                    errosCriacao: resultado.estatisticas.errosCriacao,
                    erros: resultado.estatisticas.erros || []
                });

                setEtapa('resultado');

                Swal.fire({
                    icon: 'success',
                    title: t('upload.sucesso'),
                    html: `
            <div class="text-left">
              <p><strong>${t('upload.resumo')}</strong></p>
              <p>${t('upload.totalProcessados')}: ${resultado.estatisticas.total}</p>
              <p>${t('upload.criadosComSucesso')}: ${resultado.estatisticas.criadosComSucesso}</p>
              <p>${t('upload.comErros')}: ${resultado.estatisticas.comErros + resultado.estatisticas.errosCriacao}</p>
              ${resultado.produtosCriados?.length > 0 ? `
                <div class="mt-3">
                  <p class="font-bold">Produtos criados:</p>
                  <div class="max-h-40 overflow-y-auto text-sm">
                    ${resultado.produtosCriados.slice(0, 10).map((prod: ProdutoUpload) => `
                      <div class="flex items-center gap-2 p-1">
                        <span class="text-green-500">✓</span>
                        <span>${prod.nome}</span>
                      </div>
                    `).join('')}
                    ${resultado.produtosCriados.length > 10 ? `
                      <p class="text-gray-500 text-sm mt-1">... e mais ${resultado.produtosCriados.length - 10} produtos</p>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
            </div>
          `,
                    background: temaAtual.bg,
                    color: temaAtual.text,
                    confirmButtonText: t('upload.verProdutos')
                }).then((result) => {
                    if (result.isConfirmed) {
                        onSuccess();
                        onClose();
                    }
                });

                onSuccess();
            } else {
                const mensagemErro = resultado.mensagem || t('upload.erro');
                const todasMensagensErro = resultado.estatisticas?.erros?.length > 0
                    ? resultado.estatisticas.erros.slice(0, 10).map((erro: string) => `
                      <div class="text-red-400 text-sm mb-1 flex items-start gap-2">
                        <span class="text-red-500 mt-1">•</span>
                        <span>${erro}</span>
                      </div>
                    `).join('')
                    : '';
                const temMaisErros = resultado.estatisticas?.erros?.length > 10;
                const temErrosValidacao = resultado.estatisticas?.erros?.length > 0;
                const ehFormatoInvalido = resultado.tipo === 'PlanilhaFormatoInvalidoException';

                Swal.fire({
                    icon: 'error',
                    title: t('upload.erro'),
                    html: `
            <div class="text-left">
              <p class="mb-3">${mensagemErro}</p>
              ${temErrosValidacao ? `
                <div class="mt-2">
                  <p class="font-bold mb-2">${t('upload.errosEncontrados')}:</p>
                  <div class="max-h-40 overflow-y-auto bg-red-900/20 p-3 rounded">
                    ${todasMensagensErro}
                    ${temMaisErros ? `
                      <p class="text-gray-400 text-sm mt-2">
                        ... e mais ${resultado.estatisticas.erros.length - 10} erros
                      </p>
                    ` : ''}
                  </div>
                </div>
              ` : ''}
              ${ehFormatoInvalido ? `
                <div class="mt-4 p-3 bg-yellow-900/20 rounded">
                  <p class="font-bold text-yellow-400">Dica:</p>
                  <p class="text-sm">Use o conversor para formatar sua planilha corretamente.</p>
                </div>
              ` : ''}
            </div>
          `,
                    background: temaAtual.bg,
                    color: temaAtual.text,
                    width: 600
                });
            }
        } catch (error) {
            console.error('Erro no upload:', error);
            Swal.fire({
                icon: 'error',
                title: t('upload.erroConexao'),
                text: t('upload.tenteNovamente'),
                background: temaAtual.bg,
                color: temaAtual.text
            });
        } finally {
            setIsUploading(false);
        }
    };

    const resetar = () => {
        setArquivo(null);
        setPreviewData([]);
        setEstatisticas(null);
        setEtapa('selecao');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetar();
        onClose();
    };


    const abrirConversor = () => {
        onClose();
        router.push('/conversor');
    };


    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/70">
                <div className={`${temaAtual.bg} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border ${temaAtual.border}`}>
                    <div className="p-6 border-b border-gray-700/50">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className={`text-2xl font-bold ${temaAtual.text}`}>
                                    {t('upload.titulo')}
                                </h2>
                                <p className={`text-sm mt-1 ${modoDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {t('upload.subtitulo')}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className={`p-2 rounded-lg ${temaAtual.hover} transition-colors`}
                            >
                                <FaTimes className={`text-lg ${temaAtual.text}`} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                        {etapa === 'selecao' && (
                            <div className="space-y-6">
                                <div className={`rounded-xl p-4 border ${modoDark
                                        ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10'
                                        : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-lg ${modoDark
                                                    ? 'bg-emerald-500/20'
                                                    : 'bg-emerald-100'
                                                }`}>
                                                <FaMagic className={`text-xl ${modoDark
                                                        ? 'text-emerald-400'
                                                        : 'text-emerald-500'
                                                    }`} />
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold ${temaAtual.text}`}>
                                                    {t('conversor.titulo')}
                                                </h4>
                                                <p className={`text-sm ${modoDark
                                                        ? 'text-gray-400'
                                                        : 'text-gray-600'
                                                    }`}>
                                                    {t('conversor.subtitulo')}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={abrirConversor}
                                            className={`cursor-pointer px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${modoDark
                                                ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600"
                                                : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500"
                                                } text-white transition-colors`}
                                        >
                                            <FaExchangeAlt />
                                            {t('conversor.abrir')}
                                        </button>
                                    </div>
                                </div>

                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${modoDark ? 'border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/5' : 'border-blue-300 hover:border-blue-400 hover:bg-blue-50'}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${modoDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                        <FaUpload className={`text-2xl ${modoDark ? 'text-blue-400' : 'text-blue-500'}`} />
                                    </div>
                                    <h3 className={`text-lg font-semibold mb-2 ${temaAtual.text}`}>
                                        {t('upload.arrasteSolte')}
                                    </h3>
                                    <p className={`text-sm mb-4 ${modoDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {t('upload.formatoSuportado')}
                                    </p>
                                    <button className={` cursor-pointer px-6 py-2 rounded-lg font-medium ${modoDark ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors`}>
                                        {t('upload.selecionarArquivo')}
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>

                                <div className={`rounded-xl p-4 ${modoDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                                    <h4 className={`font-semibold mb-3 flex items-center gap-2 ${temaAtual.text}`}>
                                        <FaExclamationTriangle className={modoDark ? 'text-yellow-500' : 'text-yellow-600'} />
                                        {t('upload.importante')}
                                    </h4>
                                    <ul className={`space-y-2 text-sm ${modoDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <li className="flex items-start gap-2">
                                            <FaCheck className={`mt-1 ${modoDark ? 'text-green-400' : 'text-green-600'}`} />
                                            <span>{t('upload.camposObrigatorios')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <FaCheck className={`mt-1 ${modoDark ? 'text-green-400' : 'text-green-600'}`} />
                                            <span>{t('upload.descricaoAutomatica')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <FaCheck className={`mt-1 ${modoDark ? 'text-green-400' : 'text-green-600'}`} />
                                            <span>{t('upload.quantidadeMinimaPadrao')}</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className={`rounded-xl p-4 border ${modoDark ? 'border-green-500/30 bg-green-500/5' : 'border-green-200 bg-green-50'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className={`font-semibold mb-1 ${temaAtual.text}`}>
                                                {t('upload.naoTemTemplate')}
                                            </h4>
                                            <p className={`text-sm ${modoDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {t('upload.baixeTemplate')}
                                            </p>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                onClick={() => handleDownloadTemplate('csv')}
                                                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 flex-1 justify-center w-full sm:w-auto cursor-pointer ${modoDark ? 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30' : 'bg-blue-100 hover:bg-blue-200 border-blue-200'} border transition-colors`}
                                            >
                                                <FaFileCsv className={`text-lg ${modoDark ? 'text-blue-400' : 'text-blue-600'}`} />
                                                <div className="text-left">
                                                    <div className={`font-medium ${temaAtual.text}`}>CSV</div>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => handleDownloadTemplate('excel')}
                                                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 flex-1 justify-center w-full sm:w-auto cursor-pointer ${modoDark ? 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30' : 'bg-green-100 hover:bg-green-200 border-green-200'} border transition-colors`}
                                            >
                                                <FaFileExcel className={`text-lg ${modoDark ? 'text-green-400' : 'text-green-600'}`} />
                                                <div className="text-left">
                                                    <div className={`font-medium ${temaAtual.text}`}>Excel</div>
                                                    <div className="text-xs opacity-75">.xlsx</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className={`rounded-xl p-4 border ${modoDark ? 'border-blue-500/30 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                                    <h4 className={`font-semibold mb-2 flex items-center gap-2 ${temaAtual.text}`}>
                                        <FaInfoCircle className={modoDark ? 'text-blue-400' : 'text-blue-500'} />
                                        {t('upload.dicasRapidas')}
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className={`p-2 rounded ${modoDark ? 'bg-gray-800' : 'bg-white'}`}>
                                            <div className="font-medium">CSV</div>
                                            <div className={modoDark ? 'text-gray-400' : 'text-gray-600'}>Use ; ou , como separador</div>
                                        </div>
                                        <div className={`p-2 rounded ${modoDark ? 'bg-gray-800' : 'bg-white'}`}>
                                            <div className="font-medium">Excel</div>
                                            <div className={modoDark ? 'text-gray-400' : 'text-gray-600'}>Suporta .xlsx e .xls</div>
                                        </div>
                                        <div className={`p-2 rounded ${modoDark ? 'bg-gray-800' : 'bg-white'}`}>
                                            <div className="font-medium">Preço</div>
                                            <div className={modoDark ? 'text-gray-400' : 'text-gray-600'}>Use . como decimal</div>
                                        </div>
                                        <div className={`p-2 rounded ${modoDark ? 'bg-gray-800' : 'bg-white'}`}>
                                            <div className="font-medium">Qtd Mínima</div>
                                            <div className={modoDark ? 'text-gray-400' : 'text-gray-600'}>Usada para Notificações de Estoque</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {etapa === 'preview' && arquivo && (
                            <div className="space-y-6">
                                <div className={`rounded-xl p-4 ${modoDark ? 'bg-blue-500/10' : 'bg-blue-50'} border ${modoDark ? 'border-blue-500/30' : 'border-blue-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${modoDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                                {arquivo.name.endsWith('.csv') ? (
                                                    <FaFileCsv className={modoDark ? 'text-blue-400' : 'text-blue-500'} />
                                                ) : (
                                                    <FaFileExcel className={modoDark ? 'text-blue-400' : 'text-blue-500'} />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold ${temaAtual.text}`}>{arquivo.name}</h4>
                                                <p className={`text-sm ${modoDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {(arquivo.size / 1024).toFixed(2)} KB • {arquivo.name.endsWith('.csv') ? 'CSV' : 'Excel'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={abrirConversor}
                                                className={` cursor-pointer px-3 py-1 rounded-lg text-sm ${modoDark
                                                    ? 'hover:bg-emerald-500/20 text-emerald-400'
                                                    : 'hover:bg-emerald-100 text-emerald-600'
                                                    } flex items-center gap-1`}
                                            >
                                                <FaMagic className="text-xs" />
                                                {t('conversor.converter')}
                                            </button>
                                            <button
                                                onClick={resetar}
                                                className={`cursor-pointer px-3 py-1 rounded-lg text-sm ${modoDark ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-100 text-red-500'}`}
                                            >
                                                {t('upload.trocarArquivo')}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {previewData.length > 0 && (
                                    <div>
                                        <h4 className={`font-semibold mb-3 ${temaAtual.text}`}>
                                            {t('upload.preview')} (5 primeiras linhas)
                                        </h4>
                                        <div className={`rounded-lg border overflow-hidden ${modoDark ? 'border-gray-700' : 'border-gray-300'}`}>
                                            <div className="overflow-x-auto max-h-60">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className={`${modoDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
                                                            <th className="p-3 text-left font-medium">#</th>
                                                            <th className="p-3 text-left font-medium">{t('upload.conteudo')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {previewData.map((linha) => (
                                                            <tr
                                                                key={linha.linha}
                                                                className={`border-t ${modoDark ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'}`}
                                                            >
                                                                <td className={`p-3 ${linha.isCabecalho ? 'font-bold' : ''}`}>
                                                                    {linha.linha}
                                                                </td>
                                                                <td className={`p-3 font-mono text-xs ${linha.isCabecalho ? 'text-blue-500' : temaAtual.text} break-all`}>
                                                                    {linha.conteudo}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className={`rounded-xl p-4 ${modoDark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'} border`}>
                                    <div className="flex items-start gap-3">
                                        <FaExclamationTriangle className={`mt-1 ${modoDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                                        <div>
                                            <h5 className={`font-semibold ${temaAtual.text}`}>
                                                {t('upload.avisoValidacao')}
                                            </h5>
                                            <p className={`text-sm ${modoDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {t('upload.avisoValidacaoMensagem')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/30">
                                    <button
                                        onClick={resetar}
                                        className={`px-4 cursor-pointer py-2 rounded-lg ${modoDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                                    >
                                        {t('cancelar')}
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={isUploading || !empresaAtivada}
                                        className={`px-6 cursor-pointer py-2 rounded-lg font-medium flex items-center gap-2 ${empresaAtivada
                                            ? modoDark
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600'
                                                : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500'
                                            : 'bg-gray-400 cursor-not-allowed'
                                            } text-white transition-colors`}
                                    >
                                        {isUploading ? (
                                            <>
                                                <FaSpinner className="animate-spin" />
                                                {t('upload.processando')}
                                            </>
                                        ) : (
                                            <>
                                                <FaUpload />
                                                {t('upload.iniciarImportacao')}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {etapa === 'resultado' && estatisticas && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className={`rounded-xl p-4 ${modoDark ? 'bg-blue-500/10' : 'bg-blue-50'} border ${modoDark ? 'border-blue-500/30' : 'border-blue-200'}`}>
                                        <div className={`text-2xl font-bold mb-1 ${modoDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                            {estatisticas.total}
                                        </div>
                                        <div className={`text-sm ${modoDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {t('upload.totalProcessados')}
                                        </div>
                                    </div>

                                    <div className={`rounded-xl p-4 ${modoDark ? 'bg-green-500/10' : 'bg-green-50'} border ${modoDark ? 'border-green-500/30' : 'border-green-200'}`}>
                                        <div className={`text-2xl font-bold mb-1 ${modoDark ? 'text-green-400' : 'text-green-600'}`}>
                                            {estatisticas.criadosComSucesso}
                                        </div>
                                        <div className={`text-sm ${modoDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {t('upload.criadosComSucesso')}
                                        </div>
                                    </div>

                                    <div className={`rounded-xl p-4 ${modoDark ? 'bg-yellow-500/10' : 'bg-yellow-50'} border ${modoDark ? 'border-yellow-500/30' : 'border-yellow-200'}`}>
                                        <div className={`text-2xl font-bold mb-1 ${modoDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                            {estatisticas.comErros}
                                        </div>
                                        <div className={`text-sm ${modoDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {t('upload.comErrosValidacao')}
                                        </div>
                                    </div>

                                    <div className={`rounded-xl p-4 ${modoDark ? 'bg-red-500/10' : 'bg-red-50'} border ${modoDark ? 'border-red-500/30' : 'border-red-200'}`}>
                                        <div className={`text-2xl font-bold mb-1 ${modoDark ? 'text-red-400' : 'text-red-600'}`}>
                                            {estatisticas.errosCriacao}
                                        </div>
                                        <div className={`text-sm ${modoDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {t('upload.errosCriacao')}
                                        </div>
                                    </div>
                                </div>

                                {estatisticas.erros.length > 0 && (
                                    <div>
                                        <h4 className={`font-semibold mb-3 ${temaAtual.text}`}>
                                            {t('upload.errosEncontrados')}
                                        </h4>
                                        <div className={`rounded-lg border p-4 max-h-60 overflow-y-auto ${modoDark ? 'border-red-500/30 bg-red-500/5' : 'border-red-200 bg-red-50'}`}>
                                            <ul className="space-y-2">
                                                {estatisticas.erros.slice(0, 20).map((erro: string, index: number) => (
                                                    <li key={index} className={`text-sm ${modoDark ? 'text-red-300' : 'text-red-600'}`}>
                                                        • {erro}
                                                    </li>
                                                ))}
                                                {estatisticas.erros.length > 20 && (
                                                    <li className={`text-sm ${modoDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        ... e mais {estatisticas.erros.length - 20} erros
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}

                                {estatisticas.comErros > 0 && (
                                    <div className={`rounded-xl p-4 ${modoDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-200'} border`}>
                                        <div className="flex items-start gap-3">
                                            <FaMagic className={`mt-1 ${modoDark ? 'text-purple-400' : 'text-white'}`} />
                                            <div>
                                                <h5 className={`font-semibold ${temaAtual.text}`}>
                                                    {t('conversor.sugestaoTitulo')}
                                                </h5>
                                                <p className={`text-sm ${modoDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                                    {t('conversor.sugestaoMensagem')}
                                                </p>
                                                <button
                                                    onClick={abrirConversor}
                                                    className={`mt-2 px-4 py-2 rounded-lg text-sm ${modoDark
                                                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600'
                                                        : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500'
                                                        } text-white transition-colors`}
                                                >
                                                    <FaArrowRight className="inline mr-2" />
                                                    {t('conversor.usarConversor')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between pt-4 border-t border-gray-700/30">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className={`px-4 py-2 rounded-lg ${modoDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                                    >
                                        {t('upload.voltarListagem')}
                                    </button>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={resetar}
                                            className={`px-4 py-2 rounded-lg ${modoDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} transition-colors`}
                                        >
                                            {t('upload.novaImportacao')}
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            className={`px-6 py-2 rounded-lg font-medium ${modoDark
                                                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600'
                                                : 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500'
                                                } text-white transition-colors`}
                                        >
                                            {t('upload.concluir')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </>
    );
}
