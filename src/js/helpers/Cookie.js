const getCookie = (name) => {
  try {
    const { cookie } = document
    let valueStart = cookie.indexOf(`${name}=`) + 1
    if (valueStart === 0) {
      return null
    }
    valueStart += name.length
    let valueEnd = cookie.indexOf(';', valueStart)
    if (valueEnd === -1) {
      valueEnd = cookie.length
    }
    return decodeURIComponent(cookie.substring(valueStart, valueEnd))
  } catch (error) {
    return null
  }
}

const setCookie = (name, value, expire) => {
  const temp = `${name}=${encodeURIComponent(value)}${(expire === 0 ? '; path=/;' : `; path=/; expires=${(new Date((new Date()).getTime() + expire)).toUTCString()};`)}`
  document.cookie = temp
}

const delCookie = (name) => {
  document.cookie = `${name}=0; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`
}

const canSetCookies = () => {
  setCookie('CookieTest', 'true', 0)
  const can = Boolean(getCookie('CookieTest'))
  delCookie('CookieTest')
  return can
}





export {
  getCookie,
  setCookie,
  delCookie,
  canSetCookies,
}
