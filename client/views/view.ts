
export abstract class View<TElements, TState> {
    protected elements!: TElements;
    protected viewState!: TState;

    abstract render(): Promise<void>;
    abstract attachDomListeners(): void;
    abstract attachSocketListeners(): void;

    abstract detachDomListeners(): void;
    abstract detachSocketListeners(): void;

    async mount() {
        await this.render();
        this.attachDomListeners();
        this.attachSocketListeners();
    }

    unmount() {
        this.detachDomListeners();
        this.detachSocketListeners();
    }
}