import { Modal } from "./gui/modal";
export interface ModalMaker {
    makeModal(): Modal;
    docLink: string;
}
export declare type ModalNames = "limitation" | "paste" | "straddling" | "help" | "disconnect" | "editedByOther" | "tooOld";
/**
 * A collection of stock modals.
 */
export declare class StockModals {
    private readonly maker;
    private readonly modals;
    constructor(maker: ModalMaker);
    getModal(name: ModalNames): Modal;
    private make(name);
}
