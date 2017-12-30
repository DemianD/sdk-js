import moxios from 'moxios'

const WAIT_TIME = 0

export function mockResponse(data, meta, warnings, status = 200) {
  // Mock the authentication request
  moxios.wait(() => {
    moxios.requests.mostRecent().respondWith({
      status: 200,
      response: {
        access_token: 'rMOUIcH85oh44KD7RM4XRk7jFPiG8RMLi2IPqFsQ',
        token_type: 'Bearer',
        expires_in: 5400,
      },
    })

    // We assume here that the url used to request access_tokens is the base url
    // minus the `/access_tokens`. This is easier when we test configuration changes.
    const proxy_url = moxios.requests
      .mostRecent()
      .config.url.replace('/access_tokens', '')

    // Mock the proxy call
    moxios.wait(() => {
      moxios.requests.mostRecent().respondWith({
        status: 200,
        response: {
          data: {
            url: proxy_url,
          },
        },
      })

      // Mock the actual request
      moxios.wait(() => {
        moxios.requests.mostRecent().respondWith({
          status,
          response: { data, meta, warnings },
        })
      }, WAIT_TIME)
    }, WAIT_TIME)
  }, WAIT_TIME)
}

export function matchRequest(
  promise,
  fakeData,
  fakeMeta,
  fakeWarnings,
  fakeStatus
) {
  mockResponse(fakeData, fakeMeta, fakeWarnings, fakeStatus)

  return promise.then(() => {
    const {
      data,
      headers,
      method,
      params,
      url,
    } = moxios.requests.mostRecent().config

    return { data, headers, method, params, url }
  })
}
