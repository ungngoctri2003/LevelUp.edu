-- LevelUp.edu — seed data (khop src/data.ts + src/data/dashboardData.ts)
-- Chay SAU schema.sql. Neu da co du lieu catalog, mo khoi TRUNCATE ben duoi (can than FK / du lieu user).

-- ---------------------------------------------------------------------------
-- TUY CHON: xoa catalog + noi dung cong khai de seed lai (KHONG xoa profiles / auth)
-- ---------------------------------------------------------------------------
-- TRUNCATE TABLE
--   public.lesson_details,
--   public.assignment_submissions,
--   public.assignments,
--   public.schedule_slots,
--   public.teacher_lesson_posts,
--   public.class_enrollments,
--   public.classes,
--   public.student_course_progress,
--   public.exam_attempts,
--   public.lessons,
--   public.courses,
--   public.subjects,
--   public.exams,
--   public.news_posts,
--   public.public_teacher_profiles,
--   public.admission_applications,
--   public.marketing_leads,
--   public.admin_activity_logs,
--   public.system_settings
-- RESTART IDENTITY CASCADE;

-- ---------------------------------------------------------------------------
-- Subjects (id 1..6 = thu tu trong app)
-- ---------------------------------------------------------------------------
INSERT INTO public.subjects (id, slug, name, icon_label, sort_order)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'toan', 'Toán học', '∑', 1),
  (2, 'vat-ly', 'Vật lý', '⚛', 2),
  (3, 'hoa-hoc', 'Hóa học', '🧪', 3),
  (4, 'tieng-anh', 'Tiếng Anh', 'A', 4),
  (5, 'ngu-van', 'Ngữ văn', '📖', 5),
  (6, 'sinh-hoc', 'Sinh học', '🧬', 6);

SELECT setval(pg_get_serial_sequence('public.subjects', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.subjects), true);

-- ---------------------------------------------------------------------------
-- Courses (id 1..6)
-- ---------------------------------------------------------------------------
INSERT INTO public.courses (id, subject_id, title, description, visible, sort_order)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 1, 'Toán THPT — Từ nền tảng đến luyện đề',
   'Đại số, hình học, giải tích — lộ trình rõ ràng cho mọi cấp độ, ôn thi hiệu quả.', true, 1),
  (2, 2, 'Vật lý — Cơ, nhiệt, điện & sóng',
   'Hệ thống bài giảng và bài tập minh họa trực quan, bám sát chương trình THPT.', true, 2),
  (3, 3, 'Hóa học — Vô cơ & hữu cơ',
   'Lý thuyết súc tích, phương trình và bài tập ứng dụng từ cơ bản đến nâng cao.', true, 3),
  (4, 4, 'Tiếng Anh — Giao tiếp & ngữ pháp',
   'Nghe — nói — đọc — viết, từ vựng theo chủ đề, phù hợp học sinh THCS & THPT.', true, 4),
  (5, 5, 'Ngữ văn — Nghị luận & văn học',
   'Phân tích tác phẩm, kỹ năng viết nghị luận xã hội và ôn thi hiệu quả.', true, 5),
  (6, 6, 'Sinh học — Di truyền & ứng dụng',
   'Kiến thức sinh học hiện đại, hình ảnh minh họa và câu hỏi trắc nghiệm THPT.', true, 6);

SELECT setval(pg_get_serial_sequence('public.courses', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.courses), true);

