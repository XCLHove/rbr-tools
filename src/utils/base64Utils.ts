import { encode, decode } from 'js-base64'

export function encodeMulti(src: string, times: number = 2) {
  let result = src
  for (let i = 0; i < times; i++) {
    result = encode(result)
  }
  return result
}

export function decodeMulti(src: string, times: number = 2) {
  let result = src
  for (let i = 0; i < times; i++) {
    result = decode(result)
  }
  return result
}
