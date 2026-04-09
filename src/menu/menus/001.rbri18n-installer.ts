import { defineMenu } from '@/menu'
import { h } from 'vue'
import IconI18n from '@/components/icon-i18n/icon-i18n.vue'

export default defineMenu(() => {
  return {
    label: 'RBR 汉化安装',
    icon: () => h(IconI18n),
  }
})
