import { Coordenadas } from "@/context/cidade-context";
import { bancoDeDados } from "@/firebase-config";
import { Ocorrencia } from "@/types/ocorrencia";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

// ---------------------------------------------------------------------------
// ENTENDENDO ESTE ARQUIVO
// Antes, esta função devolvia reportes "de mentira" (uma lista MOCK escrita no
// código). Agora ela vai até o Firestore, lê os reportes de verdade e devolve
// no mesmo formato (Ocorrencia). Por isso as telas não precisaram mudar: elas
// só pedem "buscarOcorrencias" e não sabem de onde os dados vêm.
// ---------------------------------------------------------------------------

/**
 * Busca no Firebase os últimos 50 reportes, do mais novo para o mais antigo.
 * O parâmetro `_centro` ainda não é usado (desafio extra: filtrar por proximidade).
 * (O "_" no começo do nome é um aviso: "existe, mas não estou usando".)
 */
export async function buscarOcorrencias(_centro: Coordenadas): Promise<Ocorrencia[]> {
  // query() monta o "pedido" ao banco, sem executá-lo ainda:
  //  - collection(...): de qual coleção ler ("ocorrencias");
  //  - orderBy("criadoEm", "desc"): ordenar pela data, do mais novo ao mais antigo;
  //  - limit(50): trazer no máximo 50 (para não baixar o banco inteiro).
  const consulta = query(
    collection(bancoDeDados, "ocorrencias"),
    orderBy("criadoEm", "desc"),
    limit(50),
  );

  // getDocs() executa o pedido (vai à internet, por isso o await).
  // O resultado traz uma lista de documentos em `resultado.docs`.
  const resultado = await getDocs(consulta);

  // .map() percorre a lista e transforma cada documento do Firestore no formato
  // Ocorrencia que o app usa.
  return resultado.docs.map((documento) => {
    // .data() devolve os campos do documento (titulo, status, latitude...).
    const dados = documento.data();
    return {
      id: documento.id, // o id automático NÃO fica dentro de data(); vem do documento
      titulo: dados.titulo,
      // "?? undefined": se a descrição for null (vazia), vira undefined, que é
      // o que o tipo Ocorrencia espera.
      descricao: dados.descricao ?? undefined,
      status: dados.status,
      latitude: dados.latitude,
      longitude: dados.longitude,
      // [EXTRA] campos que o Desafio 1 gravou e agora também mostramos:
      tipo: dados.tipo ?? undefined,
      endereco: dados.endereco ?? undefined,
      idNotificante: dados.idNotificante ?? undefined,
      // [EXTRA] criadoEm chega do Firestore como "Timestamp" (formato do Firebase).
      // .toDate() converte para Date, que o JavaScript sabe formatar.
      // O "?." evita erro se o campo não existir.
      criadoEm: dados.criadoEm?.toDate?.(),
    };
  });
}
