import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { log_error } from '@/invoke-apis/file-log.ts'
import { ElMessage } from 'element-plus'
import { validateRbrInstallPathApi } from '@/invoke-apis/rbr-tools.ts'
import { getTauriStore, tauriStoreKey } from '@/utils/tauriStoreUtils.ts'
import { loadingStart } from '@/utils/LoadingUtils.ts'

const useRbrToolsStore = defineStore('rbrTools', () => {
  const rbrInstallPath = ref('')
  const rbrInstallPathValid = ref({
    valid: false,
    message: '请选择 RBR 安装目录',
  })
  watch(
    () => rbrInstallPath.value,
    () => validateRbrInstallPath(),
  )

  let loadPromise: Promise<void> | null

  async function validateRbrInstallPath() {
    const path = rbrInstallPath.value
    await validateRbrInstallPathApi(path).then((v) => {
      if (rbrInstallPath.value !== path) return
      rbrInstallPathValid.value = v
    })
  }

  async function loadRbrInstallPath() {
    const tauriStore = await getTauriStore()
    rbrInstallPath.value = (await tauriStore.get<string>(tauriStoreKey.RBR_INSTALL_PATH)) || ''
    await validateRbrInstallPath()
  }

  function load() {
    if (loadPromise) return
    loadPromise = Promise.resolve()
      .then(async () => {
        const loadingEnd = loadingStart('加载配置...')
        try {
          await loadRbrInstallPath()
        } catch (e: any) {
          const errMsg = e?.message || e?.toString()
          log_error(errMsg)
          ElMessage.error(errMsg)
        } finally {
          loadingEnd()
        }
      })
      .finally(() => {
        loadPromise = null
      })
  }

  async function waitingLoad() {
    await loadPromise
  }

  async function saveRbrInstallPath() {
    const tauriStore = await getTauriStore()
    await tauriStore.set(tauriStoreKey.RBR_INSTALL_PATH, rbrInstallPath.value)
  }

  async function save() {
    const loadingEnd = loadingStart('保存配置...')
    try {
      if (!rbrInstallPathValid.value.valid) {
        ElMessage.error(rbrInstallPathValid.value.message)
        return
      }
      await saveRbrInstallPath()

      ElMessage.success('保存完毕！')
      load()
    } catch (e: any) {
      const errMsg = e?.message || e?.toString()
      log_error(errMsg)
      ElMessage.error(errMsg)
    } finally {
      loadingEnd()
    }
  }

  load()

  return {
    rbrInstallPath,
    rbrInstallPathValid: computed(() => rbrInstallPathValid.value),
    validateRbrInstallPath,
    save,
    load,
    waitingLoad,
  }
})

export default useRbrToolsStore
