import { DataType as LogionomType } from 'builtIn/Data'
import { OneType, ITypeMatch } from './one'

interface ITest {
  key1: string
  key2: string
  key3: string
}

const t: ITest = { key1: 'key1', key2: 'key2', key3: 'key3' }

const types: ITypeMatch[] = [
  { log: LogionomType.String, oneS: OneType.Строка },
  { log: LogionomType.Float, oneS: OneType.Число },
  { log: LogionomType.Integer, oneS: OneType.Число },
  { log: LogionomType.Boolean, oneS: OneType.Булево },
  { log: LogionomType.DateTime, oneS: OneType.Дата },
]

const getLogType = (oneType: OneType) => {
  const filter = (e: ITypeMatch) => e.oneS === oneType
  return getType(filter, 'log', LogionomType.String)
}

const getOneStype = (logType: LogionomType) => {
  const filter = (e: ITypeMatch) => e.log === logType
  return getType(filter, 'oneS', OneType.Строка)
}

const getType = (
  filter: (e: ITypeMatch) => boolean,
  ret: 'log' | 'oneS',
  def: LogionomType | OneType
): OneType | LogionomType => {
  const type = types.find(filter)
  return type ? type[ret] : def
}

export { getLogType, getOneStype, t }
