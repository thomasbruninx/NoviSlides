declare module 'reveal.js' {
  type RevealConfig = {
    embedded?: boolean;
    width?: number;
    height?: number;
    autoSlide?: number;
    transition?: string;
    loop?: boolean;
    controls?: boolean;
    autoSlideStoppable?: boolean;
    progress?: boolean;
    slideNumber?: boolean;
    keyboard?: boolean;
    touch?: boolean;
  };

  class Reveal {
    constructor(container: HTMLElement, config?: RevealConfig);
    initialize(): Promise<void>;
    configure(config: RevealConfig): void;
    sync(): void;
    layout(): void;
    destroy(): void;
  }

  export default Reveal;
}
