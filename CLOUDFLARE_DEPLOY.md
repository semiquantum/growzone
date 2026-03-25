# Cloudflare Pages Deployment (GrowZone)

## 1) Connect project to Cloudflare Pages
- Build command: leave empty (static site)
- Output directory: `/`

## 2) Add Pages Function for API
- File already added: `functions/query.js`
- This creates endpoint: `/query`

## 3) Configure environment variables (Cloudflare Pages)
In Pages dashboard -> Settings -> Environment variables, add:
- `HF_API_KEY` = your Hugging Face key
- `HF_MODEL` = `Qwen/Qwen2.5-1.5B-Instruct`

Set them for both:
- Production
- Preview

## 4) Firebase auth checklist
In Firebase Console -> Authentication:
- Enable `Email/Password`
- Enable `Google`
- Add authorized domain: `growzone.sqstudio.in`

## 5) Verify live
- Open `/login.html` and sign in
- You should redirect to `/dashboard.html`
- Open `/growai.html` and send a message
- Bot calls `/query` via Cloudflare Function

## 6) Security notes
- Never hardcode `HF_API_KEY` in frontend files
- Keep `.env` local only (already ignored by git)
