-- QuickSewa Database Upgrade Schema Migration
-- Run these commands in your Supabase SQL Editor to support the new advanced AI Issue Detection metadata.

alter table complaints add column if not exists confidence integer;
alter table complaints add column if not exists department text;
alter table complaints add column if not exists urgent boolean default false;
alter table complaints add column if not exists estimated_repair text;
alter table complaints add column if not exists secondary_issues text;
