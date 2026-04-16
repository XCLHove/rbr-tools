import { invokeWrapper } from '@/utils/invokeWrapper.ts'

export const checkSimRallyCNInstallStatusApi = (rbrInstallPath: string) => {
  return invokeWrapper<string>('check_sim_rally_cn_install_status', {
    rbrInstallPath,
  })
}

export const installSimRallyCNApi = (rbrInstallPath: string, zipFileUrl: string, timeoutSeconds: number = 15) => {
  return invokeWrapper<string>('install_sim_rally_cn', {
    rbrInstallPath,
    zipFileUrl,
    timeoutSeconds,
  })
}
