export interface LinhaOriginal {
  [key: string]: unknown;
}

export interface LinhaConvertida {
  Nome: string;
  Descricao: string;
  Preco: number;
  Quantidade: number;
  erros?: string[];
}

export interface MapeamentoColuna {
  colunaTemplate: string;
  colunaOriginal: string | null;
  obrigatorio: boolean;
  descricao: string;
}

export interface EstatisticasConversao {
  totalLinhas: number;
  linhasConvertidas: number;
  linhasComErros: number;
  camposObrigatoriosPreenchidos: number;
}

export interface PreviewData {
  colunasOriginais: string[];
  primeirasLinhas: LinhaOriginal[];
  mapeamento: Record<string, string | null>;
}

export interface DebugInfo {
  coluna: string;
  valor: unknown;
  processado: unknown;
  tipo: string;
  status: 'ok' | 'erro' | 'aviso';
}

export interface ParseResult {
  original: unknown;
  processado: number;
  metodo: string;
  sucesso: boolean;
}

export interface FormatosSuportados {
  preco: string[];
  quantidade: string[];
  exemplos: {
    entrada: string;
    saida: number;
    descricao: string;
  }[];
}