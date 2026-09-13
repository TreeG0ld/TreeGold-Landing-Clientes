// Configuración de PM2 para mantener el servidor Next.js corriendo en el VPS
// (reinicio automático si se cae, arranque al reiniciar el servidor).
// Uso en el VPS, dentro de la carpeta del proyecto:
//   pm2 start ecosystem.config.cjs
//   pm2 save
//   pm2 startup   (una sola vez; sigue las instrucciones que imprime)
module.exports = {
  apps: [
    {
      name: "treegold",
      script: "npm",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
    },
  ],
};
