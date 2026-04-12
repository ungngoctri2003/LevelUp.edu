-- Cho phép người tham gia xóa thread DM (cascade tin nhắn) và tự rời nhóm chat tùy chỉnh.

drop policy if exists chat_dm_threads_delete_participant on public.chat_dm_threads;
create policy chat_dm_threads_delete_participant on public.chat_dm_threads
  for delete using (
    participant_low = (select auth.uid())
    or participant_high = (select auth.uid())
  );

drop policy if exists chat_custom_members_delete_self on public.chat_custom_conversation_members;
create policy chat_custom_members_delete_self on public.chat_custom_conversation_members
  for delete using (user_id = (select auth.uid()));