-- ---------------------------------------------------------------------------
-- Lessons (id 1..17 — trung id route / findLessonContext)
-- ---------------------------------------------------------------------------
INSERT INTO public.lessons (id, course_id, title, duration_minutes, level_label, sort_order)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 1, 'Đại số - Phương trình bậc hai', 45, 'Lớp 10', 1),
  (2, 1, 'Hình học - Định lý Pythagoras', 38, 'Lớp 9', 2),
  (3, 1, 'Lượng giác cơ bản', 52, 'Lớp 11', 3),
  (4, 1, 'Đạo hàm và ứng dụng', 60, 'Lớp 12', 4),
  (5, 1, 'Tích phân - Nguyên hàm', 55, 'Lớp 12', 5),
  (6, 2, 'Cơ học - Chuyển động thẳng đều', 40, 'Lớp 10', 1),
  (7, 2, 'Điện học - Định luật Ohm', 45, 'Lớp 11', 2),
  (8, 2, 'Sóng và dao động', 50, 'Lớp 12', 3),
  (9, 3, 'Hóa vô cơ - Bảng tuần hoàn', 42, 'Lớp 10', 1),
  (10, 3, 'Hóa hữu cơ - Hiđrocacbon', 48, 'Lớp 11', 2),
  (11, 4, 'Grammar - Thì hiện tại hoàn thành', 35, 'Lớp 10', 1),
  (12, 4, 'Reading - Bài đọc hiểu THPT', 40, 'Lớp 12', 2),
  (13, 4, 'Speaking - Chủ đề giáo dục', 30, 'Lớp 11', 3),
  (14, 5, 'Nghị luận xã hội - Dàn ý & mở bài', 50, 'Lớp 12', 1),
  (15, 5, 'Văn học hiện đại - Chí Phèo', 45, 'Lớp 11', 2),
  (16, 6, 'Di truyền Mendel', 44, 'Lớp 12', 1),
  (17, 6, 'Hệ miễn dịch', 38, 'Lớp 11', 2);

SELECT setval(pg_get_serial_sequence('public.lessons', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.lessons), true);

