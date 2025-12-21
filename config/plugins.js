module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: "strapi-upload-supabase-provider",
      providerOptions: {
        apiUrl: env("SUPABASE_API_URL"),
        apiKey: env("SUPABASE_API_KEY"),
        bucket: env("SUPABASE_BUCKET_NAME"),
        directory: env("SUPABASE_BUCKET_DIRECTORY"),
      },
      sizeLimit: 1000000000,
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
        checkFileSize: {},
      },
    },
  },
  // upload: {
  //   config: {
  //     provider: 'cloudinary',
  //     providerOptions: {
  //       cloud_name: env('CLOUDINARY_NAME'),
  //       api_key: env('CLOUDINARY_KEY'),
  //       api_secret: env('CLOUDINARY_SECRET'),
  //     },
  //     actionOptions: {
  //       upload: {
  //         folder: env('CLOUDINARY_FOLDER', 'strapi-uploads'),
  //       },
  //       uploadStream: {
  //         folder: env('CLOUDINARY_FOLDER', 'strapi-uploads'),
  //       },
  //       delete: {},
  //     },
  //   },
  // },
  'system-logs': {
    enabled: true,
    resolve: './src/plugins/system-logs',
  },
});
