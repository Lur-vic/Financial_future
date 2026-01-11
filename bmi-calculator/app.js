const express = require('express');
const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/bmi', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/bmi/calculate', (req, res) => {
  const heightCm = parseFloat(req.body.height);
  const weight = parseFloat(req.body.weight);

  if (!heightCm || !weight || heightCm <= 0 || weight <= 0) {
    return res.send('<h1>Ошибка: введите корректные данные</h1><a href="/bmi">Назад</a>');
  }

  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  const bmiRounded = bmi.toFixed(1);

  let category = '';
  let color = '';

  if (bmi < 18.5) { category = 'Недостаток веса'; color = '#60a5fa'; }
  else if (bmi < 25) { category = 'Норма'; color = '#4ade80'; }
  else if (bmi < 30) { category = 'Избыточный вес'; color = '#fbbf24'; }
  else if (bmi < 35) { category = 'Ожирение I степени'; color = '#f97316'; }
  else if (bmi < 40) { category = 'Ожирение II степени'; color = '#ef4444'; }
  else { category = 'Ожирение III степени'; color = '#991b1b'; }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>BMI Result</title>
      <style>
        body { background: #1e1e2f; color: white; font-family: Arial; text-align: center; padding: 50px; }
        h1 { font-size: 4em; margin: 20px; color: ${color}; }
        .category { font-size: 2em; margin: 20px; }
        a { color: #4ade80; text-decoration: none; font-size: 1.2em; }
      </style>
    </head>
    <body>
      <h1>${bmiRounded}</h1>
      <div class="category">${category}</div>
      <p>Рост: ${heightCm} см | Вес: ${weight} кг</p>
      <a href="/bmi">Рассчитать заново</a>
    </body>
    </html>
  `);
});

app.listen(80, () => console.log('BMI Calculator running on port 80'));