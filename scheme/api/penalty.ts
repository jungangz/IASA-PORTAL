import commonApi from './commonApi'
import { UID, UserInfo } from '../user'

export type PID = string

export interface PenaltyRequest {
    token: string
    request: {
        type: string
        uid: UID
    }
}

export interface PenaltyResponseOne {
    score: number
    teacher: UserInfo
    info: string
    time: number
    pid: PID
}

export interface Penalty {
    score: number
    history: PenaltyResponseOne[]
}

export interface PenaltyResponse extends commonApi {
    data: Penalty
}
