# Map Engine — Benchmark Procedure

Run the app with `?bench` in the URL to enable console logging of FPS and draw calls.

Example: `http://localhost:3000/?bench`

## Scenarios
1. Camera quiet (player idle): record 10 s average FPS and draw calls.
2. Moving fast (WASD sprint): record during traversal.
3. Elevated view (max zoom out / high pitch): record.

## Targets
- 60 FPS sustained.
- < 200 draw calls per frame.

## Logging
Console output: `[bench] fps=.. drawCalls=.. chunks=..` every ~2 s.

## Notes
- Disable HMR for stable measurements: `DISABLE_HMR=true npm run dev`.
- Use Chrome Performance tab for deeper profiling.