import AsyncStorage from '@react-native-async-storage/async-storage'
import { KEYS } from '../constants'

export const guardarPIN = (pin: string) => AsyncStorage.setItem(KEYS.PIN, pin)
export const verificarPIN = async (pin: string) => (await AsyncStorage.getItem(KEYS.PIN)) === pin
export const tienePIN = async () => !!(await AsyncStorage.getItem(KEYS.PIN))
export const guardarCarteraActiva = (id: string) => AsyncStorage.setItem(KEYS.CARTERA, id)
export const getCarteraActiva = () => AsyncStorage.getItem(KEYS.CARTERA)
