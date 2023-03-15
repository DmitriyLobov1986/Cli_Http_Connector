export default UtConnector
declare class UtConnector {
  /** @param {import('./utConnector').Options} options параметры */
  constructor({ base, output }: import('./types').Options)
  multibar: {
    multimode: boolean
    createSpinner(
      spOptions: import('../progressBar/index.mjs').spOptions
    ): import('../progressBar/spinner.mjs').default
    isActive: boolean
    create(total: any, startValue: any, payload: any): any
  }
  bar: any
  url: any
  auth: string
  output: string
  /**
   *
   * @param {string} query текст запроса
   * @param {import('./utConnector').qParams} qParams параметры запроса
   */
  getDataToCsv(query: string, qParams: import('./types').qParams): Promise<void>
}
