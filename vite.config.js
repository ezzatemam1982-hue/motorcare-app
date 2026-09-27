import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Vite plugin to ensure all static classic scripts, databases, and assets are copied to dist
function copyClassicScripts() {
  return {
    name: 'copy-classic-scripts',
    closeBundle() {
      const itemsToCopy = [
        'js',
        'css',
        'app_config.js',
        'obd_codes.js',
        'obd_codes.json',
        'carData.js',
        'car_database.json',
        'service_centers.js',
        'service_centers.json',
        'manifest.json',
        'sw.js',
        'service-worker.js',
        'privacy.html'
      ];

      for (const item of itemsToCopy) {
        const srcPath = path.resolve(__dirname, item);
        const destPath = path.resolve(__dirname, 'dist', item);

        if (fs.existsSync(srcPath)) {
          const stat = fs.statSync(srcPath);
          if (stat.isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }

      // Automatically copy root image assets (logos, icons, headers) to dist
      const rootFiles = fs.readdirSync(__dirname);
      for (const file of rootFiles) {
        if (/\.(png|jpe?g|svg|webp|ico)$/i.test(file)) {
          const srcFile = path.resolve(__dirname, file);
          const destFile = path.resolve(__dirname, 'dist', file);
          fs.copyFileSync(srcFile, destFile);
        }
      }

      console.log('[MotorCare Build] All modular scripts, data libraries and images mirrored to dist successfully.');
    }
  };
}

export default {
  plugins: [copyClassicScripts()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
};
