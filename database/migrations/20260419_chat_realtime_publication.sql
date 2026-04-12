-- Bật Realtime (postgres_changes) cho các bảng chat.
-- Trên Supabase: nếu chưa có trong publication, client .channel().on('postgres_changes') sẽ không nhận sự kiện.
-- Chạy migration này sau 20260415 (và sau 20260417 nếu dùng participant_low/high).

DO $pub$
DECLARE
  t text;
  tables text[] := ARRAY[
    'chat_dm_threads',
    'chat_dm_messages',
    'chat_class_messages',
    'chat_class_read_state',
    'chat_custom_conversations',
    'chat_custom_conversation_members',
    'chat_custom_messages'
  ];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_publication p
      WHERE p.pubname = 'supabase_realtime'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_publication_tables pt
      WHERE pt.pubname = 'supabase_realtime'
        AND pt.schemaname = 'public'
        AND pt.tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END
$pub$;
