import { Response } from 'node-fetch-cookies'

interface qParam {
  Имя: String
  Тип: String
  Значение: String | Number | Boolean
}

export interface Options {
  base: string
  output: string
}

export type qParams = Array<qParam>
