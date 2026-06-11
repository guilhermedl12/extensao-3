const URL_DA_API = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnSSZiMU7uHFhl87IJsq6ntl9UiEa3y1fNMneuE2kWjo4TRQT3e__1jplQeVqdIhLzuN2UfjVVH7KZZVniT_Wenhco742kMG4ucCaUq5vcMnQMLxrsaAefF3mn0GNLV69su5YTa9FpdNwKSBtuCgnfSA8DKzuNP8FwD6wY9Ppwi6OMXPQmmf9VIDcX5w2QIZfC-xvTfEZ7vNqz0n94OqhvknS_ch6BnIogRii2LeftS3fmkZnkBnfVaWYjuVplwcf14SP0vIy8W4VJ0n0xJvPOz_kOm2dQ&lib=MxCniELoUwAfTVKfDpvWhioOXptZoxvKu";

        let totalEntrevistados = 0;

        // Paleta de cores do design system
        const COLORS = {
            blue500:  'rgba(36, 85, 204, 0.75)',
            blue300:  'rgba(109, 150, 240, 0.75)',
            red:      'rgba(232, 68, 90, 0.75)',
            green:    'rgba(45, 168, 132, 0.75)',
            yellow:   'rgba(232, 160, 32, 0.75)',
            purple:   'rgba(124, 92, 240, 0.75)',
        };

        const CHART_DEFAULTS = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        font: { family: 'Inter', size: 12 },
                        color: '#2a2f3f',
                        boxWidth: 12,
                        padding: 16,
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

                const el = document.getElementById('valorTotal');
                if (el) el.textContent = totalEntrevistados;

                let expostosComAnsiedade = 0, expostosSemAnsiedade = 0;
                let segurosComAnsiedade = 0, segurosSemAnsiedade = 0;
                const contagemPorCurso = {};
                let certezaSim = 0, certezaNao = 0, certezaDuvida = 0;
                let totalDeepfake = 0, totalSpoofing = 0;

                dados.forEach(linha => {
                    const chaves = Object.keys(linha);
                    const chaveCurso     = chaves.find(c => c.toLowerCase().includes("curso"));
                    const chaveExposicao = chaves.find(c => c.toLowerCase().includes("expostas") || c.toLowerCase().includes("vazadas"));
                    const chaveAnsiedade = chaves.find(c => c.toLowerCase().includes("ansiedade") || c.toLowerCase().includes("medo"));
                    const chaveDeepfake  = chaves.find(c => c.toLowerCase().includes("deepfake"));
                    const chaveSpoofing  = chaves.find(c => c.toLowerCase().includes("spoofing"));

                    const exposto = chaveExposicao ? String(linha[chaveExposicao]).trim().toLowerCase() : "";
                    const ansioso = chaveAnsiedade ? String(linha[chaveAnsiedade]).trim().toLowerCase() : "";
                    const curso   = chaveCurso     ? String(linha[chaveCurso]).trim() : "Não identificado";
                    const sofreuDeepfake = chaveDeepfake ? String(linha[chaveDeepfake]).trim().toLowerCase() === "sim" : false;
                    const sofreuSpoofing = chaveSpoofing ? String(linha[chaveSpoofing]).trim().toLowerCase() === "sim" : false;

                    if (exposto === "sim" && ansioso === "sim") expostosComAnsiedade++;
                    if (exposto === "sim" && ansioso === "não") expostosSemAnsiedade++;
                    if (exposto !== "sim" && exposto !== "" && ansioso === "sim") segurosComAnsiedade++;
                    if (exposto !== "sim" && exposto !== "" && ansioso === "não") segurosSemAnsiedade++;

                    if (!contagemPorCurso[curso]) contagemPorCurso[curso] = { deepfake: 0, spoofing: 0 };
                    if (sofreuDeepfake) contagemPorCurso[curso].deepfake++;
                    if (sofreuSpoofing) contagemPorCurso[curso].spoofing++;

                    if (exposto === "sim") certezaSim++;
                    else if (exposto === "não tenho certeza") certezaDuvida++;
                    else if (exposto === "não") certezaNao++;

                    if (sofreuDeepfake) totalDeepfake++;
                    if (sofreuSpoofing) totalSpoofing++;
                });

                // Gráfico 1
                new Chart(document.getElementById('graficoAnsiedade').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['Já teve dados vazados', 'Nunca teve / Não sabe'],
                        datasets: [
                            { label: 'Com ansiedade constante', data: [expostosComAnsiedade, segurosComAnsiedade], backgroundColor: COLORS.red, borderRadius: 4 },
                            { label: 'Sem ansiedade',           data: [expostosSemAnsiedade, segurosSemAnsiedade], backgroundColor: COLORS.green, borderRadius: 4 }
                        ]
                    },
                    options: { ...CHART_DEFAULTS, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } } }
                });

                // Gráfico 2
                const labelsCursos = Object.keys(contagemPorCurso);
                new Chart(document.getElementById('graficoCursos').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: labelsCursos,
                        datasets: [
                            { label: 'Deepfakes',      data: labelsCursos.map(c => contagemPorCurso[c].deepfake), backgroundColor: COLORS.blue500, borderRadius: 4 },
                            { label: 'Voice Spoofing', data: labelsCursos.map(c => contagemPorCurso[c].spoofing), backgroundColor: COLORS.yellow, borderRadius: 4 }
                        ]
                    },
                    options: { ...CHART_DEFAULTS, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } }, y: { ticks: { font: { size: 11 } } } } }
                });

                // Gráfico 3
                const dadosIncerteza = [certezaSim, certezaNao, certezaDuvida];
                new Chart(document.getElementById('graficoIncerteza').getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        labels: ['Confirmou vazamento', 'Nunca vazou', 'Não tem certeza'],
                        datasets: [{ data: dadosIncerteza, backgroundColor: [COLORS.red, COLORS.green, COLORS.yellow], borderWidth: 2, borderColor: '#fff' }]
                    },
                    options: {
                        ...CHART_DEFAULTS,
                        plugins: {
                            ...CHART_DEFAULTS.plugins,
                            tooltip: {
                                callbacks: {
                                    label: ctx => {
                                        const v = ctx.raw || 0;
                                        const pct = totalEntrevistados > 0 ? ((v / totalEntrevistados) * 100).toFixed(1) + '%' : '0%';
                                        return ` ${v} pessoas (${pct})`;
                                    }
                                }
                            }
                        }
                    }
                });

                // Gráfico 4
                new Chart(document.getElementById('graficoPerfilIA').getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['Relatos de Deepfakes', 'Relatos de Voice Spoofing'],
                        datasets: [{ label: 'Total de ocorrências', data: [totalDeepfake, totalSpoofing], backgroundColor: [COLORS.blue500, COLORS.purple], borderRadius: 6 }]
                    },
                    options: { ...CHART_DEFAULTS, indexAxis: 'y', scales: { x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } } } }, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } }
                });

            } catch (err) {
                console.error("Erro ao carregar dashboard:", err);
            }
        }

        carregarDashboard();