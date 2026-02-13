import { useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import { ProdutoI, VerificacaoVinculacoesI, PaginacaoProdutosI } from '@/utils/types/produtos';

export const useProdutos = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getUsuarioId = useCallback(() => {
        const usuarioSalvo = localStorage.getItem("client_key");
        if (!usuarioSalvo) throw new Error("Usuário não autenticado");
        return usuarioSalvo.replace(/"/g, "");
    }, []);

    const getHeaders = useCallback(() => {
        const usuarioId = getUsuarioId();
        const token = Cookies.get("token");

        if (!token) {
            throw new Error("Token não encontrado");
        }

        return {
            'Content-Type': 'application/json',
            'user-id': usuarioId,
            'Authorization': `Bearer ${token}`,
        };
    }, [getUsuarioId]);



    const verificarVinculacoes = useCallback(async (produtoId: string): Promise<VerificacaoVinculacoesI> => {
        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_URL_API}/produtos/${produtoId}/vinculacoes`,
                {
                    headers: getHeaders(),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao verificar vinculações: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);


    const arquivarProduto = useCallback(async (
        produtoId: string,
        motivo?: string
    ): Promise<ProdutoI> => {
        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_URL_API}/produtos/${produtoId}/arquivar`,
                {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({ motivo }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro ao arquivar produto: ${response.status}`);
            }

            const data = await response.json();
            return data.produto;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    const excluirProduto = useCallback(async (produtoId: string): Promise<void> => {
        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_URL_API}/produtos/${produtoId}`,
                {
                    method: 'DELETE',
                    headers: getHeaders(),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro ao excluir produto: ${response.status}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);


    const restaurarProduto = useCallback(async (produtoId: string): Promise<ProdutoI> => {
        try {
            setLoading(true);

            const produtoIdNum = parseInt(produtoId);
            if (isNaN(produtoIdNum)) {
                throw new Error(`ID do produto inválido: "${produtoId}"`);
            }

            const url = `${process.env.NEXT_PUBLIC_URL_API}/produtos/${produtoIdNum}/restaurar`;
            const headers = getHeaders();

            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({}),
                redirect: 'manual',
            });

            if (response.type === 'opaqueredirect' || response.status === 301 || response.status === 302) {
                throw new Error('A requisição foi redirecionada.');
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data.produto;

        } catch (err) {
            const mensagemErro = err instanceof Error ? err.message : 'Erro desconhecido';
            console.error(`Erro ao restaurar produto ${produtoId}:`, mensagemErro);

            if (mensagemErro.includes('404')) {
                throw new Error(`Rota não encontrada.`);
            }

            setError(mensagemErro);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);

    const verificarVinculacoesMultiplas = useCallback(async (produtoIds: string[]): Promise<{
        id: string;
        podeExcluir: boolean;
    }[]> => {
        try {
            setLoading(true);
            setError(null);

            const resultados = [];

            for (const produtoId of produtoIds) {
                try {
                    const response = await fetch(
                        `${process.env.NEXT_PUBLIC_URL_API}/produtos/${produtoId}/vinculacoes`,
                        {
                            headers: getHeaders(),
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        resultados.push({
                            id: produtoId,
                            podeExcluir: data.podeExcluir
                        });
                    } else {
                        resultados.push({
                            id: produtoId,
                            podeExcluir: false
                        });
                    }
                } catch {
                    resultados.push({
                        id: produtoId,
                        podeExcluir: false
                    });
                }
            }

            return resultados;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);


    const listarArquivados = useCallback(async (
        empresaId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<PaginacaoProdutosI> => {
        try {
            setLoading(true);

            const validPage = Math.max(1, page);
            const validLimit = Math.min(Math.max(1, limit), 100);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_URL_API}/produtos/arquivados/${empresaId}?page=${validPage}&limit=${validLimit}`,
                {
                    headers: getHeaders(),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao listar produtos arquivados: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);


    const excluirMultiplosProdutos = useCallback(async (
        produtoIds: string[],
        acao: 'excluir' | 'arquivar' = 'arquivar'
    ): Promise<{
        mensagem: string;
        resultados: Array<{
            id: string;
            nome: string;
            sucesso: boolean;
            acao?: string;
            motivo?: string;
            erro?: string;
        }>;
    }> => {
        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_URL_API}/produtos/multiplos`,
                {
                    method: 'DELETE',
                    headers: getHeaders(),
                    body: JSON.stringify({ ids: produtoIds, acao }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Erro ao excluir produtos: ${response.status}`);
            }

            return await response.json();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            throw err;
        } finally {
            setLoading(false);
        }
    }, [getHeaders]);


    const mostrarModalExclusaoInteligente = useCallback(async (
        produto: ProdutoI,
        modoDark: boolean,
        t: (key: string, params?: Record<string, string | number>) => string,
        onConfirm: (acao: 'excluir' | 'arquivar') => Promise<void>
    ) => {
        try {
            const verificacao = await verificarVinculacoes(produto.id);

            if (verificacao.podeExcluir) {
                const result = await Swal.fire({
                    title: t("confirmacaoExclusao.titulo"),
                    text: t("confirmacaoExclusao.mensagem", { produto: produto.nome }),
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    cancelButtonColor: "#d33",
                    confirmButtonText: t("confirmacaoExclusao.botaoConfirmar"),
                    cancelButtonText: t("confirmacaoExclusao.botaoCancelar"),
                    background: modoDark ? "#1e293b" : "#FFFFFF",
                    color: modoDark ? "#f8fafc" : "#0f172a",
                    showDenyButton: false,
                });

                if (result.isConfirmed) {
                    await onConfirm('excluir');
                }
            } else {
                const vinculacoesTexto = verificacao.vinculacoes
                    .map(v => `• ${t(`vinculacoes.${v.tipo}`)}: ${v.quantidade}`)
                    .join('\n');

                const result = await Swal.fire({
                    title: 'Não é possível excluir',
                    html: `
                        <div class="text-left">
                            <p class="mb-3">O produto "<strong>${produto.nome}</strong>" possui vinculações ativas no sistema.</p>
                            <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-3">
                                <p class="font-semibold text-red-600 dark:text-red-400 mb-2">Vinculações encontradas:</p>
                                <pre class="text-sm whitespace-pre-line">${vinculacoesTexto}</pre>
                            </div>
                            <p class="text-sm mb-4">Recomendamos arquivar o produto para manter o histórico completo.</p>
                        </div>
                    `,
                    icon: "error",
                    showCancelButton: true,
                    confirmButtonText: "Arquivar produto",
                    cancelButtonText: "Cancelar",
                    confirmButtonColor: "#0ea5e9",
                    cancelButtonColor: "#6b7280",
                    background: modoDark ? "#1e293b" : "#FFFFFF",
                    color: modoDark ? "#f8fafc" : "#0f172a",
                    showDenyButton: true,
                    denyButtonText: "Ver detalhes",
                    denyButtonColor: "#8b5cf6",
                });

                if (result.isConfirmed) {
                    await onConfirm('arquivar');
                } else if (result.isDenied) {
                    await Swal.fire({
                        title: "Detalhes das Vinculações",
                        html: `
                            <div class="text-left">
                                <p class="mb-4">O produto "<strong>${produto.nome}</strong>" está vinculado aos seguintes registros:</p>
                                <div class="space-y-3">
                                    ${verificacao.vinculacoes.map(v => `
                                        <div class="p-3 border rounded-lg bg-slate-50 dark:bg-slate-800">
                                            <div class="flex justify-between items-center mb-2">
                                                <span class="font-semibold">${t(`vinculacoes.${v.tipo}`)}</span>
                                                <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm">
                                                    ${v.quantidade} registros
                                                </span>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `,
                        icon: "info",
                        confirmButtonText: "Entendi",
                        background: modoDark ? "#1e293b" : "#FFFFFF",
                        color: modoDark ? "#f8fafc" : "#0f172a",
                        width: '800px',
                    });
                }
            }
        } catch (error) {
            console.error("Erro ao mostrar modal de exclusão:", error);
            Swal.fire({
                title: "Erro",
                text: "Não foi possível verificar as vinculações do produto",
                icon: "error",
                background: modoDark ? "#1e293b" : "#FFFFFF",
                color: modoDark ? "#f8fafc" : "#0f172a",
            });
        }
    }, [verificarVinculacoes]);

    return {
        loading,
        error,
        verificarVinculacoes,
        arquivarProduto,
        excluirProduto,
        restaurarProduto,
        listarArquivados,
        excluirMultiplosProdutos,
        mostrarModalExclusaoInteligente,
        verificarVinculacoesMultiplas,
    };
};