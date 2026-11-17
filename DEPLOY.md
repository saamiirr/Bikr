# Deploying Bikr to Vercel

On Vercel the shop keeps its data in two free Vercel storage add-ons:

| What | Where (online) | Where (your computer) |
| --- | --- | --- |
| Perfumes, prices, stock | Upstash Redis | `data/products.json` |
| Uploaded photos | Vercel Blob | `data/uploads/` |

The first time the site runs online, it fills Redis with the 26 perfumes from
`src/data/seed.ts`. Changes you made locally in `data/` are **not** copied up.

## 1. Put the project on Vercel

**Option A: GitHub (recommended, redeploys on every push)**

1. Create a GitHub repository and push this folder to it.
2. In Vercel: **Add New… → Project**, import the repository and click **Deploy**.
   `vercel.json` already sets the install and build commands.

**Option B: Vercel CLI (no GitHub)**

```bash
npx vercel login
```

```bash
npx vercel
```

Answer the questions (defaults are fine). This creates a preview deployment.

## 2. Add the storage (once)

In your Vercel project, open the **Storage** tab:

1. **Create Database → Upstash for Redis** (free plan). Connect it to this
   project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
2. **Create → Blob**. Choose **Public** access and connect it to this project.
   This adds `BLOB_READ_WRITE_TOKEN`.

## 3. Set the admin login

**Settings → Environment Variables**, add:

| Name | Value |
| --- | --- |
| `ADMIN_USERNAME` | your admin username |
| `ADMIN_PASSWORD` | a strong password (**don't keep `admin`**) |
| `ADMIN_SESSION_SECRET` | optional: any long random text |

If these aren't set, the login is `admin` / `admin`.

## 4. Redeploy

Environment variables only apply to new deployments:

- GitHub: **Deployments → … → Redeploy**, or push a commit.
- CLI:

```bash
npx vercel --prod
```

Then open `https://<your-site>.vercel.app/admin`.

## If something's wrong

- **"No database connected"**: Redis isn't connected to this project, or you
  didn't redeploy after connecting it.
- **"Photo storage isn't connected"**: Blob store missing, or created as
  *Private*. Create a **Public** Blob store.
