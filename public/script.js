// Financial future/frontend/script.js

document.addEventListener('DOMContentLoaded', () => {
    const resultElement = document.getElementById('result');
    
    console.log("Скрипт загружен! Запрашиваем данные у Express...");

    // Вызываем API роут, который мы создали в server.js: /api/data
    fetch('/api/data') 
        .then(response => {
            // Проверяем, что ответ успешный (статус 200)
            if (!response.ok) {
                throw new Error(`Ошибка сети: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Данные с сервера:', data);
            
            // Отображаем результат
            resultElement.innerHTML = `
                <h2>Успешное соединение!</h2>
                <p>Сообщение сервера: <strong>${data.message}</strong></p>
                <p>Расчетное значение: <strong>${data.value}</strong></p>
            `;
        })
        .catch(error => {
            console.error('Ошибка при получении данных:', error);
            resultElement.textContent = `Ошибка подключения: ${error.message}`;
        });
});