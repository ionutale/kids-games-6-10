<script>
  import { settings } from '$lib/stores/settings';
  import { t } from '$lib/stores/locale';
  import UiIcon from '$lib/components/UiIcon.svelte';
</script>

<button
  class="icon-btn"
  type="button"
  aria-label={$settings.soundEnabled ? $t('mute') : $t('sound')}
  aria-pressed={$settings.soundEnabled}
  onclick={() => settings.toggleSound()}
>
  <span class="icon-slot"><UiIcon name={$settings.soundEnabled ? 'sound-on' : 'sound-off'} /></span>
</button>

<style>
  .icon-slot {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
  }
</style>
