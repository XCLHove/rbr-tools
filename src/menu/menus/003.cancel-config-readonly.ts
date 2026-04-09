import { defineMenu } from '@/menu'
import { h } from 'vue'
import IconReadWrite from '@/components/icon-read-write/icon-read-write.vue'

export default defineMenu(() => {
  return {
    label: '取消配置只读',
    icon: () => h(IconReadWrite),
  }
})
