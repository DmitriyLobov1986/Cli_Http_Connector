declare module 'builtIn/FS' {
  //#region fsApi

  namespace constants {
    COPYFILE_EXCL: number
    COPYFILE_FICLONE: number
    COPYFILE_FICLONE_FORCE: number
    O_RDONLY: number
    O_WRONLY: number
    O_RDWR: number
    O_CREAT: number
    O_EXCL: number
    O_TRUNC: number
    O_APPEND: number
    O_SYNC: number
    S_IFMT: number
    S_IFREG: number
    S_IFDIR: number
    S_IFLNK: number
  }

  type Encoding = 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'latin1' | 'binary'
  // или явное указание номера кодовой страницы однобайтовой кодировки в формате cp<CodePageNumber>, например, cp1252
  // или явное указание номера кодовой страницы iso-8859 в формате "iso-8859-<номер>", например, iso-8859-1
  type OpenMode = number | string
  type Mode = number | string

  class Stats {
    isFile(): boolean
    isDirectory(): boolean
    isSymbolicLink(): boolean

    mode: number
    size: number
    atime: Date
    mtime: Date
    ctime: Date
    birthtime: Date
  }

  class FileHandle {
    valueOf(): number
  }

  class Dirent {
    isFile(): boolean
    isDirectory(): boolean
    isSymbolicLink(): boolean
    name: string
  }

  interface ReadSyncOptions {
    offset?: number
    length?: number
    position?: number | null
  }

  interface WriteFileOptions {
    encoding?: string
    flag?: string
    writeBOM?: boolean
  }

  function appendFileSync(
    file: string | FileHandle,
    data: string | ArrayBuffer | ArrayBufferView,
    options?: WriteFileOptions
  ): void

  function closeSync(fd: FileHandle): void

  function copyFileSync(src: string, dest: string, mode?: number): void

  function existsSync(path: string): boolean

  function fstatSync(fd: FileHandle): Stats

  function ftruncateSync(fd: FileHandle, len?: number | null): void

  function lstatSync(path: string, options?: { throwIfNoEntry?: boolean }): Stats

  function mkdirSync(
    path: string,
    options?: { recursive?: boolean; mode?: Mode } | Mode
  ): void

  function openSync(path: string, flags: OpenMode, mode?: Mode): FileHandle

  function readdirSync(path: string, options?: { withFileTypes?: false }): string[]
  function readdirSync(path: string, options: { withFileTypes: true }): Dirent[]

  function readFileSync(
    path: string | FileHandle,
    options?: { encoding?: null; flag?: string } | null
  ): ArrayBuffer
  function readFileSync(
    path: string | FileHandle,
    options: { encoding: Encoding; flag?: string } | Encoding
  ): string

  function readSync(
    fd: FileHandle,
    buffer: ArrayBuffer | ArrayBufferView,
    offset?: number | null,
    length?: number | null,
    position?: number | null
  ): number
  function readSync(
    fd: FileHandle,
    buffer: ArrayBuffer | ArrayBufferView,
    opts?: ReadSyncOptions
  ): number

  function realpathSync(path: string): string

  function renameSync(oldPath: string, newPath: string): void

  function rmdirSync(path: string, options?: { recursive?: boolean }): void

  function rmSync(path: string, options?: { force?: boolean; recursive?: boolean }): void

  function statSync(path: string, options?: { throwIfNoEntry?: boolean }): Stats

  function truncateSync(path: string, len?: number | null): void

  function unlinkSync(path: string): void

  function writeFileSync(
    path: string | FileHandle,
    data: string | ArrayBuffer | ArrayBufferView,
    options?: WriteFileOptions
  ): void

  function writeSync(
    fd: FileHandle,
    buffer: ArrayBuffer | ArrayBufferView,
    offset?: number | null,
    length?: number | null,
    position?: number | null
  ): number
  function writeSync(
    fd: FileHandle,
    string: string,
    position?: number | null,
    encoding?: Encoding
  ): number
  //#endregion
}
