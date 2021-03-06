import {
  applyDecorators,
  withConfig,
  withDefaults,
  withExposedIncludes,
  withIdentityProvider,
  withResources,
  withNetwork,
  withSecretData,
} from './decorators'

import * as exported from './exported'

export default class SkedifyAPI {
  constructor(config) {
    applyDecorators(
      withSecretData(),
      withNetwork(),
      withConfig(config),
      withDefaults(config),
      withIdentityProvider(),
      withResources(this),
      withExposedIncludes()
    )(this)
  }
}

/**
 * Export everything that should be exported
 */
Object.defineProperties(
  SkedifyAPI,
  Object.keys(exported).reduce(
    (acc, key) =>
      Object.assign(acc, {
        [key]: {
          value: exported[key],
        },
      }),
    {}
  )
)
