export type StatusOcorrencia = "aberto" | "em_execucao" | "resolvido";

export type Ocorrencia = {
  id: string;
  titulo: string;
  descricao?: string;
  status: StatusOcorrencia;
  latitude: number;
  longitude: number;
  // Campos abaixo são opcionais ("?"): reportes antigos podem não ter.
  // [EXTRA] usados na lista de reportes (Desafio 2).
  tipo?: string; // buraco, calcada, iluminacao ou outro
  endereco?: string; // endereço escrito, gravado no Desafio 1
  idNotificante?: string; // uid de quem criou (serve para "Meus reportes")
  criadoEm?: Date; // data de criação, já convertida de Timestamp para Date
};
