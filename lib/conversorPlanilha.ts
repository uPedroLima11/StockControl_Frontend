import * as XLSX from 'xlsx';
import Papa, { ParseResult } from 'papaparse';

export interface ColunaTemplate {
  id: string;
  obrigatorio: boolean;
  descricao: string;
  maxCaracteres?: number;
  tipo?: 'string' | 'number' | 'integer' | 'currency' | 'decimal';
}

export const COLUNAS_TEMPLATE: ColunaTemplate[] = [
  { id: 'Nome', obrigatorio: true, descricao: 'Nome do produto', maxCaracteres: 60, tipo: 'string' },
  { id: 'Descricao', obrigatorio: true, descricao: 'Descrição do produto', maxCaracteres: 255, tipo: 'string' },
  { id: 'Preco', obrigatorio: false, descricao: 'Preço do produto (aceita R$, $, vírgulas e pontos)', tipo: 'currency' },
  { id: 'Quantidade', obrigatorio: false, descricao: 'Quantidade em estoque', tipo: 'integer' },
];

export class ConversorPlanilha {
  static async processarArquivo(file: File): Promise<{
    colunasOriginais: string[];
    dadosOriginais: Record<string, any>[];
    erro?: string;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const extensao = file.name.split('.').pop()?.toLowerCase() || '';

      reader.onload = (e) => {
        try {
          if (extensao === 'csv') {
            this.processarCSV(e.target?.result as string, resolve, reject);
          } else if (extensao === 'xlsx' || extensao === 'xls') {
            this.processarExcel(e.target?.result as ArrayBuffer, resolve, reject);
          } else {
            reject(new Error('Formato não suportado. Use .csv, .xlsx ou .xls'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));

      if (extensao === 'csv') {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }

  private static processarCSV(
    conteudo: string,
    resolve: (value: { colunasOriginais: string[]; dadosOriginais: Record<string, any>[]; erro?: string }) => void,
    reject: (reason?: any) => void
  ) {
    Papa.parse(conteudo, {
      header: true,
      skipEmptyLines: true,
      complete: (result: ParseResult<any>) => {
        if (result.errors.length > 0) {
          reject(new Error('Erro ao processar CSV'));
          return;
        }

        const dados = result.data;
        if (dados.length === 0) {
          reject(new Error('Arquivo CSV vazio'));
          return;
        }

        const colunas = Object.keys(dados[0]);
        resolve({ colunasOriginais: colunas, dadosOriginais: dados });
      },
      error: (error: any) => reject(error),
    });
  }

  private static processarExcel(
    buffer: ArrayBuffer,
    resolve: Function,
    reject: Function
  ) {
    try {
      const workbook = XLSX.read(buffer, { type: 'array', cellText: false, cellDates: true });
      const primeiraAba = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[primeiraAba];
      
      const dados = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: '',
        dateNF: 'dd/mm/yyyy'
      }) as Record<string, any>[];

      if (dados.length === 0) {
        reject(new Error('Planilha Excel vazia'));
        return;
      }

      const colunas = Object.keys(dados[0]);
      resolve({ colunasOriginais: colunas, dadosOriginais: dados });
    } catch (error) {
      reject(new Error('Erro ao processar Excel'));
    }
  }

  static sugerirMapeamento(colunasOriginais: string[]): Record<string, string | null> {
    const mapeamento: Record<string, string | null> = {};

    COLUNAS_TEMPLATE.forEach((colunaTemplate) => {
      const colunaEncontrada = colunasOriginais.find((colOriginal) => {
        const colOriginalLower = colOriginal.toLowerCase();
        const colTemplateLower = colunaTemplate.id.toLowerCase();

        if (colunaTemplate.id === 'Nome') {
          return colOriginalLower.includes('nome') ||
                 colOriginalLower.includes('produto') ||
                 colOriginalLower.includes('item') ||
                 colOriginalLower.includes('descricao curta') ||
                 colOriginalLower.includes('product') ||
                 colOriginalLower.includes('name');
        }
        
        if (colunaTemplate.id === 'Descricao') {
          return colOriginalLower.includes('descricao') ||
                 colOriginalLower.includes('detalhe') ||
                 colOriginalLower.includes('info') ||
                 colOriginalLower.includes('observacao') ||
                 colOriginalLower.includes('description') ||
                 colOriginalLower.includes('details') ||
                 colOriginalLower.includes('obs');
        }
        
        if (colunaTemplate.id === 'Preco') {
          return colOriginalLower.includes('preco') ||
                 colOriginalLower.includes('preço') ||
                 colOriginalLower.includes('valor') ||
                 colOriginalLower.includes('price') ||
                 colOriginalLower.includes('custo') ||
                 colOriginalLower.includes('valor') ||
                 colOriginalLower.includes('vlr') ||
                 colOriginalLower.includes('venda') ||
                 colOriginalLower.includes('unitario') ||
                 colOriginalLower.includes('unitário') ||
                 colOriginalLower.includes('unit');
        }
        
        if (colunaTemplate.id === 'Quantidade') {
          return colOriginalLower.includes('quantidade') ||
                 colOriginalLower.includes('qtd') ||
                 colOriginalLower.includes('estoque') ||
                 colOriginalLower.includes('stock') ||
                 colOriginalLower.includes('disponivel') ||
                 colOriginalLower.includes('qtde') ||
                 colOriginalLower.includes('qty') ||
                 colOriginalLower.includes('amount') ||
                 colOriginalLower.includes('quant');
        }
        
        return colOriginalLower.includes(colTemplateLower);
      });

      mapeamento[colunaTemplate.id] = colunaEncontrada || null;
    });

    return mapeamento;
  }

  static converterDados(
    dadosOriginais: Record<string, any>[],
    mapeamento: Record<string, string | null>
  ): {
    dadosConvertidos: Record<string, any>[];
    estatisticas: {
      total: number;
      convertidos: number;
      comErros: number;
      erros: string[];
    };
  } {
    const dadosConvertidos: Record<string, any>[] = [];
    const errosGerais: string[] = [];
    let comErros = 0;

    dadosOriginais.forEach((linhaOriginal, index) => {
      const linhaConvertida: Record<string, any> = {};
      const errosLinha: string[] = [];
      const numeroLinha = index + 2;

      COLUNAS_TEMPLATE.forEach((colunaTemplate) => {
        const colunaMapeada = mapeamento[colunaTemplate.id];
        let valor: any = '';

        if (colunaMapeada && linhaOriginal[colunaMapeada] !== undefined) {
          valor = linhaOriginal[colunaMapeada];
        }

        let valorProcessado: any;
        
        switch (colunaTemplate.id) {
          case 'Nome':
            valorProcessado = String(valor || '').trim().substring(0, colunaTemplate.maxCaracteres || 60);
            if (!valorProcessado && colunaTemplate.obrigatorio) {
              errosLinha.push(`Linha ${numeroLinha}: Nome é obrigatório`);
            }
            break;

          case 'Descricao':
            valorProcessado = String(valor || '').trim().substring(0, colunaTemplate.maxCaracteres || 255);
            if (!valorProcessado && colunaTemplate.obrigatorio) {
              const nome = linhaConvertida['Nome'] || '';
              valorProcessado = nome ? `Produto: ${nome}` : 'Produto sem descrição';
            }
            break;

          case 'Preco':
            if (valor === '' || valor === null || valor === undefined) {
              valorProcessado = 0;
            } else {
              valorProcessado = this.parseCurrency(valor);
              
              const strValor = String(valor).trim().toLowerCase();
              const ehZeroValido = strValor === '' || 
                                  strValor === '0' || 
                                  strValor === '0,00' || 
                                  strValor === '0.00' ||
                                  strValor === 'r$ 0,00' ||
                                  strValor === '$0.00' ||
                                  strValor === 'r$0,00' ||
                                  strValor === '$0,00';
              
              if (valorProcessado === 0 && !ehZeroValido && /\d/.test(strValor.replace(/[^\d]/g, ''))) {
                const temApenasZeros = /^0+$/.test(strValor.replace(/[^\d]/g, ''));
                if (!temApenasZeros) {
                  errosLinha.push(`Linha ${numeroLinha}: Preço não reconhecido "${valor}" (será 0)`);
                }
              }
              
              valorProcessado = parseFloat(valorProcessado.toFixed(2));
            }
            break;

          case 'Quantidade':
            if (valor === '' || valor === null || valor === undefined) {
              valorProcessado = 0;
            } else {
              valorProcessado = this.parseInteger(valor);
              if (isNaN(valorProcessado)) {
                errosLinha.push(`Linha ${numeroLinha}: Quantidade inválida "${valor}"`);
                valorProcessado = 0;
              }
            }
            break;
        }

        linhaConvertida[colunaTemplate.id] = valorProcessado;
      });

      linhaConvertida['Quantidade_Minima'] = 10;
      
      if (errosLinha.length > 0) {
        comErros++;
        errosGerais.push(...errosLinha);
        linhaConvertida['_erros'] = errosLinha;
        linhaConvertida['_temErros'] = true;
      }

      dadosConvertidos.push(linhaConvertida);
    });

    return {
      dadosConvertidos,
      estatisticas: {
        total: dadosOriginais.length,
        convertidos: dadosConvertidos.length - comErros,
        comErros,
        erros: errosGerais,
      },
    };
  }

  static gerarCSV(dados: Record<string, any>[]): string {
    if (dados.length === 0) return '';

    const cabecalhoColunas = [...COLUNAS_TEMPLATE.map(col => col.id), 'Quantidade_Minima'];
    const cabecalho = cabecalhoColunas.join(',');

    const linhas = dados.map(linha => {
      return cabecalhoColunas.map(col => {
        const valor = linha[col];
        const valorStr = String(valor);
        if (valorStr.includes(',') || valorStr.includes('"') || valorStr.includes('\n') || valorStr.includes('\r')) {
          return `"${valorStr.replace(/"/g, '""')}"`;
        }
        return valorStr;
      }).join(',');
    });

    return [cabecalho, ...linhas].join('\n');
  }

  static baixarCSV(dados: Record<string, any>[], nomeArquivo: string = 'template_stockcontrol.csv') {
    const csvContent = this.gerarCSV(dados);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private static parseCurrency(value: any): number {
    if (value === null || value === undefined) return 0;
    
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : parseFloat(value.toFixed(2));
    }
    
    const str = String(value).trim();
    if (!str) return 0;
    
    if (str === '0' || str === '0,00' || str === '0.00' || 
        str === 'R$ 0,00' || str === 'R$0,00' || 
        str === '$0.00' || str === '$ 0.00') {
      return 0;
    }
    
    let cleaned = str.replace(/[^\d,\-.]/g, '');
    
    if (!cleaned.match(/\d/)) return 0;
    
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '');
      cleaned = cleaned.replace(',', '.');
    }
    else if (lastDot > lastComma) {
      cleaned = cleaned.replace(/,/g, '');
    }
    else if (lastComma !== -1) {
      cleaned = cleaned.replace(',', '.');
    }
    
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + parts[1] + '.' + parts.slice(2).join('');
    }
    
    const result = parseFloat(cleaned);
    return isNaN(result) ? 0 : parseFloat(result.toFixed(2));
  }
  
  private static parseInteger(value: any): number {
    if (value === null || value === undefined) return 0;
    
    if (typeof value === 'number') {
      return Math.round(value);
    }
    
    const str = String(value).trim();
    const match = str.match(/-?\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return isNaN(num) ? 0 : num;
    }
    
    return 0;
  }
}