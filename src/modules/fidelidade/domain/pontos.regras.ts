export const PONTOS_POR_REAL = 1;
export const VALOR_PONTO_EM_CENTAVOS = 10;
export const VERSAO_TERMO_ATUAL = 'v1.0';
export const BASE_LEGAL_FIDELIDADE = 'Consentimento (LGPD, art. 7º, I)';

export const pontosGanhos = (totalEmReais: number): number =>
  Math.floor(totalEmReais * PONTOS_POR_REAL);

export const descontoDosPontosEmCentavos = (pontos: number): number =>
  pontos * VALOR_PONTO_EM_CENTAVOS;
