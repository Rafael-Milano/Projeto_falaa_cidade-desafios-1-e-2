import { Coordenadas } from "@/context/cidade-context";
import { buscarOcorrencias } from "@/services/ocorrencias";
import { Ocorrencia } from "@/types/ocorrencia";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/**
 * Carrega as ocorrências. A busca roda toda vez que a tela volta a ficar em foco,
 * assim um reporte recém-criado já aparece ao voltar da tela "Novo reporte".
 *
 * Antes era um useEffect, que só rodava quando as coordenadas mudavam. O
 * useFocusEffect roda também quando voltamos de outra tela (ficar "em foco"
 * = estar visível para o usuário).
 */
export function useOcorrencias(coordenadas: Coordenadas | null) {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(false); // busca automática
  const [atualizando, setAtualizando] = useState(false); // [EXTRA] puxar-para-atualizar

  useFocusEffect(
    // useCallback "congela" a função enquanto as coordenadas não mudarem;
    // o useFocusEffect exige isso para não rodar à toa.
    useCallback(() => {
      if (!coordenadas) {
        return; // sem GPS não buscamos (o app precisa saber onde o usuário está)
      }
      let ativo = true; // evita atualizar o estado depois que a tela mudou
      setCarregando(true);
      buscarOcorrencias(coordenadas)
        .then((lista) => ativo && setOcorrencias(lista))
        // [EXTRA] sem o catch, um erro de rede/permissão ficaria silencioso.
        .catch((erro) => console.warn("Falha ao buscar os reportes", erro))
        .finally(() => ativo && setCarregando(false));

      // Esta função devolvida roda quando a tela perde o foco: marca que não
      // devemos mais mexer no estado.
      return () => {
        ativo = false;
      };
    }, [coordenadas]),
  );

  /** [EXTRA] Busca de novo quando o usuário puxa a lista para baixo. */
  async function recarregar() {
    if (!coordenadas) {
      return;
    }
    setAtualizando(true);
    try {
      setOcorrencias(await buscarOcorrencias(coordenadas));
    } catch (erro) {
      console.warn("Falha ao atualizar os reportes", erro);
    } finally {
      setAtualizando(false);
    }
  }

  return { ocorrencias, carregando, atualizando, recarregar };
}
