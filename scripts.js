const URL_DA_API =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSSZiMU7uHFhl87IJsq6ntl9UiEa3y1fNMneuE2kWjo4TRQT3e__1jplQeVqdIhLzuN2UfjVVH7KZZVniT_Wenhco742kMG4ucCaUq5vcMnQMLxrsaAefF3mn0GNLV69su5YTa9FpdNwKSBtuCgnfSA8DKzuNP8FwD6wY9Ppwi6OMXPQmmf9VIDcX5w2QIZfC-xvTfEZ7vNqz0n94OqhvknS_ch6BnIogRii2LeftS3fmkZnkBnfVaWYjuVplwcf14SP0vIy8W4VJ0n0xJvPOz_kOm2dQ&lib=MxCniELoUwAfTVKfDpvWhioOXptZoxvKu";

let totalEntrevistados = 0;

// Paleta de cores do design system
const COLORS = {
  blue500: "rgba(36, 85, 204, 0.75)",
  blue300: "rgba(109, 150, 240, 0.75)",
  red: "rgba(232, 68, 90, 0.75)",
  green: "rgba(45, 168, 132, 0.75)",
  yellow: "rgba(232, 160, 32, 0.75)",
  purple: "rgba(124, 92, 240, 0.75)",
};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      labels: {
        font: { family: "Inter", size: 12 },
        color: "#2a2f3f",
        boxWidth: 12,
        padding: 16,
      },
    },
tooltip: {
                    callbacks: {
                        label: function(ctx) {
                            const valor = ctx.raw || 0;
                            // Calcula a % com base na sua variável global
                            const pct = totalEntrevistados > 0 ? ((valor / totalEntrevistados) * 100).toFixed(1) + '%' : '0%';

                            // Se for gráfico de barras (Gráficos 1, 2 e 4), usa o nome do dataset (ex: "Deepfakes")
                            if (ctx.dataset && ctx.dataset.label) {
                                const nomeDataset = ctx.dataset.label;
                                
                                // Regra de limpeza apenas para o Gráfico 4 ficar minimalista
                                if (nomeDataset === 'Total de ocorrências') {
                                    return ` ${valor} relatos (${pct})`;
                                }
                                
                                // Retorno para Gráficos 1 e 2 (Ex: "Deepfakes: 5 pessoas (20%)")
                                return `${nomeDataset}: ${valor} ocorrências (${pct})`;
                            }

                            // Retorno padrão para o Gráfico de Rosca (Gráfico 3)
                            return ` ${valor} pessoas (${pct})`;
                        }
                    }
                }
            }
        };

