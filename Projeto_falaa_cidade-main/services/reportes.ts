import { bancoDeDados } from "@/firebase-config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// ENTENDENDO ESTE ARQUIVO (um "serviço")
// A tela (novo-reporte.tsx) cuida só do visual: campos, botões, alertas.
// Este arquivo cuida só de conversar com o banco. Separar assim deixa o código
// organizado: se um dia o banco mudar, só mexemos aqui e a tela nem percebe.
// ---------------------------------------------------------------------------

// [EXTRA] Os tipos de problema que o usuário pode escolher.
// "as const" diz ao TypeScript: esta lista não muda e os valores são exatamente
// estes textos (assim ele avisa se alguém escrever "burako" por engano).
export const TIPOS_DE_REPORTE = [
  { valor: "buraco", rotulo: "Buraco" },
  { valor: "calcada", rotulo: "Calçada" },
  { valor: "iluminacao", rotulo: "Iluminação" },
  { valor: "outro", rotulo: "Outro" },
] as const;

// Pega só os "valor" da lista acima: "buraco" | "calcada" | "iluminacao" | "outro"
export type TipoDeReporte = (typeof TIPOS_DE_REPORTE)[number]["valor"];

// "type" descreve o formato de um objeto: quais campos ele tem e de que tipo
// cada um é. É como a "ficha" que a tela precisa preencher para pedir a gravação.
export type DadosDoReporte = {
  idNotificante: string; // uid de quem está reportando (identificador único do usuário logado)
  titulo: string;
  descricao: string;
  tipo: TipoDeReporte; // [EXTRA] categoria do problema
  endereco: string | null; // [EXTRA] rua/bairro; null se não conseguimos descobrir
  latitude: number;
  longitude: number;
};

/**
 * Grava um reporte na coleção "ocorrencias" e devolve o id do documento criado.
 *
 * Vocabulário do Firestore:
 *  - coleção  = uma "pasta" de registros (aqui: "ocorrencias");
 *  - documento = um registro dentro da coleção (aqui: um reporte);
 *  - campos   = as informações do documento (titulo, status, latitude...).
 *
 * "async/await": gravar na internet demora. `await` significa "espere terminar
 * antes de continuar"; por isso a função é `async` e devolve uma Promise
 * (uma "promessa" de que o resultado vem depois).
 */
export async function criarReporte(dados: DadosDoReporte): Promise<string> {
  // collection(banco, "ocorrencias") aponta para a coleção.
  // addDoc cria um documento NOVO nela, com um id gerado automaticamente.
  const documento = await addDoc(collection(bancoDeDados, "ocorrencias"), {
    idNotificante: dados.idNotificante,
    // .trim() tira espaços sobrando no começo e no fim do texto.
    titulo: dados.titulo.trim(),
    // Se a descrição ficar vazia, o "|| null" grava null (vazio de verdade)
    // em vez de um texto em branco.
    descricao: dados.descricao.trim() || null,
    tipo: dados.tipo,
    endereco: dados.endereco,
    // Todo reporte nasce "aberto" (ainda ninguém resolveu).
    status: "aberto",
    latitude: dados.latitude,
    longitude: dados.longitude,
    // serverTimestamp() = "use a hora do servidor do Firebase". É melhor que a
    // hora do celular, que pode estar errada ou ser manipulada.
    criadoEm: serverTimestamp(),
  });

  return documento.id;
}
