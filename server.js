// financial-future/server.js

const express = require('express');
const path = require('path');
const app = express();
const session = require('express-session');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

const { createClient } = require('@supabase/supabase-js'); 
require('dotenv').config(); // <--- 1. Загрузка переменных из .env

const SUPABASE_URL = process.env.SUPABASE_URL; 
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY); // <--- 2. Инициализация клиента
// Используем переменную окружения PORT для деплоя на Render
const PORT = process.env.PORT || 3000; 



// ----------------------------------------------------
// 1. НАСТРОЙКА MIDDLEWARE
// ----------------------------------------------------

// Middleware для обработки JSON-запросов (Обязательно для чтения данных с фронтенда)
app.use(express.json()); 

// Обслуживание статических файлов из папки 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'super-secret-fallback-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // на проде будет true (https)
}));

app.use(passport.initialize());
app.use(passport.session());

// Сериализация пользователя
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// === Google Strategy ===
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback",        // ← просто путь
  passReqToCallback: true                      // ← это ключ к успеху
},
(req, accessToken, refreshToken, profile, done) => {
  // req здесь содержит текущий протокол (http/https) и хост (localhost или прод)
  return done(null, {
    id: profile.id,
    email: profile.emails[0].value,
    name: profile.displayName,
    photo: profile.photos?.[0]?.value || null
  });
}));


/**
 * 2. ФУНКЦИЯ РАСЧЕТА ФИНАНСОВОГО ПРОГНОЗА
 * * @param {Object} input - Данные, пришедшие с фронтенда (inputs и toggles).
 * @returns {Object} - Финальные суммы и данные для графика.
 */
function calculateProjection(input) {
    // Деструктуризация входных данных (для удобства)
    let { 
        currentAge, activeMonthly, additionalYearly, regularMonthly, additionalYearlySpending,
        childrenNumber, currentAssets, projectionYears, annualReturn,
        // Toggles не трогаем, они булевы
        incomeIncreasement, privateSchool, moreTraveling, healthProblems, parentsHelp
    } = input;

    // ****************************************************
    // ИСПРАВЛЕНИЕ: Принудительное преобразование строк в числа
    // ****************************************************
    currentAge = Number(currentAge);
    activeMonthly = Number(activeMonthly);
    additionalYearly = Number(additionalYearly);
    regularMonthly = Number(regularMonthly);
    additionalYearlySpending = Number(additionalYearlySpending);
    childrenNumber = Number(childrenNumber);
    currentAssets = Number(currentAssets);
    projectionYears = Number(projectionYears);
    annualReturn = Number(annualReturn);
    
    // Также можно добавить дополнительную проверку на NaN на бэкенде:
    if (isNaN(currentAge) || isNaN(activeMonthly) || isNaN(projectionYears)) {
        // В случае сбоя валидации на фронтенде, бэкенд отправит ошибку 500.
        throw new Error("One or more key financial inputs are not valid numbers.");
    }
    // ****************************************************
    
    // Преобразование процента в десятичную дробь
    const annualRate = annualReturn / 100;
    
    // Инициализация переменных для цикла
    let currentInvestmentWorth = currentAssets;
    let currentSavingWorth = currentAssets; // Для сценария без инвестирования
    let currentYear = 0;
    
    // Массивы для данных графика (Начинаем с начальных активов)
    const investingData = [currentAssets];
    const savingOnlyData = [currentAssets];

    // Константы расходов
    const EXPENSE_PRIVATE_SCHOOL_PER_CHILD_MONTHLY = 1000;
    const EXPENSE_PUBLIC_SCHOOL_PER_CHILD_MONTHLY = 500;
    const EXPENSE_TRAVELING_YEARLY = 500 * 12; // 6000
    const EXPENSE_HEALTH_PROBLEMS_YEARLY = 2000;
    const EXPENSE_PARENTS_HELP_YEARLY = 300 * 12; // 3600
    
    // ----------------------------------------------------
    // ЦИКЛ РАСЧЕТА ПО ГОДАМ
    // ----------------------------------------------------
    
    for (let i = 0; i < projectionYears; i++) {
        
        // 1. Расчет ГОДОВОГО АКТИВНОГО ДОХОДА
        let yearlyActiveIncome = activeMonthly * 12;
        
        // Income Increasement (35-45)
        if (incomeIncreasement && currentAge >= 35 && currentAge <= 45) {
            yearlyActiveIncome *= 1.3;
        }
        
        // Общий годовой доход
        const totalYearlyIncome = yearlyActiveIncome + additionalYearly;

        // 2. Расчет ГОДОВЫХ РАСХОДОВ
        let totalYearlySpendings = (regularMonthly * 12) + additionalYearlySpending;
        
        // Расходы на детей
        if (childrenNumber > 0) {
            const childExpenseMonthly = privateSchool 
                ? EXPENSE_PRIVATE_SCHOOL_PER_CHILD_MONTHLY 
                : EXPENSE_PUBLIC_SCHOOL_PER_CHILD_MONTHLY;
                
            totalYearlySpendings += childExpenseMonthly * childrenNumber * 12;
        }
        
        // Дополнительные Toggle-расходы
        if (moreTraveling) {
            totalYearlySpendings += EXPENSE_TRAVELING_YEARLY;
        }
        
        // Условные расходы (зависят от возраста)
        if (currentAge >= 40) {
            if (healthProblems) {
                totalYearlySpendings += EXPENSE_HEALTH_PROBLEMS_YEARLY;
            }
            if (parentsHelp) {
                totalYearlySpendings += EXPENSE_PARENTS_HELP_YEARLY;
            }
        }
        
        // 3. Расчет Чистого Годового Потока (Savings per year)
        // (Это то, что остается после всех расходов)
        const savingsPerYear = totalYearlyIncome - totalYearlySpendings;
        
        // --- СЦЕНАРИЙ А: ИНВЕСТИРОВАНИЕ (Сложный процент) ---
        
        // Увеличение накопленных активов за счет инвестиционного дохода
        // Активы * (1 + R)
        const assetsGrown = currentInvestmentWorth * (1 + annualRate);
        
        // Новые вложения (Чистый поток) + доход от новых вложений за полгода
        // Savings * (1 + R/2) (Используем R/200, как в вашей логике)
        const savingsGrown = savingsPerYear * (1 + annualRate / 2);

        currentInvestmentWorth = assetsGrown + savingsGrown;
        
        // --- СЦЕНАРИЙ B: СБЕРЕЖЕНИЕ (Без инвестиционного дохода) ---
        
        currentSavingWorth += savingsPerYear;

        // --- ОБНОВЛЕНИЕ ДАННЫХ ---
        
        currentAge++; // Возраст увеличивается на 1
        currentYear++; // Счетчик лет для графика
        
        // Добавление точек данных для графика
        investingData.push(Math.max(0, currentInvestmentWorth));
        savingOnlyData.push(Math.max(0, currentSavingWorth));
    }
    
    // 4. ФИНАЛЬНЫЙ ВОЗВРАТ РЕЗУЛЬТАТОВ
    return {
        projectionYears: input.projectionYears,
        finalInvestingAmount: Math.round(currentInvestmentWorth),
        finalSavingOnlyAmount: Math.round(currentSavingWorth),
        projectionData: {
            investing: investingData,
            savingOnly: savingOnlyData,
        }
    };
}


