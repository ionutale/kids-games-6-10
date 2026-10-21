<script>
  import { CELL, buildCells } from '$lib/frost-breaker/grid.js';

  /** Small still preview of an ice sculpture rendered on a canvas. */
  let { shapeId, scale = 1, size = 96, coreCount = 3 } = $props();

  let canvas = $state(null);

  $effect(() => {
    if (!canvas) return;
    const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    const px = Math.max(16, Math.round(size));
    canvas.width = px * dpr;
    canvas.height = px * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { cells } = buildCells(shapeId, { scale, coreCount });
    if (cells.length === 0) return;

    // Cell bounds in world space (cells store their center point).
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const cell of cells) {
      minX = Math.min(minX, cell.x - CELL / 2);
      minY = Math.min(minY, cell.y - CELL / 2);
      maxX = Math.max(maxX, cell.x + CELL / 2);
      maxY = Math.max(maxY, cell.y + CELL / 2);
    }

    const margin = px * 0.07;
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const step = Math.min((px - margin * 2) / w, (px - margin * 2) / h);
    const offsetX = (px - w * step) / 2 - minX * step;
    const offsetY = (px - h * step) / 2 - minY * step;

    ctx.clearRect(0, 0, px, px);
    for (const cell of cells) {
      const x = cell.x * step + offsetX - (step * CELL) / 2;
      const y = cell.y * step + offsetY - (step * CELL) / 2;
      if (cell.core) {
        ctx.fillStyle = '#fbbf24';
      } else {
        ctx.fillStyle = cell.shade === 0 ? 'rgba(154, 217, 245, 0.82)' : 'rgba(125, 211, 252, 0.68)';
      }
      const gap = Math.min(2, step * 0.12);
      const s = step * CELL - gap;
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, Math.min(4, s * 0.28));
      ctx.fill();
    }
  });
</script>

<canvas
  bind:this={canvas}
  class="shape-preview"
  style:width="{size}px"
  style:height="{size}px"
  aria-hidden="true"
></canvas>

<style>
  .shape-preview {
    display: block;
    pointer-events: none;
  }
</style>
