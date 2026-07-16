<template>
  <div
    class="theme-switcher theme-system-resolved-light"
    role="group"
    aria-label="Appearance"
    lang="en"
  >
    <button
      class="theme-option"
      type="button"
      value="light"
      aria-label="Use light theme"
      aria-pressed="false"
      title="Light"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="3.5"></circle>
        <path
          d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"
        ></path>
      </svg>
    </button>
    <button
      class="theme-option"
      type="button"
      value="dark"
      aria-label="Use dark theme"
      aria-pressed="false"
      title="Dark"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M19.2 15.3A8 8 0 0 1 8.7 4.8a8 8 0 1 0 10.5 10.5Z"></path>
      </svg>
    </button>
    <button
      class="theme-option theme-option-system"
      type="button"
      value="system"
      aria-label="Use system theme (currently light)"
      aria-pressed="true"
      title="System (light)"
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.5" y="6.5" width="15" height="10.5" rx="1.5"></rect>
        <path d="M7 20.5h6M10 17v3.5"></path>
        <g class="theme-system-status-light">
          <circle cx="19" cy="5" r="1.8"></circle>
          <path d="M19 1.5v1M19 7.5v1M15.5 5h1M21.5 5h1"></path>
        </g>
        <path
          class="theme-system-status-dark"
          d="M22 6.5a3.2 3.2 0 0 1-4.5-4.3A3.2 3.2 0 1 0 22 6.5Z"
        ></path>
      </svg>
    </button>
  </div>
</template>