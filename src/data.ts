/**
 * Centralized mock data - all content is hardcoded for offline use.
 * No fetch, API routes, or async data loading.
 */

export const courses = [
  {
    id: 1,
    title: 'Toán lớp 10',
    description:
      'Chương trình toán học lớp 10 với đại số, hình học và các bài tập thực hành từ cơ bản đến nâng cao.',
  },
  {
    id: 2,
    title: 'Toán lớp 11',
    description:
      'Nắm vững lượng giác, đạo hàm và các chủ đề trọng tâm chuẩn bị cho kỳ thi THPT Quốc gia.',
  },
  {
    id: 3,
    title: 'Toán lớp 12',
    description:
      'Ôn tập toàn diện kiến thức lớp 12 với lộ trình tối ưu cho kỳ thi tốt nghiệp THPT.',
  },
  {
    id: 4,
    title: 'Luyện thi THPT',
    description:
      'Khóa học chuyên sâu luyện giải đề, tổng ôn kiến thức và chiến thuật làm bài thi hiệu quả.',
  },
  {
    id: 5,
    title: 'Toán nâng cao',
    description:
      'Dành cho học sinh giỏi muốn phát triển tư duy và thử thách bản thân với bài toán khó.',
  },
  {
    id: 6,
    title: 'Toán cơ bản',
    description:
      'Học từ đầu với phương pháp dễ hiểu, xây dựng nền tảng vững chắc cho môn toán.',
  },
]

export const teachers = [
  {
    id: 1,
    name: 'Thầy Minh Tuấn',
    bio: '12 năm kinh nghiệm giảng dạy toán cấp 3. Chuyên gia luyện thi Đại học.',
    initial: 'MT',
    color: 'indigo',
  },
  {
    id: 2,
    name: 'Cô Thanh Hà',
    bio: '10 năm kinh nghiệm với phương pháp dạy sáng tạo, dễ hiểu cho mọi đối tượng.',
    initial: 'TH',
    color: 'purple',
  },
  {
    id: 3,
    name: 'Thầy Đức Anh',
    bio: '8 năm kinh nghiệm, cựu học sinh chuyên Toán và từng đạt giải quốc gia.',
    initial: 'ĐA',
    color: 'indigo',
  },
  {
    id: 4,
    name: 'Cô Lan Phương',
    bio: '15 năm kinh nghiệm, chuyên sâu về hình học và tư duy không gian.',
    initial: 'LP',
    color: 'purple',
  },
]

export const testimonials = [
  {
    id: 1,
    name: 'Nguyễn Minh Anh',
    quote:
      'LevelUp.edu giúp em cải thiện điểm toán từ 5 lên 8 trong 3 tháng. Video bài giảng rất dễ hiểu và lộ trình học phù hợp với năng lực của em.',
    initial: 'MA',
    color: 'indigo',
  },
  {
    id: 2,
    name: 'Trần Quang Hùng',
    quote:
      'Em đã đỗ vào trường chuyên nhờ khóa luyện thi. Thầy cô nhiệt tình và AI hỗ trợ giải bài rất nhanh.',
    initial: 'QH',
    color: 'purple',
  },
  {
    id: 3,
    name: 'Lê Thu Trang',
    quote:
      'Học mọi lúc mọi nơi rất tiện. Em thích nhất phần bài tập có chấm điểm ngay và gợi ý chi tiết.',
    initial: 'TT',
    color: 'indigo',
  },
]

