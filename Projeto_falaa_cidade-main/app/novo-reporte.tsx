import { useAuth } from "@/hooks/use-auth";
import { useCidade } from "@/hooks/use-cidade";
import {
  criarReporte,
  TIPOS_DE_REPORTE,
  TipoDeReporte,
} from "@/services/reportes";
import { cores } from "@/styles";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * [EXTRA] Transforma coordenadas (latitude/longitude) em um endereço escrito,
 * por exemplo "Rua das Palmeiras, 120 - Centro, Cuiabá - MT".
 * Isso se chama "geocodificação reversa". Se der qualquer problema, devolve
 * null: o reporte ainda é gravado, só fica sem o endereço.
 */
async function descobrirEndereco(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  try {
    const [lugar] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!lugar) return null;

    const rua = [lugar.street, lugar.streetNumber].filter(Boolean).join(", ");
    const cidade = [lugar.city ?? lugar.subregion, lugar.region]
      .filter(Boolean)
      .join(" - ");
    // Junta só as partes que existem, separadas por " - ".
    const endereco = [rua, lugar.district, cidade].filter(Boolean).join(" - ");
    return endereco || null;
  } catch {
    return null;
  }
}

export default function NovoReporte() {
  // useRouter: ferramenta de navegação. roteador.back() volta para a tela anterior.
  const roteador = useRouter();

  // "Hooks" (funções que começam com "use") pegam informações compartilhadas
  // pelo app inteiro. useAuth -> quem é o usuário logado (null se ninguém logou).
  const { user: usuario } = useAuth();
  // useCidade -> posição do GPS do aparelho (null se não temos permissão/sinal).
  const { coordenadas } = useCidade();

  // useState guarda um valor que, quando muda, faz a tela se redesenhar.
  // Formato: [valorAtual, funçãoParaMudar] = useState(valorInicial)
  const [titulo, setTitulo] = useState(""); // o que a pessoa digitou no título
  const [descricao, setDescricao] = useState(""); // o que digitou na descrição
  const [tipo, setTipo] = useState<TipoDeReporte>("buraco"); // [EXTRA] tipo escolhido
  const [enviando, setEnviando] = useState(false); // true enquanto grava (trava o botão)

  // Roda quando a pessoa toca em "Enviar reporte".
  async function enviar() {
    // Validações: conferimos TUDO antes de tentar gravar. Cada "return" aborta
    // a função, então nada é enviado quando algo está faltando.
    if (!titulo.trim()) {
      Alert.alert("Título obrigatório", "Diga onde está o problema.");
      return;
    }
    if (!usuario) {
      Alert.alert("Login necessário", "Entre com a sua conta para reportar.");
      return;
    }
    if (!coordenadas) {
      Alert.alert("Localização indisponível", "Ative a localização do aparelho.");
      return;
    }

    setEnviando(true); // liga o "Enviando..." e o indicador de carregamento
    // try/catch/finally: "tente isto; se der erro, faça aquilo; no final, sempre
    // faça aquilo outro". Internet falha, então precisamos prever o erro.
    try {
      // [EXTRA] descobre o endereço a partir do GPS (pode ser null).
      const endereco = await descobrirEndereco(
        coordenadas.latitude,
        coordenadas.longitude,
      );

      // Chama o serviço que grava no Firestore. O uid é o "RG" do usuário no
      // Firebase; a regra de segurança do banco confere se ele bate com o login.
      await criarReporte({
        idNotificante: usuario.uid,
        titulo,
        descricao,
        tipo,
        endereco,
        latitude: coordenadas.latitude,
        longitude: coordenadas.longitude,
      });

      Alert.alert("Reporte enviado", "Obrigado por ajudar a cidade!", [
        // Ao tocar em OK, volta para o mapa.
        { text: "OK", onPress: () => roteador.back() },
      ]);
    } catch (erro) {
      // console.warn mostra o erro técnico no terminal (para nós, programadores);
      // o usuário vê só uma mensagem amigável.
      console.warn("Falha ao gravar o reporte", erro);
      Alert.alert("Não foi possível enviar", "Tente de novo em instantes.");
    } finally {
      // "finally" roda dando certo ou errado: sempre destrava o botão.
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.container}>
      <Text style={estilos.titulo}>Novo reporte</Text>

      {/* value + onChangeText = campo "controlado": o texto digitado fica
          guardado no useState e a tela sempre mostra o que está guardado. */}
      <TextInput
        style={estilos.campo}
        placeholder="Título (ex.: Buraco na Rua das Palmeiras)"
        value={titulo}
        onChangeText={setTitulo}
        editable={!enviando}
      />
      <TextInput
        style={[estilos.campo, estilos.campoGrande]}
        placeholder="Descrição (opcional)"
        value={descricao}
        onChangeText={setDescricao}
        multiline
        editable={!enviando}
      />

      {/* [EXTRA] Botões para escolher o tipo do problema. O .map percorre a
          lista e cria um botão para cada tipo; o selecionado fica verde. */}
      <Text style={estilos.rotulo}>Tipo do problema</Text>
      <View style={estilos.tipos}>
        {TIPOS_DE_REPORTE.map((opcao) => {
          const selecionado = tipo === opcao.valor;
          return (
            <TouchableOpacity
              key={opcao.valor}
              style={[estilos.tipo, selecionado && estilos.tipoSelecionado]}
              onPress={() => setTipo(opcao.valor)}
              disabled={enviando}
            >
              <Text
                style={[
                  estilos.textoDoTipo,
                  selecionado && estilos.textoDoTipoSelecionado,
                ]}
              >
                {opcao.rotulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* disabled impede um segundo toque enquanto o primeiro envio não terminou
          (evita gravar o mesmo reporte duas vezes). */}
      <TouchableOpacity
        style={[estilos.botao, enviando && estilos.botaoDesativado]}
        onPress={enviar}
        disabled={enviando}
      >
        {/* [EXTRA] Indicador de carregamento (a "rodinha") enquanto envia. */}
        {enviando && <ActivityIndicator color={cores.branco} />}
        <Text style={estilos.textoDoBotao}>
          {enviando ? "Enviando..." : "Enviar reporte"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => roteador.back()} disabled={enviando}>
        <Text style={estilos.cancelar}>Cancelar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// StyleSheet.create reúne os estilos (cores, tamanhos, espaços) da tela.
// As cores vêm de styles/index.tsx para o app inteiro ter o mesmo visual.
const estilos = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12, backgroundColor: cores.bgBrancoGelo },
  titulo: { fontSize: 22, fontWeight: "700", color: cores.preto },
  campo: { backgroundColor: cores.branco, borderRadius: 12, padding: 14, fontSize: 15 },
  campoGrande: { minHeight: 100, textAlignVertical: "top" },
  rotulo: { fontSize: 14, fontWeight: "600", color: cores.cinzaEscuro },
  tipos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tipo: {
    backgroundColor: cores.branco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.googleBorda,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  tipoSelecionado: { backgroundColor: cores.verde, borderColor: cores.verde },
  textoDoTipo: { color: cores.preto, fontSize: 14 },
  textoDoTipoSelecionado: { color: cores.branco, fontWeight: "700" },
  botao: {
    backgroundColor: cores.verde,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  botaoDesativado: { opacity: 0.7 },
  textoDoBotao: { color: cores.branco, fontWeight: "700", fontSize: 16 },
  cancelar: { textAlign: "center", color: cores.cinzaEscuro, padding: 8 },
});
