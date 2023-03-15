export default controller;
declare const controller: MyAbortConroller;
declare class MyAbortConroller {
    abortControllers: any[];
    timeout: number;
    create(): AbortSignal;
    abort(): void;
    start(min: any): void;
    stop(): void;
}
