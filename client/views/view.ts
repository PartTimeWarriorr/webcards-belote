
abstract class View<TElements, TState> {
    private elements!: TElements;
    private viewState!: TState;

    abstract render(): void;
    abstract attachDomListeners(): void;
    abstract attachSocketListeners(): void;
}