// ----------------------------------------------------
// 3. API-РОУТ ДЛЯ РАСЧЕТОВ
// ----------------------------------------------------



app.post('/api/calculate', async (req, res) => {
    try {
        const inputData = req.body;
        
        // Простая валидация
        if (!inputData || !inputData.currentAge || !inputData.projectionYears) {
             return res.status(400).json({ error: 'Missing required financial inputs.' });
        }
        
        // 1. Проведение расчетов
        const results = calculateProjection(inputData);
        
        // 2. ЗАПИСЬ В БАЗУ ДАННЫХ (Supabase)
        // Имя таблицы: Financial_future
        const { error } = await supabase
            .from('Financial_future') 
            .insert([
                {
                    // Входные данные (соответствуют полям формы)
                    user_name: inputData.name, // Имя пользователя (Your name (for database))
                    current_age: inputData.currentAge,
                    active_monthly: inputData.activeMonthly,
                    additional_yearly: inputData.additionalYearly,
                    income_increase_toggle: inputData.incomeIncreasement, // Toggle
                    current_assets: inputData.currentAssets,
                    regular_monthly: inputData.regularMonthly,
                    additional_yearly_spending: inputData.additionalYearlySpending,
                    children_number: inputData.childrenNumber,
                    private_school_toggle: inputData.privateSchool, // Toggle
                    traveling_toggle: inputData.moreTraveling, // Toggle
                    health_problems_toggle: inputData.healthProblems, // Toggle
                    parents_help_toggle: inputData.parentsHelp, // Toggle
                    projection_years: inputData.projectionYears,
                    annual_return_rate: inputData.annualReturn, 
                    // Результаты расчетов
                    result_investing_amount: results.finalInvestingAmount,
                    result_saving_amount: results.finalSavingOnlyAmount
                }
            ]);

        if (error) {
            // Выводим ошибку в консоль сервера, но не блокируем пользователя
            console.error('Supabase write error:', error); 
        }
        
        // 3. Отправка результатов обратно на фронтенд
        res.json(results);
        
    } catch (error) {
        console.error('Calculation error or internal server error:', error);
        res.status(500).json({ error: 'Internal server error during financial calculation.' });
    }
});



// 1. Начинаем Google Login
app.get('/auth/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    // Магия: принудительно передаёт текущий хост в Google
    callbackURL: `${req.protocol}://${req.headers.host}/auth/google/callback`
  })(req, res, next);
});

// 2. Google перенаправляет сюда после входа
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

// 3. Выход
app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// 4. API: получить текущего пользователя (для фронтенда)
app.get('/auth/me', (req, res) => {
  if (req.user) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        photo: req.user.photo
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});



// ----------------------------------------------------
// 4. ЗАПУСК СЕРВЕРА
// ----------------------------------------------------

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});