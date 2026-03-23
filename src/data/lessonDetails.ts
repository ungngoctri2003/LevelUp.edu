/**
 * Nội dung chi tiết bài giảng (tĩnh) — có thể thay bằng API sau này.
 */
import { findLessonContext } from '../data'

export type LessonDetailExtra = {
  summary: string
  outline: string[]
  sections: { heading: string; body: string }[]
  resources: { name: string; type: string }[]
  teacherName: string
  practiceHints: string[]
}

const DETAILS: Record<number, LessonDetailExtra> = {
  1: {
    summary:
      'Ôn lại phương trình bậc hai một ẩn, công thức nghiệm Viète và bài toán liên quan đến dấu nghiệm — phần nền cho đại số THPT.',
    outline: [
      'Định nghĩa và dạng tổng quát ax² + bx + c = 0',
      'Công thức nghiệm Δ và trường hợp đặc biệt',
      'Định lý Viète và ứng dụng nhanh',
      'Bài tập: tìm tham số m để PT có nghiệm thỏa điều kiện',
    ],
    sections: [
      {
        heading: 'Lý thuyết cốt lõi',
        body:
          'Với a ≠ 0, phương trình bậc hai có tối đa hai nghiệm thực. Ta dùng biệt thức Δ = b² − 4ac để phân loại. Khi Δ > 0 có hai nghiệm phân biệt; Δ = 0 có nghiệm kép; Δ < 0 vô nghiệm thực (trong tập số thực).',
      },
      {
        heading: 'Ví dụ minh họa',
        body:
          'Ví dụ: Giải x² − 5x + 6 = 0. Ta có Δ = 25 − 24 = 1 > 0, hai nghiệm x₁ = 3, x₂ = 2. Kiểm tra Viète: x₁ + x₂ = 5 = −b/a, x₁x₂ = 6 = c/a.',
      },
    ],
    resources: [
      { name: 'Slide — Đại số lớp 10 (PDF)', type: 'PDF' },
      { name: 'Bảng công thức cần nhớ', type: 'PNG' },
    ],
    teacherName: 'Thầy Minh Tuấn',
    practiceHints: [
      'Tìm m để phương trình x² − 2mx + m + 1 = 0 có hai nghiệm trái dấu.',
      'Cho biết tổng hai nghiệm bằng 4 và tích bằng −5, lập phương trình.',
    ],
  },
  2: {
    summary:
      'Hệ thức lượng trong tam giác vuông, định lý Pythagoras và bài toán ứng dụng thực tế (khoảng cách, độ dài).',
    outline: [
      'Tam giác vuông và các cạnh góc vuông',
      'Định lý Pythagoras: a² + b² = c²',
      'Đảo lý và tam giác vuông',
      'Bài tập tính cạnh còn thiếu và chứng minh vuông',
    ],
    sections: [
      {
        heading: 'Ý nghĩa',
        body:
          'Định lý nối liền đại số và hình học: trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông. Đây là công cụ cơ bản để tính khoảng cách trên mặt phẳng.',
      },
    ],
    resources: [{ name: 'Hình vẽ minh họa — tam giác vuông', type: 'PDF' }],
    teacherName: 'Thầy Minh Tuấn',
    practiceHints: [
      'Tam giác có cạnh 6, 8, 10 có phải vuông không?',
      'Cho điểm A(0,0), B(3,4). Tính độ dài AB.',
    ],
  },
  3: {
    summary:
      'Góc lượng giác, vòng tròn lượng giác và các hằng đẳng thức cơ bản sin, cos, tan.',
    outline: ['Góc độ và radian', 'Định nghĩa sin, cos trên vòng tròn', 'Công thức cộng góc đơn giản'],
    sections: [
      {
        heading: 'Ghi nhớ',
        body:
          'sin²α + cos²α = 1; tanα = sinα/cosα (với cosα ≠ 0). Đổi độ sang rad: rad = độ × π/180.',
      },
    ],
    resources: [{ name: 'Bảng giá trị đặc biệt (0°, 30°, 45°…)', type: 'PDF' }],
    teacherName: 'Thầy Minh Tuấn',
    practiceHints: ['Tính sin 150°.', 'Rút gọn biểu thức sin²x + cos²x + tanx·cotx (nếu xác định).'],
  },
  4: {
    summary:
      'Đạo hàm định nghĩa theo giới hạn, quy tắc cộng — nhân — hàm hợp và ứng dụng xét chiều biến thiên.',
    outline: ['Định nghĩa đạo hàm tại một điểm', 'Công thức cơ bản', 'Tiếp tuyến và phương trình tiếp tuyến'],
    sections: [
      {
        heading: 'Ứng dụng',
        body:
          'Đạo hàm f′(x) cho biết hướng thay đổi tức thời của hàm. f′(x) > 0 thì hàm đồng biến cục bộ (trên khoảng tương ứng), f′(x) < 0 thì nghịch biến.',
      },
    ],
    resources: [{ name: 'Bài tập đạo hàm tổng hợp', type: 'PDF' }],
    teacherName: 'Thầy Minh Tuấn',
    practiceHints: ['Tính đạo hàm của f(x) = x³ − 3x + 1.', 'Tìm tiếp tuyến của y = x² tại x = 2.'],
  },
  5: {
    summary:
      'Nguyên hàm, tích phân xác định và liên hệ với diện tích hình thang cong — minh họa định lý Newton — Leibniz.',
    outline: ['Nguyên hàm và họ nguyên hàm', 'Tích phân từ a đến b', 'Diện tích và ứng dụng'],
    sections: [
      {
        heading: 'Ý tưởng',
        body:
          'Nếu F′(x) = f(x) thì ∫[a→b] f(x)dx = F(b) − F(a). Đây là cầu nối giữa đại số (nguyên hàm) và hình học (diện tích).',
      },
    ],
    resources: [{ name: 'Công thức tích phân thường gặp', type: 'PDF' }],
    teacherName: 'Thầy Minh Tuấn',
    practiceHints: ['Tính ∫₀¹ 2x dx.', 'Tìm diện tích giới hạn bởi y = x² và trục Ox từ 0 đến 2.'],
  },
  6: {
    summary:
      'Chuyển động thẳng đều: độ dịch chuyển, vận tốc không đổi và đồ thị quãng đường — thời gian.',
    outline: ['Đại lượng vận tốc', 'Công thức s = vt', 'Đồ thị và đơn vị'],
    sections: [
      {
        heading: 'Thực hành',
        body:
          'Trong chuyển động thẳng đều, vectơ gia tốc bằng 0, độ lớn vận tốc không đổi theo thời gian. Quãng đường tỉ lệ thuận với thời gian khi chọn gốc thích hợp.',
      },
    ],
    resources: [{ name: 'Ảnh mô phỏng chuyển động', type: 'PNG' }],
    teacherName: 'Cô Thanh Hà',
    practiceHints: ['Xe chạy 72 km/h trong 30 phút được bao nhiêu km?', 'Đổi 10 m/s sang km/h.'],
  },
  7: {
    summary:
      'Dòng điện, hiệu điện thế, điện trở và định luật Ohm cho đoạn mạch một chiều.',
    outline: ['Cường độ dòng điện I', 'Hiệu điện thế U', 'U = IR và ý nghĩa điện trở'],
    sections: [
      {
        heading: 'Ghi nhớ',
        body:
          'Trên một đoạn dẫn đồng chất, nhiệt độ không đổi: U tỉ lệ thuận với I (Ohm). Điện trở R phụ thuộc vật liệu và hình dạng dây.',
      },
    ],
    resources: [{ name: 'Sơ đồ mạch điện cơ bản', type: 'PDF' }],
    teacherName: 'Cô Thanh Hà',
    practiceHints: ['Cho U = 12V, R = 4Ω. Tính I.', 'Mắc nối tiếp R1=2Ω, R2=4Ω, tính R tương đương.'],
  },
  8: {
    summary:
      'Dao động điều hòa, phương trình x = A cos(ωt + φ) và sóng truyền — bước sóng, tần số.',
    outline: ['Chu kì và tần số góc', 'Phương trình dao động', 'Sóng: v = λf'],
    sections: [
      {
        heading: 'Liên hệ',
        body:
          'Dao động cơ học có thể mô tả bằng hàm sin/cosin. Sóng lan truyền mang năng lượng; bước sóng λ nhân tần số f bằng tốc độ truyền sóng.',
      },
    ],
    resources: [{ name: 'Đồ thị dao động điều hòa', type: 'PNG' }],
    teacherName: 'Cô Thanh Hà',
    practiceHints: ['Tính chu kì khi f = 50 Hz.', 'Cho λ = 2 m, v = 340 m/s, tính f.'],
  },
  9: {
    summary:
      'Cấu tạo bảng tuần hoàn, chu kì — nhóm và xu hướng tính kim loại — phi kim theo chu kì.',
    outline: ['Nguyên tử số và chu kì', 'Nhóm A và nhóm B (tổng quan)', 'Xu hướng bán kính nguyên tử'],
    sections: [
      {
        heading: 'Mẹo học',
        body:
          'Bảng tuần hoàn sắp xếp nguyên tố theo Z tăng dần. Cùng một chu kì, điện tích hạt nhân tăng nên bán kính nguyên tử có xu hướng giảm (nhìn chung).',
      },
    ],
    resources: [{ name: 'Bảng tuần hoàn — bản in A4', type: 'PDF' }],
    teacherName: 'Cô Thanh Hà',
    practiceHints: ['Xác định chu kì và nhóm của nguyên tố có Z = 12.', 'So sánh bán kính Na và Mg.'],
  },
  10: {
    summary:
      'Hiđrocacbon no, không no, danh pháp đơn giản và phản ứng thế, cracking sơ cấp.',
    outline: ['Công thức CnH2n+2 (ankan)', 'Đồng đẳng và tên gọi', 'Phản ứng cháy và clo hóa'],
    sections: [
      {
        heading: 'An toàn',
        body:
          'Hiđrocacbon dễ cháy; thí nghiệm trong phòng lab cần quy trình chuẩn. Trên lớp ta tập trung cân bằng phương trình cháy và nhận biết sản phẩm CO₂, H₂O.',
      },
    ],
    resources: [{ name: 'Mô hình phân tử metan, eten', type: 'PDF' }],
    teacherName: 'Cô Thanh Hà',
    practiceHints: ['Viết CT của pentan.', 'Cân bằng C3H8 + O2 → CO2 + H2O.'],
  },
  11: {
    summary:
      'Thì Present Perfect: have/has + V3, dùng cho hành động xảy ra trong quá khứ nhưng liên quan hiện tại hoặc kinh nghiệm sống.',
    outline: ['Cấu trúc khẳng định / phủ định / nghi vấn', 'Dấu hiệu nhận biết (ever, never, since, for)', 'Phân biệt với Past Simple'],
    sections: [
      {
        heading: 'Ví dụ',
        body:
          'I have finished my homework. / She has never been to Da Nang. For + khoảng thời gian, since + mốc thời gian.',
      },
    ],
    resources: [{ name: 'Bài tập trắc nghiệm Present Perfect', type: 'PDF' }],
    teacherName: 'Thầy Đức Anh',
    practiceHints: [
      'Hoàn thành: I ___ (not see) him since Monday.',
      'Chọn đúng: We ___ to Ha Long twice. (have been / went)',
    ],
  },
  12: {
    summary:
      'Chiến lược đọc hiểu THPT: skim — scan, xác định main idea và từ vựng theo ngữ cảnh.',
    outline: ['Đọc lướt đề bài và đoạn mở', 'Tìm từ khóa trong câu hỏi', 'Loại trừ đáp án sai'],
    sections: [
      {
        heading: 'Tip',
        body:
          'Đừng đọc kỹ từng từ ngay từ đầu. Đọc câu hỏi trước, gạch chân keyword, quay lại bài đọc để định vị đoạn liên quan.',
      },
    ],
    resources: [{ name: 'Bài đọc kèm đáp án', type: 'PDF' }],
    teacherName: 'Thầy Đức Anh',
    practiceHints: ['Tìm main idea của một đoạn cho trước.', 'Xác định từ đồng nghĩa trong ngữ cảnh.'],
  },
  13: {
    summary:
      'Luyện nói chủ đề Education: từ vựng, cụm hữu ích và mẫu câu trả lời dài 1–2 phút.',
    outline: ['Brainstorm ý: school life, exams, future', 'Linking words', 'Luyện theo cue card'],
    sections: [
      {
        heading: 'Mẫu câu',
        body:
          'In my opinion, education plays a key role in… / I believe that schools should focus more on…',
      },
    ],
    resources: [{ name: 'Cue card — Education', type: 'PDF' }],
    teacherName: 'Thầy Đức Anh',
    practiceHints: ['Nói 90 giây về “my ideal school”.', 'Liệt kê 5 từ vựng chủ đề giáo dục.'],
  },
  14: {
    summary:
      'Dàn ý bài nghị luận xã hội: mở bài gợi ý vấn đề, thân bài luận theo lớp luận, kết bài mở rộng.',
    outline: ['Nhận diện đề: hiện tượng — yêu cầu', 'Mở bài: giới thiệu + dẫn luận', 'Kết bài: khẳng định + hướng tới'],
    sections: [
      {
        heading: 'Lưu ý',
        body:
          'Thân bài nên có ít nhất hai lớp luận (Mỗi lớp: khẳng định nhỏ → giải thích → ví dụ / bình luận). Tránh lạc đề và lặp ý.',
      },
    ],
    resources: [{ name: 'Dàn ý bài viết — chủ đề học đường', type: 'DOCX' }],
    teacherName: 'Cô Lan Phương',
    practiceHints: ['Lập dàn ý cho đề: “Học để làm gì?”', 'Viết mở bài 4–5 câu cho một đề xã hội.'],
  },
  15: {
    summary:
      'Đọc hiểu “Chí Phèo”: bối cảnh, diễn biến tâm lý nhân vật và giá trị nhân đạo của Nam Cao.',
    outline: ['Bối cảnh làng Vũ Đại', 'Bi kịch Chí — Thị Nở', 'Ý nghĩa phê phán xã hội'],
    sections: [
      {
        heading: 'Gợi ý phân tích',
        body:
          'Chú ý các mốc: Chí trước và sau khi “làm quen” với Thị Nở; cách Nam Cao dùng ngôn từ gợi hình ảnh và giọng điệu trần thuật.',
      },
    ],
    resources: [{ name: 'Trích đoạn văn bản + câu hỏi', type: 'PDF' }],
    teacherName: 'Cô Lan Phương',
    practiceHints: ['Phân tích hình ảnh “cái lưỡi” trong tác phẩm.', 'Nêu ý nghĩa đoạn kết.'],
  },
  16: {
    summary:
      'Quy luật Mendel: phân ly và phân ly độc lập — bảng Punnett và xác suất kiểu hình đời con.',
    outline: ['Gen, alen, kiểu gen — kiểu hình', 'Lai một — hai tính', 'Xác suất đơn giản'],
    sections: [
      {
        heading: 'Thực hành',
        body:
          'Với lai Aa × Aa, tỉ lệ kiểu gen đời con 1 AA : 2 Aa : 1 aa; kiểu hình trội : lặn thường là 3 : 1 (trội hoàn toàn).',
      },
    ],
    resources: [{ name: 'Sơ đồ lai Mendel', type: 'PDF' }],
    teacherName: 'Cô Thanh Hà',
    practiceHints: ['Lai Aa × aa — tỉ lệ kiểu hình?', 'Giải thích phân ly độc lập bằng lời.'],
  },
  17: {
    summary:
      'Miễn dịch: kháng nguyên — kháng thể, miễn dịch tự nhiên và thích ứng; vaccine ở mức khái niệm.',
    outline: ['Các tuyến phòng vệ của cơ thể', 'Tế bào B và T (tổng quan)', 'Tiêm chủng và nhớ miễn dịch'],
    sections: [
      {
        heading: 'Liên hệ đời sống',
        body:
          'Vaccine giúp hệ miễn dịch “luyện tập” nhận diện mầm bệnh mà không gây bệnh nặng — cơ chế nhớ miễn dịch giúp phản ứng nhanh hơn khi gặp thật.',
      },
    ],
    resources: [{ name: 'Sơ đồ phản ứng miễn dịch', type: 'PNG' }],
    teacherName: 'Cô Thanh Hà',
    practiceHints: ['Khác nhau kháng nguyên và kháng thể?', 'Vì sao cần tiêm nhắc vaccine?'],
  },
}