-- ---------------------------------------------------------------------------
-- Lesson details (JSONB tu lessonDetails.ts — tom tat + cau truc day du)
-- ---------------------------------------------------------------------------
INSERT INTO public.lesson_details (lesson_id, summary, teacher_name, outline, sections, resources, practice_hints)
VALUES
  (1,
   'Ôn lại phương trình bậc hai một ẩn, công thức nghiệm Viète và bài toán liên quan đến dấu nghiệm — phần nền cho đại số THPT.',
   'Thầy Minh Tuấn',
   '["Định nghĩa và dạng tổng quát ax² + bx + c = 0","Công thức nghiệm Δ và trường hợp đặc biệt","Định lý Viète và ứng dụng nhanh","Bài tập: tìm tham số m để PT có nghiệm thỏa điều kiện"]'::jsonb,
   $s$[{"heading":"Lý thuyết cốt lõi","body":"Với a ≠ 0, phương trình bậc hai có tối đa hai nghiệm thực. Ta dùng biệt thức Δ = b² − 4ac để phân loại. Khi Δ > 0 có hai nghiệm phân biệt; Δ = 0 có nghiệm kép; Δ < 0 vô nghiệm thực (trong tập số thực)."},{"heading":"Ví dụ minh họa","body":"Ví dụ: Giải x² − 5x + 6 = 0. Ta có Δ = 25 − 24 = 1 > 0, hai nghiệm x₁ = 3, x₂ = 2. Kiểm tra Viète: x₁ + x₂ = 5 = −b/a, x₁x₂ = 6 = c/a."}]$s$::jsonb,
   '[{"name":"Slide — Đại số lớp 10 (PDF)","type":"PDF"},{"name":"Bảng công thức cần nhớ","type":"PNG"}]'::jsonb,
   '["Tìm m để phương trình x² − 2mx + m + 1 = 0 có hai nghiệm trái dấu.","Cho biết tổng hai nghiệm bằng 4 và tích bằng −5, lập phương trình."]'::jsonb),
  (2,
   'Hệ thức lượng trong tam giác vuông, định lý Pythagoras và bài toán ứng dụng thực tế (khoảng cách, độ dài).',
   'Thầy Minh Tuấn',
   '["Tam giác vuông và các cạnh góc vuông","Định lý Pythagoras: a² + b² = c²","Đảo lý và tam giác vuông","Bài tập tính cạnh còn thiếu và chứng minh vuông"]'::jsonb,
   $s$[{"heading":"Ý nghĩa","body":"Định lý nối liền đại số và hình học: trong tam giác vuông, bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông. Đây là công cụ cơ bản để tính khoảng cách trên mặt phẳng."}]$s$::jsonb,
   '[{"name":"Hình vẽ minh họa — tam giác vuông","type":"PDF"}]'::jsonb,
   '["Tam giác có cạnh 6, 8, 10 có phải vuông không?","Cho điểm A(0,0), B(3,4). Tính độ dài AB."]'::jsonb),
  (3,
   'Góc lượng giác, vòng tròn lượng giác và các hằng đẳng thức cơ bản sin, cos, tan.',
   'Thầy Minh Tuấn',
   '["Góc độ và radian","Định nghĩa sin, cos trên vòng tròn","Công thức cộng góc đơn giản"]'::jsonb,
   $s$[{"heading":"Ghi nhớ","body":"sin²α + cos²α = 1; tanα = sinα/cosα (với cosα ≠ 0). Đổi độ sang rad: rad = độ × π/180."}]$s$::jsonb,
   '[{"name":"Bảng giá trị đặc biệt (0°, 30°, 45°…)","type":"PDF"}]'::jsonb,
   '["Tính sin 150°.","Rút gọn biểu thức sin²x + cos²x + tanx·cotx (nếu xác định)."]'::jsonb),
  (4,
   'Đạo hàm định nghĩa theo giới hạn, quy tắc cộng — nhân — hàm hợp và ứng dụng xét chiều biến thiên.',
   'Thầy Minh Tuấn',
   '["Định nghĩa đạo hàm tại một điểm","Công thức cơ bản","Tiếp tuyến và phương trình tiếp tuyến"]'::jsonb,
   $s$[{"heading":"Ứng dụng","body":"Đạo hàm f′(x) cho biết hướng thay đổi tức thời của hàm. f′(x) > 0 thì hàm đồng biến cục bộ (trên khoảng tương ứng), f′(x) < 0 thì nghịch biến."}]$s$::jsonb,
   '[{"name":"Bài tập đạo hàm tổng hợp","type":"PDF"}]'::jsonb,
   '["Tính đạo hàm của f(x) = x³ − 3x + 1.","Tìm tiếp tuyến của y = x² tại x = 2."]'::jsonb),
  (5,
   'Nguyên hàm, tích phân xác định và liên hệ với diện tích hình thang cong — minh họa định lý Newton — Leibniz.',
   'Thầy Minh Tuấn',
   '["Nguyên hàm và họ nguyên hàm","Tích phân từ a đến b","Diện tích và ứng dụng"]'::jsonb,
   $s$[{"heading":"Ý tưởng","body":"Nếu F′(x) = f(x) thì ∫[a→b] f(x)dx = F(b) − F(a). Đây là cầu nối giữa đại số (nguyên hàm) và hình học (diện tích)."}]$s$::jsonb,
   '[{"name":"Công thức tích phân thường gặp","type":"PDF"}]'::jsonb,
   '["Tính ∫₀¹ 2x dx.","Tìm diện tích giới hạn bởi y = x² và trục Ox từ 0 đến 2."]'::jsonb),
  (6,
   'Chuyển động thẳng đều: độ dịch chuyển, vận tốc không đổi và đồ thị quãng đường — thời gian.',
   'Cô Thanh Hà',
   '["Đại lượng vận tốc","Công thức s = vt","Đồ thị và đơn vị"]'::jsonb,
   $s$[{"heading":"Thực hành","body":"Trong chuyển động thẳng đều, vectơ gia tốc bằng 0, độ lớn vận tốc không đổi theo thời gian. Quãng đường tỉ lệ thuận với thời gian khi chọn gốc thích hợp."}]$s$::jsonb,
   '[{"name":"Ảnh mô phỏng chuyển động","type":"PNG"}]'::jsonb,
   '["Xe chạy 72 km/h trong 30 phút được bao nhiêu km?","Đổi 10 m/s sang km/h."]'::jsonb),
  (7,
   'Dòng điện, hiệu điện thế, điện trở và định luật Ohm cho đoạn mạch một chiều.',
   'Cô Thanh Hà',
   '["Cường độ dòng điện I","Hiệu điện thế U","U = IR và ý nghĩa điện trở"]'::jsonb,
   $s$[{"heading":"Ghi nhớ","body":"Trên một đoạn dẫn đồng chất, nhiệt độ không đổi: U tỉ lệ thuận với I (Ohm). Điện trở R phụ thuộc vật liệu và hình dạng dây."}]$s$::jsonb,
   '[{"name":"Sơ đồ mạch điện cơ bản","type":"PDF"}]'::jsonb,
   '["Cho U = 12V, R = 4Ω. Tính I.","Mắc nối tiếp R1=2Ω, R2=4Ω, tính R tương đương."]'::jsonb),
  (8,
   'Dao động điều hòa, phương trình x = A cos(ωt + φ) và sóng truyền — bước sóng, tần số.',
   'Cô Thanh Hà',
   '["Chu kì và tần số góc","Phương trình dao động","Sóng: v = λf"]'::jsonb,
   $s$[{"heading":"Liên hệ","body":"Dao động cơ học có thể mô tả bằng hàm sin/cosin. Sóng lan truyền mang năng lượng; bước sóng λ nhân tần số f bằng tốc độ truyền sóng."}]$s$::jsonb,
   '[{"name":"Đồ thị dao động điều hòa","type":"PNG"}]'::jsonb,
   '["Tính chu kì khi f = 50 Hz.","Cho λ = 2 m, v = 340 m/s, tính f."]'::jsonb),
  (9,
   'Cấu tạo bảng tuần hoàn, chu kì — nhóm và xu hướng tính kim loại — phi kim theo chu kì.',
   'Cô Thanh Hà',
   '["Nguyên tử số và chu kì","Nhóm A và nhóm B (tổng quan)","Xu hướng bán kính nguyên tử"]'::jsonb,
   $s$[{"heading":"Mẹo học","body":"Bảng tuần hoàn sắp xếp nguyên tố theo Z tăng dần. Cùng một chu kì, điện tích hạt nhân tăng nên bán kính nguyên tử có xu hướng giảm (nhìn chung)."}]$s$::jsonb,
   '[{"name":"Bảng tuần hoàn — bản in A4","type":"PDF"}]'::jsonb,
   '["Xác định chu kì và nhóm của nguyên tố có Z = 12.","So sánh bán kính Na và Mg."]'::jsonb),
  (10,
   'Hiđrocacbon no, không no, danh pháp đơn giản và phản ứng thế, cracking sơ cấp.',
   'Cô Thanh Hà',
   '["Công thức CnH2n+2 (ankan)","Đồng đẳng và tên gọi","Phản ứng cháy và clo hóa"]'::jsonb,
   $s$[{"heading":"An toàn","body":"Hiđrocacbon dễ cháy; thí nghiệm trong phòng lab cần quy trình chuẩn. Trên lớp ta tập trung cân bằng phương trình cháy và nhận biết sản phẩm CO₂, H₂O."}]$s$::jsonb,
   '[{"name":"Mô hình phân tử metan, eten","type":"PDF"}]'::jsonb,
   '["Viết CT của pentan.","Cân bằng C3H8 + O2 → CO2 + H2O."]'::jsonb),
  (11,
   'Thì Present Perfect: have/has + V3, dùng cho hành động xảy ra trong quá khứ nhưng liên quan hiện tại hoặc kinh nghiệm sống.',
   'Thầy Đức Anh',
   '["Cấu trúc khẳng định / phủ định / nghi vấn","Dấu hiệu nhận biết (ever, never, since, for)","Phân biệt với Past Simple"]'::jsonb,
   $s$[{"heading":"Ví dụ","body":"I have finished my homework. / She has never been to Da Nang. For + khoảng thời gian, since + mốc thời gian."}]$s$::jsonb,
   '[{"name":"Bài tập trắc nghiệm Present Perfect","type":"PDF"}]'::jsonb,
   '["Hoàn thành: I ___ (not see) him since Monday.","Chọn đúng: We ___ to Ha Long twice. (have been / went)"]'::jsonb),
  (12,
   'Chiến lược đọc hiểu THPT: skim — scan, xác định main idea và từ vựng theo ngữ cảnh.',
   'Thầy Đức Anh',
   '["Đọc lướt đề bài và đoạn mở","Tìm từ khóa trong câu hỏi","Loại trừ đáp án sai"]'::jsonb,
   $s$[{"heading":"Tip","body":"Đừng đọc kỹ từng từ ngay từ đầu. Đọc câu hỏi trước, gạch chân keyword, quay lại bài đọc để định vị đoạn liên quan."}]$s$::jsonb,
   '[{"name":"Bài đọc kèm đáp án","type":"PDF"}]'::jsonb,
   '["Tìm main idea của một đoạn cho trước.","Xác định từ đồng nghĩa trong ngữ cảnh."]'::jsonb),
  (13,
   'Luyện nói chủ đề Education: từ vựng, cụm hữu ích và mẫu câu trả lời dài 1–2 phút.',
   'Thầy Đức Anh',
   '["Brainstorm ý: school life, exams, future","Linking words","Luyện theo cue card"]'::jsonb,
   $s$[{"heading":"Mẫu câu","body":"In my opinion, education plays a key role in… / I believe that schools should focus more on…"}]$s$::jsonb,
   '[{"name":"Cue card — Education","type":"PDF"}]'::jsonb,
   '["Nói 90 giây về “my ideal school”.","Liệt kê 5 từ vựng chủ đề giáo dục."]'::jsonb),
  (14,
   'Dàn ý bài nghị luận xã hội: mở bài gợi ý vấn đề, thân bài luận theo lớp luận, kết bài mở rộng.',
   'Cô Lan Phương',
   '["Nhận diện đề: hiện tượng — yêu cầu","Mở bài: giới thiệu + dẫn luận","Kết bài: khẳng định + hướng tới"]'::jsonb,
   $s$[{"heading":"Lưu ý","body":"Thân bài nên có ít nhất hai lớp luận (Mỗi lớp: khẳng định nhỏ → giải thích → ví dụ / bình luận). Tránh lạc đề và lặp ý."}]$s$::jsonb,
   '[{"name":"Dàn ý bài viết — chủ đề học đường","type":"DOCX"}]'::jsonb,
   '["Lập dàn ý cho đề: “Học để làm gì?”","Viết mở bài 4–5 câu cho một đề xã hội."]'::jsonb),
  (15,
   'Đọc hiểu “Chí Phèo”: bối cảnh, diễn biến tâm lý nhân vật và giá trị nhân đạo của Nam Cao.',
   'Cô Lan Phương',
   '["Bối cảnh làng Vũ Đại","Bi kịch Chí — Thị Nở","Ý nghĩa phê phán xã hội"]'::jsonb,
   $s$[{"heading":"Gợi ý phân tích","body":"Chú ý các mốc: Chí trước và sau khi “làm quen” với Thị Nở; cách Nam Cao dùng ngôn từ gợi hình ảnh và giọng điệu trần thuật."}]$s$::jsonb,
   '[{"name":"Trích đoạn văn bản + câu hỏi","type":"PDF"}]'::jsonb,
   '["Phân tích hình ảnh “cái lưỡi” trong tác phẩm.","Nêu ý nghĩa đoạn kết."]'::jsonb),
  (16,
   'Quy luật Mendel: phân ly và phân ly độc lập — bảng Punnett và xác suất kiểu hình đời con.',
   'Cô Thanh Hà',
   '["Gen, alen, kiểu gen — kiểu hình","Lai một — hai tính","Xác suất đơn giản"]'::jsonb,
   $s$[{"heading":"Thực hành","body":"Với lai Aa × Aa, tỉ lệ kiểu gen đời con 1 AA : 2 Aa : 1 aa; kiểu hình trội : lặn thường là 3 : 1 (trội hoàn toàn)."}]$s$::jsonb,
   '[{"name":"Sơ đồ lai Mendel","type":"PDF"}]'::jsonb,
   '["Lai Aa × aa — tỉ lệ kiểu hình?","Giải thích phân ly độc lập bằng lời."]'::jsonb),
  (17,
   'Miễn dịch: kháng nguyên — kháng thể, miễn dịch tự nhiên và thích ứng; vaccine ở mức khái niệm.',
   'Cô Thanh Hà',
   '["Các tuyến phòng vệ của cơ thể","Tế bào B và T (tổng quan)","Tiêm chủng và nhớ miễn dịch"]'::jsonb,
   $s$[{"heading":"Liên hệ đời sống","body":"Vaccine giúp hệ miễn dịch “luyện tập” nhận diện mầm bệnh mà không gây bệnh nặng — cơ chế nhớ miễn dịch giúp phản ứng nhanh hơn khi gặp thật."}]$s$::jsonb,
   '[{"name":"Sơ đồ phản ứng miễn dịch","type":"PNG"}]'::jsonb,
   '["Khác nhau kháng nguyên và kháng thể?","Vì sao cần tiêm nhắc vaccine?"]'::jsonb);

