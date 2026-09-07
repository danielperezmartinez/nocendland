create or replace function nocendland.materialize_finance_period(target_period_id bigint)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  selected_period nocendland.finance_period;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  select * into selected_period
  from nocendland.finance_period
  where id = target_period_id
    and id_user = current_user_id;

  if selected_period.id is null then
    raise exception 'finance_period_not_found';
  end if;

  with recurring_candidates as (
    select
      recurring.id,
      recurring.category_id,
      recurring.goal_id,
      recurring.name,
      recurring.amount,
      recurring.starts_on as recurring_starts_on,
      recurring.ends_on as recurring_ends_on,
      recurring.interval_months,
      generated_month.month_start::date as month_start,
      generated_month.month_start::date + (
        least(
          recurring.due_day::integer,
          extract(day from (generated_month.month_start + interval '1 month - 1 day'))::integer
        ) - 1
      ) as due_on,
      (
        extract(year from generated_month.month_start)::integer * 12
        + extract(month from generated_month.month_start)::integer
        - extract(year from date_trunc('month', recurring.starts_on))::integer * 12
        - extract(month from date_trunc('month', recurring.starts_on))::integer
      ) as month_distance
    from nocendland.finance_recurring_item recurring
    cross join lateral generate_series(
      date_trunc('month', selected_period.starts_on)::date,
      date_trunc('month', selected_period.ends_on)::date,
      interval '1 month'
    ) as generated_month(month_start)
    where recurring.id_user = current_user_id
      and recurring.archived_at is null
      and recurring.starts_on <= selected_period.ends_on
      and (recurring.ends_on is null or recurring.ends_on >= selected_period.starts_on)
  )
  insert into nocendland.finance_movement (
    id_user,
    period_id,
    category_id,
    recurring_item_id,
    goal_id,
    name,
    amount,
    status,
    scheduled_on,
    recurrence_due_on
  )
  select
    current_user_id,
    selected_period.id,
    candidate.category_id,
    candidate.id,
    candidate.goal_id,
    candidate.name,
    candidate.amount,
    'pending',
    candidate.due_on,
    candidate.due_on
  from recurring_candidates candidate
  where candidate.month_distance >= 0
    and mod(candidate.month_distance, candidate.interval_months) = 0
    and candidate.due_on between selected_period.starts_on and selected_period.ends_on
    and candidate.due_on >= candidate.recurring_starts_on
    and (
      candidate.recurring_ends_on is null
      or candidate.due_on <= candidate.recurring_ends_on
    )
  on conflict do nothing;
end;
$$;

revoke execute on function nocendland.materialize_finance_period(bigint) from public, anon;
grant execute on function nocendland.materialize_finance_period(bigint) to authenticated, service_role;
