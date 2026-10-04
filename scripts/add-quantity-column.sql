-- Pridá stĺpec "quantity" (počet kusov) do tabuľky meal_orders.
-- Spustite raz v Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard -> váš projekt -> SQL Editor),
-- predtým než začnete objednávky s počtom kusov používať.

alter table meal_orders
    add column if not exists quantity integer not null default 1;

alter table meal_orders
    drop constraint if exists meal_orders_quantity_check;

alter table meal_orders
    add constraint meal_orders_quantity_check
        check (quantity >= 1 and quantity <= 10);
