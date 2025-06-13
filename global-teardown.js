// global-teardown.js
async function globalTeardown() {
  console.log('🧹 開始全域測試清理...');
  
  try {
    // 清理測試資料
    console.log('🗑️  清理測試狀態...');
    
    // 這裡可以加入清理測試資料的邏輯
    // 例如：重置資料庫、清理快取等
    
    console.log('✅ 全域清理完成');
    
  } catch (error) {
    console.error('❌ 全域清理失敗:', error.message);
    // 不拋出錯誤，避免影響測試結果
  }
}

export default globalTeardown;