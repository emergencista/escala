module.exports = {
  apps: [
    {
      name: 'escala-medica',
      script: 'node',
      args: 'node_modules/.bin/next start',
      cwd: '/home/ubuntu/escala/escala-medica',
      instances: 1,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: 10000,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/pm2/escala-error.log',
      out_file: '/var/log/pm2/escala-out.log',
    },
  ],
};
