import { CategoriaI } from "./categoria";
import { FornecedorI } from "./fornecedor";
import { UsuarioI } from "./usuario";

export interface ProdutoI {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  quantidade: number;
  quantidadeMin: number;
  foto: string | null;
  noCatalogo: boolean;
  fornecedorId: string | null;
  categoriaId: string | null;
  empresaId: string | null;
  usuarioId: string | null;
  createdAt: Date;
  updatedAt: Date;

  ativo?: boolean;
  arquivado?: boolean;
  dataArquivamento?: Date | null;
  motivoArquivamento?: string | null;
  usuarioArquivouId?: string | null;
  usuarioArquivou?: UsuarioI | null;

  saldoAtual?: number;

  fornecedor?: FornecedorI;
  categoria?: CategoriaI;
  empresa?: string;
}

export interface VinculacaoProdutoI {
  tipo: 'VENDA' | 'MOVIMENTACAO' | 'PEDIDO' | 'INVENTARIO' | 'NOTIFICACAO';
  quantidade: number;
  detalhes?: Record<string, string | number | boolean | null>;
}

export interface VerificacaoVinculacoesI {
  podeExcluir: boolean;
  vinculacoes: VinculacaoProdutoI[];
  totalVinculacoes: number;
  acoesPossiveis: {
    podeExcluir: boolean;
    podeArquivar: boolean;
    podeRestaurar: boolean;
  };
}

export interface ProdutoArquivadoI extends ProdutoI {
  dataArquivamento: Date;
  motivoArquivamento: string;
  usuarioArquivou: UsuarioI | null;
}

export interface PaginacaoProdutosI {
  produtos: ProdutoI[];
  paginacao: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}