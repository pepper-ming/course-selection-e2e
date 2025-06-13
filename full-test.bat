@echo off
setlocal EnableDelayedExpansion
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
call :run_test "tests/auth.spec.js" "auth" "認證測試"

REM 2. 課程查詢測試  
echo.
echo 📚 執行課程查詢測試...
set /a TOTAL_TESTS+=1
call :run_test "tests/course-query.spec.js" "course-query" "課程查詢測試"

REM 3. 選課作業測試
echo.
echo 📝 執行選課作業測試...
set /a TOTAL_TESTS+=1
call :run_test "tests/enrollment.spec.js" "enrollment" "選課作業測試"

REM 4. 我的課表測試
echo.
echo 📅 執行我的課表測試...
set /a TOTAL_TESTS+=1
call :run_test "tests/my-courses.spec.js" "my-courses" "我的課表測試"

REM 顯示測試結果
call :show_results

REM 生成報告
call :generate_report

pause
exit /b !TEST_FAILED!

REM ========== 子程序區域 ==========

:run_test
REM 參數: %1=測試檔案 %2=輸出目錄 %3=測試名稱
call npx playwright test %~1 --reporter=list --output=test-results/%~2
set TEST_RESULT=!errorlevel!

if !TEST_RESULT! neq 0 (
    echo ❌ %~3失敗
    set /a TEST_FAILED+=1
) else (
    echo ✅ %~3通過
    set /a PASSED_TESTS+=1
)

REM 等待一秒避免狀態衝突
timeout /t 2 /nobreak >nul
goto :eof

:show_results
echo.
echo =====================================
echo 📊 測試結果統計:
echo    總測試套件: !TOTAL_TESTS!
echo    通過套件: !PASSED_TESTS!
echo    失敗套件: !TEST_FAILED!

if !TEST_FAILED! gtr 0 (
    echo ❌ 有 !TEST_FAILED! 個測試套件失敗，請查看詳細報告
) else (
    echo 🎉 所有測試套件執行完成且通過！
)
goto :eof

:generate_report
echo.
echo 📊 生成綜合測試報告...

REM 先執行所有測試並生成報告
call npx playwright test --reporter=html --reporter=list

REM 等待報告檔案生成完成
timeout /t 3 /nobreak >nul

REM 檢查報告是否存在
if exist playwright-report\index.html (
    echo 📊 測試報告已生成，正在開啟...
    
    REM 方法1：直接用瀏覽器開啟（更可靠）
    start "" "playwright-report\index.html"
    
    REM 方法2：如果方法1失敗，嘗試用 playwright show-report
    if !errorlevel! neq 0 (
        echo 嘗試使用 playwright show-report...
        call npx playwright show-report --host 127.0.0.1 --port 9323
    )
) else (
    echo ⚠️  找不到測試報告檔案
    echo    請手動查看 playwright-report 資料夾
)

goto :eof

echo.
echo 💡 其他有用的命令:
echo    npx playwright test --headed          - 有界面執行測試
echo    npx playwright test --debug           - 除錯模式  
echo    npx playwright test --ui              - 開啟測試 UI
echo    npm run test:full-sequential          - 使用 npm 執行順序測試
echo    npx playwright show-report            - 查看詳細報告
echo.

if !TEST_FAILED! neq 0 (
    echo ⚠️  部分測試失敗，建議檢查:
    echo    1. 測試環境是否穩定
    echo    2. 測試資料是否正確
    echo    3. 前後端服務是否正常
)
goto :eof