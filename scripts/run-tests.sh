#!/bin/bash

# 測試執行腳本
echo "🚀 開始執行 E2E 測試..."

# 設定顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查環境
check_environment() {
    echo "🔍 檢查測試環境..."
    
    # 檢查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安裝${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js 已安裝${NC}"
    
    # 檢查後端服務
    if ! curl -s http://localhost:8000/api/ > /dev/null; then
        echo -e "${YELLOW}⚠️  後端服務未啟動，嘗試啟動...${NC}"
        cd ../course_selection_project
        python manage.py runserver &
        BACKEND_PID=$!
        sleep 5
    else
        echo -e "${GREEN}✓ 後端服務運行中${NC}"
    fi
    
    # 檢查前端服務
    if ! curl -s http://localhost:5173 > /dev/null; then
        echo -e "${YELLOW}⚠️  前端服務未啟動，嘗試啟動...${NC}"
        cd ../course-selection-frontend
        npm run dev &
        FRONTEND_PID=$!
        sleep 5
    else
        echo -e "${GREEN}✓ 前端服務運行中${NC}"
    fi
}

# 清理函數
cleanup() {
    echo "🧹 清理測試環境..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID
    fi
}

# 設定清理
trap cleanup EXIT

# 主測試函數
run_tests() {
    # 檢查環境
    check_environment
    
    # 安裝依賴
    if [ ! -d "node_modules" ]; then
        echo "📦 安裝測試依賴..."
        npm install
    fi
    
    # 建立必要目錄
    mkdir -p screenshots
    mkdir -p test-results
    mkdir -p playwright-report
    
    # 執行測試
    echo -e "\n🧪 執行測試..."
    
    # 根據參數執行不同測試
    case "$1" in
        "auth")
            echo "執行認證測試..."
            npx playwright test tests/auth.spec.js
            ;;
        "course")
            echo "執行課程查詢測試..."
            npx playwright test tests/course-query.spec.js
            ;;
        "enrollment")
            echo "執行選課作業測試..."
            npx playwright test tests/enrollment.spec.js
            ;;
        "mycourses")
            echo "執行我的課表測試..."
            npx playwright test tests/my-courses.spec.js
            ;;
        "smoke")
            echo "執行冒煙測試..."
            npx playwright test --grep @smoke
            ;;
        "headed")
            echo "執行有界面測試..."
            npx playwright test --headed
            ;;
        "debug")
            echo "執行除錯模式..."
            npx playwright test --debug
            ;;
        "ui")
            echo "開啟測試 UI..."
            npx playwright test --ui
            ;;
        *)
            echo "執行所有測試..."
            npx playwright test
            ;;
    esac
    
    # 儲存測試結果
    TEST_RESULT=$?
    
    # 顯示測試結果
    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "\n${GREEN}✅ 測試通過！${NC}"
    else
        echo -e "\n${RED}❌ 測試失敗！${NC}"
        echo "查看報告: npx playwright show-report"
    fi
    
    return $TEST_RESULT
}

# 顯示使用說明
show_usage() {
    echo "使用方式: ./run-tests.sh [選項]"
    echo ""
    echo "選項:"
    echo "  auth       - 只執行認證測試"
    echo "  course     - 只執行課程查詢測試"
    echo "  enrollment - 只執行選課作業測試"
    echo "  mycourses  - 只執行我的課表測試"
    echo "  smoke      - 執行冒煙測試"
    echo "  headed     - 有界面執行測試"
    echo "  debug      - 除錯模式"
    echo "  ui         - 開啟測試 UI"
    echo "  help       - 顯示此說明"
    echo ""
}

# 主程式
if [ "$1" == "help" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    show_usage
else
    run_tests $1
fi