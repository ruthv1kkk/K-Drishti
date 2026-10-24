<div align="center">

# 👁️ K-Drishti

### See the issue. Track the action.

A responsive civic-tech platform for reporting and following community issues in Kanpur.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-2ea44f?style=for-the-badge&logo=githubpages&logoColor=white)](https://ruthv1kkk.github.io/K-Drishti/)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)

[Live Demo](https://ruthv1kkk.github.io/K-Drishti/) · [Report a Bug](https://github.com/ruthv1kkk/K-Drishti/issues) · [Request a Feature](https://github.com/ruthv1kkk/K-Drishti/issues)

</div>

<!-- Add a screenshot: save it as docs/screenshot.png, then uncomment the line below
<p align="center"><img src="docs/screenshot.png" alt="K-Drishti screenshot" width="800"></p>
-->

---

## 📖 About

**K-Drishti** (*Drishti* means "vision" in Hindi) is a front-end civic-tech project that shows how residents could report local problems, follow the progress of their complaints, and see where public funds are going, all in one place.

It is a presentation prototype: every issue, location, budget, and ledger record in the app is **fictional sample data**, and nothing connects to a real municipal system.

## ✨ Features

| Feature | What it does |
| --- | --- |
| 📊 **Overview** | Community issue summaries, recent reports, and a city activity snapshot |
| 📝 **Report an Issue** | Validated form with optional local image preview, auto-generated complaint IDs, and saving in the browser (`localStorage`) |
| 🔎 **Track a Complaint** | Look up seeded example complaints and follow their status timeline |
| 🗺️ **Issue Map** | Interactive Leaflet map with fictional markers, category and status filters, and a matching list |
| 🧰 **Services** | Service cards that preselect the right category in the report form |
| 💰 **Funding & Transparency** | Illustrative budgets, releases, expenditure, verification status, a project ledger, and allocation bars |
| 📈 **City Analytics** | Charts and stats built from the shared issue data |

## 🛠️ Tech Stack

- **[Vite](https://vitejs.dev/)** for fast development and production builds
- **[React](https://react.dev/)** for the user interface
- **[Leaflet](https://leafletjs.com/)** with OpenStreetMap tiles for maps
- **[Oxlint](https://oxc.rs/)** for linting
- **GitHub Actions + GitHub Pages** for deployment

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- npm (comes with Node.js)

### Run locally

```bash
# 1. Clone the repository
git clone https://github.com/ruthv1kkk/K-Drishti.git
cd K-Drishti

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open the local URL that Vite prints in the terminal (usually `http://localhost:5173`).

### Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build in `dist/` |
| `npm run lint` | Run Oxlint |

## 📁 Project Structure

```
K-Drishti/
├── .github/workflows/   # GitHub Actions workflow for Pages deployment
├── public/              # Static assets
├── scripts/             # Helper scripts
├── src/                 # Application source code
├── index.html           # App entry point
├── vite.config.js       # Vite configuration
└── package.json
```

## 🌐 Deployment

The site deploys automatically to **GitHub Pages** through GitHub Actions on every push to `main`.

1. Go to **Settings → Pages**.
2. Under **Source**, choose **GitHub Actions**.
3. Push to `main` and watch the run in the **Actions** tab.

Live site: **https://ruthv1kkk.github.io/K-Drishti/**

> The Vite `base` option in `vite.config.js` is set to `/K-Drishti/`. If you rename the repository, update it to match.

## ⚠️ Notes & Limitations

- All reports, locations, budgets, and ledger records are **fictional presentation data**.
- Reports are saved **only in the current browser** (`localStorage`). Clearing site data removes them.
- Images are previewed locally and are **never uploaded**.
- Map tiles load from OpenStreetMap and need an internet connection.

## 🤝 Contributing

Contributions, issues, and feature ideas are welcome.

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request



---

<div align="center">

If you like this project, consider giving it a ⭐

</div>
