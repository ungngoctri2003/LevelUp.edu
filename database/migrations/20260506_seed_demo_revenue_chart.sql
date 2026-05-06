-- Demo doanh thu cho biểu đồ admin (2025-01 → hiện tại).
-- Điều kiện: đã có ít nhất 1 dòng trong public.classes và public.courses.
-- Chạy: Supabase → SQL Editor (hoặc psql). Có thể chạy lại: xóa các dòng note = SEED_DEMO_REVENUE_CHART rồi insert lại.
--
-- Biểu đồ chỉ tính payment_status = 'paid' và ngày theo confirmed_at (hoặc submitted_at).

DO $seed$
DECLARE
  cls_ids bigint[];
  crs_ids bigint[];
  n_cls int;
  n_crs int;
BEGIN
  SELECT coalesce(array_agg(id ORDER BY id), '{}'::bigint[]) INTO cls_ids FROM public.classes;
  SELECT coalesce(array_agg(id ORDER BY id), '{}'::bigint[]) INTO crs_ids FROM public.courses;
  n_cls := array_length(cls_ids, 1);
  n_crs := array_length(crs_ids, 1);

  IF n_cls IS NULL OR n_crs IS NULL THEN
    RAISE NOTICE 'seed_demo_revenue_chart: bỏ qua — cần ít nhất một lớp (classes) và một khóa (courses).';
    RETURN;
  END IF;

  DELETE FROM public.student_class_payments WHERE note = 'SEED_DEMO_REVENUE_CHART';
  DELETE FROM public.student_course_payments WHERE note = 'SEED_DEMO_REVENUE_CHART';

  ALTER TABLE public.student_class_payments DISABLE TRIGGER student_class_payments_notify;
  ALTER TABLE public.student_course_payments DISABLE TRIGGER student_course_payments_notify;

  -- Thanh toán lớp: cách ~4 ngày, xen kẽ nguồn & số tiền
  INSERT INTO public.student_class_payments (
    student_id,
    class_id,
    student_name,
    student_email,
    payment_source,
    payment_status,
    amount,
    note,
    submitted_at,
    confirmed_at
  )
  SELECT
    NULL::uuid,
    cls_ids[1 + (((t.ord - 1) * 3) % n_cls)],
    'Demo doanh thu lớp #' || t.ord::text,
    NULL::text,
    (ARRAY[
      'bank_transfer'::public.payment_source,
      'momo'::public.payment_source,
      'vnpay'::public.payment_source,
      'cash'::public.payment_source
    ])[1 + ((t.ord - 1) % 4)],
    'paid'::public.payment_status,
    (1800000::numeric + (t.ord % 55) * 190000::numeric + (extract(month from t.ts)::int % 6) * 120000::numeric),
    'SEED_DEMO_REVENUE_CHART',
    t.ts - interval '2 hours',
    t.ts
  FROM (
    SELECT
      row_number() OVER (ORDER BY s.ts) AS ord,
      s.ts
    FROM generate_series(
      timestamptz '2025-01-02 10:00:00+07',
      now(),
      interval '4 days'
    ) AS s(ts)
  ) t;

  -- Thanh toán khóa: lệch pha (~5 ngày) để biểu đồ có cả hai cột
  INSERT INTO public.student_course_payments (
    student_id,
    course_id,
    student_name,
    student_email,
    payment_source,
    payment_status,
    amount,
    note,
    submitted_at,
    confirmed_at
  )
  SELECT
    NULL::uuid,
    crs_ids[1 + (((t.ord - 1) * 5) % n_crs)],
    'Demo doanh thu khóa #' || t.ord::text,
    NULL::text,
    (ARRAY[
      'bank_transfer'::public.payment_source,
      'momo'::public.payment_source,
      'vnpay'::public.payment_source,
      'cash'::public.payment_source
    ])[1 + ((t.ord - 1) % 4)],
    'paid'::public.payment_status,
    (950000::numeric + (t.ord % 42) * 165000::numeric + (extract(month from t.ts)::int % 5) * 88000::numeric),
    'SEED_DEMO_REVENUE_CHART',
    t.ts - interval '90 minutes',
    t.ts
  FROM (
    SELECT
      row_number() OVER (ORDER BY s.ts) AS ord,
      s.ts
    FROM generate_series(
      timestamptz '2025-01-05 14:30:00+07',
      now(),
      interval '5 days'
    ) AS s(ts)
  ) t;

  ALTER TABLE public.student_class_payments ENABLE TRIGGER student_class_payments_notify;
  ALTER TABLE public.student_course_payments ENABLE TRIGGER student_course_payments_notify;

  RAISE NOTICE 'seed_demo_revenue_chart: đã thêm dữ liệu demo (lớp + khóa), note = SEED_DEMO_REVENUE_CHART.';
EXCEPTION
  WHEN OTHERS THEN
    BEGIN
      ALTER TABLE public.student_class_payments ENABLE TRIGGER student_class_payments_notify;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    BEGIN
      ALTER TABLE public.student_course_payments ENABLE TRIGGER student_course_payments_notify;
    EXCEPTION
      WHEN OTHERS THEN NULL;
    END;
    RAISE;
END
$seed$;
