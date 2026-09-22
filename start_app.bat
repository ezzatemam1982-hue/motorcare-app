@echo off
title تشغيل تطبيق MotorCare
echo ========================================================
echo   جاري تشغيل خادم MotorCare المحلي على http://localhost:8089
echo ========================================================
start "" "http://localhost:8089/index.html"
python scratch/serve.py
pause