async function carregarDashboard() {
  try {
    const resposta = await fetch(URL_DA_API);
    const dados = await resposta.json();

    if (!dados || dados.length === 0) return;

    totalEntrevistados = dados.length;

    const spanAmostra = document.querySelector(".amostra-n");
    if (spanAmostra) {
      spanAmostra.textContent = totalEntrevistados;
    }

    let expostosComAnsiedade = 0,
      expostosSemAnsiedade = 0;
    let segurosComAnsiedade = 0,
      segurosSemAnsiedade = 0;
    const contagemPorCurso = {};
    let certezaSim = 0,
      certezaNao = 0,
      certezaDuvida = 0;
    let totalDeepfake = 0,
      totalSpoofing = 0;

    dados.forEach((linha) => {
      const chaves = Object.keys(linha);
      const chaveCurso = chaves.find((c) => c.toLowerCase().includes("curso"));
      const chaveExposicao = chaves.find(
        (c) =>
          c.toLowerCase().includes("expostas") ||
          c.toLowerCase().includes("vazadas"),
      );
      const chaveAnsiedade = chaves.find(
        (c) =>
          c.toLowerCase().includes("ansiedade") ||
          c.toLowerCase().includes("medo"),
      );
      const chaveDeepfake = chaves.find((c) =>
        c.toLowerCase().includes("deepfake"),
      );
      const chaveSpoofing = chaves.find((c) =>
        c.toLowerCase().includes("spoofing"),
      );

      const exposto = chaveExposicao
        ? String(linha[chaveExposicao]).trim().toLowerCase()
        : "";
      const ansioso = chaveAnsiedade
        ? String(linha[chaveAnsiedade]).trim().toLowerCase()
        : "";
      const curso = chaveCurso
        ? String(linha[chaveCurso]).trim()
        : "Não identificado";
      const sofreuDeepfake = chaveDeepfake
        ? String(linha[chaveDeepfake]).trim().toLowerCase() === "sim"
        : false;
      const sofreuSpoofing = chaveSpoofing
        ? String(linha[chaveSpoofing]).trim().toLowerCase() === "sim"
        : false;

      if (exposto === "sim" && ansioso === "sim") expostosComAnsiedade++;
      if (exposto === "sim" && ansioso === "não") expostosSemAnsiedade++;
      if (exposto !== "sim" && exposto !== "" && ansioso === "sim")
        segurosComAnsiedade++;
      if (exposto !== "sim" && exposto !== "" && ansioso === "não")
        segurosSemAnsiedade++;

      if (!contagemPorCurso[curso])
        contagemPorCurso[curso] = { deepfake: 0, spoofing: 0 };
      if (sofreuDeepfake) contagemPorCurso[curso].deepfake++;
      if (sofreuSpoofing) contagemPorCurso[curso].spoofing++;

      if (exposto === "sim") certezaSim++;
      else if (exposto === "não tenho certeza") certezaDuvida++;
      else if (exposto === "não") certezaNao++;

      if (sofreuDeepfake) totalDeepfake++;
      if (sofreuSpoofing) totalSpoofing++;
    });

    // Gráfico 1
    new Chart(document.getElementById("graficoAnsiedade").getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Já teve dados vazados", "Nunca teve / Não sabe"],
        datasets: [
          {
            label: "Com ansiedade constante",
            data: [expostosComAnsiedade, segurosComAnsiedade],
            backgroundColor: COLORS.red,
            borderRadius: 4,
          },
          {
            label: "Sem ansiedade",
            data: [expostosSemAnsiedade, segurosSemAnsiedade],
            backgroundColor: COLORS.green,
            borderRadius: 4,
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
          x: { ticks: { font: { size: 11 } } },
        },
      },
    });

    // Gráfico 2 (Ordenado)
    const cursosArray = Object.entries(contagemPorCurso);

    // Aplicando Sort
    cursosArray.sort((a, b) => {
      const totalA = a[1].deepfake + a[1].spoofing;
      const totalB = b[1].deepfake + b[1].spoofing;

      return totalB - totalA; // Ordem decrescente
    });

    // Separar os dadps de volta para o formato original
    const labelCursos = cursosArray.map((item) => item[0]);
    const dataDeepfake = cursosArray.map((item) => item[1].deepfake);
    const dataSpoofing = cursosArray.map((item) => item[1].spoofing);

    const ctxCursos = document.getElementById("graficoCursos").getContext("2d");
    new Chart(ctxCursos, {
      type: "bar",
      data: {
        labels: labelCursos,
        datasets: [
          {
            label: "Tentativas de Deepfake",
            data: dataDeepfake,
            backgroundColor: "rgba(54, 162, 235, 0.7)", // Fundo Azul com transparência
            borderColor: "rgba(54, 162, 235, 1)", // Borda Azul sólida
            borderWidth: 1,
          },
          {
            label: "Tentativas de Voice Spoofing",
            data: dataSpoofing,
            backgroundColor: "rgba(153, 102, 255, 0.7)", // Fundo Roxo com transparência
            borderColor: "rgba(153, 102, 255, 1)", // Borda Roxa sólida
            borderWidth: 1,
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        responsive: true,
        indexAxis: "y",
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
          y: {
            stacked: true,
          },
        },
        plugins: {
            ...CHART_DEFAULTS.plugins,
          legend: { position: "bottom" },
        },
      },
    });

    // Gráfico 3
    const dadosIncerteza = [certezaSim, certezaNao, certezaDuvida];
    new Chart(document.getElementById("graficoIncerteza").getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Confirmou vazamento", "Nunca vazou", "Não tem certeza"],
        datasets: [
          {
            data: dadosIncerteza,
            backgroundColor: [COLORS.red, COLORS.green, COLORS.yellow],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS},
    });

    // Gráfico 4
    new Chart(document.getElementById("graficoPerfilIA").getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Relatos de Deepfakes", "Relatos de Voice Spoofing"],
        datasets: [
          {
            label: "Total de ocorrências",
            data: [totalDeepfake, totalSpoofing],
            backgroundColor: [COLORS.blue500, COLORS.purple],
            borderRadius: 6,
          },
        ],
      },
      options: {
        ...CHART_DEFAULTS,
        indexAxis: "y",
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } },
        },
        plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } },
      },
    });
  } catch (err) {
    console.error("Erro ao carregar dashboard:", err);
  }
}

carregarDashboard();
