<script>
  /**
   * Original inline SVG art for Penguin Code.
   * Solid fills and opacity layers only: no emoji, no external assets and no
   * shared definition ids, so any number of instances can safely share a page.
   */
  let { name, label = '' } = $props();

  const hasLabel = $derived(typeof label === 'string' && label.trim() !== '');
</script>

<svg
  class="art"
  viewBox="0 0 64 64"
  width="100%"
  height="100%"
  role={hasLabel ? 'img' : undefined}
  aria-label={hasLabel ? label : undefined}
  aria-hidden={hasLabel ? undefined : 'true'}
  focusable={hasLabel ? undefined : 'false'}
>
  {#if name === 'penguin'}
    <!-- Feet sit behind the body so only the orange toes peek out. -->
    <ellipse cx="26" cy="58" rx="5.5" ry="3" fill="#f59e0b" />
    <ellipse cx="38" cy="58" rx="5.5" ry="3" fill="#f59e0b" />
    <path
      d="M32.5 5.5C40 5.5 47 11.3 47 18.5C47 23.5 44.8 27.8 41.3 30.3C48.3 33.5 52.5 39 52.5 44.5C52.5 51.5 43.5 56.5 32 56.5C20.5 56.5 11.5 51.5 11.5 44.5C11.5 38.5 15.9 33 23.2 29.9C19.9 27.4 18 23.3 18 18.5C18 11.3 25 5.5 32.5 5.5Z"
      fill="#0b1e2d"
      stroke="#7dd3fc"
      stroke-opacity="0.35"
      stroke-width="1.4"
    />
    <ellipse cx="34" cy="43" rx="11.5" ry="12.5" fill="#eaf8ff" />
    <ellipse cx="34" cy="49" rx="9" ry="5" fill="#b8dce9" opacity="0.35" />
    <ellipse cx="36" cy="20.5" rx="8.5" ry="9.5" fill="#eaf8ff" />
    <path
      d="M19.5 33.5C14.5 36.5 12 42.5 13.8 48.6C14.6 51.6 18 51.6 18.5 48.6C19.2 44 20.8 39.5 24 36.2Z"
      fill="#153f5a"
      stroke="#7dd3fc"
      stroke-opacity="0.3"
      stroke-width="1"
    />
    <path d="M43.6 18.6C49.2 17.2 54.6 20.2 56.4 23C53.8 25.6 48.8 26.6 43.6 25.4Z" fill="#fbbf24" />
    <path
      d="M44.2 23C48.5 23.4 52.6 23 55.5 22.2"
      fill="none"
      stroke="#d97706"
      stroke-linecap="round"
      stroke-opacity="0.8"
      stroke-width="1.1"
    />
    <circle cx="39" cy="19.5" r="2.4" fill="#04202e" />
    <circle cx="39.8" cy="18.7" r="0.8" fill="#eaf8ff" />
    <path
      d="M26.5 12.5C29 9 32.5 8 35.5 8.5"
      fill="none"
      stroke="#b8dce9"
      stroke-linecap="round"
      stroke-opacity="0.4"
      stroke-width="2"
    />
  {:else if name === 'fish'}
    <path
      d="M14 33L3.5 21.5L6.5 33L3.5 44.5Z"
      fill="#7dd3fc"
      stroke="#7dd3fc"
      stroke-linejoin="round"
      stroke-width="2"
    />
    <path d="M24 22C27.5 13.5 35 12.5 40 17.5C35.5 18.5 30.5 20.5 27.5 24Z" fill="#7dd3fc" />
    <path d="M24 44C27.5 51 34.5 51.5 38.5 47C34 46 30 44.5 27 42Z" fill="#7dd3fc" opacity="0.9" />
    <ellipse
      cx="30"
      cy="33"
      rx="17"
      ry="12"
      fill="#5eead4"
      stroke="#04202e"
      stroke-opacity="0.28"
      stroke-width="1.2"
    />
    <ellipse cx="30" cy="37.5" rx="12" ry="5.5" fill="#a7f3e4" opacity="0.5" />
    <path
      d="M33.5 26.5C32.5 29.5 32.5 32 33.5 35"
      fill="none"
      stroke="#0a2a44"
      stroke-linecap="round"
      stroke-opacity="0.22"
      stroke-width="1.4"
    />
    <path
      d="M43 35C44.5 35.2 45.5 35.8 46 36.5"
      fill="none"
      stroke="#0a2a44"
      stroke-linecap="round"
      stroke-opacity="0.35"
      stroke-width="1.4"
    />
    <circle cx="25" cy="31" r="1.1" fill="#eaf8ff" opacity="0.45" />
    <circle cx="29" cy="36" r="0.9" fill="#eaf8ff" opacity="0.35" />
    <circle cx="38" cy="30" r="2.4" fill="#04202e" />
    <circle cx="38.9" cy="29.2" r="0.75" fill="#eaf8ff" />
  {:else if name === 'igloo'}
    <rect x="5" y="45" width="54" height="4.5" rx="2.25" fill="#b8dce9" opacity="0.85" />
    <path d="M8 46C8 27.5 18.5 15.5 32 15.5C45.5 15.5 56 27.5 56 46Z" fill="#eaf8ff" />
    <path d="M8 46C8 39 9.5 32.8 12.8 28C13.8 33.5 15.2 39.8 17.6 46Z" fill="#b8dce9" opacity="0.45" />
    <g fill="none" stroke="#8fb9cb" stroke-linecap="round" stroke-opacity="0.75" stroke-width="1.3">
      <path d="M15 31C23 28.5 41 28.5 49 31" />
      <path d="M10.5 39.5C20 36.5 44 36.5 53.5 39.5" />
      <path d="M23 29.8C22.8 32.5 22.8 35.6 23 38.2" />
      <path d="M41 29.8C41.2 32.5 41.2 35.6 41 38.2" />
      <path d="M15.5 39C16 42.5 16.2 44.5 16.4 46" />
      <path d="M48.5 39C48 42.5 47.8 44.5 47.6 46" />
    </g>
    <path d="M25 46L25 38C25 34 28 31.5 32 31.5C36 31.5 39 34 39 38L39 46Z" fill="#071c2c" />
    <path
      d="M19 27.5C22 21 26.5 18 32 17"
      fill="none"
      stroke="#7dd3fc"
      stroke-linecap="round"
      stroke-opacity="0.35"
      stroke-width="2.4"
    />
  {:else if name === 'ice'}
    <path d="M32 7L55 20L32 33L9 20Z" fill="#eaf8ff" />
    <path d="M9 20L32 33L32 57L9 44Z" fill="#7dd3fc" />
    <path d="M55 20L32 33L32 57L55 44Z" fill="#b8dce9" />
    <g fill="none" stroke="#04202e" stroke-opacity="0.16" stroke-linejoin="round" stroke-width="1.1">
      <path d="M32 7L55 20L32 33L9 20Z" />
      <path d="M9 20L32 33L32 57L9 44Z" />
      <path d="M55 20L32 33L32 57L55 44Z" />
    </g>
    <path
      d="M32 13.5L43.5 20L32 26.5L20.5 20Z"
      fill="none"
      stroke="#7dd3fc"
      stroke-linejoin="round"
      stroke-opacity="0.5"
      stroke-width="1.2"
    />
    <path
      d="M14 33.5L26 40"
      fill="none"
      stroke="#eaf8ff"
      stroke-linecap="round"
      stroke-opacity="0.6"
      stroke-width="1.2"
    />
    <path
      d="M38 40L50 33.5"
      fill="none"
      stroke="#eaf8ff"
      stroke-linecap="round"
      stroke-opacity="0.45"
      stroke-width="1.2"
    />
  {:else if name === 'water'}
    <rect
      x="4"
      y="18"
      width="56"
      height="40"
      rx="16"
      fill="#0a2a44"
      stroke="#7dd3fc"
      stroke-opacity="0.35"
      stroke-width="1.2"
    />
    <path
      d="M11 35C14.5 29.5 20 29.5 23.5 35C27 40.5 32.5 40.5 36 35C39.5 29.5 45 29.5 48.5 35"
      fill="none"
      stroke="#7dd3fc"
      stroke-linecap="round"
      stroke-width="3.6"
    />
    <path
      d="M16 46C19 42 23 42 26 46C29 50 33 50 36 46C39 42 43 42 46 46"
      fill="none"
      stroke="#b8dce9"
      stroke-linecap="round"
      stroke-opacity="0.55"
      stroke-width="3"
    />
  {:else if name === 'star'}
    <path
      d="M32 8L37.76 24.07L54.83 24.58L41.32 35.03L46.11 51.42L32 41.8L17.89 51.42L22.68 35.03L9.17 24.58L26.24 24.07Z"
      fill="#fbbf24"
      stroke="#f59e0b"
      stroke-opacity="0.5"
      stroke-linejoin="round"
      stroke-width="1.2"
    />
    <path
      d="M11.2 25.4L32 10.4L52.8 25.4"
      fill="none"
      stroke="#fde68a"
      stroke-linejoin="round"
      stroke-linecap="round"
      stroke-opacity="0.65"
      stroke-width="1.8"
    />
  {/if}
</svg>

<style>
  .art {
    display: block;
  }
</style>
