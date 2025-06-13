@echo off
chcp 65001 >nul
echo 🧪 開始執行完整 E2E 測試套件...
echo.

REM 設定變數
set TEST_FAILED=0
set TOTAL_TESTS=0
set PASSED_TESTS=0

REM 檢查服務狀態
echo 📡 檢查後端服務...
curl -s http://localhost:8000/api/courses/ >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 後端服務未啟動，請先啟動 Django 服務
    echo    指令: cd ../course_selection_project ^&^& python manage.py runserver
    pause
    exit /b 1
)
echo ✅ 後端服務正常

echo 🌐 檢查前端服務...  
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 前端服務未啟動，請先啟動 Vue 服務
    echo    指令: cd ../course-selection-frontend ^&^& npm run dev
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
mkdir test-results 2>nul
mkdir playwright-report 2>nul
mkdir screenshots 2>nul

echo.
echo 🚀 開始執行測試...
echo =====================================

REM 1. 認證功能測試
echo.
echo 👤 執行認證功能測試...
set /a TOTAL_TESTS+=1
npx playwright test tests/auth.spec.js --reporter=list --output=test-results/auth
if %errorlevel% neq 0 (
    echo ❌ 認證測試失敗
    set /a TEST_FAILED+=1
) else (
    echo ✅ 認證測試通過
    set /a PASSED_TESTS+=1
)

REM 等待一秒避免狀態衝突
timeout /t 2 /nobreak >nul

REM 2. 課程查詢測試  
echo.
echo 📚 執行課程查詢測試...
set /a TOTAL_TESTS+=1
npx playwright test tests/course-query.spec.js --reporter=list --output=test-results/course-query
if %errorlevel% neq 0 (
    echo ❌ 課程查詢測試失敗
    set /a TEST_FAILED+=1
) else (
    echo ✅ 課程查詢測試通過
    set /a PASSED_TESTS+=1
)

REM 等待一秒避免狀態衝突
timeout /t 2 /nobreak >nul

REM 3. 選課作業測試
echo.
echo 📝 執行選課作業測試...
set /a TOTAL_TESTS+=1
npx playwright test tests/enrollment.spec.js --reporter=list --output=test-results/enrollment
if %errorlevel% neq 0 (
    echo ❌ 選課作業測試失敗
    set /a TEST_FAILED+=1
) else (
    echo ✅ 選課作業測試通過
    set /a PASSED_TESTS+=1
)

REM 等待一秒避免狀態衝突
timeout /t 2 /nobreak >nul

REM 4. 我的課表測試
echo.
echo 📅 執行我的課表測試...
set /a TOTAL_TESTS+=1
npx playwright test tests/my-courses.spec.js --reporter=list --output=test-results/my-courses
if %errorlevel% neq 0 (
    echo ❌ 我的課表測試失敗
    set /a TEST_FAILED+=1
) else (
    echo ✅ 我的課表測試通過
    set /a PASSED_TESTS+=1
)

echo.
echo =====================================
echo 📊 測試結果統計:
echo    總測試套件: %TOTAL_TESTS%
echo    通過套件: %PASSED_TESTS%
echo    失敗套件: %TEST_FAILED%

REM 檢查是否有測試失敗
if %TEST_FAILED% gtr 0 (
    echo ❌ 有 %TEST_FAILED% 個測試套件失敗，請查看詳細報告
    set FINAL_RESULT=1
) else (
    echo 🎉 所有測試套件執行完成且通過！
    set FINAL_RESULT=0
)

echo.
echo 📊 生成綜合測試報告...
REM 先嘗試生成 HTML 報告
npx playwright show-report --host 127.0.0.1 --port 9323 || (
    echo ⚠️  HTML 報告生成失敗，生成文字報告...
    if exist test-results (
        echo 📄 測試結果文件位置: test-results/
        dir test-results /b
    )
)

echo.
echo 💡 其他有用的命令:
echo    npx playwright test --headed          - 有界面執行測試
echo    npx playwright test --debug           - 除錯模式  
echo    npx playwright test --ui              - 開啟測試 UI
echo    npm run test:full                     - 使用 npm 執行完整測試
echo    npx playwright show-report            - 查看詳細報告
echo.

if %FINAL_RESULT% neq 0 (
    echo ⚠️  部分測試失敗，建議檢查:
    echo    1. 測試環境是否穩定
    echo    2. 測試資料是否正確
    echo    3. 前後端服務是否正常
)

pause
exit /b %FINAL_RESULT%