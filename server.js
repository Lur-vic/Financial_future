// Financial future/backend/server.js

const express = require('express');
const path = require('path'); // Встроенный модуль Node.js для работы с путями
const app = express();
const port = 3000; 

// --- 1. Настройка обслуживания статических файлов ---

// Определяем полный путь к папке frontend
const frontendPath = path.join(__dirname, 'public'); 

// Используем middleware express.static, чтобы Express обслуживал все файлы 
// из папки 'frontend' (index.html, styles.css, script.js)
app.use(express.static(frontendPath));

// --- 2. Настройка API роутов (для калькуляций) ---

// Этот роут будет использоваться для получения данных
app.get('/api/data', (req, res) => {
    // Здесь вы будете выполнять расчеты
    const calculationResult = {
        status: 'OK',
        message: 'Данные успешно получены с бэкенда Express!',
        value: 14032
    };
    res.json(calculationResult);
});

// --- 3. Точка входа (отдача index.html) ---

// *Не обязательно, если вы используете app.use(express.static)*,
// но может быть полезно для настройки роутинга в одностраничном приложении (SPA).
// Если пользователь обращается к корню '/', Express найдет и отдаст index.html
// из папки, указанной в express.static.


// --- 4. Запуск сервера ---
app.listen(port, () => {
  console.log(`Server listening on port ${port}. 
  Frontend доступен по адресу: http://localhost:${port}`);
});