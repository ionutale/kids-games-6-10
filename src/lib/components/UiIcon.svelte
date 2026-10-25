<script>
  let { name, label = '' } = $props();

  const line = {
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2.4,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  };

  const speaker = 'M4 9.4H7.4L11.6 5.4V18.6L7.4 14.6H4A1.5 1.5 0 0 1 2.5 13.1V10.9A1.5 1.5 0 0 1 4 9.4Z';

  const teeth = [0, 45, 90, 135, 180, 225, 270, 315];
</script>

<svg
  class="ui-icon"
  viewBox="0 0 24 24"
  width="100%"
  height="100%"
  fill="none"
  role={label ? 'img' : undefined}
  aria-label={label ? label : undefined}
  aria-hidden={label ? undefined : 'true'}
  focusable={label ? undefined : 'false'}
>
  {#if name === 'arrow-left'}
    <path {...line} d="M19.5 12H4.5" />
    <path {...line} d="M10.5 6l-6 6 6 6" />
  {:else if name === 'arrow-up'}
    <path {...line} d="M12 19.5V4.5" />
    <path {...line} d="M6 10.5l6-6 6 6" />
  {:else if name === 'arrow-down'}
    <path {...line} d="M12 4.5v15" />
    <path {...line} d="M6 13.5l6 6 6-6" />
  {:else if name === 'arrow-right'}
    <path {...line} d="M4.5 12h15" />
    <path {...line} d="M13.5 6l6 6-6 6" />
  {:else if name === 'play'}
    <path {...line} d="M8.4 5.4v13.2L19 12z" />
  {:else if name === 'lock'}
    <path
      fill="currentColor"
      fill-rule="evenodd"
      d="M6.5 10.5H17.5A2.5 2.5 0 0 1 20 13V18A2.5 2.5 0 0 1 17.5 20.5H6.5A2.5 2.5 0 0 1 4 18V13A2.5 2.5 0 0 1 6.5 10.5ZM10.66 16.54A1.9 1.9 0 1 1 13.34 16.54L14 19.3H10Z"
    />
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      d="M8 10.5V7.8A4 4 0 0 1 16 7.8V10.5"
    />
  {:else if name === 'trophy'}
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      d="M6.5 5.5H4.6A3.6 3.6 0 0 0 8 11"
    />
    <path
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      d="M17.5 5.5H19.4A3.6 3.6 0 0 1 16 11"
    />
    <path fill="currentColor" d="M6.5 3.5H17.5V9.5A5.5 5.5 0 0 1 6.5 9.5Z" />
    <path fill="currentColor" d="M10.6 14.4H13.4V19.6H10.6Z" />
    <path fill="currentColor" d="M7.5 19.6H16.5A1 1 0 0 1 17.5 20.6V21.6H6.5V20.6A1 1 0 0 1 7.5 19.6Z" />
  {:else if name === 'bulb'}
    <path
      fill="currentColor"
      d="M12 3A6 6 0 0 0 8.4 13.8C9 14.3 9.4 15.1 9.5 15.9H14.5C14.6 15.1 15 14.3 15.6 13.8A6 6 0 0 0 12 3Z"
    />
    <path {...line} d="M9.6 17.6h4.8" />
    <path {...line} d="M10.7 20.4h2.6" />
  {:else if name === 'star'}
    <path
      fill="currentColor"
      stroke="currentColor"
      stroke-width="1.4"
      stroke-linejoin="round"
      d="M12 2.4L14.47 8.6L21.13 9.03L15.99 13.3L17.64 19.77L12 16.2L6.36 19.77L8.01 13.3L2.87 9.03L9.53 8.6Z"
    />
  {:else if name === 'settings'}
    <g fill="currentColor">
      {#each teeth as angle (angle)}
        <rect x="10.9" y="1.7" width="2.2" height="5.2" rx="1.1" transform={`rotate(${angle} 12 12)`} />
      {/each}
      <path
        fill-rule="evenodd"
        d="M12 5.4a6.6 6.6 0 1 0 0 13.2 6.6 6.6 0 1 0 0-13.2ZM12 9.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 1 0 0-5.2Z"
      />
    </g>
  {:else if name === 'sound-on'}
    <path fill="currentColor" d={speaker} />
    <path {...line} d="M14.4 9.6A4 4 0 0 1 14.4 14.4" />
    <path {...line} d="M17.2 7.2A7.4 7.4 0 0 1 17.2 16.8" />
  {:else if name === 'sound-off'}
    <path fill="currentColor" d={speaker} />
    <path {...line} d="M14.5 9l6 6" />
    <path {...line} d="M20.5 9l-6 6" />
  {/if}
</svg>

<style>
  .ui-icon {
    display: block;
  }
</style>
