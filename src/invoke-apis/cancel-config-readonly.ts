import { invokeWrapper } from '@/utils/invokeWrapper.ts'

export const getIsEnableAutoCancelConfigReadonlyApi = () => {
  return invokeWrapper<boolean>('get_is_enable_auto_cancel_config_readonly')
}

export const enableAutoCancelConfigReadonlyApi = (rbrInstallPath: string) => {
  return invokeWrapper<void>('enable_auto_cancel_config_readonly', {
    rbrInstallPath,
  })
}

export const disabledAutoCancelConfigReadonlyApi = () => {
  return invokeWrapper<void>('disabled_auto_cancel_readonly')
}

export const getConfigReadonlyApi = (rbrInstallPath: string) => {
  return invokeWrapper<boolean>('get_config_readonly', { rbrInstallPath })
}

export const cancelConfigReadonlyApi = (rbrInstallPath: string) => {
  return invokeWrapper<void>('cancel_config_readonly', { rbrInstallPath })
}
