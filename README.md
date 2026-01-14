# FYI - Smart Student Productivity Dashboard

A full-stack AI-powered productivity dashboard for CS students to track assignments, predict workload, and forecast grades using Machine Learning.

## Features

- **Task Tracker**: Log assignments with difficulty, deadlines, and actual performance
- **AI Predictor**: Forecast effort (hours) and expected grades using Random Forest models
- **Subject Manager**: Manage courses and mark "terror professors" for adjusted predictions
- **K-Fold Cross-Validation**: Real-time model confidence metrics displayed in UI
- **Feature Engineering**: Incorporates cumulative GPA, workload trends, and assignment sequences

## Tech Stack

### Backend

- **FastAPI**: REST API with automatic OpenAPI docs
- **MySQL**: Relational database for assignment logs and subjects
- **scikit-learn**: Random Forest Regressor with GridSearchCV hyperparameter tuning
- **Pandas**: Data manipulation and feature engineering

### Frontend

- **React** (Vite): Modern SPA with hot module replacement
- **TailwindCSS**: Utility-first styling with custom design system
- **Axios**: HTTP client for API communication
- **Lucide React**: Icon library

## Machine Learning

- **Models**: Random Forest Regressor (100 trees)
- **Features**: 7 engineered features including subject GPA trends, workload patterns, and assignment progression
- **Validation**: 5-Fold Cross-Validation with R² and MAE metrics
- **Hyperparameter Tuning**: GridSearchCV with 48-54 parameter combinations
- **Current Performance**:
  - Duration Prediction: **R² = 0.68**, MAE = 2.7 hours
  - Grade Prediction: **R² = 0.38**, MAE = 0.3 GPA points

## Setup

### Prerequisites

- Python 3.8+
- Node.js 16+
- MySQL 8.0+

### Backend Setup

```bash
cd backend
pip install fastapi uvicorn mysql-connector-python pandas scikit-learn

# Update database credentials in main.py (lines 31-34)
# DB_HOST, DB_USER, DB_PASSWORD, DB_NAME

python -m uvicorn main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Database Setup

```sql
CREATE DATABASE dlsu_productivity_db;

-- Tables are auto-created on first run
-- See backend/main.py startup_event() for schema
```

## Project Structure

```
TRACKER/
├── backend/
│   ├── main.py              # FastAPI app with ML models
│   └── populate_data.py     # Sample data ingestion script
├── frontend/
│   ├── src/
│   │   ├── pages/           # TaskTracker, Predictor, SubjectManager
│   │   ├── components/      # Sidebar
│   │   └── services/        # API client (api.js)
│   └── tailwind.config.js   # Custom design tokens
└── README.md
```

## 🎓 Key Learnings

This project demonstrates:

- Full-stack development with modern frameworks
- ML model selection (Linear Regression → Random Forest)
- Feature engineering for improved predictions
- Cross-validation and hyperparameter tuning
- RESTful API design with FastAPI
- Responsive UI with React and TailwindCSS

## License

MIT License - Feel free to use for your own projects!

## Author

**[Karl Divinagracia]**

- GitHub: [@lraaak](https://github.com/lraaak)
- LinkedIn: [Karl Divinagracia](www.linkedin.com/in/karl-divinagracia-206463399)
