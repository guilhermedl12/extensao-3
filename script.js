// 1. Seleciona o elemento canvas do HTML
const ctx = document.getElementById('meuGrafico').getContext('2d');

// 2. Cria uma nova instância do gráfico
const meuGrafico = new Chart(ctx, {
    type: 'doughnut', // Define o tipo de gráfico: 'bar', 'line', 'pie', 'doughnut', etc.
    data: {
        labels: ['Adolescentes', 'Adultos', 'Idosos'], // Legendas do eixo X
        datasets: [{
            label: 'Vítimas',
            data: [12, 19, 3], // Os dados que serão plotados
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true // Garante que o gráfico comece do valor zero no eixo Y
            }
        }
    }
});