# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## Database (Supabase Postgres)
- Set `DATABASE_CLIENT=postgres`.
- Prefer a single `DATABASE_URL` like `postgresql://postgres:[YOUR_PASSWORD]@db.jromefuxyhpxffrdivzx.supabase.co:5432/postgres`.
- Enable SSL by setting `DATABASE_SSL=true`. If you encounter TLS issues, set `DATABASE_SSL_REJECT_UNAUTHORIZED=false`.
- Optional: set `DATABASE_SCHEMA=public`, `DATABASE_POOL_MIN=2`, `DATABASE_POOL_MAX=10`, `DATABASE_CONNECTION_TIMEOUT=60000`.
- Copy `.env.example` to `.env` and replace `[YOUR_PASSWORD]` with your actual password. Do not commit secrets.
- Start the app with `npm run develop` and Strapi will read the connection from `config/database.js` (`connectionString` and SSL options).

## Upload (Supabase Storage)
- Configure Strapi upload provider in `config/plugins.js:1-21`.
- Set `SUPABASE_API_URL=https://<project-ref>.supabase.co`.
- Set `SUPABASE_API_KEY` to the service role key to bypass RLS.
- Set `SUPABASE_BUCKET_NAME` to your bucket (e.g., `strapi-uploads`) and optional `SUPABASE_BUCKET_DIRECTORY`.
- Ensure CSP allows Supabase domains (`config/middlewares.js:6-17` already includes `supabase.co`).
- If you prefer client-side policies, create storage policies permitting inserts; otherwise use the service role key.

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
