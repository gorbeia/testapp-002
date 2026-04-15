---
description: Create an operational screen component (counter, kitchen, drinks bar)
---

1. Create the component under `src/components/screens/screen-name/`.

2. Apply the **operational design register** rules:
   - Dark theme: background `#0f1117`, surface `#1a1d27`, border `#2a2d3a`
   - Primary action colour: `#e85d2f` (warm orange)
   - Text primary: `#f8f9fa`, secondary: `#9ca3af`
   - Touch targets: minimum 56×56px on all interactive elements
   - No decorative elements — every pixel must serve a function
   - High information density but immediately scannable

3. Use Tailwind dark theme classes. The operational screens use a dark background by default:

   ```tsx
   <div className="min-h-screen bg-[#0f1117] text-[#f8f9fa]">
   ```

4. **Status colours** for order tickets:
   - RECEIVED: `bg-blue-500` / `#3b82f6`
   - IN_PREPARATION: `bg-amber-500` / `#f59e0b`
   - READY: `bg-green-500` / `#22c55e`
   - CANCELLED: `bg-gray-500` / `#6b7280`

5. **Single-tap actions** — status changes should require exactly one tap:

   ```tsx
   <button className="h-14 w-full rounded-lg bg-[#e85d2f] text-white font-bold text-lg active:scale-95 transition-transform">
     → Start
   </button>
   ```

6. Use **JetBrains Mono** for order numbers and verification codes:

   ```tsx
   <span className="font-mono text-2xl font-bold">#47</span>
   ```

7. For the **drinks counter specifically**:
   - Grid of large product buttons (POS terminal style)
   - One tap = add one unit to current order
   - Running tally at the bottom
   - No navigation away during service
   - Age-restricted products: confirm button becomes "Verify ID & Confirm"

8. For the **KDS (kitchen)** specifically:
   - Three-column Kanban layout on tablets (RECEIVED / IN_PREPARATION / READY)
   - Single column with filter tabs on phones
   - Slow order indicator (⏱ amber) when time > 2× average
   - Order changed alert (🔔 orange banner) when counter edited ticket
   - Preparation instructions accessible via one tap (book icon → full-screen overlay)

9. Connect to real-time updates via SSE:

   ```typescript
   useEffect(() => {
     const eventSource = new EventSource(`/api/txosna/${txosnaId}/events`);
     eventSource.addEventListener('ticket-status-changed', (e) => {
       const data = JSON.parse(e.data);
       // update local state
     });
     return () => eventSource.close();
   }, [txosnaId]);
   ```

10. Add i18n keys to all four locale files. Operational screens should use concise labels — volunteers don't have time to read long text.
