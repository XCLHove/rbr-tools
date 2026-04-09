import { defineMenu } from '@/menu'
import { h } from 'vue'
import { Setting } from '@element-plus/icons-vue'

export default defineMenu(() => {
  return {
    label: 'RBR 汉化配置',
    icon: () => h(Setting),
  }
})
