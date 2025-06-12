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

// 測試課程資料
export const testCourses = {
  dataStructure: {
    name: '資料結構',
    code: 'CS101',
    type: '必修',
    credit: 3
  },
  algorithm: {
    name: '演算法',
    code: 'CS102',
    type: '必修',
    credit: 3
  },
  machineLearning: {
    name: '機器學習導論',
    code: 'CS301',
    type: '選修',
    credit: 3
  },
  webProgramming: {
    name: '網頁程式設計',
    code: 'CS302',
    type: '選修',
    credit: 3
  }
};

// 選課規則
export const enrollmentRules = {
  minCourses: 2,
  maxCourses: 8,
  messages: {
    timeConflict: '時間衝突',
    courseFull: '課程已額滿',
    maxCoursesReached: '已達選課門數上限',
    minCoursesRequired: '至少需選擇 2 門課程',
    alreadyEnrolled: '您已選過此課程'
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
  navigation: 5000,
  apiResponse: 3000,
  animation: 500,
  debounce: 600
};