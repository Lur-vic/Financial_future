const request = require('supertest');
const { app } = require('../server'); // импортируем app

describe('API Integration Tests', () => {
  it('POST /api/calculate should return calculation results', async () => {
    const response = await request(app)
      .post('/api/calculate')
      .send({
        name: 'Integration Test User',
        currentAge: 30,
        activeMonthly: 5000,
        additionalYearly: 0,
        regularMonthly: 3000,
        additionalYearlySpending: 0,
        childrenNumber: 0,
        currentAssets: 10000,
        projectionYears: 5,
        annualReturn: 8,
        incomeIncreasement: false,
        privateSchool: false,
        moreTraveling: false,
        healthProblems: false,
        parentsHelp: false,
        salaryIncreasement: 0,
        inflationRate: 0
      })
      .expect(200); // ожидаем успешный ответ

    // Проверяем структуру ответа
    expect(response.body).toHaveProperty('finalInvestingAmount');
    expect(response.body).toHaveProperty('finalSavingOnlyAmount');
    expect(response.body).toHaveProperty('projectionData');
    expect(response.body.projectionData.investing).toBeInstanceOf(Array);
    expect(response.body.projectionData.investing.length).toBe(6); // 5 лет + стартовая точка

    // Проверяем логику
    expect(response.body.finalInvestingAmount).toBeGreaterThan(response.body.finalSavingOnlyAmount);
  });

  it('should handle invalid data with 400', async () => {
    const response = await request(app)
      .post('/api/calculate')
      .send({}) // пустое тело
      .expect(400);

    expect(response.body.error).toContain('Missing required');
  });
});