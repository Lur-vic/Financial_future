// financial-future/public/script.js

let projectionChart = null; // Глобальная переменная для экземпляра графика

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('projection-form');
    const resultsSection = document.getElementById('results');
    const investingResultDiv = document.getElementById('investing-result');
    const savingResultDiv = document.getElementById('saving-result');
    const serverMessage = document.getElementById('server-message');

    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const loginModal = document.getElementById('loginModal');
    const loginButton = document.getElementById('loginButton');
    const closeModal = document.getElementById('closeModal');

    let currentUser = null;



    async function updateAuthUI() {
        const response = await fetch('/auth/me');
        const data = await response.json();

        if (data.authenticated) {
            currentUser = data.user;
            document.getElementById('loginButton').textContent = 'Log Out';
            document.getElementById('dashboardLink').style.display = 'block';
        } else {
            currentUser = null;
            document.getElementById('loginButton').textContent = 'Log In / Sign Up';
            document.getElementById('dashboardLink').style.display = 'none';
        }
        }


    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
        });
    }

    // 2. ЛОГИКА ОТКРЫТИЯ МОДАЛЬНОГО ОКНА
    if (loginButton && loginModal && closeModal) {
                loginButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentUser) {
                // Уже залогинен → логаут
                window.location.href = '/auth/logout';
            } else {
                // Не залогинен → показываем модалку
                if (mainNav) mainNav.classList.remove('active');
                loginModal.style.display = 'block';
            }
        });

        // Закрыть модальное окно при клике на X
            closeModal.addEventListener('click', () => {
            loginModal.style.display = 'none';
            updateAuthUI();                    // ← добавлена строка
        });

        window.addEventListener('click', (event) => {
            if (event.target === loginModal) {
                loginModal.style.display = 'none';
                updateAuthUI();                // ← добавлена строка
            }
        });
    }
    


    
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
            salaryIncreasement: parseFloat(document.getElementById('salaryIncreasement').value),
            inflationRate: parseFloat(document.getElementById('inflationRate').value),

            // Состояние Toggles (отправляем как true/false)
            incomeIncreasement: document.getElementById('incomeIncreasement').checked,
            privateSchool: document.getElementById('privateSchool').checked,
            moreTraveling: document.getElementById('moreTraveling').checked,
            healthProblems: document.getElementById('healthProblems').checked,
            parentsHelp: document.getElementById('parentsHelp').checked,
        };

        if (currentUser) {
            inputData.user_id = currentUser.id;
        }
        
        // Базовая проверка (можно расширить)
        const numericalFields = [
            'currentAge', 'activeMonthly', 'additionalYearly', 'regularMonthly', 
            'additionalYearlySpending', 'childrenNumber', 'currentAssets', 
            'projectionYears', 'annualReturn', 'salaryIncreasement', 'inflationRate'
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
    // Добавляем +1, чтобы включить Год 0 (текущее состояние)
    const labels = Array.from({ length: totalYears + 1 }, (_, i) => `Year ${i}`);

    projectionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels, 
            datasets: [
                {
                    label: 'Investing Scenario',
                    data: data.investing, 
                    borderColor: '#4ade80', // Акцентный зеленый
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 3
                },
                {
                    label: 'Saving-Only Scenario',
                    data: data.savingOnly, 
                    borderColor: '#60a5fa', // Акцентный синий
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
                },
                tooltip: {
                    callbacks: {
                        // Улучшаем отображение сумм в подсказке
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(context.parsed.y);
                            }
                            return label;
                        }
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
                        color: 'white',
                        // Отображать подписи каждые 5 лет для чистоты
                        callback: function(value, index, values) {
                            if (index % 5 === 0) {
                                return `Year ${index}`;
                            }
                            return null; 
                        },
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'rgba(255, 255, 255, 0.3)' // Более заметная ось X
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Net Worth ($)',
                        color: 'white'
                    },
                    // ГЛАВНОЕ ИЗМЕНЕНИЕ: Принудительно начинаем ось Y с 0
                    beginAtZero: true, 
                    ticks: {
                        color: 'white',
                        // Увеличиваем лимит подписей и используем компактный формат
                        maxTicksLimit: 10, 
                        minRotation: 0,
                        callback: function(value, index, values) {
                            return new Intl.NumberFormat('en-US', { 
                                style: 'currency', 
                                currency: 'USD', 
                                notation: 'compact', // Для крупных чисел (1M, 500K)
                                compactDisplay: 'short',
                                minimumFractionDigits: 0, 
                                maximumFractionDigits: 1 
                            }).format(value);
                        }
                    },

                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)', // Более заметная сетка
                        borderColor: 'rgba(255, 255, 255, 0.3)' // Более заметная ось Y
                    }
                }
            }
        }
    });
}

await updateAuthUI();

});