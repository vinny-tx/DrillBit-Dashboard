# 📊 Drillbit Dashboard

A modern dashboard app built to track and visualize messages requiring attention, using filtering, sorting, and pagination.

---

## 🧰 Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **TailwindCSS** + **ShadCN UI**
- **Prisma** ORM
- **PostgreSQL**
- **Tremor** charts

---

## 🚀 Local Development

1. **Clone the Repo**

   ```bash
   git clone https://github.com/vinny-tx/drillbit-dashboard.git
   cd drillbit-dashboard
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Environment Variables**

   Create a `.env` file in the root of the project with your PostgreSQL connection string:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/your-db"
   DIRECT_URL=""
   ```

4. **Push Prisma Schema**

   ```bash
   npx prisma db push
   ```

5. **Seed the Database**

   ```bash
   npx tsx prisma/seed.ts
   ```

6. **Run the Dev Server**

   ```bash
   npm run dev
   ```

---

## 🗂 Project Structure

```
/src
  /app
    /dashboard          # UI & logic for dashboard page
    /api/messages       # API route to fetch messages
  /components/ui        # Shared UI components (Badge, Card, etc.)
  /lib                  # Helper functions and formatting
  /types                # Type definitions (e.g., Message)
prisma/
  schema.prisma         # DB schema
  seed.ts               # Optional seed script
```

---

## 🧼 Code Style

- Tailwind CSS via classNames
- ShadCN components + consistent `space-y`, `gap`, and layout utilities
- Type safety enforced with custom `Message` and `SortOption` types

---

## 🙏 Acknowledgements

- [Tremor](https://www.tremor.so/) for charts
- [ShadCN UI](https://ui.shadcn.dev/) for clean component primitives
- [Prisma](https://www.prisma.io/) for database ORM

---

## 👤 Author

Vincent Tran  
[github.com/vinny-tx](https://github.com/vinny-tx)
