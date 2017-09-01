//@flow

import blueDefer, { type Defer } from 'Util/defer'
import { type DCNumber } from 'Newtype'
import uuid from 'Util/uuid'

export type ApiMethod = {
  method: string,
  params: { [arg: string]: any }
}

export type RequestOptions = {
  dc: DCNumber,
  requestID: string,
  resultType: string,
}


export default class ApiRequest {
  data: ApiMethod
  requestID: UID = uuid()
  uid: UID
  defer: Defer
  deferFinal: Defer
  needAuth: boolean
  options: RequestOptions
  constructor(
    data: ApiMethod,
    options: RequestOptions,
    uid: UID
  ) {
    options.requestID = this.requestID
    this.uid = uid
    this.data = data
    this.options = options
    this.needAuth = !allowNoAuth(data.method)
    Object.defineProperty(this, 'defer', {
      value     : blueDefer(),
      enumerable: false,
      writable  : true,
    })
    Object.defineProperty(this, 'deferFinal', {
      value     : blueDefer(),
      enumerable: false,
      writable  : true,
    })
  }
}

declare var ap: ApiRequest

/*::
const fromUuid = uuid()
type UID = typeof fromUuid
*/

const noAuthMethods = [
  'auth.sendCode',
  'auth.sendCall',
  'auth.checkPhone',
  'auth.signUp',
  'auth.signIn',
  'auth.importAuthorization',
  'help.getConfig',
  'help.getNearestDc',
]

const allowNoAuth = (method: string) =>
  noAuthMethods.indexOf(method) > -1
