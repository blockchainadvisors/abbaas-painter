module.exports = {
  apps: [
    {
      name: 'abbaas-backend',
      cwd: '/home/neylaur/abbaas-painter/backend',
      script: 'venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
      env: {
        PYTHONUNBUFFERED: '1'
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000
    },
    {
      name: 'abbaas-frontend',
      cwd: '/home/neylaur/abbaas-painter/frontend',
      script: 'npm',
      args: 'run dev -- --host 0.0.0.0',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 1000
    }
  ]
};
