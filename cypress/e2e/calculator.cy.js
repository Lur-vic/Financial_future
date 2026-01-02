describe('Financial Future Main Page', () => {
  it('loads the calculator and performs basic calculation', () => {
    cy.visit('/')  // ← теперь '/' вместо полного URL, берётся из baseUrl

    // остальной код теста без изменений

    // Проверяем, что заголовок виден
    cy.get('.app-title').should('contain', 'Financial Future')

    // Заполняем обязательное поле "Your name"
    cy.get('#name').type('Cypress Test')

    // Нажимаем кнопку расчёта
    cy.get('#calculate-btn').click()

    // Ждём появления результатов
    cy.get('#results', { timeout: 10000 }).should('be.visible')

    // Проверяем, что результаты отобразились
    cy.get('#investing-result').should('contain.text', '$')
    cy.get('#saving-result').should('contain.text', '$')

    // Проверяем, что график есть
    cy.get('#projectionChart').should('exist')
  })
})