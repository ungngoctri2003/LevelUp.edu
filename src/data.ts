/**
 * Centralized mock data - all content is hardcoded for offline use.
 * No fetch, API routes, or async data loading.
 */

/** Mỗi khóa có thể gắn `subject` để hiển thị nhãn môn trên trang chủ */
export const courses = [
  {
    id: 1,
    subject: 'Toán',
    title: 'Toán THPT — Từ nền tảng đến luyện đề',
    description:
      'Đại số, hình học, giải tích — lộ trình rõ ràng cho mọi cấp độ, ôn thi hiệu quả.',
  },
  {
    id: 2,
    subject: 'Vật lý',
    title: 'Vật lý — Cơ, nhiệt, điện & sóng',
    description:
      'Hệ thống bài giảng và bài tập minh họa trực quan, bám sát chương trình THPT.',
  },
  {
    id: 3,
    subject: 'Hóa học',
    title: 'Hóa học — Vô cơ & hữu cơ',
    description:
      'Lý thuyết súc tích, phương trình và bài tập ứng dụng từ cơ bản đến nâng cao.',
  },
  {
    id: 4,
    subject: 'Tiếng Anh',
    title: 'Tiếng Anh — Giao tiếp & ngữ pháp',
    description:
      'Nghe — nói — đọc — viết, từ vựng theo chủ đề, phù hợp học sinh THCS & THPT.',
  },
  {
    id: 5,
    subject: 'Ngữ văn',
    title: 'Ngữ văn — Nghị luận & văn học',
    description:
      'Phân tích tác phẩm, kỹ năng viết nghị luận xã hội và ôn thi hiệu quả.',
  },
  {
    id: 6,
    subject: 'Sinh học',
    title: 'Sinh học — Di truyền & ứng dụng',
    description:
      'Kiến thức sinh học hiện đại, hình ảnh minh họa và câu hỏi trắc nghiệm THPT.',
  },
]

export const teachers = [
  {
    id: 1,
    name: 'Thầy Minh Tuấn',
    bio: '12 năm kinh nghiệm — Toán THPT & luyện thi. Phương pháp bài bản, sát đề.',
    initial: 'MT',
    color: 'indigo',
  },
  {
    id: 2,
    name: 'Cô Thanh Hà',
    bio: 'Vật lý & Hóa: 10 năm kinh nghiệm, nhiều học sinh đạt điểm cao THPT Quốc gia.',
    initial: 'TH',
    color: 'purple',
  },
  {
    id: 3,
    name: 'Thầy Đức Anh',
    bio: 'Tiếng Anh học thuật & giao tiếp; từng làm việc với giáo trình quốc tế.',
    initial: 'ĐA',
    color: 'indigo',
  },
  {
    id: 4,
    name: 'Cô Lan Phương',
    bio: 'Ngữ văn & kỹ năng viết: chuyên sâu nghị luận, văn học hiện đại.',
    initial: 'LP',
    color: 'purple',
  },
]