-- ---------------------------------------------------------------------------
-- Exams (id 1..4)
-- ---------------------------------------------------------------------------
INSERT INTO public.exams (id, title, subject_label, duration_minutes, question_count, level_label, published, assigned, questions)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Kiểm tra Toán — Đại số & hàm số', 'Toán học', 45, 3, 'Lớp 10', true, true,
    $e1$[
      {"text":"Phương trình x² - 4 = 0 có nghiệm là?","options":["x = ±2","x = 2","x = -2","x = 4"],"answer":"x = ±2"},
      {"text":"Đạo hàm của hàm số f(x) = x³ là?","options":["3x²","x²","3x","2x²"],"answer":"3x²"},
      {"text":"Giá trị của sin(90°) là?","options":["0","1","-1","√2/2"],"answer":"1"}
    ]$e1$::jsonb),
  (2, 'Ôn tập Vật lý — Cơ học', 'Vật lý', 60, 3, 'Lớp 10', true, true,
    $e2$[
      {"text":"Đơn vị đo lực trong hệ SI là?","options":["Newton (N)","Joule (J)","Watt (W)","Pascal (Pa)"],"answer":"Newton (N)"},
      {"text":"Định luật I Newton phát biểu điều gì?","options":["F = ma","Vật đứng yên hoặc chuyển động đều nếu hợp lực bằng 0","Mọi lực đều có lực phản lực","Năng lượng bảo toàn"],"answer":"Vật đứng yên hoặc chuyển động đều nếu hợp lực bằng 0"},
      {"text":"Vận tốc 36 km/h tương đương bao nhiêu m/s?","options":["10","6","20","360"],"answer":"10"}
    ]$e2$::jsonb),
  (3, 'Trắc nghiệm Hóa học — Hữu cơ cơ bản', 'Hóa học', 50, 3, 'Lớp 11', true, false,
    $e3$[
      {"text":"Nguyên tố có số hiệu nguyên tử Z = 6 là?","options":["Cacbon","Nito","Oxi","Silic"],"answer":"Cacbon"},
      {"text":"Ankan đơn giản nhất là?","options":["Metan","Etan","Propan","Butan"],"answer":"Metan"},
      {"text":"Nhóm chức của ancol etylic là?","options":["-OH","-COOH","-CHO","-NH₂"],"answer":"-OH"}
    ]$e3$::jsonb),
  (4, 'Tiếng Anh — Reading & Cloze', 'Tiếng Anh', 45, 3, 'Lớp 12', true, true,
    $e4$[
      {"text":"Chọn từ đúng: I ___ a student.","options":["am","is","are","be"],"answer":"am"},
      {"text":"Thì hiện tại hoàn thành của \"go\" là?","options":["have gone","has went","have go","has gone"],"answer":"have gone"},
      {"text":"\"Beautiful\" nghĩa là?","options":["Đẹp","Buồn","Nhanh","Khó"],"answer":"Đẹp"}
    ]$e4$::jsonb);

