import { invokeWrapper } from '@/utils/invokeWrapper.ts'

export const validateRbrInstallPathApi = (rbrInstallPath: string) => {
  return invokeWrapper<{
    valid: boolean
    message: string
  }>('validate_rbr_install_path', { rbrInstallPath })
}
