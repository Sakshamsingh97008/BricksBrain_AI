# BricksBrain AI 🧠🏠

An AI-powered real estate platform — React + Tailwind frontend, Node.js/Express backend,
MongoDB database, and a Python/FastAPI microservice for all the machine-learning features.
Visual style is inspired by MagicBricks-style listings platforms (red/white theme, card-based listings).

## What's included

| Feature | How it's implemented |
|---|---|
| ML price prediction | `RandomForestRegressor` (scikit-learn) trained on a generated 6,000-row synthetic Indian real-estate dataset |
| Future price forecasting | **ARIMA** (statsmodels) + a **neural forecaster** — full LSTM if TensorFlow is installed, otherwise an automatic lightweight MLP fallback so the feature works out of the box |
| Personalized recommendations | Content-based filtering (cosine similarity over property feature vectors + user preferences/history) |
| Area Intelligence | Per-locality walk/safety/connectivity scores, schools/hospitals count, 5yr price growth |
| Google Maps | Live embed if you add an API key, graceful fallback link otherwise |
| Property comparison | Compare up to 4 properties side-by-side |
| EMI calculator | Real amortization math with year-by-year schedule chart |
| **AI chatbot assistant** | Intent-classification + slot-extraction NLU (regex/keyword based, no external API key required) — floating widget on every page, answers FAQs about pricing, EMI, listings, and areas |
| **List Your Property** | Logged-in users can post their own property for free with photo uploads (up to 8 photos); submissions go to "Pending" for a quick admin review, then go live |
| **Downloadable PDF report** | One-click, client-generated PDF report per property — specs, description, amenities, area intelligence, AI price prediction/forecast, EMI |
| **AI interior design ideas** | Pick a room + style and get AI-generated design images (via OpenAI's image API, if `OPENAI_API_KEY` is set) or a curated inspiration gallery + design tips as a no-key fallback |
| 3D Digital Twin | Interactive procedural building model rendered with Three.js — drag to rotate, auto-rotate, scales to the property's BHK/area |
| Auth | JWT (httpOnly cookie + bearer token), bcrypt password hashing, role-based access (user/admin/agent) |
| Dashboards | User dashboard (saved properties, my listings, AI recommendations, preferences) + Admin dashboard (stats, charts, pending-listing approvals, recent activity) |

This is a **complete, runnable demo build**. The ML models are trained on realistic
*synthetic* data (documented in `ai-service/train.py`) since no proprietary MLS dataset
is bundled — swap in real listing data any time by replacing the training CSV.

---

## Project structure

```
bricksbrain-ai/
├── backend/            Node.js + Express REST API
│   ├── config/db.js
│   ├── models/          User.js, Property.js  (Mongoose)
│   ├── controllers/      auth, property, chat, admin
│   ├── routes/
│   ├── middleware/       auth (JWT), upload (multer photo uploads), error handler
│   ├── uploads/           uploaded property photos (served at /uploads)
│   ├── seed.js           seeds 120 demo properties + demo/admin users
│   └── server.js
├── ai-service/          Python + FastAPI ML microservice
│   ├── main.py            API endpoints
│   ├── train.py           generates dataset + trains price model
│   ├── models/
│   │   ├── price_predictor.py   RandomForest price prediction
│   │   ├── forecast.py          ARIMA + LSTM/MLP forecasting
│   │   ├── recommender.py       content-based recommendation engine
│   │   ├── chatbot.py           intent-based chat NLU
│   │   └── interior_design.py   AI interior design ideas (with curated fallback)
│   └── data/               generated CSVs (dataset + price history)
└── frontend/            React + Vite + Tailwind CSS
    └── src/
        ├── pages/          Home, Listings, PropertyDetail, ListProperty, Dashboard, AdminDashboard, ...
        ├── components/     Navbar, PropertyCard, Chatbot, DigitalTwin3D, MapView, EMICalculator, CompareTable, InteriorDesign
        ├── utils/           generateReport.js (client-side PDF report generation)
        ├── context/        AuthContext
        └── api/axios.js
```

---

## Quick start

### 1. MongoDB
Run MongoDB locally (`mongod`) or use a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.
Either way, you just need a connection string for `MONGO_URI` in the backend `.env` (see below).

### 2. AI/ML service (Python)
```bash
cd ai-service
pip install -r requirements.txt
python train.py          # generates dataset + trains the price model (~30s, pre-trained artifacts already included)
cp .env.example .env      # optional — only needed for real AI-generated interior design images
uvicorn main:app --reload --port 8000
```
Optional — for a real LSTM instead of the automatic MLP fallback:
```bash
pip install tensorflow-cpu
```

### 3. Backend (Node.js)
```bash
cd backend
cp .env.example .env     # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed              # populates 120 demo properties + demo/admin accounts
npm run dev                # http://localhost:5000
```

### 4. Frontend (React)
```bash
cd frontend
cp .env.example .env      # optionally add a Google Maps API key
npm install
npm run dev                 # http://localhost:5173
```

Open **http://localhost:5173** — the app is fully functional end-to-end.

### Demo logins (created by `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@bricksbrain.ai | admin123 |
| User | demo@bricksbrain.ai | demo1234 |

---

## Environment variables

**backend/.env**
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/bricksbrain
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**ai-service/.env** (optional)
```
# Only needed for real AI-generated interior design images.
# Without it, the Interior Design feature still works -- it shows a curated
# inspiration gallery + written design tips instead.
OPENAI_API_KEY=
```

**frontend/.env**
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=            # optional — leave blank to use the built-in fallback map link
```

---

## Key API endpoints

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/properties                 (filters: city, propertyType, listingType, bhk, minPrice, maxPrice, sort, page)
GET    /api/properties/featured
GET    /api/properties/:id
POST   /api/properties/:id/save        (toggle wishlist)
POST   /api/properties/compare          { ids: [...] }
GET    /api/properties/recommendations (auth required)
POST   /api/properties/predict-price   -> proxies to AI service
POST   /api/properties/forecast        -> proxies to AI service (ARIMA + LSTM)
POST   /api/properties/emi
POST   /api/properties/interior-design -> proxies to AI service (auth required)
POST   /api/properties/list             (auth required, multipart/form-data with up to 8 "images") -- Post Your Property
GET    /api/properties/my-listings     (auth required) -- your own submitted listings
PUT    /api/properties/:id             (auth required — owner or admin)
DELETE /api/properties/:id             (auth required — owner or admin)

POST   /api/chat                        -> proxies to AI chatbot

GET    /api/admin/stats                (admin only)
GET    /api/admin/pending-properties   (admin only) -- listings awaiting review
```

AI microservice (FastAPI, auto docs at `http://localhost:8000/docs`):
```
POST /predict-price
POST /forecast-price
POST /recommend
POST /chatbot
POST /interior-design
```

---

## How "Post Your Property" works

Any logged-in user can go to **Post Property FREE** in the navbar (or `/list-property`) to submit
a listing with photos. Submissions from regular users are saved with `status: "Pending"` and won't
appear in public listings until an admin approves them from the **Pending Approvals** panel on the
Admin Dashboard. Listings created directly by an admin go live immediately. Users can track the
status of everything they've posted under **Dashboard → My Listings**.

## How the AI interior design feature works

On any property page, open **AI Interior Design Ideas**, pick a room and a style, and generate
suggestions. If `OPENAI_API_KEY` is set in `ai-service/.env`, real AI-generated room images are
requested from OpenAI's image API. If no key is set, you still get a curated inspiration gallery
and a written set of design tips for that style — no key required to try the feature.

## How the downloadable report works

On any property page, click **Report** next to the save button to generate and download a
branded PDF summarizing the property's details, description, amenities, area intelligence, and
(if you've already run them on that page) the AI price prediction and forecast. This is generated
entirely client-side with `jspdf` — no backend call needed.

---

## Notes & next steps for production

- The ML price model is trained on **synthetic** data for demo purposes — retrain
  `ai-service/train.py` against real listing data for production accuracy.
- The chatbot uses rule-based intent classification (fast, free, no API key). To upgrade
  it to a generative LLM, swap the internals of `generate_reply()` in `chatbot.py` to call
  an LLM API using the extracted intent/slots as context.
- The 3D Digital Twin is a procedurally generated massing model (walls/floors/roof scaled
  to BHK & area) rather than a true BIM/CAD twin — swap in a GLTF/GLB model loader in
  `DigitalTwin3D.jsx` if you have real 3D scans per property.
- Uploaded property photos are stored on local disk under `backend/uploads/` — swap in
  S3/Cloudinary/another object store before deploying to more than one server instance.
- Add rate limiting / stricter CORS and rotate `JWT_SECRET` before deploying publicly.
