@echo off
echo ========================================================
echo        ADVANCED ACADEMY - CBSE RESULT SYSTEM
echo               OFFLINE-FIRST LOCAL RUNNER
echo ========================================================

echo 1. Starting Backend (FastAPI on http://127.0.0.1:8000)...
start "School Backend" cmd /k "cd backend && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000"

timeout /t 3 /nobreak > nul

echo 2. Starting Frontend (React on http://localhost:5173)...
start "School Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak > nul

echo 3. Opening Browser...
start http://localhost:5173

echo.
echo Application is running!
echo Backend Docs: http://127.0.0.1:8000/docs
echo Frontend Portal: http://localhost:5173
echo.
echo Demo Credentials:
echo   Super Admin:   admin / AdminPassword123!
echo   Principal:     principal / PrincipalPassword123!
echo   Class Teacher: teacher5 / TeacherPassword123! (Class 5 only)
echo   Teacher View:  teacher6 / TeacherPassword123! (Class 6 + View All)
echo ========================================================
pause
