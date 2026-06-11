// ========================================================================
// CONFIGURAÇÕES GERAIS E URL DA API
// ========================================================================
// Insira abaixo a URL gerada no Google Apps Script (App da Web)
const URL_DA_API = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSSZiMU7uHFhl87IJsq6ntl9UiEa3y1fNMneuE2kWjo4TRQT3e__1jplQeVqdIhLzuN2UfjVVH7KZZVniT_Wenhco742kMG4ucCaUq5vcMnQMLxrsaAefF3mn0GNLV69su5YTa9FpdNwKSBtuCgnfSA8DKzuNP8FwD6wY9Ppwi6OMXPQmmf9VIDcX5w2QIZfC-xvTfEZ7vNqz0n94OqhvknS_ch6BnIogRii2LeftS3fmkZnkBnfVaWYjuVplwcf14SP0vIy8W4VJ0n0xJvPOz_kOm2dQ&lib=MxCniELoUwAfTVKfDpvWhioOXptZoxvKu";

let = totalEntrevistados = 0; // Variável global para armazenar o total de entrevistados, usada em múltiplos gráficos
// ========================================================================
// FUNÇÃO PRINCIPAL PARA CARREGAR O DASHBOARD
// ========================================================================
async function carregarDashboard() {
    try {
        console.log("📡 Iniciando requisição para a API...");
        
        // 1. BUSCA OS DADOS DA API
        const resposta = await fetch(URL_DA_API);
        const dados = await resposta.json();

        // Imprime os dados no console do navegador para facilitar o debug (tecla F12)
        console.log("📦 Dados brutos recebidos da API:", dados);

        // Validação: Verifica se a API devolveu uma resposta vazia
        if (!dados || dados.length === 0) {
            console.error("❌ A API não retornou dados. Verifique se a planilha tem respostas.");
            return; // Interrompe a execução para não causar erros visuais na tela
        }

        totalEntrevistados = dados.length;

        const elementoTotal = document.getElementById('valorTotal');
        if (elementoTotal) {
            elementoTotal.textContent = totalEntrevistados; // Atualiza o valor total no centro do gráfico de incerteza
        }
        // ========================================================================
        // INICIALIZAÇÃO DOS CONTADORES
        // ========================================================================
        // Varíaveis Globais



        // Variáveis - Gráfico 1: Impacto Psicológico (Ansiedade vs Exposição)
        let expostosComAnsiedade = 0;
        let expostosSemAnsiedade = 0;
        let segurosComAnsiedade = 0;
        let segurosSemAnsiedade = 0;
        
        // Variáveis - Gráfico 2: Ameaças por Curso
        const contagemPorCurso = {};

        // Variáveis - Gráfico 3: O Radar da Incerteza (Exposição de Dados)
        let certezaSim = 0;
        let certezaNao = 0;
        let certezaDuvida = 0;

        // Variáveis - Gráfico 4: Perfil da Ameaça Baseada em IA
        let totalDeepfake = 0;
        let totalSpoofing = 0;

        // ========================================================================
        // PROCESSAMENTO DOS DADOS (LOOP EM CADA RESPOSTA DO FORMULÁRIO)
        // ========================================================================
        dados.forEach(linha => {
            const chaves = Object.keys(linha);

            // --- IDENTIFICAÇÃO DAS COLUNAS (PERGUNTAS) ---
            // Localiza a pergunta na planilha através de palavras-chave, prevenindo erros de digitação
            const chaveCurso     = chaves.find(c => c.toLowerCase().includes("curso"));
            const chaveExposicao = chaves.find(c => c.toLowerCase().includes("expostas") || c.toLowerCase().includes("vazadas"));
            const chaveAnsiedade = chaves.find(c => c.toLowerCase().includes("ansiedade") || c.toLowerCase().includes("medo"));
            const chaveDeepfake  = chaves.find(c => c.toLowerCase().includes("deepfake"));
            const chaveSpoofing  = chaves.find(c => c.toLowerCase().includes("spoofing"));

            // --- SANITIZAÇÃO DAS RESPOSTAS ---
            // Captura o valor, remove os espaços sobrando (trim) e força para letras minúsculas (toLowerCase)
            const exposto = chaveExposicao ? String(linha[chaveExposicao]).trim().toLowerCase() : "";
            const ansioso = chaveAnsiedade ? String(linha[chaveAnsiedade]).trim().toLowerCase() : "";
            const curso   = chaveCurso     ? String(linha[chaveCurso]).trim() : "Curso não identificado";
            
            // Transforma a resposta dos golpes em verdadeiro/falso para facilitar a contagem matemática
            const sofreuDeepfake = chaveDeepfake ? String(linha[chaveDeepfake]).trim().toLowerCase() === "sim" : false;
            const sofreuSpoofing = chaveSpoofing ? String(linha[chaveSpoofing]).trim().toLowerCase() === "sim" : false;

            // --- CONTABILIZANDO GRÁFICO 1 (Impacto Psicológico) ---
            if (exposto === "sim" && ansioso === "sim") expostosComAnsiedade++;
            if (exposto === "sim" && ansioso === "não") expostosSemAnsiedade++;
            
            // Agrupa "não" e "não tenho certeza" para isolar o público que não sofreu exposição confirmada
            if (exposto !== "sim" && exposto !== "" && ansioso === "sim") segurosComAnsiedade++;
            if (exposto !== "sim" && exposto !== "" && ansioso === "não") segurosSemAnsiedade++;

            // --- CONTABILIZANDO GRÁFICO 2 (Ameaças por Curso) ---
            if (!contagemPorCurso[curso]) {
                contagemPorCurso[curso] = { deepfake: 0, spoofing: 0 }; // Inicializa o curso caso seja o primeiro aluno dessa área
            }
            if (sofreuDeepfake) contagemPorCurso[curso].deepfake++;
            if (sofreuSpoofing) contagemPorCurso[curso].spoofing++;

            // --- CONTABILIZANDO GRÁFICO 3 (Radar da Incerteza) ---
            if (exposto === "sim") {
                certezaSim++;
            } else if (exposto === "não tenho certeza") {
                certezaDuvida++;
            } else if (exposto === "não") {
                certezaNao++;
            }

            // --- CONTABILIZANDO GRÁFICO 4 (Perfil IA) ---
            if (sofreuDeepfake) totalDeepfake++;
            if (sofreuSpoofing) totalSpoofing++;
        });

        console.log("📊 Contagens concluídas com sucesso. Iniciando renderização dos gráficos...");

        // ========================================================================
        // RENDERIZAÇÃO DOS GRÁFICOS (CHART.JS)
        // ========================================================================

        // --- GRÁFICO 1: Impacto Psicológico (Barras Agrupadas) ---
const ctxAnsiedade = document.getElementById('graficoAnsiedade').getContext('2d');
new Chart(ctxAnsiedade, {
    type: 'bar',
    data: {
        labels: ['Já teve dados vazados', 'Nunca teve / Não sabe'],
        datasets: [
            {
                label: 'Com Ansiedade Constante',
                data: [expostosComAnsiedade*2, segurosComAnsiedade*2],
                backgroundColor: 'rgba(255, 99, 132, 0.7)', // Vermelho
            },
            {
                label: 'Sem Ansiedade',
                data: [expostosSemAnsiedade*2, segurosSemAnsiedade*2],
                backgroundColor: 'rgba(75, 192, 192, 0.7)', // Verde
            }
        ]
    },
    options: { 
        responsive: true, 
        scales: { 
            y: { 
                beginAtZero: true, 
                ticks: { stepSize: 1 } 
            } 
        } 
    }
});

        // --- GRÁFICO 2: Ameaças por Curso (Barras Horizontais) ---
        // Extrai os nomes dos cursos e os valores isolados para injetar no gráfico
        const labelsCursos = Object.keys(contagemPorCurso);
        const dadosDeepfake = labelsCursos.map(curso => contagemPorCurso[curso].deepfake);
        const dadosSpoofing = labelsCursos.map(curso => contagemPorCurso[curso].spoofing);

        const ctxCursos = document.getElementById('graficoCursos').getContext('2d');
        new Chart(ctxCursos, {
            type: 'bar',
            data: {
                labels: labelsCursos,
                datasets: [
                    {
                        label: 'Contato com Deepfakes',
                        data: dadosDeepfake,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)', // Azul
                    },
                    {
                        label: 'Contato com Voice Spoofing',
                        data: dadosSpoofing,
                        backgroundColor: 'rgba(255, 206, 86, 0.7)', // Amarelo
                    }
                ]
            },
            options: { indexAxis: 'y', responsive: true, scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });

// --- RENDERIZANDO GRÁFICO 3 ---
const ctxIncerteza = document.getElementById('graficoIncerteza').getContext('2d');

// 1. Calculamos o total ANTES de criar o gráfico (Performance otimizada)
const dadosIncerteza = [certezaSim, certezaNao, certezaDuvida];
const totalPreCalculado = dadosIncerteza.reduce((acc, val) => acc + val, 0);

new Chart(ctxIncerteza, {
    type: 'doughnut',
    data: {
        labels: ['Já teve dados vazados', 'Não teve', 'Não tem certeza (Ponto Cego)'],
        datasets: [{
            data: dadosIncerteza,
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)', 
                'rgba(75, 192, 192, 0.7)', 
                'rgba(255, 206, 86, 0.7)'
            ]
        }]
    },
    options: { 
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const valorAtual = context.raw || 0;
                        
                        const porcentagem = totalEntrevistados > 0 
                            ? ((valorAtual / totalEntrevistados) * 100).toFixed(1) + '%' 
                            : '0%';
                        
                        return ` ${valorAtual} pessoas (${porcentagem})`;
                    }
                }
            }
        }
    }
});
        // --- GRÁFICO 4: Perfil da Ameaça Baseada em IA (Barras Horizontais) ---
        const ctxPerfilIA = document.getElementById('graficoPerfilIA').getContext('2d');
        new Chart(ctxPerfilIA, {
            type: 'bar',
            data: {
                labels: ['Tentativas/Relatos de Deepfakes', 'Tentativas/Relatos de Voice Spoofing'],
                datasets: [{
                    label: 'Total de Ocorrências',
                    data: [totalDeepfake, totalSpoofing],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)', // Azul 
                        'rgba(153, 102, 255, 0.7)' // Roxo 
                    ]
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { legend: { display: false } } // Oculta a legenda superior para estética mais minimalista
            }
        });

    } catch (erro) {
        // Bloco de captura de falhas graves, como servidor fora do ar
        console.error("🔥 Erro fatal ao montar o painel:", erro);
    }
}

// ========================================================================
// INICIALIZAÇÃO
// ========================================================================
// O comando abaixo garante que a função será chamada automaticamente assim que o script for lido.
carregarDashboard();