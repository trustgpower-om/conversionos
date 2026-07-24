-- Per-lead Bitrix sync status — agent VIDI ishod sinhronizacije ("nema laznog uspeha").
-- Vrednosti: 'pending' (default), 'synced', 'not_configured', 'failed'.
alter table leads
  add column if not exists bitrix_sync_status text
  default 'pending';
