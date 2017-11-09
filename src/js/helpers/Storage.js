import AppConfig from '../config/Config.js';

export const lStore = {
  get: (key) => localStorage.getItem(`${AppConfig.AppNamespace}.${key}`),
  set: (key, value) => localStorage.setItem(`${AppConfig.AppNamespace}.${key}`, value),
  remove: (key) => localStorage.removeItem(`${AppConfig.AppNamespace}.${key}`)
};

export const sStore = {
  get: (key) => sessionStorage.getItem(`${AppConfig.AppNamespace}.${key}`),
  set: (key, value) => sessionStorage.setItem(`${AppConfig.AppNamespace}.${key}`, value),
  remove: (key) => sessionStorage.removeItem(`${AppConfig.AppNamespace}.${key}`)
};