SELECT setval(pg_get_serial_sequence('public.exams', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.exams), true);

-- ---------------------------------------------------------------------------
-- News
-- ---------------------------------------------------------------------------
INSERT INTO public.news_posts (id, title, excerpt, body, category, published_on, slug)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Khai giảng khóa đa môn — THPT 2025',
   'Mở đăng ký Toán, Lý, Hóa, Anh, Văn, Sinh với lộ trình linh hoạt và học bù trực tuyến...',
   NULL, 'Sự kiện', '2025-03-20', 'khai-giang-khoa-da-mon-thpt-2025'),
  (2, 'Hướng dẫn sử dụng nền tảng học trực tuyến',
   'Cách chọn môn, theo dõi tiến độ và làm bài kiểm tra trên LevelUp.edu...',
   NULL, 'Hướng dẫn', '2025-03-15', 'huong-dan-su-dung-nen-tang'),
  (3, 'Cuộc thi đa môn LevelUp — Vòng 3',
   'Kết quả các phần thi Toán, Khoa học & Tiếng Anh đã được công bố...',
   NULL, 'Thông báo', '2025-03-10', 'cuoc-thi-da-mon-levelup-vong-3'),
  (4, 'Cập nhật ngân hàng đề thi & chấm tự động',
   'Thêm đề trắc nghiệm cho nhiều môn và cải thiện gợi ý sau khi nộp bài...',
   NULL, 'Cập nhật', '2025-03-05', 'cap-nhat-ngan-hang-de-thi');

