import { defineMenu } from '@/menu'
import { h } from 'vue'
import IconSimRallyCn from '@/components/icon-sim-rally-cn/icon-sim-rally-cn.vue'

export default defineMenu(() => {
  return {
    label: 'SimRallyCN 安装',
    icon: () => h(IconSimRallyCn),
  }
})
