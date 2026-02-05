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
    on(eventName: string, callback: (event: {
      currentSlide?: HTMLElement | null;
      previousSlide?: HTMLElement | null;
      indexh?: number;
      indexv?: number;
      origin?: string;
      data?: {
        currentSlide?: HTMLElement | null;
        previousSlide?: HTMLElement | null;
        indexh?: number;
        indexv?: number;
        origin?: string;
      };
    }) => void): void;
    off(eventName: string, callback: (event: {
      currentSlide?: HTMLElement | null;
      previousSlide?: HTMLElement | null;
      indexh?: number;
      indexv?: number;
      origin?: string;
      data?: {
        currentSlide?: HTMLElement | null;
        previousSlide?: HTMLElement | null;
        indexh?: number;
        indexv?: number;
        origin?: string;
      };
    }) => void): void;
    getCurrentSlide(): HTMLElement | null;
    getIndices?(): { h: number; v?: number; f?: number };
    slide(indexh: number, indexv?: number, indexf?: number): void;
  }

  export default Reveal;
}

declare module 'reveal.js/dist/*.css';
declare module 'reveal.js/dist/theme/*.css';