<script setup lang="ts">
import logo from "../assets/wbk-logo.svg"

defineProps<{
  imgClass?: string
}>()
</script>

<template>
  <img :src="logo" alt="WBK 2026" :class="imgClass" />
</template>