// Lessons by subject - for Bài giảng page
export const lessonsBySubject = [
  {
    id: 'toan',
    name: 'Toán học',
    icon: '∑',
    lessons: [
      { id: 1, title: 'Đại số - Phương trình bậc hai', duration: '45 phút', level: 'Lớp 10' },
      { id: 2, title: 'Hình học - Định lý Pythagoras', duration: '38 phút', level: 'Lớp 9' },
      { id: 3, title: 'Lượng giác cơ bản', duration: '52 phút', level: 'Lớp 11' },
      { id: 4, title: 'Đạo hàm và ứng dụng', duration: '60 phút', level: 'Lớp 12' },
      { id: 5, title: 'Tích phân - Nguyên hàm', duration: '55 phút', level: 'Lớp 12' },
    ],
  },
  {
    id: 'vat-ly',
    name: 'Vật lý',
    icon: '⚛',
    lessons: [
      { id: 6, title: 'Cơ học - Chuyển động thẳng đều', duration: '40 phút', level: 'Lớp 10' },
      { id: 7, title: 'Điện học - Định luật Ohm', duration: '45 phút', level: 'Lớp 11' },
      { id: 8, title: 'Sóng và dao động', duration: '50 phút', level: 'Lớp 12' },
    ],
  },
  {
    id: 'hoa-hoc',
    name: 'Hóa học',
    icon: '🧪',
    lessons: [
      { id: 9, title: 'Hóa vô cơ - Bảng tuần hoàn', duration: '42 phút', level: 'Lớp 10' },
      { id: 10, title: 'Hóa hữu cơ - Hiđrocacbon', duration: '48 phút', level: 'Lớp 11' },
    ],
  },
]

// Tests/Exams - for Bài kiểm tra page
export const exams = [
  {
    id: 1,
    title: 'Kiểm tra Toán - Chương 1: Đại số',
    subject: 'Toán học',
    duration: 45,
    questions: 20,
    level: 'Lớp 10',
    assigned: true,
  },
  {
    id: 2,
    title: 'Ôn tập Vật lý - Cơ học',
    subject: 'Vật lý',
    duration: 60,
    questions: 25,
    level: 'Lớp 10',
    assigned: true,
  },
  {
    id: 3,
    title: 'Thử nghiệm THPT - Môn Toán',
    subject: 'Toán học',
    duration: 90,
    questions: 50,
    level: 'Lớp 12',
    assigned: false,
  },
]

// News - for Tin tức page
export const news = [
  { id: 1, title: 'Khai giảng khóa học mới - Toán 12 năm 2025', date: '20/03/2025', excerpt: 'LevelUp.edu chính thức mở đăng ký khóa Toán 12 với lộ trình ôn thi THPT...', category: 'Sự kiện' },
  { id: 2, title: 'Hướng dẫn sử dụng nền tảng học trực tuyến', date: '15/03/2025', excerpt: 'Bài viết hướng dẫn chi tiết cách học hiệu quả trên LevelUp.edu...', category: 'Hướng dẫn' },
  { id: 3, title: 'Công bố kết quả cuộc thi Toán học LevelUp lần 3', date: '10/03/2025', excerpt: 'Ban tổ chức đã công bố danh sách học sinh đạt giải...', category: 'Thông báo' },
  { id: 4, title: 'Cập nhật tính năng làm bài kiểm tra trực tuyến', date: '05/03/2025', excerpt: 'Hệ thống bài kiểm tra mới cho phép làm đề và chấm điểm tự động...', category: 'Cập nhật' },
]

// Admissions - for Tuyển sinh page
export const admissionsInfo = {
  title: 'Thông tin tuyển sinh 2025',
  deadline: '31/08/2025',
  requirements: [
    'Học sinh từ lớp 6 đến lớp 12',
    'Có thiết bị kết nối internet',
    'Đăng ký qua form trực tuyến',
  ],
  steps: [
    { step: 1, title: 'Đăng ký tài khoản', desc: 'Tạo tài khoản trên website LevelUp.edu' },
    { step: 2, title: 'Chọn khóa học', desc: 'Xem và chọn khóa học phù hợp với trình độ' },
    { step: 3, title: 'Thanh toán học phí', desc: 'Thanh toán qua chuyển khoản hoặc ví điện tử' },
    { step: 4, title: 'Bắt đầu học', desc: 'Truy cập bài giảng và bắt đầu học ngay' },
  ],
}

// Video preview section - static placeholder data (no YouTube embed for offline)
export const videoPreview = {
  title: 'Trải nghiệm bài giảng chất lượng',
  description:
    'Mỗi video bài giảng được biên soạn kỹ lưỡng với phương pháp giảng dạy hiện đại. Học sinh có thể xem đi xem lại nhiều lần, tua nhanh hoặc chậm tùy ý.',
  features: [
    'Bài giảng rõ ràng, dễ hiểu từ cơ bản đến nâng cao',
    'Có phụ đề và tài liệu kèm theo',
    'Bài tập thực hành sau mỗi bài học',
  ],
}
