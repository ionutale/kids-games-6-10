<script>
  import { settings } from '$lib/stores/settings';
  import { t } from '$lib/stores/locale';
</script>

<button
  class="icon-btn"
  type="button"
  aria-label={$settings.soundEnabled ? $t('mute') : $t('sound')}
  aria-pressed={$settings.soundEnabled}
  onclick={() => settings.toggleSound()}
>
  {#if $settings.soundEnabled}🔊{:else}🔇{/if}
</button>
