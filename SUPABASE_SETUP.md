# Configuración de Supabase para Pantcookie App

Para que el sistema de puntuaciones funcione, necesitas configurar tu proyecto de Supabase. Sigue estos pasos:

## 1. Crear el Proyecto
Ve a [Supabase](https://supabase.com/) y crea un nuevo proyecto.

## 2. Obtener Credenciales
Ve a `Project Settings` -> `API`.
Copia la `URL` y la clave `anon` (public).
Pega estos valores en el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

## 3. Crear la Tabla `game_scores`
Ve al `SQL Editor` en Supabase y ejecuta el siguiente script para crear la tabla y configurar las políticas de seguridad (RLS):

```sql
-- Crear la tabla de puntuaciones
CREATE TABLE public.game_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    player_name TEXT NOT NULL,
    game_type TEXT NOT NULL, -- 'puzzle', 'trivia', 'shura_run'
    score INTEGER NOT NULL,
    difficulty TEXT, -- 'easy', 'medium', 'hard', etc.
    metadata JSONB -- Para guardar datos extra como modo de juego, tiempo, etc.
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir que cualquiera (incluso anónimos) pueda INSERTAR puntuaciones
CREATE POLICY "Enable insert for all users" ON public.game_scores
    FOR INSERT WITH CHECK (true);

-- Crear política para permitir que cualquiera pueda LEER puntuaciones
CREATE POLICY "Enable read access for all users" ON public.game_scores
    FOR SELECT USING (true);

-- (Opcional) Índices para mejorar el rendimiento de las consultas
CREATE INDEX idx_game_scores_game_type ON public.game_scores(game_type);
CREATE INDEX idx_game_scores_score ON public.game_scores(score DESC);
```

## 4. Verificar
Una vez ejecutado el script, tu aplicación podrá enviar y recibir puntuaciones automáticamente.
