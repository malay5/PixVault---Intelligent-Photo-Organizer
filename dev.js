const concurrently = require('concurrently');

concurrently([
    { command: 'npm run dev --prefix main_app/frontend', name: 'frontend', prefixColor: 'blue' },
    { command: 'npm start --prefix main_app/backend', name: 'backend', prefixColor: 'green' },
    { command: 'uvicorn main:app --reload --app-dir ml_service', name: 'ml_service', prefixColor: 'yellow' },
    { command: 'npm run dev --prefix monitoring_dashboard', name: 'monitoring', prefixColor: 'magenta' }
], {
    prefix: 'name',
    killOthers: ['failure', 'success'],
    restartTries: 3,
});
