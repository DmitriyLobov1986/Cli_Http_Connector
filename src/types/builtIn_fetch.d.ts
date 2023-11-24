declare module 'builtIn/Fetch' {
  //#region fetchAPI

  // Представление заголовков запроса и ответа
  interface Headers {
    append(name: string, value: string): void
    delete(name: string): void
    get(name: string): string | null
    has(name: string): boolean
    set(name: string, value: string): void
    forEach(
      callbackfn: (value: string, key: string, parent: Headers) => void,
      thisArg?: any
    ): void
    [Symbol.iterator](): IterableIterator<[string, string]>
    entries(): IterableIterator<[string, string]>
    keys(): IterableIterator<string>
    values(): IterableIterator<string>
  }
  type HeadersInit = Headers | IterableIterator<[string, string]> | Record<string, string>
  declare var Headers: {
    prototype: Headers
    new (init?: HeadersInit): Headers
  }

  // Представление тела запроса/ответа
  interface Body {
    readonly bodyUsed: boolean
    arrayBuffer(): Promise<ArrayBuffer>
    json(): Promise<any>
    text(): Promise<string>
  }

  // Представление запроса
  type RequestInfo = Request | string
  type RequestRedirect = 'error' | 'follow' | 'manual'
  interface Request extends Body {
    readonly headers: Headers
    readonly method: string
    readonly redirect: RequestRedirect
    readonly url: string
    clone(): Request
  }
  type BodyInit = ArrayBufferView | ArrayBuffer | string
  interface RequestInit {
    body?: BodyInit | null
    headers?: HeadersInit
    method?: string
    redirect?: RequestRedirect
  }
  declare var Request: {
    prototype: Request
    new (input: RequestInfo, init?: RequestInit): Request
  }

  // Представление ответа
  interface Response extends Body {
    readonly headers: Headers
    readonly ok: boolean
    readonly redirected: boolean
    readonly status: number
    readonly statusText: string
    readonly url: string
    clone(): Response
  }
  interface ResponseInit {
    headers?: HeadersInit
    status?: number
    statusText?: string
  }
  declare var Response: {
    prototype: Response
    new (body?: BodyInit | null, init?: ResponseInit): Response
    error(): Response
    redirect(url: string, status?: number): Response
  }

  // Функция запроса ресурса сети
  function fetch(url: Request | string, init?: RequestInit): Promise<Response>

  //#endregion
}
