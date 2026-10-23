begin;
alter table public.chat_assessments add column budget jsonb;
-- Existing snapshot function includes the new column via to_jsonb(a).
alter function public.server_assessment_reply(uuid,uuid,uuid,uuid,text,text,text,text,text,text) rename to save_assessment_reply;
revoke all on function public.save_assessment_reply(uuid,uuid,uuid,uuid,text,text,text,text,text,text) from service_role;
create function public.server_assessment_reply(p_owner uuid,p_subject uuid,p_conversation uuid,p_operation uuid,p_text text,p_topic text,p_requested_difficulty text,p_action text,p_question text,p_difficulty text,p_budget jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare snapshot jsonb;
begin
  if p_budget is not null then
    if jsonb_typeof(p_budget)<>'object' or not p_budget ?& array['minutes','started_at','continued'] or (select count(*) from jsonb_object_keys(p_budget))<>3 or jsonb_typeof(p_budget->'minutes')<>'number' or jsonb_typeof(p_budget->'started_at')<>'string' or jsonb_typeof(p_budget->'continued')<>'boolean' then raise sqlstate '22023'; end if;
    if (p_budget->>'minutes')::integer not between 1 and 240 or (p_budget->>'started_at')::timestamptz is null then raise sqlstate '22023'; end if;
  end if;
  perform public.save_assessment_reply(p_owner,p_subject,p_conversation,p_operation,p_text,p_topic,p_requested_difficulty,p_action,p_question,p_difficulty);
  update public.chat_assessments set budget=p_budget where conversation_id=p_conversation and account_id=p_owner;
  snapshot := public.assessment_snapshot(p_conversation);
  update public.conversation_turns set assessment=snapshot where id=p_operation;
  return snapshot;
end; $$;
revoke all on function public.server_assessment_reply(uuid,uuid,uuid,uuid,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.server_assessment_reply(uuid,uuid,uuid,uuid,text,text,text,text,text,text,jsonb) to service_role;
commit;
notify pgrst, 'reload schema';
