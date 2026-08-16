import { load } from '@tauri-apps/plugin-store'
import { getName } from '@tauri-apps/api/app'

export const tauriStoreKey = {
  RBR_INSTALL_PATH: 'RBR_INSTALL_PATH',
  RBR_TOOLS_DONATION_CODE: 'RBR_TOOLS_DONATION_CODE',
  CLOSE_BEHAVIOR: 'CLOSE_BEHAVIOR',
}

/**关闭程序时的行为：'minimize' 最小化（默认），'exit' 直接退出 */
export const DEFAULT_CLOSE_BEHAVIOR = 'minimize'

let store: ReturnType<typeof load> | null = null

export function getTauriStore() {
  if (!store) {
    store = getName().then((appName) => load(`store/${appName}.bin`))
  }
  return store
}
