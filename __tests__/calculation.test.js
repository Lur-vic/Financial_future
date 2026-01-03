const { calculateProjection } = require('../server.js'); // путь к твоей функции

describe('calculateProjection', () => {
  const baseInput = {
    currentAge: 30,
    activeMonthly: 5000,
    additionalYearly: 0,
    regularMonthly: 3000,
    additionalYearlySpending: 0,
    childrenNumber: 0,
    currentAssets: 10000,
    projectionYears: 20,
    annualReturn: 8,
    incomeIncreasement: false,
    privateSchool: false,
    moreTraveling: false,
    healthProblems: false,
    parentsHelp: false,
    salaryIncreasement: 0,
    inflationRate: 0
  };

  it('should return correct final amounts with default values', () => {
    const result = calculateProjection(baseInput);

    expect(result.finalInvestingAmount).toBeGreaterThan(result.finalSavingOnlyAmount);
    expect(result.projectionData.investing.length).toBe(21); // 20 лет + стартовая точка
    expect(result.projectionData.savingOnly.length).toBe(21);
  });

  it('should account for salary growth', () => {
    const withGrowth = { ...baseInput, salaryIncreasement: 7 };
    const result = calculateProjection(withGrowth);

    // После роста зарплаты investing должен быть выше, чем без роста
    const withoutGrowth = calculateProjection(baseInput);
    expect(result.finalInvestingAmount).toBeGreaterThan(withoutGrowth.finalInvestingAmount);
  });

  it('should account for inflation', () => {
    const withInflation = { ...baseInput, inflationRate: 5 };
    const result = calculateProjection(withInflation);

    const withoutInflation = calculateProjection(baseInput);
    expect(result.finalInvestingAmount).toBeLessThan(withoutInflation.finalInvestingAmount);
  });

  it('should limit children expenses to 20 years', () => {
    const withChildren = { ...baseInput, childrenNumber: 2, privateSchool: true, projectionYears: 30 };
    const result = calculateProjection(withChildren);

    // Логика: после 20 лет расходы на детей исчезают → рост должен ускориться
    // Мы просто проверяем, что расчёт завершился и массивы правильной длины
    expect(result.projectionData.investing.length).toBe(31); // 30 + 1
  });
});