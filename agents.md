## Codex Usage Window Efficiency

- Prefer bounded reads over unbounded dumps: use `sed -n`, `head`, `tail`, or `ls` with limits, e.g. `sed -n '1,120p' app.js` and `ls -1 src | head -n 20` instead of dumping full files or directories.
- Prefer bounded reads over `cat`, unbounded `find`, and unconstrained `rg`: compare `rg --max-count 20 "TODO" src/` with a broad search before scanning everything.
- Query telemetry in summarized form first: in SQL, select only required columns and add `ORDER BY` + `LIMIT`, e.g. `SELECT user_id, event_count FROM events WHERE event_type='api_call' ORDER BY event_count DESC LIMIT 20;`.
- Use counts and top-N before full rows: `SELECT COUNT(*) FROM events WHERE created_at >= now() - interval '1 day';` and `SELECT event_name, COUNT(*) AS calls FROM telemetry GROUP BY event_name ORDER BY calls DESC LIMIT 10;`.
- Avoid repeated wide scans after small edits: rerun targeted commands on changed scope, e.g. `git diff --name-only | xargs rg --max-count 30 "pattern"`.
- Combine related checks in one pass: `rg -n "error|warn" logs/*.log --max-count 40` then drill into one file only if needed.
- Keep command output small: use `tail -n 40 logs/service.log` and `SELECT ... LIMIT 25` instead of raw log dumps or full-row fetches.
- Reduce token load per turn: request explicit metrics like top-10 spikes, top call classes, or top-10 offenders, e.g. `SELECT query_hash, COUNT(*) AS hits FROM queries GROUP BY 1 ORDER BY hits DESC LIMIT 10;`.
- Keep context tight: report concise summaries (`command`, `result`, `next action`) and avoid repeating full histories unless explicitly requested.
