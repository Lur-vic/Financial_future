// financial-future/public/script.js

let projectionChart = null; // Глобальная переменная для экземпляра графика

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('projection-form');
    const resultsSection = document.getElementById('results');
    const investingResultDiv = document.getElementById('investing-result');
    const savingResultDiv = document.getElementById('saving-result');
    const serverMessage = document.getElementById('server-message');

    // Обработчик события отправки формы
    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Предотвращаем стандартную перезагрузку страницы
        serverMessage.textContent = 'Calculating...';
        resultsSection.style.display = 'none';

        // 1. Сбор данных из формы
        const inputData = {
            // Данные ввода
            name: document.getElementById('name').value,
            currentAge: parseFloat(document.getElementById('currentAge').value),
            activeMonthly: parseFloat(document.getElementById('activeMonthly').value),
            additionalYearly: parseFloat(document.getElementById('additionalYearly').value),
            regularMonthly: parseFloat(document.getElementById('regularMonthly').value),
            additionalYearlySpending: parseFloat(document.getElementById('additionalYearlySpending').value),
            childrenNumber: parseInt(document.getElementById('childrenNumber').value),
            currentAssets: parseFloat(document.getElementById('currentAssets').value),
            projectionYears: parseInt(document.getElementById('projectionYears').value),
            annualReturn: parseFloat(document.getElementById('annualReturn').value),

            // Состояние Toggles (отправляем как true/false)
            incomeIncreasement: document.getElementById('incomeIncreasement').checked,
            privateSchool: document.getElementById('privateSchool').checked,
            moreTraveling: document.getElementById('moreTraveling').checked,
            healthProblems: document.getElementById('healthProblems').checked,
            parentsHelp: document.getElementById('parentsHelp').checked,
        };
        
        // Базовая проверка (можно расширить)
        const numericalFields = [
            'currentAge', 'activeMonthly', 'additionalYearly', 'regularMonthly', 
            'additionalYearlySpending', 'childrenNumber', 'currentAssets', 
            'projectionYears', 'annualReturn'
        ];

        if (inputData.name.trim() === '') {
            serverMessage.textContent = 'Error: Please enter your name.';
            return;
        }

        const invalidField = numericalFields.find(key => isNaN(inputData[key]));

        if (invalidField) {
            serverMessage.textContent = `Error: Field "${invalidField}" must be a number.`;
            return;
        }

        // 2. Отправка данных на Express-бэкенд
        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(inputData)
            });

            const data = await response.json();

            if (response.ok) {
                serverMessage.textContent = ''; // Успех, сообщение убираем
                
                // 3. Отображение результатов
                displayResults(data);
                
            } else {
                // Ошибка с сервера (например, 400 Bad Request)
                serverMessage.textContent = `Server Error: ${data.error || 'An error occurred during calculation.'}`;
            }

        } catch (error) {
            console.error('Network Error:', error);
            serverMessage.textContent = 'Connection Error: Could not reach the server.';
        }
    });

    /**
     * Отображает полученные данные и строит график.
     * @param {Object} data - Результаты расчета от сервера.
     */
    function displayResults(data) {
        // Форматирование чисел для отображения
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
        };
        
        // 4. Заполнение итоговых сумм
        investingResultDiv.textContent = formatCurrency(data.finalInvestingAmount);
        savingResultDiv.textContent = formatCurrency(data.finalSavingOnlyAmount);
        
        resultsSection.style.display = 'block';

        // 5. Построение графика (Chart.js)
        renderChart(data.projectionData, data.projectionYears);
    }

    /**
     * Создает или обновляет график.
     */
    function renderChart(data, totalYears) {
        const ctx = document.getElementById('projectionChart').getContext('2d');
        
        // Если график уже существует, уничтожаем его перед созданием нового
        if (projectionChart) {
            projectionChart.destroy();
        }

        // Подготовка данных для осей X (годы)
        const labels = Array.from({ length: totalYears + 1 }, (_, i) => `Year ${i}`);

        projectionChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels, // Годы от 0 до N
                datasets: [
                    {
                        label: 'Investing Scenario',
                        data: data.investing, // Данные для инвестиционного сценария
                        borderColor: '#4ade80', // Зеленый (accent-green)
                        backgroundColor: 'rgba(74, 222, 128, 0.1)',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 3
                    },
                    {
                        label: 'Saving-Only Scenario',
                        data: data.savingOnly, // Данные для сценария сбережения
                        borderColor: '#60a5fa', // Синий (accent-blue)
                        backgroundColor: 'rgba(96, 165, 250, 0.1)',
                        tension: 0.4,
                        fill: false,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Years',
                            color: 'white'
                        },
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Net Worth ($)',
                            color: 'white'
                        },
                        ticks: {
                            color: 'white',
                            // Форматирование значений на оси Y
                            callback: function(value, index, values) {
                                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }

});