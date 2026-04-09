import { defineMenu } from '@/menu'
import { h } from 'vue'
import { Upload } from '@element-plus/icons-vue'

export default defineMenu(() => {
  return {
    label: '检查更新',
    icon: () => h(Upload),
  }
})
