import { Response } from 'node-fetch'

interface qParam {
  Имя: String
  Тип: String
  Значение: String | Number | Boolean
}

interface Options {
  base: string
  output: string
}

export type qParams = Array<qParam>
