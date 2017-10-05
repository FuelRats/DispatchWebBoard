export function getUrlParam(r) {
  let param = window.location.href.slice(window.location.href.indexOf('?') + 1)
    .split('&')
    .find(e => e.split('=')[0] === r);
  return param === undefined ? null : param.split('=')[1];
  // Can you tell I tried REALLY HARD to make this a one liner?
}