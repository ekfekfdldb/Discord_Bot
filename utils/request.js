// utils/request.js
const fetch = require('node-fetch');


/**
* fetchWithTimeout
* @param {string} url - 요청할 URL
* @param {object} options - fetch 옵션 (headers, method 등)
* @param {number} timeoutMs - 타임아웃 시간 (ms)
* @returns {Promise<{ res: Response|null, elapsed: number, errInfo: string }>} 응답, 소요 시간, 에러 정보
*/
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);
options.signal = controller.signal;


let res = null;
let elapsed = 0;
let errInfo = '';
const start = Date.now();


try {
res = await fetch(url, options);
elapsed = Date.now() - start;
} catch (e) {
elapsed = Date.now() - start;
const cause = e.cause || {};
errInfo = [e.name, e.message, cause.code, cause.errno].filter(Boolean).join(' | ');
} finally {
clearTimeout(timeout);
}


return { res, elapsed, errInfo };
}


module.exports = { fetchWithTimeout };