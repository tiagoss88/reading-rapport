-- Adicionar novo valor ao enum app_permission
ALTER TYPE public.app_permission ADD VALUE IF NOT EXISTS 'view_relatorios';