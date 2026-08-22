-- Retira el único alimento de prueba corrupto y sus siete ingestas asociadas.
delete from public.nutrition_ingredient
where btrim(name) = 'mamawebo'
  and calories_per_100 = 3000000000000000000
  and proteins_per_100 = 100000
  and fats_per_100 = 21111111
  and carbohydrates_per_100 = 1111111124;

-- Impide almacenar cantidades imposibles que desborden los cálculos o JavaScript.
alter table public.nutrition_ingredient
  add constraint nutrition_ingredient_calories_range
    check (calories_per_100 between 0 and 1000),
  add constraint nutrition_ingredient_proteins_range
    check (proteins_per_100 between 0 and 100),
  add constraint nutrition_ingredient_fats_range
    check (fats_per_100 between 0 and 100),
  add constraint nutrition_ingredient_carbohydrates_range
    check (carbohydrates_per_100 between 0 and 100),
  add constraint nutrition_ingredient_grams_per_unit_range
    check (grams_per_unit between 0 and 32767);

alter table public.nutrition_intake
  add constraint nutrition_intake_quantity_range
    check (quantity_in_grams between 0 and 100000),
  add constraint nutrition_intake_units_range
    check (units between 0 and 10000);

-- Numeric evita el desbordamiento intermedio; bigint conserva el contrato publicado.
create or replace view public.nutrition_intake_with_totals
with (security_invoker = true)
as
select
  intake.id as intake_id,
  intake.ingredient,
  intake.quantity_in_grams,
  ingredient.name as ingredient_name,
  (
    ingredient.calories_per_100::numeric
      * intake.quantity_in_grams::numeric
      / 100::numeric
  )::bigint as calories,
  ingredient.proteins_per_100
    * intake.quantity_in_grams::double precision
    / 100::double precision as proteins,
  ingredient.fats_per_100
    * intake.quantity_in_grams::double precision
    / 100::double precision as fats,
  ingredient.carbohydrates_per_100
    * intake.quantity_in_grams::double precision
    / 100::double precision as carbohydrates,
  intake.date,
  intake.id_user
from public.nutrition_intake intake
join public.nutrition_ingredient ingredient on intake.ingredient = ingredient.id;

create or replace view public.nutrition_objectives_totals
with (security_invoker = true)
as
select
  sum(intake.calories) as calories,
  sum(intake.proteins) as proteins,
  sum(intake.fats) as fats,
  sum(intake.carbohydrates) as carbohydrates,
  intake.date,
  intake.id_user
from public.nutrition_intake_with_totals intake
group by intake.date, intake.id_user;
