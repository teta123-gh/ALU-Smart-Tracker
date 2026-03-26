# How to Run the ALU Tracker

The ALU Tracker consists of two parts: a Python backend and a React frontend. Both need to be running for the application to work.

## 1. Start the Backend API

1. Open a new terminal.
2. Navigate to the `backend` directory:
   ```bash
   cd c:\Users\TETA KETSIA\OneDrive\Desktop\alu-tracker\backend
   ```
3. Run the Flask server:
   ```bash
   python app.py
   ```
   *You should see a message saying "ALU Tracker API running on http://localhost:5000". Leave this terminal open.*

## 2. Start the Frontend Server

1. Open a **second** new terminal.
2. Navigate to the `frontend` directory:
   ```bash
   cd c:\Users\TETA KETSIA\OneDrive\Desktop\alu-tracker\frontend
   ```
3. Start a local HTTP server:
   ```bash
   python -m http.server 8000
   ```
   *Leave this terminal open as well.*

## 3. Open the Application

Now that both servers are running, you can access the app:
1. Open your web browser (Chrome, Edge, Firefox, etc.).
2. Go to: **[http://localhost:8000/index.html](http://localhost:8000/index.html)**

### Demo Login
You can log in to the dashboard using these credentials:
- **Email:** `demo@alu.edu`
- **Password:** `demo1234`
