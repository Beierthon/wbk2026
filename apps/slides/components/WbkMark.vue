<script setup lang="ts">
import mark from "../assets/wbk-mark.svg"

defineProps<{
  imgClass?: string
}>()
</script>

<template>
  <img :src="mark" alt="WBK 2026" :class="imgClass" />
</template>
