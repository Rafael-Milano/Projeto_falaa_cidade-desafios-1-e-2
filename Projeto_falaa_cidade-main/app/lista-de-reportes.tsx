import { STATUS } from "@/constants/status";
import { useAuth } from "@/hooks/use-auth";
import { useCidade } from "@/hooks/use-cidade";
import { useOcorrencias } from "@/hooks/use-ocorrencias";
import { TIPOS_DE_REPORTE } from "@/services/reportes";
import { cores } from "@/styles";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/** [EXTRA] Transforma uma Date em texto: 23/11/2026 22:10 */
function formatarData(data: Date): string {
  const dois = (n: number) => String(n).padStart(2, "0"); // 5 -> "05"
  return (
    `${dois(data.getDate())}/${dois(data.getMonth() + 1)}/${data.getFullYear()} ` +
    `${dois(data.getHours())}:${dois(data.getMinutes())}`
  );
}

export default function ListaDeReportes() {
  // Posição do GPS: o hook de ocorrências só busca quando ela existe.
  const { coordenadas } = useCidade();
  // Usuário logado (necessário para o filtro "Meus reportes").
  const { user: usuario } = useAuth();
  // `ocorrencias` = lista vinda do Firestore; `carregando` = true durante a busca.
  const { ocorrencias, carregando, atualizando, recarregar } = useOcorrencias(coordenadas);

  // [EXTRA] false = mostra todos; true = só os reportes do usuário logado.
  const [somenteMeus, setSomenteMeus] = useState(false);

  // Se o filtro estiver ligado, ficamos só com os reportes cujo dono é o usuário.
  // Fazemos o filtro aqui no app (e não no Firestore) para não precisar criar índice.
  const visiveis = somenteMeus
    ? ocorrencias.filter((o) => o.idNotificante === usuario?.uid)
    : ocorrencias;

  return (
    // edges={["bottom"]}: o cabeçalho da navegação já cuida do topo.
    <SafeAreaView style={estilos.container} edges={["bottom"]}>
      <Text style={estilos.titulo}>Reportes</Text>

      {/* [EXTRA] Botões "Todos" / "Meus reportes" (só aparecem para quem está logado). */}
      {usuario && (
        <View style={estilos.filtros}>
          <TouchableOpacity
            style={[estilos.filtro, !somenteMeus && estilos.filtroAtivo]}
            onPress={() => setSomenteMeus(false)}
          >
            <Text style={[estilos.textoFiltro, !somenteMeus && estilos.textoFiltroAtivo]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[estilos.filtro, somenteMeus && estilos.filtroAtivo]}
            onPress={() => setSomenteMeus(true)}
          >
            <Text style={[estilos.textoFiltro, somenteMeus && estilos.textoFiltroAtivo]}>
              Meus reportes
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Enquanto busca, mostra a "rodinha". */}
      {carregando && <ActivityIndicator color={cores.verde} />}

      {/* Busca terminou e não veio nada: avisa que está vazio. */}
      {!carregando && visiveis.length === 0 && (
        <Text style={estilos.vazio}>
          {somenteMeus ? "Você ainda não fez nenhum reporte." : "Nenhum reporte ainda."}
        </Text>
      )}

      {/* FlatList = lista otimizada: só desenha o que cabe na tela e vai
          desenhando o resto conforme a pessoa rola. */}
      <FlatList
        data={visiveis} // a lista de itens
        // keyExtractor dá um identificador único para cada item (o id do documento)
        keyExtractor={(ocorrencia) => ocorrencia.id}
        // [EXTRA] puxar-para-atualizar: arrastar a lista para baixo recarrega.
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={recarregar}
            colors={[cores.verde]}
          />
        }
        // renderItem diz como desenhar CADA item da lista (aqui, um cartão).
        renderItem={({ item }) => {
          // Procura o nome bonito do tipo ("calcada" -> "Calçada").
          const tipo = TIPOS_DE_REPORTE.find((t) => t.valor === item.tipo)?.rotulo;
          return (
            <View style={estilos.cartao}>
              {/* Bolinha com a cor do status (vermelho, amarelo ou verde). */}
              <View style={[estilos.bolinha, { backgroundColor: STATUS[item.status].cor }]} />
              <View style={estilos.textos}>
                <Text style={estilos.tituloDoReporte}>{item.titulo}</Text>
                {/* "a && b": só mostra b se a existir (descrição é opcional). */}
                {item.descricao && <Text style={estilos.descricao}>{item.descricao}</Text>}
                {item.endereco && <Text style={estilos.descricao}>{item.endereco}</Text>}
                <Text style={estilos.situacao}>
                  {STATUS[item.status].rotulo}
                  {tipo ? ` · ${tipo}` : ""}
                  {/* [EXTRA] data de criação */}
                  {item.criadoEm ? ` · ${formatarData(item.criadoEm)}` : ""}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: cores.bgBrancoGelo },
  titulo: { fontSize: 22, fontWeight: "700", color: cores.preto, marginBottom: 12 },
  filtros: { flexDirection: "row", gap: 8, marginBottom: 12 },
  filtro: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.googleBorda,
    backgroundColor: cores.branco,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  filtroAtivo: { backgroundColor: cores.verde, borderColor: cores.verde },
  textoFiltro: { color: cores.preto, fontSize: 14 },
  textoFiltroAtivo: { color: cores.branco, fontWeight: "700" },
  vazio: { textAlign: "center", color: cores.cinzaEscuro, marginTop: 24 },
  cartao: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  bolinha: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  textos: { flex: 1 },
  tituloDoReporte: { fontSize: 16, fontWeight: "700", color: cores.preto },
  descricao: { fontSize: 14, color: cores.cinzaEscuro, marginTop: 2 },
  situacao: { fontSize: 12, color: cores.cinzaClaro, marginTop: 4 },
});
