import { invokeWrapper } from '@/utils/invokeWrapper.ts'

export const checkRBRi18nInstallStatusApi = (rbrInstallPath: string) => {
  return invokeWrapper<string>('check_rbri18n_install_status', {
    rbrInstallPath,
  })
}

export const installRBRi18nApi = (rbrInstallPath: string, zipFileUrl: string, timeoutSeconds: number = 15) => {
  return invokeWrapper<string>('install_rbri18n', {
    rbrInstallPath,
    zipFileUrl,
    timeoutSeconds,
  })
}
