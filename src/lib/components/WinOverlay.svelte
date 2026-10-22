<script>
  import { t } from '$lib/stores/locale';

  // `maxLevel` stays the fallback: callers that only pass it keep the old behavior.
  let {
    result = null,
    level = 1,
    bestStars = 0,
    maxLevel = 50,
    campaignComplete,
    hasNext,
    nextTarget = null,
    onRetry,
    onNext,
    onBack,
  } = $props();

  const campaignDone = $derived(campaignComplete ?? level >= maxLevel);
  const canGoNext = $derived(hasNext ?? level < maxLevel);

  const win = $derived(Boolean(result?.win));
  const showNext = $derived(win && canGoNext && nextTarget !== null);
  const stars = $derived(Number(result?.stars ?? 0));
  const pct = $derived(Number(result?.pct ?? 0));
  const title = $derived(
    win ? (stars >= 3 ? $t('perfect') : stars === 2 ? $t('beautiful') : $t('clearedTitle')) : $t('soClose'),
  );
</script>

{#if result}
  <div class="overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
    <div class="card">
      <div class="kicker">{$t('frostName')}</div>
      <h2 id="result-title">{title}</h2>
      <div class="pct">{pct}%</div>

      {#if win}
        <div class="stars" aria-label={`${stars} / 3`}>
          {#each [1, 2, 3] as n}
            <span class:dim={n > stars}>★</span>
          {/each}
        </div>
        <p class="sub">
          {stars === 1 ? $t('resultOneStar', { stars, pct }) : $t('resultManyStars', { stars, pct })}
        </p>
        <p class="hint">
          {#if campaignDone}
            {$t('lastLevel')}
          {:else if stars < 3}
            {$t('howToStars')}
          {:else}
            {$t('nothingLeft')}
          {/if}
        </p>
        {#if bestStars > stars}
          <p class="best">{$t('best')} {bestStars}★</p>
        {/if}
      {:else}
        <p class="sub">{$t('failSub', { pct })}</p>
        <p class="hint">{$t('aimCores')}</p>
      {/if}

      <div class="actions">
        {#if showNext}
          <button class="btn primary" type="button" onclick={onNext}>
            {$t('playLevel', { n: nextTarget })}
          </button>
          <button class="btn ghost" type="button" onclick={onRetry}>
            {$t('playAgain')} · {$t('level', { n: level })}
          </button>
        {:else if win}
          <button class="btn primary" type="button" onclick={onRetry}>
            {$t('playAgain')} · {$t('level', { n: level })}
          </button>
        {:else}
          <button class="btn primary" type="button" onclick={onRetry}>{$t('retry')}</button>
        {/if}
        <button class="btn ghost" type="button" onclick={onBack}>{$t('back')}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 34px;
    background: rgba(1, 7, 14, 0.64);
    backdrop-filter: blur(7px);
    -webkit-backdrop-filter: blur(7px);
    pointer-events: auto;
  }
  .card {
    width: 540px;
    max-width: 100%;
    padding: 34px 34px 30px;
    border-radius: 30px;
    background: linear-gradient(160deg, rgba(11, 38, 60, 0.98), rgba(5, 20, 34, 0.98));
    border: 1px solid rgba(157, 228, 255, 0.28);
    box-shadow:
      0 28px 80px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    text-align: center;
  }
  .kicker {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2.2px;
    text-transform: uppercase;
    color: #83bdd2;
    margin-bottom: 8px;
  }
  h2 {
    margin: 0 0 12px;
    font-size: 34px;
    letter-spacing: -0.8px;
    line-height: 1.05;
  }
  .pct {
    font-size: 62px;
    font-weight: 900;
    letter-spacing: -3px;
    line-height: 1;
    background: linear-gradient(180deg, #f4fdff, #7dd3fc);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    margin-bottom: 6px;
  }
  .stars {
    display: flex;
    justify-content: center;
    gap: 8px;
    font-size: 46px;
    line-height: 1;
    color: var(--gold);
    text-shadow: 0 0 22px rgba(251, 191, 36, 0.55);
    margin: 6px 0 12px;
  }
  .stars .dim {
    color: rgba(251, 191, 36, 0.18);
    text-shadow: none;
  }
  .sub {
    margin: 0 auto 8px;
    max-width: 420px;
    color: #b8dce9;
    font-size: 15.5px;
    line-height: 1.45;
  }
  .hint {
    margin: 0 auto 18px;
    max-width: 420px;
    color: #8db8cc;
    font-size: 13.5px;
    line-height: 1.45;
  }
  .best {
    margin: -8px 0 16px;
    color: var(--gold);
    font-size: 13px;
    font-weight: 800;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .actions :global(.btn) {
    width: 100%;
    min-height: 56px;
    font-size: 18px;
  }
</style>
