//@flow

import { makeError, type MakeError } from 'apropos'
import { fromNullable, Maybe } from 'folktale/maybe'

import { getState } from '../portal'
import {
  type Client,
} from '../index.h'

import {
  type DCNumber,
  type UID,
  toCryptoKey,
  toDCNumber,
} from 'Newtype'
import { KeyStorage } from 'Util/key-storage'


export const resolveRequest = (uid: string, dc: DCNumber, outID: string): Maybe<string> =>
  getClient(uid)
    .map(({ command }) => command)
    .chain(command => command.maybeGetK(outID))
    .map(pair => pair.snd())

export function getClient(uid: string): Maybe<Client> {
  return fromNullable(getState)
    .chain(e => fromNullable(e()))
    .chain(e => fromNullable(e.client))
    .chain(e => fromNullable(e[uid]))
  // const { client } = getState()
  // return fromNullable(client[uid])
}

type KeySelector = (x: Client) => KeyStorage

const keyQuery =
  (selector: KeySelector) =>
    (uid: UID, dc: DCNumber) =>
      getClient(uid)
        .map(selector)
        .chain(fromNullable)
        .chain(keyStorage => keyStorage.getMaybe(dc))
        /*:: .map(toCryptoKey) */

export const queryHomeDc =
  (uid: UID) =>
    getClient(uid)
      .map(client => client.homeDc)
      .chain(fromNullable)
      /*:: .map(toDCNumber) */

export const queryAuthID = keyQuery(client => client.authID)
export const queryAuthKey = keyQuery(client => client.auth)
export const querySalt = keyQuery(client => client.salt)

export const queryKeys = (uid: UID, dc: DCNumber) =>
  fromNullable(dc)
    .chain((
      dc
    ) => queryAuthKey(uid, dc).map(auth => ({ dc, auth })))
    .chain(({
      dc, auth
    }) => queryAuthID(uid, dc).map(authID => ({ dc, auth, authID })))
    .chain(({
      dc, auth, authID
    }) => querySalt(uid, dc).map(salt => ({ uid, dc, auth, authID, salt })))


export const queryAck = (uid: string, dc: DCNumber) =>
  getState().client[uid].pendingAck[dc] || ([]: string[])
