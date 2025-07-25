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
drillbit-dashboard/
├── .env                         # Local environment variables (ignored by git)
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── prisma/
│   ├── schema.prisma            # Prisma schema with model definitions
│   └── seed.ts                  # Script to seed database
├── lib/
│   └── utils.ts                 # Utility functions (e.g., cn)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home route
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Dashboard page
│   │   ├── customer/
│   │   │   └── [phone]/
│   │   │       └── page.tsx     # Customer detail view
│   │   └── api/
│   │       └── messages/
│   │           ├── route.ts     # GET all messages
│   │           └── [phone]/
│   │               └── route.ts # GET messages for specific phone
│   └── types/
│       └── index.ts             # Shared TypeScript types (e.g., Message)
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
