/**
 * Создаёт массив фильтров для паралелльных запросов
 * @param {string} query  текст запроса
 * @returns {Array} массив фильтров
 */
export function getQueryChunks(query: string): any[];
/**
 * Форматирует значения полей объекта
 * @param {object} item
 * @returns {object} отформотированный объект
 */
export function customTransform(item: object): object;
/**
 * Получение массива полей запроса
 * @param {string} query текст запроса
 * @returns {Array<string>} массив полей запроса
 */
export function getQueryFields(query: string): Array<string>;