function defaultDetail(subjectName: string, title: string): LessonDetailExtra {
  return {
    summary: `Bài "${title}" — môn ${subjectName}: ôn lý thuyết, làm ví dụ và luyện tập theo lộ trình lớp.`,
    outline: ['Mục tiêu bài học', 'Nội dung lý thuyết', 'Ví dụ minh họa', 'Câu hỏi củng cố'],
    sections: [
      {
        heading: 'Giới thiệu',
        body: `Phần này giới thiệu chủ đề "${title}" trong chương trình ${subjectName}. Bạn có thể xem lại video, tải tài liệu và làm bài tập gợi ý bên dưới.`,
      },
      {
        heading: 'Nội dung chính',
        body:
          'Bài gồm phần lý thuyết, ví dụ và phần luyện tập. Giáo viên có thể bổ sung slide, bài kiểm tra ngắn sau từng mục tùy lớp.',
      },
    ],
    resources: [
      { name: 'Tài liệu kèm bài (PDF)', type: 'PDF' },
      { name: 'Ghi chú nhanh (DOCX)', type: 'DOCX' },
    ],
    teacherName: 'Giáo viên phụ trách',
    practiceHints: ['Ôn lại các khái niệm đã nêu trong video.', 'Làm 5 câu trắc nghiệm trong phần bài tập.'],
  }
}

export type LessonDetailView = LessonDetailExtra & {
  subjectId: string
  subjectName: string
  icon: string
  lesson: { id: number; title: string; duration: string; level: string }
}

export function getLessonDetail(lessonId: string | number): LessonDetailView | null {
  const ctx = findLessonContext(lessonId)
  if (!ctx) return null
  const id = ctx.lesson.id
  const extra = DETAILS[id] ?? defaultDetail(ctx.subject.name, ctx.lesson.title)
  return {
    subjectId: ctx.subject.id,
    subjectName: ctx.subject.name,
    icon: ctx.subject.icon,
    lesson: ctx.lesson,
    ...extra,
  }
}
