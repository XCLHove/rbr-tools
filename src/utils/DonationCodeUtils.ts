import { decode, encode } from 'js-base64'

const prefix = 'rbr-tools'
const suffix = 'donation-code'
const row13Map = new Map<string, string>()
Array.from({ length: 13 }).forEach((_, i) => {
  const lowerStartChar = 'a'
  const lowerCharCode = lowerStartChar.charCodeAt(0) + i
  const lowerChar = String.fromCharCode(lowerCharCode)
  const lowerMapChar = String.fromCharCode(lowerCharCode + 13)
  row13Map.set(lowerChar, lowerMapChar)
  row13Map.set(lowerMapChar, lowerChar)

  const upperStartChar = 'A'
  const upperCharCode = upperStartChar.charCodeAt(0) + i
  const upperChar = String.fromCharCode(upperCharCode)
  const upperMapChar = String.fromCharCode(upperCharCode + 13)
  row13Map.set(upperChar, upperMapChar)
  row13Map.set(upperMapChar, upperChar)
})

export function generateDonationCode(username: string) {
  const textPrefix = `${prefix}:${username}`
  const textSuffix = `${username}:${suffix}`
  const base64Prefix = row13(encode(textPrefix))
  const base64Suffix = row13(encode(textSuffix))
  const text = [base64Prefix, base64Suffix].join(':')
  const base64 = row13(encode(text))
  return base64
}

function row13(str: string) {
  return str
    .split('')
    .map((char) => row13Map.get(char) || char)
    .join('')
}

export function validateDonationCode(code: string) {
  try {
    const text = decode(row13(code))
    const [base64Prefix, base64Suffix] = text.split(':')

    const textPrefix = decode(row13(base64Prefix))
    const [decodePrefix, decodePrefixUsername] = textPrefix.split(':')
    if (decodePrefix !== prefix) return null

    const textSuffix = decode(row13(base64Suffix))
    const [decodeSuffixUsername, decodeSuffix] = textSuffix.split(':')
    if (decodeSuffix !== suffix) return null

    if (decodePrefixUsername !== decodeSuffixUsername) return null

    return {
      username: decodePrefixUsername,
    }
  } catch (_e: any) {
    return null
  }
}
