module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', '*'],
          'img-src': ["'self'", 'data:', 'blob:', '*'],
          'media-src': ["'self'", 'data:', 'blob:', '*'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: false,
      origin: ['http://34.21.175.175:1337', 
        'http://34.21.175.175:3000', 
        'http://34.21.175.175', 
        'https://dnt.trwq-ta.io.vn', 
        'https://dnt-admin.trwq-ta.io.vn', 
        'http://dnt.trwq-ta.io.vn',
        'https://customer-web-snowy.vercel.app',
        'customer-web-snowy.vercel.app',
        'http://localhost:5173',
        'https://diniti.vn',
        'https://www.diniti.vn'
      ],
      headers: ['*'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      keepHeaderOnError: false,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