export const testimonials = [
  {
    id: 1,
    name: 'Nguyễn Minh Anh',
    quote:
      'Em học song song Toán và Vật lý trên LevelUp — điểm cả hai môn đều tiến bộ rõ rệt. Video dễ hiểu, có thể xem lại bất cứ lúc nào.',
    initial: 'MA',
    color: 'indigo',
  },
  {
    id: 2,
    name: 'Trần Quang Hùng',
    quote:
      'Khóa Tiếng Anh và Hóa giúp em tự tin hơn trước kỳ thi. Thầy cô phản hồi nhanh, bài tập đa dạng.',
    initial: 'QH',
    color: 'purple',
  },
  {
    id: 3,
    name: 'Lê Thu Trang',
    quote:
      'Nền tảng gom nhiều môn nên em không phải nhảy qua lại giữa các app. Chấm điểm và gợi ý rất hữu ích.',
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
  {
    id: 'tieng-anh',
    name: 'Tiếng Anh',
    icon: 'A',
    lessons: [
      { id: 11, title: 'Grammar - Thì hiện tại hoàn thành', duration: '35 phút', level: 'Lớp 10' },
      { id: 12, title: 'Reading - Bài đọc hiểu THPT', duration: '40 phút', level: 'Lớp 12' },
      { id: 13, title: 'Speaking - Chủ đề giáo dục', duration: '30 phút', level: 'Lớp 11' },
    ],
  },
  {
    id: 'ngu-van',
    name: 'Ngữ văn',
    icon: '📖',
    lessons: [
      { id: 14, title: 'Nghị luận xã hội - Dàn ý & mở bài', duration: '50 phút', level: 'Lớp 12' },
      { id: 15, title: 'Văn học hiện đại - Chí Phèo', duration: '45 phút', level: 'Lớp 11' },
    ],
  },
  {
    id: 'sinh-hoc',
    name: 'Sinh học',
    icon: '🧬',
    lessons: [
      { id: 16, title: 'Di truyền Mendel', duration: '44 phút', level: 'Lớp 12' },
      { id: 17, title: 'Hệ miễn dịch', duration: '38 phút', level: 'Lớp 11' },
    ],
  },
]

/** Tìm môn + bài theo id bài (id duy nhất trong mock lessonsBySubject) */
export function findLessonContext(lessonId) {
  const id = Number(lessonId)
  if (Number.isNaN(id)) return null
  for (const sub of lessonsBySubject) {
    const lesson = sub.lessons.find((l) => l.id === id)
    if (lesson) return { subject: sub, lesson }
  }
  return null
}

// Tests/Exams - for Bài kiểm tra page
export const exams = [
  {
    id: 1,
    title: 'Kiểm tra Toán — Đại số & hàm số',
    subject: 'Toán học',
    duration: 45,
    questions: 20,
    level: 'Lớp 10',
    assigned: true,
  },
  {
    id: 2,
    title: 'Ôn tập Vật lý — Cơ học',
    subject: 'Vật lý',
    duration: 60,
    questions: 25,
    level: 'Lớp 10',
    assigned: true,
  },
  {
    id: 3,
    title: 'Trắc nghiệm Hóa học — Hữu cơ cơ bản',
    subject: 'Hóa học',
    duration: 50,
    questions: 30,
    level: 'Lớp 11',
    assigned: false,
  },
  {
    id: 4,
    title: 'Tiếng Anh — Reading & Cloze',
    subject: 'Tiếng Anh',
    duration: 45,
    questions: 35,
    level: 'Lớp 12',
    assigned: true,
  },
]

// News - for Tin tức page
export const news = [
  {
    id: 1,
    title: 'Khai giảng khóa đa môn — THPT 2025',
    date: '20/03/2025',
    excerpt: 'Mở đăng ký Toán, Lý, Hóa, Anh, Văn, Sinh với lộ trình linh hoạt và học bù trực tuyến...',
    category: 'Sự kiện',
  },
  {
    id: 2,
    title: 'Hướng dẫn sử dụng nền tảng học trực tuyến',
    date: '15/03/2025',
    excerpt: 'Cách chọn môn, theo dõi tiến độ và làm bài kiểm tra trên LevelUp.edu...',
    category: 'Hướng dẫn',
  },
  {
    id: 3,
    title: 'Cuộc thi đa môn LevelUp — Vòng 3',
    date: '10/03/2025',
    excerpt: 'Kết quả các phần thi Toán, Khoa học & Tiếng Anh đã được công bố...',
    category: 'Thông báo',
  },
  {
    id: 4,
    title: 'Cập nhật ngân hàng đề thi & chấm tự động',
    date: '05/03/2025',
    excerpt: 'Thêm đề trắc nghiệm cho nhiều môn và cải thiện gợi ý sau khi nộp bài...',
    category: 'Cập nhật',
  },
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
  title: 'Trải nghiệm bài giảng đa môn',
  description:
    'Toán, khoa học tự nhiên, ngoại ngữ và xã hội — mỗi video được biên soạn kỹ, dễ theo dõi. Xem lại không giới hạn, tua nhanh hoặc chậm tùy ý.',
  features: [
    'Nội dung bám chương trình THCS & THPT, nhiều môn trên một tài khoản',
    'Phụ đề, tài liệu kèm theo và bài tập sau mỗi bài',
    'Gợi ý lộ trình theo môn bạn chọn',
  ],
}
