-- 1. Tabla de configuración (Umbral del Sensor)
create table configuracion (
  id bigint primary key default 1,
  umbral_gas integer not null default 1500,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insertar configuración inicial
insert into configuracion (id, umbral_gas) 
values (1, 1500) 
on conflict (id) do nothing;

-- 2. Tabla de usuarios (Datos del usuario y WiFi)
create table usuarios (
  id bigint primary key default 1,
  nombre text not null,
  email text not null unique,
  telefono text not null,
  wifi_ssid text not null,
  wifi_password text,
  notif_email boolean not null default true,
  notif_sms boolean not null default false,
  password text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insertar usuario inicial (propietario)
insert into usuarios (id, nombre, email, telefono, wifi_ssid, wifi_password, notif_email, notif_sms, password)
values (1, 'Carlos Mendoza', 'carlos.mendoza@smartsense.io', '+34 612 345 678', 'SmartSense_IoT_2G', 'securepass123', true, false, '123456')
on conflict (id) do nothing;

-- 3. Tabla de registros de eventos de gas
create table gas_eventos (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  valor_gas integer not null,
  alerta boolean not null
);

-- Habilitar Supabase Realtime para la tabla gas_eventos
alter publication supabase_realtime add table gas_eventos;

-- Opcional: Desactivar RLS para pruebas rápidas de lectura/escritura pública
alter table configuracion disable row level security;
alter table usuarios disable row level security;
alter table gas_eventos disable row level security;

-- 4. MIGRACIÓN: Soporte para múltiples usuarios autoincrementables (Ejecutar en SQL Editor)
alter table usuarios alter column id drop default;
create sequence if not exists usuarios_id_seq;
alter table usuarios alter column id set default nextval('usuarios_id_seq');
alter sequence usuarios_id_seq owned by usuarios.id;
-- Ajustar secuencia para que el siguiente ID autogenerado sea 2 (evitando colisión con el ID 1 existente)
select setval('usuarios_id_seq', coalesce((select max(id) from usuarios), 1));

-- ============================================================
-- MIGRACIÓN PARA BASE DE DATOS YA EXISTENTE
-- Ejecutar este bloque en el SQL Editor de Supabase si la tabla
-- 'usuarios' ya existe y necesitas agregar el campo password:
-- ============================================================
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password text;
-- ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email text unique;  -- si aún no existe el unique
-- UPDATE usuarios SET password = '123456' WHERE id = 1 AND (password IS NULL OR password = '');
-- ============================================================
