# DermAI - AI-Powered Skin Analysis Platform

<div align="center">

![DermAI](https://img.shields.io/badge/DermAI-Skin%20Analysis-pink?style=for-the-badge&logo=health&logoColor=white)

[![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat&logo=python)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat&logo=typescript)](https://typescriptlang.org)
[![Flask](https://img.shields.io/badge/Flask-3+-000000?style=flat&logo=flask)](https://flask.palletsprojects.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat&logo=firebase)](https://firebase.google.com)

*Advanced AI-powered dermatological diagnostic platform combining deep learning (Vision Transformer) with Grad-CAM explainability and real-time medical consultation assistant.*

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 🌟 Features

### Core AI Capabilities
- **🔬 8-Class Skin Condition Detection** - Vision Transformer (ViT) / EfficientNet deep learning model.
- **🧠 Grad-CAM Visual Explanations** - Transparent visual heatmaps revealing which regions influenced the AI's classification.
- **💬 AI Chat Assistant** - Real-time dermatology consultations powered by Groq LLMs.
- **📊 Comprehensive Reports** - Detailed diagnostic breakdowns with symptoms, clinical remedies, and prevention.
- **⚡ Real-time Processing** - Sub-second inference and image processing pipeline.

### User & Clinical Features
- **🔐 Authentication** - Secure authentication powered by Firebase Auth with local dev simulation.
- **👤 User Profiles** - Account management, security settings, and personal scans.
- **📈 Analytics Dashboard** - Trend visualization, historical scans, and condition distribution.
- **📱 Fully Responsive** - Mobile-friendly modern UI built with Tailwind CSS.
- **📄 PDF Export** - Instant download of branded clinical assessment reports.

### Detected Conditions
| Category | Conditions |
|----------|------------|
| **Bacterial** | Cellulitis, Impetigo |
| **Fungal** | Athlete's Foot, Nail Fungus, Ringworm |
| **Parasitic** | Creeping Eruption |
| **Viral** | Chickenpox, Shingles |

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Groq API Key** (optional, for AI chat assistant)

### 1. Clone the repository
```bash
git clone https://github.com/Ojas37/DermAI.git
cd DermAI
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # macOS/Linux
pip install -r requirements.txt
python init_db.py
```

### 3. Frontend Setup
```bash
cd ..
npm install
```

### 4. Run the Application
```bash
# Automated (Windows PowerShell):
.\scripts\start-derm-ai.ps1

# Or manually in two terminals:
# Terminal 1 (Backend):
cd backend && python app.py

# Terminal 2 (Frontend):
npm run dev
```

- **Frontend**: http://localhost:5176/
- **Backend API**: http://localhost:5002/api/health

---

## 🏗️ Architecture

```
derm-ai/
├── backend/                      # Flask Backend (Python)
│   ├── api/                      # REST endpoints (chat, analysis)
│   ├── middleware/               # Auth & rate-limiting middleware
│   ├── models/                   # SQLAlchemy models
│   ├── utils/                    # Grad-CAM, PDF generator, mock analyzer
│   ├── app.py                    # Flask application entry point
│   ├── config.py                 # Backend configurations
│   └── requirements.txt          # Python dependencies
│
├── src/                          # React Frontend (TypeScript)
│   ├── components/               # UI components
│   │   ├── auth/                 # Login, Signup, ForgotPassword
│   │   ├── chat/                 # AI Consultation Chat
│   │   ├── dashboard/            # SkinScan, Analytics, ScanDetails
│   │   └── landing/              # Hero & marketing sections
│   ├── lib/                      # AuthContext, ServiceContext, utils
│   ├── App.tsx                   # Main router & routes
│   └── main.tsx                  # React DOM mount
│
├── docs/                         # Detailed project documentation
└── scripts/                      # Startup & automation scripts
```

---

## 🛡️ License & Disclaimer

*Disclaimer: DermAI is designed for informational and educational purposes and does not replace professional medical diagnosis or consultation.*
