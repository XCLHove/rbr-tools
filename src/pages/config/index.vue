<script lang="ts" setup>
import { onMounted } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { log_error } from '@/invoke-apis/file-log.ts'
import { ElMessage } from 'element-plus'
import useRbrToolsStore from '@/stores/useRbrToolsStore.ts'
import { storeToRefs } from 'pinia'

const rbrToolsStore = useRbrToolsStore()
const { rbrInstallPath, rbrInstallPathValid } = storeToRefs(rbrToolsStore)

function selectRbrInstallPath() {
  open({
    title: '选择 RBR 安装目录',
    directory: true,
    defaultPath: rbrInstallPath.value,
  })
    .then((path) => {
      rbrInstallPath.value = path || rbrInstallPath.value
    })
    .catch((e) => {
      const errMsg = e?.message || e?.toString()
      log_error(errMsg)
      ElMessage.error(errMsg)
    })
}

onMounted(() => rbrToolsStore.load())
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <el-scrollbar>
      <el-descriptions :column="1" border direction="horizontal" label-width="fit-content">
        <el-descriptions-item label="RBR 安装目录">
          <div class="flex flex-col">
            <div class="flex flex-row">
              <el-input v-model="rbrInstallPath" :rows="1" placeholder="请选择 RBR 安装路径" type="textarea"></el-input>
              <el-button type="primary" @click="selectRbrInstallPath">选择</el-button>
            </div>
            <el-text v-show="!rbrInstallPathValid.valid" class="text-wrap" style="align-self: flex-start" type="danger">
              {{ rbrInstallPathValid.message }}
            </el-text>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-scrollbar>
    <el-button class="mt-1 mb-1" type="primary" @click="rbrToolsStore.save()">保存</el-button>
  </div>
</template>

<style lang="scss" scoped></style>
