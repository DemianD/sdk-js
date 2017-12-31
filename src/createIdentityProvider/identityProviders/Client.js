import network from '../../util/network'

import pick from '../../util/pick'
import retry from '../../util/retry'

import { createIdentityProviderError } from '../../util/createError'

import {
  MISCONFIGURED,
  MISCONFIGURED_CLIENT_ID,
  MISCONFIGURED_REALM,
} from '../../constants'

const MAX_ATTEMPTS = 3
const REFETCH_WINDOW = 20
const S_TO_MS = 1000

export default class Client {
  constructor(options = {}) {
    this._options = pick(options, 'client_id', 'realm')

    if (!this._options.client_id) {
      throw createIdentityProviderError(
        'client_id is a required option for `Client`',
        MISCONFIGURED,
        MISCONFIGURED_CLIENT_ID
      )
    }

    if (!this._options.realm) {
      throw createIdentityProviderError(
        'realm is a required option for `Client`',
        MISCONFIGURED,
        MISCONFIGURED_REALM
      )
    }
  }

  getAuthorization(force = false) {
    if (this._current === undefined || force) {
      this._current = retry(
        (resolve, reject) => {
          network
            .post(`${this._options.realm}/access_tokens`, {
              grant_type: 'public_client',
              client_id: this._options.client_id,
            })
            .then(resolve, reject)
        },
        {
          max_attempts: MAX_ATTEMPTS,
        }
      )
        .then(({ data }) => ({
          Authorization: `${data.token_type} ${data.access_token}`,
          Expiration: data.expires_in,
          Realm: this._options.realm,
        }))
        .then(({ Realm, Authorization, Expiration }) =>
          network
            .get(`${Realm}/integrations/proxy`, {
              headers: { Authorization },
            })
            .then(({ data: response }) => ({
              Realm: response.data.url,
              Authorization,
              Expiration,
            }))
        )
        .then(access => {
          setTimeout(
            this.getAuthorization.bind(this, true),
            (access.Expiration - REFETCH_WINDOW) * S_TO_MS
          )
          return access
        })
    }

    return this._current
  }
}
