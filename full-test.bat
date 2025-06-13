@echo off
chcp 65001 >nul
echo 🧪 開始執行完整 E2E 測試套件...
echo.

REM 檢查服務狀態
echo 📡 檢查後端服務...
curl -s http://localhost:8000/api/courses/ > nul
if %errorlevel% neq 0 (
    echo ❌ 後端服務未啟動，請先啟動 Django 服務
    echo    指令: cd ../course_selection_project && python manage.py runserver
    pause
    exit /b 1
)
echo ✅ 後端服務正常

echo 🌐 檢查前端服務...  
curl -s http://localhost:5173 > nul
if %errorlevel% neq 0 (
    echo ❌ 前端服務未啟動，請先啟動 Vue 服務
    echo    指令: cd ../course-selection-frontend && npm run dev
    pause
    exit /b 1
)
echo ✅ 前端服務正常
echo.

REM 清理舊的測試結果
echo 🧹 清理舊的測試結果...
if exist test-results rmdir /s /q test-results
if exist playwright-report rmdir /s /q playwright-report
if exist screenshots rmdir /s /q screenshots
mkdir test-results
mkdir playwright-report  
mkdir screenshots

echo.
echo 🚀 開始執行測試...
echo =====================================

REM 1. 認證功能測試
echo.
echo 👤 執行認證功能測試...
npx playwright test tests/auth.spec.js --reporter=list
if %errorlevel% neq 0 (
    echo ❌ 認證測試失敗
    set TEST_FAILED=1
) else (
    echo ✅ 認證測試通過
)

REM 2. 課程查詢測試  
echo.
echo 📚 執行課程查詢測試...
npx playwright test tests/course-query.spec.js --reporter=list
if %errorlevel% neq 0 (
    echo ❌ 課程查詢測試失敗
    set TEST_FAILED=1
) else (
    echo ✅ 課程查詢測試通過
)

REM 3. 選課作業測試
echo.
echo 📝 執行選課作業測試...
npx playwright test tests/enrollment.spec.js --reporter=list
if %errorlevel% neq 0 (
    echo ❌ 選課作業測試失敗
    set TEST_FAILED=1
) else (
    echo ✅ 選課作業測試通過
)

REM 4. 我的課表測試
echo.
echo 📅 執行我的課表測試...
npx playwright test tests/my-courses.spec.js --reporter=list  
if %errorlevel% neq 0 (
    echo ❌ 我的課表測試失敗
    set TEST_FAILED=1
) else (
    echo ✅ 我的課表測試通過
)

echo.
echo =====================================

REM 檢查是否有測試失敗
if defined TEST_FAILED (
    echo ❌ 部分測試失敗，請查看詳細報告
) else (
    echo 🎉 所有測試執行完成且通過！
)

echo.
echo 📊 生成測試報告...
npx playwright show-report --host 127.0.0.1 --port 9323

echo.
echo 💡 其他有用的命令:
echo    npx playwright test --headed          - 有界面執行測試
echo    npx playwright test --debug           - 除錯模式
echo    npx playwright test --ui              - 開啟測試 UI
echo    npx playwright show-report            - 查看詳細報告
echo.
pause