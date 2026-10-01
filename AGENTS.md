# AGENTS.md

- Schema changes for the published app go in idempotent scripts under `supabase/manual/` that the user runs by hand — the app's client points to a different database than the Cloud migration tool.
- New modules that depend on new tables are loaded with `React.lazy` inside an `ErrorBoundary` and check table existence (PGRST205) first — a missing table must never blank the whole app.
- Database triggers on `servicos_nacional_gas` that touch other modules must swallow their own errors (`exception when others`) — closing an OS must never fail because of a side feature.
- Field operators never touch stock tables directly; they record materials through security-definer RPCs (`registrar_materiais_os`) — stock tables stay admin-only under RLS.
