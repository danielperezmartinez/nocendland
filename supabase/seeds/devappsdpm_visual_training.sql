-- Dataset visual idempotente para el único perfil del entorno de desarrollo.
-- Solo reemplaza ejercicios, horarios y seguimientos identificados por los UUID reservados del seed.

do $$
declare
  target_user_id uuid;
  target_user_count bigint;
  visual_schedule_id bigint;
  alternative_schedule_id bigint;
begin
  select count(distinct e.id_user)
    into target_user_count
    from public.training_exercise e
   where e.portable_id between
     '91000000-0000-4000-8000-000000000001'::uuid and
     '91000000-0000-4000-8000-000000000009'::uuid;

  if target_user_count = 1 then
    select e.id_user
      into target_user_id
      from public.training_exercise e
     where e.portable_id between
       '91000000-0000-4000-8000-000000000001'::uuid and
       '91000000-0000-4000-8000-000000000009'::uuid
     order by e.id_user
     limit 1;
  else
    select count(*)
      into target_user_count
      from public."user";

    if target_user_count <> 1 then
      raise exception 'El dataset visual necesita un único propietario previo o un único perfil; se encontraron % perfiles', target_user_count;
    end if;

    select u.id
      into target_user_id
      from public."user" u
     order by u.created_at, u.id
     limit 1;
  end if;

  insert into public.training_exercise (
    id_user,
    portable_id,
    name,
    description,
    tips,
    video_url,
    training_modalities,
    muscle_groups,
    movement_patterns,
    archived_at,
    updated_at
  )
  values
    (
      target_user_id,
      '91000000-0000-4000-8000-000000000001',
      'UI · Press banca · progreso completo',
      'Caso de referencia con descripción extensa, vídeo, varios recordatorios técnicos y más clasificaciones de las que caben visibles en la card.',
      array['Apoya los pies con firmeza.', 'Mantén las escápulas retraídas.', 'Controla la bajada y evita rebotar.'],
      'https://www.youtube.com/',
      array['strength'],
      array['chest', 'shoulders', 'triceps'],
      array['push'],
      null,
      now()
    ),
    (
      target_user_id,
      '91000000-0000-4000-8000-000000000002',
      'UI · Dominadas · solo repeticiones',
      'Historial sin peso para comprobar la gráfica alternativa de repeticiones y una card con badges resumidos.',
      array['Inicia el tirón llevando los hombros lejos de las orejas.', 'Evita balancearte.'],
      null,
      array['strength'],
      array['back', 'biceps', 'forearms_grip'],
      array['pull'],
      null,
      now()
    ),
    (
      target_user_id,
      '91000000-0000-4000-8000-000000000003',
      'UI · Sentadilla · sesión incompleta',
      'Combina objetivos completos con una sesión actual parcialmente rellenada para revisar campos nulos y ausencia de recomendación.',
      array['Mantén la planta del pie apoyada.', 'Acompaña la dirección de las rodillas con las puntas de los pies.'],
      null,
      array['strength'],
      array['glutes_hips', 'quadriceps', 'hamstrings', 'calves'],
      array['squat'],
      null,
      now()
    ),
    (
      target_user_id,
      '91000000-0000-4000-8000-000000000004',
      'UI · Peso muerto · historial sin métricas',
      'Tiene sesiones guardadas sin series para activar el estado intermedio de la ficha: historial existente pero tendencia todavía no disponible.',
      array['Acerca la barra al cuerpo.'],
      null,
      array['strength'],
      array['full_body', 'back', 'glutes_hips', 'hamstrings'],
      array['hip_hinge', 'loaded_carry'],
      null,
      now()
    ),
    (
      target_user_id,
      '91000000-0000-4000-8000-000000000005',
      'UI · Plancha · ficha sin historial',
      'Ejercicio completamente documentado pero todavía sin seguimientos, para comprobar ceros, guiones y estados vacíos.',
      array['Aprieta glúteos y abdomen.', 'Mantén cuello y espalda alineados.'],
      null,
      array['balance_stability'],
      array['core_abs'],
      array['anti_rotation_core_stability'],
      null,
      now()
    ),
    (
      target_user_id,
      '91000000-0000-4000-8000-000000000006',
      'UI · Paseo del granjero · badges abundantes',
      'Card deliberadamente densa para validar el salto de línea, el límite visible de badges y el indicador de elementos adicionales.',
      array['Camina erguido.', 'No dejes que las cargas golpeen las piernas.', 'Mantén un ritmo uniforme.'],
      null,
      array['strength', 'cardio'],
      array['full_body', 'forearms_grip', 'core_abs'],
      array['loaded_carry', 'locomotion'],
      null,
      now()
    ),
    (
      target_user_id,
      '91000000-0000-4000-8000-000000000007',
      'UI · Movilidad de hombros · cuatro badges',
      'Caso compacto con exactamente cuatro clasificaciones, sin resumen adicional.',
      array['Trabaja siempre dentro de un rango cómodo.'],
      null,
      array['mobility', 'flexibility'],
      array['shoulders'],
      array['rotation'],
      null,
      now()
    ),
    (
      target_user_id,
      '91000000-0000-4000-8000-000000000008',
      'UI · Salto al cajón · potencia',
      'Ejercicio explosivo con taxonomía amplia y seguimiento breve.',
      array['Aterriza con control.', 'Baja caminando en lugar de saltar hacia atrás.'],
      null,
      array['power_plyometrics'],
      array['full_body', 'glutes_hips', 'quadriceps', 'calves'],
      array['squat', 'jump'],
      null,
      now()
    ),
    (
      target_user_id,
      '91000000-0000-4000-8000-000000000009',
      'UI · Ejercicio mínimo · sin clasificar',
      null,
      array[]::text[],
      null,
      array[]::text[],
      array[]::text[],
      array[]::text[],
      null,
      now()
    )
  on conflict (id_user, portable_id) do update
    set name = excluded.name,
        description = excluded.description,
        tips = excluded.tips,
        video_url = excluded.video_url,
        training_modalities = excluded.training_modalities,
        muscle_groups = excluded.muscle_groups,
        movement_patterns = excluded.movement_patterns,
        archived_at = null,
        updated_at = now();

  insert into public.training_schedule (id_user, portable_id, name, is_active, updated_at)
  values
    (target_user_id, '92000000-0000-4000-8000-000000000001', 'QA visual · Todos los casos', false, now()),
    (target_user_id, '92000000-0000-4000-8000-000000000002', 'QA visual · Horario alternativo', false, now())
  on conflict (id_user, portable_id) do update
    set name = excluded.name,
        updated_at = now();

  select s.id into visual_schedule_id
    from public.training_schedule s
   where s.id_user = target_user_id
     and s.portable_id = '92000000-0000-4000-8000-000000000001';

  select s.id into alternative_schedule_id
    from public.training_schedule s
   where s.id_user = target_user_id
     and s.portable_id = '92000000-0000-4000-8000-000000000002';

  delete from public.training_schedule_item i
   where i.id_user = target_user_id
     and i.schedule_id in (visual_schedule_id, alternative_schedule_id);

  insert into public.training_schedule_item (
    id_user,
    schedule_id,
    exercise_id,
    weekday,
    set_count,
    target_repetitions,
    target_weight_kg,
    sort_order,
    updated_at
  )
  select
    target_user_id,
    visual_schedule_id,
    e.id,
    seed.weekday,
    seed.set_count,
    seed.target_repetitions,
    seed.target_weight_kg,
    seed.sort_order,
    now()
  from (values
    ('91000000-0000-4000-8000-000000000007'::uuid, 1::smallint, 2::smallint, 12::smallint, null::numeric, 0),
    ('91000000-0000-4000-8000-000000000009'::uuid, 2::smallint, 1::smallint, null::smallint, null::numeric, 0),
    ('91000000-0000-4000-8000-000000000008'::uuid, 3::smallint, 3::smallint, 6::smallint, null::numeric, 0),
    ('91000000-0000-4000-8000-000000000005'::uuid, 4::smallint, 3::smallint, 45::smallint, null::numeric, 0),
    ('91000000-0000-4000-8000-000000000001'::uuid, extract(isodow from current_date)::smallint, 4::smallint, 8::smallint, 55::numeric, 0),
    ('91000000-0000-4000-8000-000000000002'::uuid, extract(isodow from current_date)::smallint, 3::smallint, 10::smallint, null::numeric, 1),
    ('91000000-0000-4000-8000-000000000003'::uuid, extract(isodow from current_date)::smallint, 4::smallint, 8::smallint, 80::numeric, 2),
    ('91000000-0000-4000-8000-000000000004'::uuid, extract(isodow from current_date)::smallint, 3::smallint, 5::smallint, 100::numeric, 3),
    ('91000000-0000-4000-8000-000000000006'::uuid, extract(isodow from current_date)::smallint, 3::smallint, 30::smallint, 24::numeric, 4),
    ('91000000-0000-4000-8000-000000000008'::uuid, 7::smallint, 4::smallint, 5::smallint, null::numeric, 0)
  ) as seed(portable_id, weekday, set_count, target_repetitions, target_weight_kg, sort_order)
  join public.training_exercise e
    on e.id_user = target_user_id
   and e.portable_id = seed.portable_id;

  insert into public.training_schedule_item (
    id_user, schedule_id, exercise_id, weekday, set_count, target_repetitions, target_weight_kg, sort_order, updated_at
  )
  select target_user_id, alternative_schedule_id, e.id, seed.weekday, seed.set_count,
         seed.target_repetitions, seed.target_weight_kg, seed.sort_order, now()
  from (values
    ('91000000-0000-4000-8000-000000000005'::uuid, 2::smallint, 3::smallint, 45::smallint, null::numeric, 0),
    ('91000000-0000-4000-8000-000000000007'::uuid, 4::smallint, 2::smallint, 12::smallint, null::numeric, 0)
  ) as seed(portable_id, weekday, set_count, target_repetitions, target_weight_kg, sort_order)
  join public.training_exercise e
    on e.id_user = target_user_id
   and e.portable_id = seed.portable_id;

  update public.training_schedule
     set is_active = false,
         updated_at = now()
   where id_user = target_user_id
     and is_active;

  update public.training_schedule
     set is_active = true,
         updated_at = now()
   where id = visual_schedule_id
     and id_user = target_user_id;

  delete from public.training_entry t
   using public.training_exercise e
   where t.id_user = target_user_id
     and t.exercise_id = e.id
     and e.id_user = target_user_id
     and e.portable_id between '91000000-0000-4000-8000-000000000001'::uuid
                           and '91000000-0000-4000-8000-000000000009'::uuid;

  with entry_seed(portable_id, days_ago, sort_order, sets) as (
    values
      ('91000000-0000-4000-8000-000000000001'::uuid, 400, 0, '[[8,35],[8,35],[8,35]]'::jsonb),
      ('91000000-0000-4000-8000-000000000001'::uuid, 240, 0, '[[8,40],[8,40],[8,40]]'::jsonb),
      ('91000000-0000-4000-8000-000000000001'::uuid, 120, 0, '[[8,45],[8,45],[7,45],[6,45]]'::jsonb),
      ('91000000-0000-4000-8000-000000000001'::uuid, 70, 0, '[[8,50],[8,50],[8,50],[7,50]]'::jsonb),
      ('91000000-0000-4000-8000-000000000001'::uuid, 35, 0, '[[8,52.5],[8,52.5],[8,52.5],[8,52.5]]'::jsonb),
      ('91000000-0000-4000-8000-000000000001'::uuid, 21, 0, '[[8,55],[8,55],[8,55],[8,55]]'::jsonb),
      ('91000000-0000-4000-8000-000000000001'::uuid, 14, 0, '[[8,60],[8,60],[8,60],[8,60]]'::jsonb),
      ('91000000-0000-4000-8000-000000000001'::uuid, 7, 0, '[[8,62.5],[8,62.5],[8,62.5],[8,62.5]]'::jsonb),
      ('91000000-0000-4000-8000-000000000001'::uuid, 0, 0, '[[8,65],[8,65],[7,65],[null,null]]'::jsonb),

      ('91000000-0000-4000-8000-000000000002'::uuid, 70, 1, '[[5,null],[4,null],[3,null]]'::jsonb),
      ('91000000-0000-4000-8000-000000000002'::uuid, 35, 1, '[[7,null],[6,null],[5,null]]'::jsonb),
      ('91000000-0000-4000-8000-000000000002'::uuid, 14, 1, '[[8,null],[7,null],[6,null]]'::jsonb),
      ('91000000-0000-4000-8000-000000000002'::uuid, 7, 1, '[[9,null],[8,null],[7,null]]'::jsonb),
      ('91000000-0000-4000-8000-000000000002'::uuid, 0, 1, '[[10,null],[9,null],[8,null]]'::jsonb),

      ('91000000-0000-4000-8000-000000000003'::uuid, 21, 2, '[[8,75],[8,75],[8,75],[8,75]]'::jsonb),
      ('91000000-0000-4000-8000-000000000003'::uuid, 14, 2, '[[8,80],[8,80],[7,80],[6,80]]'::jsonb),
      ('91000000-0000-4000-8000-000000000003'::uuid, 7, 2, '[[8,82.5],[8,82.5],[8,82.5],[7,82.5]]'::jsonb),
      ('91000000-0000-4000-8000-000000000003'::uuid, 0, 2, '[[8,85],[7,85],[null,85],[null,null]]'::jsonb),

      ('91000000-0000-4000-8000-000000000004'::uuid, 14, 3, '[]'::jsonb),
      ('91000000-0000-4000-8000-000000000004'::uuid, 7, 3, '[]'::jsonb),
      ('91000000-0000-4000-8000-000000000004'::uuid, 0, 3, '[]'::jsonb),

      ('91000000-0000-4000-8000-000000000006'::uuid, 14, 4, '[[30,24],[30,24],[30,24]]'::jsonb),
      ('91000000-0000-4000-8000-000000000006'::uuid, 7, 4, '[[32,24],[31,24],[30,24]]'::jsonb),
      ('91000000-0000-4000-8000-000000000006'::uuid, 0, 4, '[[30,26],[30,26],[30,26]]'::jsonb),

      ('91000000-0000-4000-8000-000000000008'::uuid, 14, 5, '[[4,null],[4,null],[4,null],[4,null]]'::jsonb),
      ('91000000-0000-4000-8000-000000000008'::uuid, 0, 5, '[[5,null],[5,null],[5,null],[5,null]]'::jsonb)
  ), inserted_entries as (
    insert into public.training_entry (id_user, exercise_id, performed_on, sort_order, updated_at)
    select target_user_id, e.id, current_date - seed.days_ago, seed.sort_order, now()
      from entry_seed seed
      join public.training_exercise e
        on e.id_user = target_user_id
       and e.portable_id = seed.portable_id
    returning id, exercise_id, performed_on
  )
  insert into public.training_set (id_user, entry_id, position, repetitions, weight_kg, updated_at)
  select
    target_user_id,
    inserted.id,
    set_data.ordinality::smallint,
    (set_data.value ->> 0)::smallint,
    (set_data.value ->> 1)::numeric,
    now()
  from entry_seed seed
  join public.training_exercise e
    on e.id_user = target_user_id
   and e.portable_id = seed.portable_id
  join inserted_entries inserted
    on inserted.exercise_id = e.id
   and inserted.performed_on = current_date - seed.days_ago
  cross join lateral jsonb_array_elements(seed.sets) with ordinality as set_data(value, ordinality);
end
$$;
