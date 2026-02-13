import { useState } from 'react';
import { FaBox, FaArchive, FaTimes, FaInfoCircle, FaHistory, FaExclamationTriangle } from 'react-icons/fa';
import Swal from 'sweetalert2';

interface ArquivarProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  produto: {
    id: string;
    nome: string;
    quantidade: number;
  };
  modoDark: boolean;
  onConfirm: (motivo: string) => Promise<void>;
}

export default function ArquivarProdutoModal({
  isOpen,
  onClose,
  produto,
  modoDark,
  onConfirm
}: ArquivarProdutoModalProps) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const temaAtual = modoDark ? {
    fundo: '#1e293b',
    texto: '#f8fafc',
    card: '#334155',
    borda: '#475569',
    primario: '#3b82f6',
  } : {
    fundo: '#ffffff',
    texto: '#0f172a',
    card: '#f8fafc',
    borda: '#e2e8f0',
    primario: '#2563eb',
  };

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      Swal.fire({
        title: 'Motivo necessário',
        text: 'Por favor, informe o motivo do arquivamento',
        icon: 'warning',
        background: modoDark ? temaAtual.fundo : '#ffffff',
        color: modoDark ? temaAtual.texto : '#0f172a',
      });
      return;
    }

    try {
      setLoading(true);
      await onConfirm(motivo);
      onClose();
    } catch (error) {
      console.error('Erro ao arquivar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className={`rounded-2xl w-full max-w-md overflow-hidden border ${modoDark ? 'border-blue-500/30' : 'border-blue-200'} shadow-2xl`}
        style={{
          background: modoDark 
            ? 'linear-gradient(135deg, #1e293b, #0f172a)' 
            : 'linear-gradient(135deg, #ffffff, #f8fafc)'
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${modoDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <FaArchive className={`text-xl ${modoDark ? 'text-blue-400' : 'text-blue-500'}`} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${modoDark ? 'text-white' : 'text-slate-900'}`}>
                  Arquivar Produto
                </h2>
                <p className={`text-sm ${modoDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  {produto.nome}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${modoDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} transition-colors`}
            >
              <FaTimes className={modoDark ? 'text-slate-400' : 'text-slate-600'} />
            </button>
          </div>

          <div className={`mb-6 p-4 rounded-xl ${modoDark ? 'bg-slate-800/50' : 'bg-blue-50/50'} border ${modoDark ? 'border-slate-700' : 'border-blue-100'}`}>
            <div className="flex items-start gap-3">
              <FaInfoCircle className={`mt-1 ${modoDark ? 'text-blue-400' : 'text-blue-500'}`} />
              <div>
                <p className={`text-sm ${modoDark ? 'text-slate-300' : 'text-slate-700'} mb-2`}>
                  Ao arquivar um produto:
                </p>
                <ul className={`text-xs space-y-1 ${modoDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  <li className="flex items-center gap-2">
                    <FaBox className="text-xs" />
                    <span>O produto será removido da listagem principal</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaHistory className="text-xs" />
                    <span>Todas as vendas e movimentações serão preservadas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FaExclamationTriangle className="text-xs" />
                    <span>O produto poderá ser restaurado futuramente</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block ${modoDark ? 'text-slate-300' : 'text-slate-700'} mb-2 text-sm font-medium`}>
                Motivo do arquivamento *
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Produto descontinuado, substituído por novo modelo, etc."
                rows={3}
                className={`w-full rounded-xl px-4 py-3 ${modoDark ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none`}
                maxLength={255}
              />
              <p className={`text-right text-xs mt-1 ${modoDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {motivo.length}/255 caracteres
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={onClose}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all ${modoDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !motivo.trim()}
                className="flex-1 px-4 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)'
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Arquivando...
                  </div>
                ) : (
                  'Confirmar Arquivamento'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}