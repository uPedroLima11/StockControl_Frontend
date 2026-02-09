export class ParseUtils {
  static parseCurrency(value: any): number {
    if (value === null || value === undefined) return 0;
    
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : parseFloat(value.toFixed(2));
    }
    
    const str = String(value).trim();
    if (!str) return 0;
    
    const zerosValidos = [
      '0', '0,00', '0.00', 
      'R$ 0,00', 'R$0,00', 'R$ 0.00', 'R$0.00',
      '$0.00', '$ 0.00', '$0,00', '$ 0,00',
      '€0.00', '€ 0.00', '€0,00', '€ 0,00'
    ];
    
    if (zerosValidos.includes(str)) {
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
  

  static parseInteger(value: any): number {
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