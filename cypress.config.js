const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://money.kelerbit.com',  // дефолт для локального запуска
    setupNodeEvents(on, config) {
      // Можно добавить плагины позже
    },
  },
})