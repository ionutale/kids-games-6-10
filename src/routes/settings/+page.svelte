<script>
  import { onMount } from 'svelte';
  import GameShell from '$lib/components/GameShell.svelte';
  import SoundToggle from '$lib/components/SoundToggle.svelte';
  import { t, locale, setLocale, LOCALES } from '$lib/stores/locale';
  import {
    getMusicVolume,
    setMusicVolume,
    getSfxVolume,
    setSfxVolume,
    sfx,
    unlockAudio,
  } from '$lib/frost-breaker/audio.js';

  let musicPct = $state(0);
  let sfxPct = $state(0);

  // Volume getters read persisted values that are not available during SSR.
  onMount(() => {
    musicPct = Math.round(getMusicVolume() * 100);
    sfxPct = Math.round(getSfxVolume() * 100);
  });

  function onMusicInput(event) {
    musicPct = event.currentTarget.valueAsNumber;
    setMusicVolume(musicPct / 100);
  }

  function onSfxInput(event) {
    sfxPct = event.currentTarget.valueAsNumber;
    setSfxVolume(sfxPct / 100);
  }

  function previewSfx() {
    const a = unlockAudio();
    if (!a || a.state === 'running') {
      sfx.tap();
      return;
    }
    a.resume()
      .then(() => sfx.tap())
      .catch(() => {});
  }
</script>

<svelte:head>
  <title>{$t('settings')} · {$t('appTitle')}</title>
</svelte:head>

<GameShell backHref="/" title={$t('settings')} settingsLink={false} soundToggle={false}>
  <div class="settings">
    <section class="card glass row">
      <h2 class="cardtitle">{$t('sound')}</h2>
      <SoundToggle />
    </section>

    <div class="sliders">
      <section class="card glass col">
        <div class="cardhead">
          <span class="cardicon" aria-hidden="true">🎵</span>
          <h2 class="cardtitle">{$t('music')}</h2>
          <output class="pct" aria-live="polite">{musicPct}%</output>
        </div>
        <input
          class="range"
          type="range"
          min="0"
          max="100"
          step="1"
          value={musicPct}
          aria-label={$t('musicVolume')}
          oninput={onMusicInput}
        />
      </section>

      <section class="card glass col">
        <div class="cardhead">
          <span class="cardicon" aria-hidden="true">✨</span>
          <h2 class="cardtitle">{$t('soundEffects')}</h2>
          <output class="pct" aria-live="polite">{sfxPct}%</output>
        </div>
        <input
          class="range"
          type="range"
          min="0"
          max="100"
          step="1"
          value={sfxPct}
          aria-label={$t('sfxVolume')}
          oninput={onSfxInput}
          onchange={previewSfx}
        />
      </section>
    </div>

    <section class="card glass col">
      <div class="cardhead">
        <span class="cardicon" aria-hidden="true">🌐</span>
        <h2 class="cardtitle">{$t('language')}</h2>
      </div>
      <div class="langs">
        {#each LOCALES as l (l.id)}
          <button
            class="lang"
            class:active={$locale === l.id}
            type="button"
            aria-pressed={$locale === l.id}
            onclick={() => setLocale(l.id)}
          >
            {l.label}
          </button>
        {/each}
      </div>
    </section>

    <div class="donewrap">
      <a class="btn primary done" href="/">{$t('done')}</a>
    </div>
  </div>
</GameShell>

<style>
  .settings {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-top: 4px;
  }
  .card {
    padding: 18px 20px;
    border-radius: var(--radius);
  }
  .row {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .col {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cardhead {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .cardicon {
    font-size: 24px;
    line-height: 1;
    filter: drop-shadow(0 0 10px rgba(125, 211, 252, 0.35));
  }
  .cardtitle {
    flex: 1;
    min-width: 0;
    font-size: 18px;
    font-weight: 750;
    letter-spacing: -0.2px;
  }
  .pct {
    font-size: 16px;
    font-weight: 800;
    color: var(--cyan);
    font-variant-numeric: tabular-nums;
    min-width: 48px;
    text-align: right;
  }
  .sliders {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
  @media (max-width: 620px) {
    .sliders {
      grid-template-columns: 1fr;
    }
  }
  .range {
    width: 100%;
    height: var(--touch-min);
    margin: 0;
    accent-color: var(--cyan);
    cursor: pointer;
  }
  .langs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  @media (max-width: 400px) {
    .langs {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .lang {
    min-height: var(--touch-min);
    border-radius: 14px;
    border: 1px solid var(--line);
    background: rgba(6, 24, 40, 0.7);
    color: var(--ink-soft);
    font-size: 14.5px;
    font-weight: 750;
    transition:
      transform 0.12s var(--ease),
      border-color 0.15s ease;
  }
  .lang:active {
    transform: scale(0.96);
  }
  .lang:hover {
    border-color: var(--line-strong);
  }
  .lang.active {
    border-color: var(--cyan);
    color: #04202e;
    background: linear-gradient(180deg, #a8eeff, #5eead4);
    box-shadow: 0 0 18px rgba(125, 211, 252, 0.28);
  }
  .donewrap {
    display: flex;
    justify-content: center;
    padding-top: 4px;
  }
  .done {
    min-width: 180px;
  }
</style>
