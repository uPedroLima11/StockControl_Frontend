export type TipoUsuario = 'ADMIN' | 'FUNCIONARIO' | 'PROPRIETARIO';

export interface UsuarioI {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  recuperacao?: string;
  tipo: string; 
  empresaId?: string | null;
  permissoesPersonalizadas?: boolean;
  emailVerificado?: boolean;
  codigoVerificacao?: string;
  codigoExpiracao?: Date;
  doisFAToken?: string;
  doisFAExpiracao?: Date;
  doisFAAprovado?: boolean;
  doisFADataAprovado?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

