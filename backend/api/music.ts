import express from 'express'
import fetch from 'node-fetch'

import {Permission, token} from "../../scheme/api/auth"
import createResponse from "../createResponse"
import jwt from "jsonwebtoken"
import getSecret from "../util/secret"
import db from "../util/db";


function getMusicInfo(name: string, singer: string) {
    return new Promise(async (resolve, reject) => {
        try {
            let keyword = singer.trim() + ' ' + name.trim()
            const key = getSecret('youtube')
            fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURI(keyword)}&type=video&key=${key}`).then(res => res.json()).then(res => {
                resolve({
                    name: name,
                    singer: singer,
                    yt: res.items[0].id.videoId,
                    thumbnail: res.items[0].snippet.thumbnails.high.url
                })
            })
        } catch (e) {
            reject()
        }
    })
}


const router = express.Router()

router.post('/confirm', async (req, res, next) => {
    try {
        res.send(createResponse(await getMusicInfo(req.body.name, req.body.singer)))
    } catch (e) {
        res.status(500)
        res.send(createResponse(false, '유튜브 API에 오류가 발생했어요. NULL에 문의해주세요.'))
    }
})

router.post('/register', async (req, res, next) => {
    const tomorrow = new Date()
    if (tomorrow.getHours() < 13) {
        res.status(403)
        res.send(createResponse(false, '아직 신청 시간이 되지 않았어요. 13시에 다시 시도하세요!'))
        return
    }
    tomorrow.setDate(tomorrow.getDate() + 1)
    let tomorrowStr = `${tomorrow.getFullYear()}_${tomorrow.getMonth() + 1}_${tomorrow.getDate()}`
    let musicList = (await db.get('music', 'date', tomorrowStr))?.musicList ?? []
    if (musicList.length >= 6) {
        res.status(403)
        res.send(createResponse(false, '아미 신청이 마감되었어요. 내일 다시 시도하세요!'))
        return
    }
    musicList.push({
        name: req.body.name,
        singer: req.body.singer,
        yt: req.body.yt,
        thumbnail: req.body.thumbnail
    })
    if (await db.update('music', 'date', tomorrowStr, {
        date: tomorrowStr,
        musicList: musicList
    })) {
        res.send(createResponse(true))
    } else {
        res.status(500)
        res.send(createResponse(false, 'DB에 연결할 수 없어요. 관리자에게 문의하세요.'))
    }
})

router.get('/today', async (req, res, next) => {
    try {
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        let todayStr = `${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`
        let tomorrowStr = `${tomorrow.getFullYear()}_${tomorrow.getMonth() + 1}_${tomorrow.getDate()}`
        res.send(createResponse({
            today: (await db.get('music', 'date', todayStr))?.musicList ?? [],
            tomorrow: (await db.get('music', 'date', tomorrowStr))?.musicList ?? []
        }))
    } catch (e) {
        res.status(500)
        res.send(createResponse(false, ''))
    }
})

export default router