export default progressBar;
/**
 * JSDoc style
 */
export type spOptions = {
    frame: string;
    message: string;
    showTimer?: boolean;
};
declare const progressBar: MyProgress;
/**
 * JSDoc style
 * @typedef {object} spOptions
 * @property {string} frame
 * @property {string} message
 * @property {boolean} [showTimer]
 */
declare class MyProgress {
    constructor(opt: any, preset: any);
    bars: any[];
    multimode: boolean;
    progress: number;
    /**
     * @param {spOptions} spOptions
     */
    createSpinner(spOptions: spOptions): Spinner;
    isActive: boolean;
    create(total: any, startValue: any, payload: any): any;
    update(): void;
}
import Spinner from "./spinner.mjs";