SELECT setval(pg_get_serial_sequence('public.news_posts', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.news_posts), true);

-- ---------------------------------------------------------------------------
-- Giao vien cong khai (data.ts teachers)
-- ---------------------------------------------------------------------------
INSERT INTO public.public_teacher_profiles (id, user_id, name, bio, initial, color_token, avatar_url, sort_order)
OVERRIDING SYSTEM VALUE
VALUES
  (1, NULL, 'Thầy Minh Tuấn', '12 năm kinh nghiệm — Toán THPT & luyện thi. Phương pháp bài bản, sát đề.', 'MT', 'indigo',
   'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80', 1),
  (2, NULL, 'Cô Thanh Hà', 'Vật lý & Hóa: 10 năm kinh nghiệm, nhiều học sinh đạt điểm cao THPT Quốc gia.', 'TH', 'purple',
   'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80', 2),
  (3, NULL, 'Thầy Đức Anh', 'Tiếng Anh học thuật & giao tiếp; từng làm việc với giáo trình quốc tế.', 'ĐA', 'indigo',
   'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80', 3),
  (4, NULL, 'Cô Lan Phương', 'Ngữ văn & kỹ năng viết: chuyên sâu nghị luận, văn học hiện đại.', 'LP', 'purple',
   'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80', 4);

