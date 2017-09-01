//@flow
import { type Middleware } from 'redux'
import { of } from 'most'
import { replace, toPairs, chain, o, contains, trim, pipe, identity } from 'ramda'
import Logger from 'mtproto-logger'
const log = Logger`redux-core`

import { of as ofRight } from 'apropos'

import { type State } from './index.h'
// import warning from 'Util/warning'
import { subject } from '../property'

export const tryAddUid = () => (next: (action: any) => any) => (action: mixed) => {
  const send = () => next(action)
  if (typeof action !== 'object' || action == null) return
  if (typeof action.uid === 'string') return send()
  if (typeof action.payload === 'object' && action.payload != null && typeof action.payload.uid === 'string')
    action.uid = action.payload.uid
  return next(action)
}

export const skipEmptyMiddleware = () => (next: *) => (action: *) => {
  if (
    getActionType(action) === 'networker/sent delete'
    && Array.isArray(action.payload)
    && action.payload.length === 0
  ) //TODO Remove hardcode
    log`skip empty`(action.type)
  else
    return next(action)
}

export const debounceMiddleware = ({ dispatch }: *) => (next: *) => {
  const actionStream = subject({ type: '', payload: {}, meta: { debounced: false } })
  actionStream
    .tap(log`action`)
    .map(action => {
      action.meta.debounced = true
      return action
    })
    .concatMap(val => of(val).delay(50))
    .observe(dispatch)
  return (action: *) => {
    if (action.meta && action.meta.debounced)
      return next(action)
    return actionStream.next(action)
  }
}

type ActionObject = {
  type: string,
  payload: mixed,
  meta: {
    debounced: boolean
  },
}
/*::
declare var actionObject: ActionObject
declare var dataArray: Array<any>
const actionArray = { ...actionObject, payload: dataArray }

type ActionArray = typeof actionArray
*/

// type BatchConfig = {[scope: string]: string[]}

const removeTypeIndex = replace(/\[\d+\] /, '')

const getActionType = pipe(
  (e: ActionObject) => e.type || '',
  removeTypeIndex,
  trim
)

// const actionPairs = ([scope, acts]: [string, string[]]): string[] => acts.map(
//   (name: string): string => [scope, name].join('/'))

// const configToActionTypes: (config: BatchConfig) => string[] =
//   //$ FlowIssue
//   o(chain(actionPairs), toPairs)
//
// function ensurePushMap(
//   actionType: string,
//   value: ActionArray,
//   map: Map<string, ActionArray>
// ) {
//   const stored = map.get(actionType)
//   if (stored !== undefined) {
//     stored.payload = stored.payload.concat(value.payload)
//   } else {
//     value.meta.debounced = true
//     map.set(actionType, value)
//   }
// }

// const BATCH_TIMEOUT = 100

// export function batch(config: BatchConfig) {
//   const actions = configToActionTypes(config)
//   const isBatch = (model: string): boolean => contains(model, actions)
//   return ({ dispatch }: *) => (next: *) => {
//     let actionMap: Map<string, ActionArray> | null = null
//     function dispatchAll() {
//       if (actionMap == null) return
//       for (const action of actionMap.values())
//         dispatch(action)
//       actionMap = null
//     }
//     return (action: ActionObject) => {
//       const actionType = getActionType(action)
//       if (isBatch(actionType) && !action.meta.debounced) {
//         if (actionMap == null) {
//           actionMap = new Map
//           setTimeout(dispatchAll, BATCH_TIMEOUT)
//         }
//         if (Array.isArray(action.payload)) {
//           /*::
//           (action: ActionArray)
//           */
//           ensurePushMap(actionType, action, actionMap)
//         }
//       } else {
//         return next(action)
//       }
//     }
//   }
// }




export const normalizeActions =
  <Defaults: { [field: string]: any }>(defaults: Defaults) => () =>
    (next: *) => (action: *) => next({ ...defaults, ...action })
