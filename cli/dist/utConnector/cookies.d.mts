export default MyCookieJas;
declare class MyCookieJas {
    /** @param {string} output output file path  */
    constructor(output: string);
    output: string;
    loadCookies(): any;
    saveCookies(): any;
}
