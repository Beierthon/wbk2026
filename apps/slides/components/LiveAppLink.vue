<script setup lang="ts">
defineProps<{
  href: string
  label?: string
}>()
</script>

<template>
  <div class="live-demo-fallback">
    <a :href="href" target="_blank" rel="noopener noreferrer">
      {{ label ?? "In neuem Tab öffnen" }}
      <span aria-hidden="true">↗</span>
    </a>
  </div>
</template>
