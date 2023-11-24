import { DataType as LoginomType } from 'builtIn/Data'

export enum OneType {
  Строка = 'Строка',
  Число = 'Число',
  Дата = 'Дата',
  Булево = 'Булево',
}

export interface ITypeMatch {
  log: LoginomType
  oneS: OneType
}

export interface IOneParams {
  ТекстЗапроса: string
  ПараметрыЗапроса: IQueryParams[]
  ПутьКФайлу: string
}

export interface IOneCheckParams {
  ИдентификаторЗадания: string | null
}

export interface IOneResponse {
  Статус: string
  Сообщения: string[]
  КраткоеПредставлениеОшибки: string
  ИдентификаторЗадания?: string
}

export interface IQueryParams {
  Имя: string
  Тип: OneType | LoginomType
  Значение: any
}
