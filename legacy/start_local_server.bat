@echo off
chcp 65001 > nul
title (주)조영산업 MES 로컬 서버 (포트 3000)
echo ==================================================
echo   (주)조영산업 MES 생산 관리 시스템 로컬 서버 실행
echo   - 접속 주소: http://localhost:3000
echo ==================================================
echo.
start http://localhost:3000
node server.cjs
pause
