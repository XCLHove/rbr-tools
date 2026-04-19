<script setup lang="ts">
import { ref } from 'vue'

type AdInfo = {
  id: string
  imageUrl: string
}

const ads = ref<AdInfo[]>([
  {
    id: 'umodel',
    imageUrl: '/assets/ads/umodel.jpg',
  },
  {
    id: 'ad2',
    imageUrl: '',
  },
])
</script>

<template>
  <el-carousel indicator-position="none" arrow="never">
    <el-carousel-item v-for="ad in ads" :key="ad.id">
      <div v-if="ad.imageUrl" class="ad-carousel-item">
        <img :src="ad.imageUrl" :alt="ad.id" />
      </div>
      <div v-else class="ad-carousel-item">
        <el-text>广告位招租</el-text>
      </div>
    </el-carousel-item>
  </el-carousel>
</template>

<style scoped lang="scss">
.ad-carousel-item {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  width: auto;

  img {
    height: 100%;
    object-fit: contain;
  }
}
</style>