SELECT setval(pg_get_serial_sequence('public.public_teacher_profiles', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.public_teacher_profiles), true);

-- ---------------------------------------------------------------------------
-- Tuyen sinh + lead + admin log + settings (dashboardData)
-- ---------------------------------------------------------------------------
INSERT INTO public.admission_applications (id, student_name, parent_phone, grade_label, status, submitted_at, notes)
OVERRIDING SYSTEM VALUE
VALUES
  (1, 'Vũ Khánh', '0901112233', 'Lớp 10', 'new', '2025-03-18 12:00:00+07', NULL),
  (2, 'Đặng Linh', '0912223344', 'Lớp 12', 'reviewing', '2025-03-17 12:00:00+07', NULL),
  (3, 'Bùi Nam', '0933334455', 'Lớp 11', 'accepted', '2025-03-10 12:00:00+07', NULL);

SELECT setval(pg_get_serial_sequence('public.admission_applications', 'id'), (SELECT COALESCE(MAX(id), 1) FROM public.admission_applications), true);

INSERT INTO public.marketing_leads (full_name, email, phone, course_interest)
VALUES
  ('Nguyễn Thị Mai', 'mai@email.com', '0909123456', 'Toán THPT — Từ nền tảng đến luyện đề');

INSERT INTO public.admin_activity_logs (occurred_at, actor_email, action, type)
VALUES
  (now() - interval '2 hours', 'admin@levelup.edu', 'Cập nhật khóa đa môn THPT', 'course'),
  (now() - interval '1 day', 'system', 'Sao lưu cơ sở dữ liệu tự động', 'system'),
  (now() - interval '1 day', 'admin@levelup.edu', 'Duyệt tài khoản giáo viên mới', 'user'),
  (now() - interval '2 days', 'support@levelup.edu', 'Trả lời ticket #882', 'support');

