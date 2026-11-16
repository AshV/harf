import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  // Using relative base ensures clean deployment on both GitHub Pages and Cloudflare Pages
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'pwa-maskable-512x512.png'
      ],
      manifest: {
        name: 'हर्फ़ (Harf) — आधुनिक हिन्दी ई-पुस्तकालय',
        short_name: 'हर्फ़',
        description: 'सार्वजनिक डोमेन हिन्दी साहित्य के लिए आधुनिक, ऑफ़लाइन डिजिटल पुस्तकालय।',
        theme_color: '#FAF7F2',
        background_color: '#FAF7F2',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: './',
        start_url: './',
        lang: 'hi',
        dir: 'ltr',
        categories: ['books', 'education', 'literature'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['assets/**/*.{js,css}', '*.{ico,png,svg,webp}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // App Shell & Navigation: Always fetch fresh HTML from network when online, fallback to cache when offline
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'harf-html-cache-v2',
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Master Library Catalog: Always try network first to get newly added books immediately
            urlPattern: /.*\/content\/library\.json.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'harf-library-catalog-v4',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days fallback
              },
              networkTimeoutSeconds: 3,
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Book Metadata & Chapters: StaleWhileRevalidate for fast offline and online reading
            urlPattern: /.*\/content\/books\/.*\.json/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'harf-books-runtime',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
