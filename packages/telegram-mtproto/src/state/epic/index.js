//@flow

import { combineEpics } from 'redux-most'
import { Stream, awaitPromises } from 'most'
import { append } from 'ramda'
import { type UID, type DCNumber } from 'Newtype'
import { MAIN, API } from 'Action'
import { Pure, Lift, liftF } from '@safareli/free'
import { resolve, Future, of, after } from 'fluture'
import netRequest, { onNewTask } from './net-request'
import { onTaskEnd, receiveResponse } from './task'
import { getClient } from '../query'
import Auth from '../../service/authorizer'
import type {
  Client
} from '../index.h'
import { dispatch } from '../portal'
import { Identity, KeyValue } from 'Monad'
import { trimType } from '../helpers'
// import Config from 'ConfigProvider'


// const interpret = (act) => ({ action, hasUID }: { action: string[], hasUID: boolean[] }) => ({
//   action: append(act.type, action),
//   hasUID: append(!!act.uid, hasUID),
// })
const Blackhole = {
  //$off
  action(state: {
    ...Client,
    status: KeyValue<DCNumber, boolean>
  }, action: {
    uid: UID,
    type: string,
    payload: mixed
  }) {
    const { homeDc, status } = state
    const statusObj = status.toJSON()
    const type = trimType(action.type)
    console.log(type, state, statusObj)

    if (type === 'api/request new') {
      console.warn(statusObj[homeDc])
      if (!statusObj[homeDc]) {
        Auth(action.uid, state.homeDc).promise()
      } else {
        dispatch(API.TASK.NEW([action.payload.netReq]), action.uid)
      }
    }
    if (type === 'main/auth resolve') {
      dispatch(API.TASK.NEW(state.request.values), action.uid)
    }
  }
}

const onEvent = (action: Stream<any>) => action
  .filter(e => !!e.uid)
  .map(e => after(1500, e).promise())
  .thru(awaitPromises)
  .map(e => getClient(e.uid).map(state => Blackhole.action(state, e)))
  .filter(() => false)

const onAuthResolve = (action: Stream<any>) => action
  .thru(e => MAIN.AUTH.RESOLVE.stream(e))
  .map(e => after(1500, e).promise())
  .thru(awaitPromises)
  // .filter(e => getClient(e.uid)
  //   .map(statusRequest)
  //   .matchWith({
  //     Just   : ({ value }) => value,
  //     Nothing: () => false,
  //   }))
  .tap(e => console.log(e))
  .map(e => getClient(e.uid)
    .map(st => st.request.values)
    .map(vals => dispatch(API.TASK.NEW(vals), e.uid)))
  .filter(() => false)


const onNewRequest = (action: Stream<any>) => action
  .thru(e => API.REQUEST.NEW.stream(e))
  //$off
  // .map(({ uid }: { uid: string }) => uid)
  // .map(getClient)
  // .map((x) => x)
  .map(e => getClient(e.uid)
    .map(st => st.request.values)
    .map(vals => dispatch(API.TASK.NEW(vals), e.uid)))
  .filter(() => false)

// const initialize = (action: Stream<{ type: string, payload: any }>) =>
//   action
//     .thru(MAIN.DC_DETECTED.stream)
//     .map(val => val.payload)
//     // .thru(e => statusGuard(statuses.importStorage, moduleStatus, e))
//     // .map(async(dc): Promise<void> => {
//     //   const set = Config.storage.set
//     //   await set('nearest_dc', dc)
//     //   await set('dc', dc)
//     // })
//     // .thru(awaitPromises)
//     // .delay(1000)
//     .map(() => MAIN.ACTIVATED())

const afterStorageImport = (action: Stream<{ type: string, payload: any }>) => action
  .thru(MAIN.STORAGE_IMPORTED.stream)
  .map(e => e.payload)
  .map(({ home, uid }) => ({ dc: home, uid }))
  .map(MAIN.DC_DETECTED)

// const noAuth = (action: Stream<{ type: string, payload: any }>) => action
//   .thru(MAIN.AUTH_UNREG.stream)
//   .map(val => val.payload)
  // .map((dc) =>
  //   remove(`dc${dc}_auth_key`).then(() => dc))
  // .thru(awaitPromises)
  // .map(dc => dc === queryHomeDc()
  //   ? [
  //     MAIN.MODULE_LOADED(),
  //     NET.STATUS_SET([{
  //       dc,
  //       status: netStatuses.load,
  //     }]),
  //   ]
  //   : [MAIN.MODULE_LOADED()])
  // .chain(from)

// const reactivate = (action: Stream<{ type: string, payload: any }>) =>
//   action
//     .thru(MAIN.DC_CHANGED.stream)
//     // .delay(66)
//     .map(val => val.payload)
//     .map(val => typeof val === 'number'
//       ? val
//       : val.newDC)
//     // .skipRepeats()
//     .map(MAIN.DC_DETECTED)

// const dcRecieved = (action: Stream<{ type: string, payload: any }>) =>
//   action
//     .thru(MAIN.MODULE_LOADED.stream)
  // .thru(e => statusGuard(statuses.importStorage, moduleStatus, e))
  // .map(() => queryInvoke())
  // .map(async(): Promise<number> => {
  //   const opts = {
  //     dc             : DEFAULT_DC,
  //     createNetworker: true
  //   }
  //   const { nearest_dc }: {
  //     nearest_dc: number
  //   } = await invoke('help.getNearestDc', {}, opts)
  //   if (!isFinite(nearest_dc))
  //     return DEFAULT_DC
  //   return nearest_dc
  // })
  // .thru(awaitPromises)
  // .skipRepeats()
  // .recoverWith(() => of(DEFAULT_DC))
  // .map(({ dc }) => MAIN.DC_DETECTED)

// const requestsRecovery = (action: Stream<any>) =>
//   action
//     .thru(MAIN.RECOVERY_MODE.stream)
//     .map(e => e.payload)
//     .delay(3000)
//     .map(async({ halt, recovery, uid }) => {
//       const state = getState()
//       const reqMap = state.request.api
//       reqMap.ids
//         .map(id => reqMap.get(id))
//         .map(({ method, params }) => state.invoke(method, params))
//
//     })

const rootEpic = combineEpics([
  // initialize,
  // noAuth,
  afterStorageImport,
  // reactivate,
  // dcRecieved,
  onNewRequest,
  onAuthResolve,
  netRequest,
  receiveResponse,
  onEvent,
  // afterCarrier,
  onNewTask,
  onTaskEnd,
])

export default rootEpic
