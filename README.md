# ALU Smart Tracker

The ALU Smart Tracker is a comprehensive web application designed to help students track their academic progress, extracurricular activities, skills development, and personal goals. It also provides an Admin Portal for administrators to manage and monitor student progress.

## 🌟 Features

### For Students
- **Dashboard Overview**: A centralized view of your academic and personal progress.
- **Course Management**: Track enrolled courses, assignments, and grades.
- **Activity Tracking**: Log and monitor extracurricular activities and personal projects.
- **Skills Development**: Track acquired skills and your proficiency levels.
- **Goal Setting**: Set and track both short-term and long-term goals.

### For Administrators
- **Admin Portal**: A dedicated workspace to view all registered students and their details.
- **Student Monitoring**: Review individual student enrollments, course progress, and overall performance in a tabulated interface.

## 🛠️ Technology Stack

The application has a decoupled architecture, divided into a RESTful API backend and a single-page application frontend.

### Backend
- **Framework**: Python / Flask
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT (JSON Web Tokens) via Flask-JWT-Extended
- **CORS Handling**: Flask-CORS for cross-origin request handling

### Frontend
- **Structure/Style/Logic**: HTML5, Vanilla CSS, and Vanilla JavaScript
- **Static Assets**: Pure frontend stack requiring no build tools for simplicity and rapid development setup.

## 🚀 Getting Started

Follow these steps to get the application running on your local machine. You will need to run both the backend server and a local HTTP server for the frontend to make the application fully functional.

### Prerequisites
- Python 3.8+ installed on your machine
- Web browser (Chrome, Edge, Firefox, etc.)

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install the required Python packages (it is recommended to use a virtual environment):
   ```bash
   pip install -r requirements.txt
   ```

3. Initialize the database and populate it with sample data:
   ```bash
   python seed.py
   ```

4. Start the Flask API server:
   ```bash
   python app.py
   ```
   *The backend API will run on `http://localhost:5000`. Leave this terminal process open.*

### 2. Frontend Setup

1. Open a **new, separate terminal** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Start a local HTTP server to properly serve the frontend assets:
   ```bash
   python -m http.server 8000
   ```
   *Leave this terminal open as well.*

### 3. Access the Application

Once both the backend API and frontend HTTP server are running, you can access the app:

1. Open your web browser.
2. Navigate to: **[http://localhost:8000/index.html](http://localhost:8000/index.html)**

#### Demo Credentials
You can log in to explore the dashboard using the following test account:
- **Email:** `demo@alu.edu`
- **Password:** `demo1234`
#### Admin Credentials
You can log in to explore admin dashboard using the following test account:
- **Email:** `admin@alu.edu`
- **Password:** `admin1234`
