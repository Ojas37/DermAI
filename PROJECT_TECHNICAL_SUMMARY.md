# 🔬 DermAI — Comprehensive Technical Project & Dataset Summary

---

## 📌 1. Executive Summary
**DermAI** is an end-to-end medical artificial intelligence platform designed to assist patients, clinicians, and researchers with automated dermatological screening, explainable decision-making, and conversational clinical guidance.

The platform bridges advanced computer vision (Vision Transformers and EfficientNet) with Explainable Artificial Intelligence (Grad-CAM saliency heatmaps) and conversational LLMs (Groq / Llama 3.1), wrapped in a responsive web architecture built with React, TypeScript, and Flask.

---

## 📊 2. What is a Dataset & How is it Used in DermAI?

### 2.1 Concept: What is a Dataset in Medical AI?
In Machine Learning, a **dataset** is a curated collection of data points (in this case, thousands of high-resolution skin photographs) coupled with ground-truth clinical annotations verified by board-certified dermatologists or biopsy histopathology.

A medical image dataset serves three core purposes:
1. **Training Set (~70–80%)**: The neural network updates its internal weights by identifying patterns (texture, color gradients, border irregularities, erythema, scaling).
2. **Validation Set (~10–15%)**: Evaluates model generalization during training and prevents overfitting.
3. **Test Set (~10–15%)**: An unseen holdout dataset used to benchmark final real-world clinical sensitivity, specificity, and accuracy.

---

### 2.2 Datasets Used by DermAI

DermAI combines two benchmark clinical dermatological datasets to cover both **infectious pathogens** and **pigmented lesions/neoplasms**:

```
                              ┌────────────────────────────────────────┐
                              │          DermAI Data Foundation         │
                              └───────────────────┬────────────────────┘
                                                  │
                ┌─────────────────────────────────┴─────────────────────────────────┐
                ▼                                                                   ▼
┌───────────────────────────────┐                                   ┌───────────────────────────────┐
│     Infectious Skin Dataset   │                                   │       HAM10000 Dataset        │
│    (DermNet NZ & Clinical)    │                                   │        (ISIC Archive)         │
├───────────────────────────────┤                                   ├───────────────────────────────┤
│ • Macro / Smartphone Photos   │                                   │ • Dermoscopic Microscopic     │
│ • 8 Infectious Classes        │                                   │ • 7 Lesion / Cancer Classes   │
│ • Bacterial, Fungal, Viral    │                                   │ • 10,015 Histopathology Imgs  │
└───────────────────────────────┘                                   └───────────────────────────────┘
```