INSERT INTO public.system_settings (key, value)
VALUES
  ('admissions_info', $j${
    "title": "Thông tin tuyển sinh 2025",
    "deadline": "31/08/2025",
    "requirements": [
      "Học sinh từ lớp 6 đến lớp 12",
      "Có thiết bị kết nối internet",
      "Đăng ký qua form trực tuyến"
    ],
    "steps": [
      {"step": 1, "title": "Đăng ký tài khoản", "desc": "Tạo tài khoản trên website LevelUp.edu"},
      {"step": 2, "title": "Chọn khóa học", "desc": "Xem và chọn khóa học phù hợp với trình độ"},
      {"step": 3, "title": "Thanh toán học phí", "desc": "Thanh toán qua chuyển khoản hoặc ví điện tử"},
      {"step": 4, "title": "Bắt đầu học", "desc": "Truy cập bài giảng và bắt đầu học ngay"}
    ]
  }$j$::jsonb),
  ('admin_stats_snapshot', $j${
    "totalStudents": 1284,
    "totalTeachers": 24,
    "activeCourses": 18,
    "monthlyRevenue": 245000000,
    "pendingAdmissions": 42,
    "openTickets": 7
  }$j$::jsonb),
  ('video_preview', $j${
    "title": "Trải nghiệm bài giảng đa môn",
    "description": "Toán, khoa học tự nhiên, ngoại ngữ và xã hội — mỗi video được biên soạn kỹ, dễ theo dõi.",
    "features": [
      "Nội dung bám chương trình THCS & THPT, nhiều môn trên một tài khoản",
      "Phụ đề, tài liệu kèm theo và bài tập sau mỗi bài",
      "Gợi ý lộ trình theo môn bạn chọn"
    ]
  }$j$::jsonb),
  ('testimonials', $j$[
    {"id": 1, "name": "Nguyễn Minh Anh", "initial": "MA", "color": "indigo", "quote": "Em học song song Toán và Vật lý trên LevelUp — điểm cả hai môn đều tiến bộ rõ rệt. Video dễ hiểu, có thể xem lại bất cứ lúc nào."},
    {"id": 2, "name": "Trần Quang Hùng", "initial": "QH", "color": "purple", "quote": "Khóa Tiếng Anh và Hóa giúp em tự tin hơn trước kỳ thi. Thầy cô phản hồi nhanh, bài tập đa dạng."},
    {"id": 3, "name": "Lê Thu Trang", "initial": "TT", "color": "indigo", "quote": "Nền tảng gom nhiều môn nên em không phải nhảy qua lại giữa các app. Chấm điểm và gợi ý rất hữu ích."}
  ]$j$::jsonb)
ON CONFLICT (key) DO UPDATE SET value = excluded.value;
