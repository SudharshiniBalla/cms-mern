# 🖥️ ContentCMS — MERN Stack CMS

A full-featured Content Management System built with **MongoDB, Express, React, Node.js**. Supports drag-and-drop page building, multi-role collaboration, approval workflows, SEO tools, media management, and analytics.

---

## 📸 Features

| Feature | Description |
|---|---|
| 🧱 **Drag & Drop Editor** | 10+ block types: Heading, Paragraph, Image, Button, Columns, CTA, Testimonial, FAQ, HTML, Divider |
| 👥 **Multi-Role System** | Admin, Editor, Author, Viewer with granular permissions |
| ✅ **Approval Workflow** | Authors submit → Editors/Admins approve & publish |
| 🎨 **Templates** | Reusable page templates with categories |
| 🔍 **SEO Tools** | Per-page meta title, description, keywords + live SERP preview |
| 🖼️ **Media Library** | Upload, organize, and reuse images/videos/documents |
| 📊 **Analytics Dashboard** | Page views, top pages, recent activity charts |
| 📋 **Page Revisions** | Auto-save revisions, restore previous versions |
| ⚙️ **Site Settings** | Branding, colors, social links, system toggles |

---

## 🗂️ Project Structure

```
cms-mern/
├── backend/                  # Node.js + Express API
│   ├── controllers/          # Route handlers
│   │   ├── authController.js
│   │   ├── pageController.js
│   │   ├── userController.js
│   │   ├── templateController.js
│   │   ├── mediaController.js
│   │   ├── analyticsController.js
│   │   └── settingsController.js
│   ├── models/               # Mongoose schemas
│   │   ├── User.js
│   │   ├── Page.js
│   │   ├── Template.js
│   │   ├── Media.js
│   │   ├── Analytics.js
│   │   └── Settings.js
│   ├── middleware/
│   │   └── auth.js           # JWT protect + role authorize
│   ├── routes/               # Express routers
│   ├── config/
│   │   └── db.js
│   ├── seed.js               # Database seeder
│   ├── server.js             # Entry point
│   └── .env.example
│
├── frontend/                 # React 18 SPA
│   └── src/
│       ├── context/
│       │   └── AuthContext.js
│       ├── pages/
│       │   ├── LoginPage.js
│       │   ├── DashboardPage.js
│       │   ├── PagesListPage.js
│       │   ├── PageEditorPage.js  # Drag-and-drop editor
│       │   ├── UsersPage.js
│       │   ├── MediaPage.js
│       │   ├── TemplatesPage.js
│       │   ├── SettingsPage.js
│       │   └── ProfilePage.js
│       ├── components/
│       │   └── common/
│       │       └── AppLayout.js
│       ├── services/
│       │   └── api.js        # Axios + API helpers
│       ├── styles/
│       │   └── global.css
│       └── App.js
│
├── package.json              # Root scripts (concurrently)
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/cms-mern.git
cd cms-mern
npm run install-all
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cms_db
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

### 3. Seed Database

```bash
cd backend
node seed.js
```

This creates sample users, pages, and templates:

| Role | Email | Password |
|---|---|---|
| 👑 Admin | admin@cms.com | admin123 |
| ✏️ Editor | editor@cms.com | editor123 |
| 📝 Author | author@cms.com | author123 |

### 4. Run Development Servers

```bash
# From root — starts both backend (5000) and frontend (3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Role Permissions

| Permission | Admin | Editor | Author | Viewer |
|---|:---:|:---:|:---:|:---:|
| Create pages | ✅ | ✅ | ✅ | ❌ |
| Edit own pages | ✅ | ✅ | ✅ | ❌ |
| Edit all pages | ✅ | ✅ | ❌ | ❌ |
| Publish pages | ✅ | ✅ | ❌ | ❌ |
| Approve/review | ✅ | ✅ | ❌ | ❌ |
| Delete pages | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Manage settings | ✅ | ❌ | ❌ | ❌ |

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login |
| GET | `/api/auth/me` | Private | Get current user |
| PUT | `/api/auth/profile` | Private | Update profile |
| PUT | `/api/auth/change-password` | Private | Change password |

### Pages
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/pages` | Private | List pages |
| GET | `/api/pages/:id` | Private | Get page |
| GET | `/api/pages/slug/:slug` | Public | Get published page |
| POST | `/api/pages` | Private | Create page |
| PUT | `/api/pages/:id` | Private | Update page |
| DELETE | `/api/pages/:id` | Editor+ | Delete page |
| PATCH | `/api/pages/:id/approve` | Editor+ | Approve & publish |
| POST | `/api/pages/:id/duplicate` | Private | Duplicate page |
| GET | `/api/pages/:id/revisions` | Private | List revisions |

### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Other
- `GET/PUT /api/settings` — Site settings
- `GET/POST /api/media` — Media library
- `GET /api/analytics/dashboard` — Dashboard stats
- `GET /api/templates` — Page templates

---

## 🛠️ Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (jsonwebtoken)
- bcryptjs password hashing
- Helmet, CORS, Rate limiting
- Multer for file uploads

**Frontend**
- React 18 with hooks
- React Router v6
- @dnd-kit (drag & drop editor)
- Recharts (analytics charts)
- Axios (HTTP client)
- react-hot-toast (notifications)
- date-fns (date formatting)

---

## 🌩️ Production Deployment

### Backend (e.g. Railway, Render)
1. Set `NODE_ENV=production`
2. Use MongoDB Atlas connection string
3. Set a strong `JWT_SECRET`
4. Configure `CLIENT_URL` to your frontend domain

### Frontend (e.g. Vercel, Netlify)
1. Set build command: `cd frontend && npm run build`
2. Set `REACT_APP_API_URL` to your backend URL
3. Update the `proxy` in `frontend/package.json` for production

### Media Storage (Production)
For production, replace local `multer` storage with Cloudinary:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 📄 License

MIT © 2024
