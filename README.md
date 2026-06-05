# Nexus ERP

A full-stack ERP system with a Django REST backend and a React frontend.

## Project structure

- `backend/` - Django project and REST API
  - `accounts/` - authentication, users, permissions, tokens
  - `employees/` - employee records, attendance, payroll, leave
  - `hr/` - HR features and supporting views
  - `erp/` - Django project settings and URL routing
  - `requirements.txt` - Python dependencies

- `frontend/` - React single-page application
  - `src/` - React source files
  - `public/` - frontend static assets
  - `package.json` - Node dependencies and scripts

## Technology stack

- Backend: Python, Django, Django REST Framework
- Frontend: React, React Router, Axios
- Database: SQLite (local development)

## Prerequisites

- Python 3.11+ (recommended)
- Node.js and npm

## Backend setup

1. Open a terminal and switch to the backend folder:
   ```powershell
   cd backend
   ```

2. Create and activate a virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate
   ```

3. Install Python dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

4. Apply migrations:
   ```powershell
   python manage.py migrate
   ```

5. Run the Django development server:
   ```powershell
   python manage.py runserver
   ```

The backend API will be available at `http://127.0.0.1:8000`.

## Frontend setup

1. Open a terminal and switch to the frontend folder:
   ```powershell
   cd frontend
   ```

2. Install frontend dependencies:
   ```powershell
   npm install
   ```

3. Start the React development server:
   ```powershell
   npm start
   ```

The frontend will usually run at `http://localhost:3000`.

## Useful commands

- `python backend/manage.py runserver`
- `python backend/manage.py migrate`
- `npm --prefix frontend install`
- `npm --prefix frontend start`

## Notes

- The backend currently uses SQLite by default for local development.
- Update `backend/erp/settings.py` if adding environment-specific settings or switching databases.
- Connect the frontend to backend API URLs via the React app configuration.
