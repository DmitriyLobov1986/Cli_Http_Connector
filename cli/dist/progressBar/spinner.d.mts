export default Spinner;
declare class Spinner {
    constructor(options: any, { frame, message, showTimer }: {
        frame: any;
        message: any;
        showTimer?: boolean;
    });
    isActive: boolean;
    message: any;
    frame: any;
    index: number;
    start: any;
    showTimer: boolean;
    render(forceRendering?: boolean): void;
    lastDrawnString: string;
    stop(): void;
}