#### A. The Primary Infectious Skin Disease Dataset (DermNet NZ / Kaggle)
- **Source**: Compiled from clinical archives including [DermNet New Zealand](https://dermnetnz.org/) and the Kaggle Skin Disease Dataset.
- **Image Modality**: Macro-clinical photography (standard consumer cameras and smartphone photos under varying ambient lighting).
- **Target Conditions (8 Classes)**:
  1. `BA-cellulitis`: Deep subcutaneous bacterial infection (*Streptococcus/Staphylococcus*).
  2. `BA-impetigo`: Contagious epidermal bacterial crusting sores.
  3. `FU-athlete-foot` (*Tinea Pedis*): Interdigital fungal scaling and maceration.
  4. `FU-nail-fungus` (*Onychomycosis*): Subungual fungal hyperkeratosis and nail dystrophia.
  5. `FU-ringworm` (*Tinea Corporis*): Annular erythematous scaly plaques.
  6. `PA-cutaneous-larva-migrans`: Serpiginous creeping eruption tracks from nematode hookworms.
  7. `VI-chickenpox` (*Varicella*): Disseminated pruritic vesicular eruptions.
  8. `VI-shingles` (*Herpes Zoster*): Unilateral dermatomal neurocutaneous blistering rash.

#### B. The HAM10000 Dataset ("Human Against Machine with 10,000 training images")
- **Source**: Tschandl et al., Department of Dermatology, Medical University of Vienna & Cliff Rosendahl (Queensland, Australia). Published in *Nature Scientific Data* via the International Skin Imaging Collaboration (ISIC).
- **Scale**: **10,015 dermatoscopic images**.
- **Ground Truth Verification**: Over 50% confirmed via histopathology biopsy; remaining cases confirmed via expert consensus and confocal microscopy.
- **Target Conditions (7 Classes)**:
  1. `mel` (Melanoma): Malignant neoplasm of melanocytes.
  2. `nv` (Melanocytic Nevi): Benign melanocytic nevi (moles).
  3. `bcc` (Basal Cell Carcinoma): Non-melanoma skin cancer.
  4. `akiec` (Actinic Keratoses / Intraepithelial Carcinoma): Sun-induced pre-malignant lesions.
  5. `bkl` (Benign Keratosis): Seborrheic keratoses, solar lentigines, lichen-planus like keratoses.
  6. `df` (Dermatofibroma): Benign dermal fibrous histiocytomas.
  7. `vasc` (Vascular Lesions): Hemangiomas, angiokeratomas, pyogenic granulomas.

---

### 2.3 Image Preprocessing & Augmentation Pipeline
Raw clinical photos vary widely in aspect ratio, zoom, and lighting. DermAI applies an automated tensor transformation pipeline using **Albumentations**:

1. **Bilinear Spatial Resizing**: Rescales input images to $224 \times 224$ pixels to match transformer patch tokenization grids ($16 \times 16$ patches).
2. **Channel Standardization (ImageNet Normalization)**:
   $$\mu = [0.485, 0.456, 0.406], \quad \sigma = [0.229, 0.224, 0.225]$$
3. **Data Augmentation** *(during training)*:
   - Random horizontal and vertical flips
   - Color jitter (brightness, contrast, saturation)
   - Shift-scale-rotation to ensure rotational invariance of lesion margins
   - PyTorch `ToTensorV2` format conversion ($[B, C, H, W]$ tensor layout).

---

## 🧠 3. Machine Learning Architecture

DermAI incorporates two deep neural network backbones:

```
Input Image (224x224x3)
        │
        ▼
┌──────────────────────────────────────────────┐
│  Vision Transformer (ViT) / EfficientNet-B0 │
│  • Patch Embedding (16x16 tokens)            │
│  • 12 Multi-Head Self-Attention Blocks       │
│  • Global Contextual Feature Extraction      │
└──────────────────────┬───────────────────────┘
                       │ 512-dim feature embedding
        ┌──────────────┴──────────────┐
        ▼                             ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│     Classifier Head       │   │    Uncertainty Head       │
│ • Linear(512 -> 256)      │   │ • Linear(512 -> 128)      │
│ • LayerNorm + ReLU        │   │ • Linear(128 -> 1)        │
│ • Linear(256 -> 8)        │   │ • Variance / Entropy      │
│ • Softmax Activation      │   └───────────────────────────┘
└─────────────┬─────────────┘
              ▼
   Probabilities & Top-3
   Differential Diagnoses
```

### 3.1 Vision Transformer (ViT-Base / Patch-16)
- Instead of relying solely on local convolutions, the Vision Transformer splits the image into $14 \times 14 = 196$ non-overlapping patches ($16 \times 16$ pixels each).
- Each patch is projected into a $768$-dimensional embedding vector, concatenated with a learned `[CLS]` token and positional embeddings.
- **Multi-Head Self-Attention (MHSA)** enables the model to compare any skin patch with distant skin areas simultaneously, capturing global lesion symmetry, surrounding erythema, and peripheral spread.

### 3.2 Uncertainty Quantification Head
Medical decision support systems must know when they are uncertain. DermAI includes a dual-headed architecture:
- Head 1: Predicts class logits $z_i$.
- Head 2: Estimates epistemic and aleatoric uncertainty $\sigma^2$, flagging out-of-distribution or ambiguous skin photos for specialist manual review.

### 3.3 Explainable AI: Grad-CAM (Gradient-Weighted Class Activation Mapping)
To avoid the "black box" problem in healthcare, DermAI implements **Grad-CAM**:
1. Hooks into the final transformer attention block / feature map activations $A^k$.
2. Calculates gradients of the predicted class score $y^c$ with respect to feature maps:
   $$\alpha_k^c = \frac{1}{Z} \sum_i \sum_j \frac{\partial y^c}{\partial A_{i,j}^k}$$
3. Generates a weighted linear combination passed through a ReLU activation to retain features that positively correlate with the diagnosis:
   $$L_{\text{Grad-CAM}}^c = \text{ReLU}\left(\sum_k \alpha_k^c A^k\right)$$
4. Produces a thermal colormap (`jet` colormap) overlaid on the original photo, highlighting the exact skin regions the AI inspected.

---

## 🛠️ 4. Full-Stack Software Architecture

```
┌────────────────────────────────────────────────────────┐
│             React 18 + TypeScript Frontend             │
│  • Vite Build Engine        • Tailwind CSS Styling     │
│  • Context API (Auth, Service, Toast)                  │
│  • PDF Download & Interactive Grad-CAM Viewer          │
└───────────────────────────▲────────────────────────────┘
                            │ REST JSON & Multipart Form
┌───────────────────────────▼────────────────────────────┐
│                  Flask 3 REST Backend                  │
│  • PyTorch 2.2 Inference Engine                        │
│  • Grad-CAM Heatmap Processor                          │
│  • Groq AI (Llama 3.1) Medical Consultation Blueprint  │
│  • ReportLab 5 PDF Engine                              │
│  • SQLAlchemy 2.0 ORM + SQLite / PostgreSQL            │
└────────────────────────────────────────────────────────┘
```

| Layer | Technologies | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite | Single-Page Application (SPA) with real-time UI updates, drag-and-drop uploads, and responsive layouts. |
| **Backend API** | Python 3.10+, Flask 3, Werkzeug, Flask-CORS, Flask-Limiter | REST API handling multipart image ingestion, inference, rate limiting, and session security. |
| **Deep Learning** | PyTorch, TorchVision, Timm, Albumentations, OpenCV, Matplotlib | Image transformation, model forward pass, softmax probabilities, and visual heatmap generation. |
| **Generative AI** | Groq Cloud SDK, Meta Llama 3.1 models | Real-time clinical dermatological assistant, conversational triage, and automated medical commentary. |
| **Document Engine**| ReportLab 5 | Programmatic generation of branded clinical PDF reports with diagnosis tables, heatmaps, and doctor triage warnings. |
| **Database** | SQLite 3 (Dev) / PostgreSQL (Prod), SQLAlchemy | Persistent storage of analysis records, timestamps, confidence scores, and chat history. |
| **Authentication**| Firebase Authentication + Local Dev Fallback | User session management, profile security, and anonymous scan tracking. |

---

## 🔄 5. End-to-End Workflow

1. **User Interaction**:
   - The user navigates to `/scan` and uploads a skin photo (JPEG/PNG/WebP, max 16MB).
2. **Backend Processing**:
   - The Flask API validates file integrity and generates a unique `analysis_id` (e.g., `analysis_20261028_001758_1e5e1b1d`).
   - Image tensor is normalized and passed to `DermatologyAnalyzer`.
3. **Inference & Explainability**:
   - Softmax computes probabilities across all condition categories.
   - Grad-CAM hooks extract attention weights and produce a base64 overlay image.
   - Primary diagnosis, confidence percentage, symptoms, and remedies are formatted into a JSON record.
4. **Persistence & Presentation**:
   - Result is saved to the SQLite database.
   - The frontend instantly transitions to `/scan/:id` displaying the diagnosed disease, confidence badge, differential diagnoses, symptoms, remedies, and Grad-CAM visualizer.
5. **Clinical Report Export**:
   - Clicking **"Download Report"** triggers `/api/analysis/<id>/pdf`, assembling the report layout and streaming a publication-ready PDF download.

---

## ⚖️ 6. Clinical & Ethical Disclaimers
- **Intended Use**: DermAI is an educational and clinical decision-support tool designed for preliminary triage and informational awareness.
- **Non-Diagnostic Notice**: DermAI does not replace clinical histopathology, physical examination by a certified dermatologist, or dermoscopy by trained physicians.
