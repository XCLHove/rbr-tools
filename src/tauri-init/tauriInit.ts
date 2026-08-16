import { createTrayMenu } from '@/tray-menu'
import { log_error } from '@/invoke-apis/file-log.ts'
import { getAllWindows } from '@tauri-apps/api/window'
import { getTauriStore, tauriStoreKey, DEFAULT_CLOSE_BEHAVIOR } from '@/utils/tauriStoreUtils.ts'

export function tauriInit() {
  Promise.resolve()
    .then(async () => {
      await createTrayMenu()
      await handleCloseBehavior()
    })
    .catch((e: any) => {
      console.error(e)
      log_error(`tauriInit: ${e?.message || e}`)
    })
}

/**根据配置处理关闭事件：最小化（默认）或直接退出*/
async function handleCloseBehavior() {
  const allWindows = await getAllWindows()
  const mainWindow = allWindows.find((w) => w.label === 'main')
  if (!mainWindow) return
  await mainWindow.onCloseRequested(async (e) => {
    const tauriStore = await getTauriStore()
    const behavior = (await tauriStore.get<string>(tauriStoreKey.CLOSE_BEHAVIOR)) || DEFAULT_CLOSE_BEHAVIOR
    if (behavior === 'exit') return
    e.preventDefault()
    mainWindow.hide()
  })
}
