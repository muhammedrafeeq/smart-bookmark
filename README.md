# 🔖 Smart Bookmark App

A sleek, real-time personal bookmark manager. Built with **Next.js**, **Supabase**, and **Tailwind CSS**.

## ✨ Features
- 🔐 **Google OAuth**: Fast and secure login.
- ⚡ **Real-time Sync**: Updates across all open tabs instantly without refresh.
- 🛡️ **Private Data**: Row Level Security (RLS) ensures only you see your bookmarks.
- 🎨 **Premium UI**: Dark mode with glassmorphism and smooth animations.
- 📱 **Responsive**: Fully optimized for mobile and desktop.

---

## 🛠️ Development Journey: Challenges & Solutions

Building this app presented a few interesting technical hurdles:

### 1. Provider Enablement Error
**Problem**: Initially, clicking "Sign in with Google" returned localized errors like `Unsupported provider: provider is not enabled`.
**Solution**: Diagnosed that Supabase requires manual enablement of OAuth providers. I provided detailed documentation on configuring the Google Cloud Console (Client ID/Secret) and properly setting up the Redirect URIs in the Supabase dashboard.

### 2. Real-time Subscription Filtering
**Problem**: Real-time subscriptions needed to be scoped correctly so users wouldn't receive notifications for other people's bookmarks (even if RLS protected the data).
**Solution**: Implemented Postgres level filtering in the Supabase subscription:
```typescript
.on('postgres_changes', { 
  event: '*', 
  schema: 'public', 
  table: 'bookmarks', 
  filter: `user_id=eq.${user.id}` 
}, ...)
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js installed.
- A [Supabase](https://supabase.com/) project.
- A [Google Cloud](https://console.cloud.google.com/) project for OAuth.

### 2. Supabase Setup
1. Run the SQL in `supabase_schema.sql` within your Supabase SQL Editor.
2. Enable the **Google** provider under **Authentication > Providers**.
3. Enable **Realtime** for the `bookmarks` table (**Database > Replication**).

### 3. Environment Variables
Create a `.env.local` file with your keys:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run Locally
```bash
npm install
npm run dev
```

---

## 🌐 Deployment
Deploy easily on **Vercel**:
1. Push your code to GitHub.
2. Link the repo in Vercel.
3. Add the two environment variables in the Vercel dashboard.
4. Ensure the Vercel URL is added to your Google OAuth Authorized redirect URIs.
