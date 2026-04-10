<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getTauriStore, tauriStoreKey } from '@/utils/tauriStoreUtils.ts'
import { loadingStart } from '@/utils/LoadingUtils.ts'
import { ElMessage } from 'element-plus'
import { validateDonationCode } from '@/utils/DonationCodeUtils.ts'
import router from '@/router'
import PageReadme from '@/components/page-readme/page-readme.vue'
import ReadmeUrl from './README.md?url'

const dialogVisible = ref(true)
const donationCode = ref('')

async function validate() {
  const tauriStore = await getTauriStore()
  const code = (await tauriStore.get<string>(tauriStoreKey.RBR_TOOLS_DONATION_CODE)) || donationCode.value
  if (!code) {
    ElMessage.warning('请填写捐赠码！')
    return
  }
  const valid = validateDonationCode(code)
  if (!valid) {
    ElMessage.error('捐赠码无效！')
    return
  }
  await tauriStore.set(tauriStoreKey.RBR_TOOLS_DONATION_CODE, code)
  ElMessage.success(`感谢捐赠，${valid.username}！`)
  dialogVisible.value = false
}

function doValidate() {
  const loadingEnd = loadingStart('校验捐赠码...')
  validate().finally(() => loadingEnd())
}

function beforeClose(_done: () => void) {
  router.replace('/')
}

onMounted(() => {
  doValidate()
})
</script>

<template>
  <el-dialog
    :model-value="dialogVisible"
    title="捐赠"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :before-close="beforeClose"
    draggable
    style="width: 500px"
    center
  >
    <div class="flex flex-col">
      <div class="flex">
        <el-input type="textarea" v-model="donationCode" :rows="1" placeholder="请输入捐赠码"></el-input>
        <el-button type="primary" @click="validate">校验</el-button>
      </div>
      <el-scrollbar>
        <page-readme :url="ReadmeUrl" />
      </el-scrollbar>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
