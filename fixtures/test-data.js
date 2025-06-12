// 測試使用者資料
export const testUsers = {
  student1: {
    username: 'student001',
    password: 'password123',
    name: '學生1',
    role: 'student'
  },
  student2: {
    username: 'student002',
    password: 'password123',
    name: '學生2',
    role: 'student'
  },
  teacher: {
    username: 'teacher001',
    password: 'password123',
    name: '陳教授',
    role: 'teacher'
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    name: '系統管理員',
    role: 'admin'
  }
};

// 測試課程資料 - 與後端 seed_code.py 保持一致
export const testCourses = {
  dataStructure: {
    name: '資料結構',
    course_code: 'CS101', // 修正為 course_code
    type: '必修',
    capacity: 60,
    credit: 3,
    semester: '113上'
  },
  algorithm: {
    name: '演算法',
    course_code: 'CS102',
    type: '必修',
    capacity: 60,
    credit: 3,
    semester: '113上'
  },
  machineLearning: {
    name: '機器學習導論',
    course_code: 'CS301',
    type: '選修',
    capacity: 40,
    credit: 3,
    semester: '113上'
  },
  webProgramming: {
    name: '網頁程式設計',
    course_code: 'CS302',
    type: '選修',
    capacity: 45,
    credit: 3,
    semester: '113上'
  },
  database: {
    name: '資料庫系統',
    course_code: 'CS303',
    type: '選修',
    capacity: 50,
    credit: 3,
    semester: '113上'
  },
  ai: {
    name: '人工智慧',
    course_code: 'CS304',
    type: '選修',
    capacity: 40,
    credit: 3,
    semester: '113上'
  }
};

// 選課規則 - 與後端 services.py 保持一致
export const enrollmentRules = {
  minCourses: 2,
  maxCourses: 8,
  messages: {
    timeConflict: '選課失敗：時間衝突',
    courseFull: '課程人數已滿，無剩餘名額',
    maxCoursesReached: '已達選課門數上限 (8門)',
    minCoursesRequired: '至少需選擇 2 門課程',
    alreadyEnrolled: '您已選過此課程',
    courseNotFound: '找不到課程'
  }
};

// API 端點
export const apiEndpoints = {
  login: '/api/auth/login/',
  logout: '/api/auth/logout/',
  currentUser: '/api/auth/me/',
  courses: '/api/courses/',
  enrollments: '/api/enrollments/',
  myCourses: '/api/enrollments/my-courses/'
};

// 頁面路徑
export const pageRoutes = {
  login: '/login',
  register: '/register',
  courses: '/courses',
  enrollment: '/enrollment',
  myCourses: '/my-courses'
};

// 等待時間設定
export const timeouts = {
  navigation: 10000, // 增加導航超時時間
  apiResponse: 5000, // 增加 API 回應超時時間
  animation: 1000, // 增加動畫等待時間
  debounce: 800 // 搜尋防抖時間
};