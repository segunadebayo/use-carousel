/// <reference types="react" />
export interface UseCarouselProps {
    /**
     * Start at specific slide number (in controlled mode)
     */
    index?: number;
    /**
     * The initial index of the slide that should be active
     */
    defaultIndex?: number;
    /**
     * If `true`, the carousel will be disabled
     */
    isDisabled?: boolean;
    /**
     * Change slides after a specified interval
     */
    autoPlay?: boolean;
    /**
     * The interval in `ms` to change the slides when `autoPlay` is true
     */
    interval?: number;
    /**
     *  A number of visible slides
     */
    perView?: number;
    /**
     * Stop autoplay on mouseover
     */
    pauseOnHover?: boolean;
    /**
     * Stop autoplay if the user used the arrows
     */
    disableOnInteraction?: boolean;
    /**
     * The most appropriate role for the carousel container
     * depends on the information architecture of the page
     */
    role?: "group" | "region";
    /**
     * The top-level `id` to use for the carousel
     */
    id?: string;
    /**
     * Carousel to loop again after reaching last slide
     */
    loop?: boolean;
    /**
     * direction of the carousel
     */
    direction?: "horizontal" | "vertical";
    /**
     * If `true`, the directions of the carousel
     * updates will be reversed
     */
    isReversed?: boolean;
    /**
     * In event, we don't use a visible label, set an accessible label
     * for the carousel.
     *
     * Note that since the aria-roledescription is set to "carousel",
     * the label does not contain the word "carousel".
     */
    "aria-label"?: string;
    /**
     * Function called when the slide is changed
     */
    onChange?: (index: number) => void;
    /**
     * Function to be called when carousel reaches its beginning (initial position)
     */
    onReachEnd?: () => void;
    /**
     * Function to be called when carousel reach last slide
     */
    onReachStart?: () => void;
    /**
     * A size of the space between slides
     */
    spacing?: string | number;
    /**
     * Ratio to trigger swipe to next/previous slide during long swipes
     * default value: 0.5
     */
    swipeRatio?: number;
    /**
     * Add (in px) additional slide offset in the beginning of the container (before all slides)
     */
    offsetBefore?: number;
    /**
     * Add (in px) additional slide offset in the end of the container (after all slides)
     */
    offsetAfter?: number;
    /**
     * Minimal duration (in ms) to trigger swipe to next/previous slide during swipe
     * default value: 300
     */
    swipeMs?: number;
    /**
     * If disabled, then slider will be animated only when you release it, it will not move while you hold your finger on it
     * default value: True
     */
    followFinger?: boolean;
    /**
     * Allows to set different parameter for different responsive breakpoints (screen sizes
     */
    breakpoints?: {
        [breakpoint: string]: Pick<UseCarouselProps, "spacing" | "perView" | "autoPlay" | "offsetAfter" | "offsetBefore">;
    };
    /**
     * The type of interaction with the thumbnail that will
     * trigger a change in active slide.
     *
     * - `hover`: Hovering the thumbnail will change the active index
     * - `click`: Clicking the thumbnail will change the active active
     *
     * @default "click"
     */
    thumbnail?: {
        interaction?: "hover" | "click";
        orientation?: "horizontal" | "vertical";
    };
    /**
     * Callback fired when user swipes on mobile
     */
    onSwipe?(params: {
        direction: "left" | "right";
        fromIndex: number;
        toIndex: number;
        pageSize: number;
    }): void;
}
/**
 * React hook that implements the Carousel design pattern
 *
 * @see WAI-ARIA https://www.w3.org/TR/wai-aria-practices-1.1/#carousel
 * @see W3.org https://www.w3.org/WAI/tutorials/carousels/
 */
export declare function useCarousel(props?: UseCarouselProps): {
    getRootProps: (props?: Record<string, any>) => {
        onMouseDown: (event: unknown) => void;
        ref: (node: HTMLElement) => void;
        id: string;
        role: "group" | "region";
        "aria-roledescription": string;
        "aria-labelledby": string;
        style: any;
    };
    getLabelProps: (props?: Record<string, any>) => {
        id: string;
    };
    getSlideGroupWrapperProps: (props?: Record<string, any>) => {
        style: any;
    };
    getSlideGroupProps: (props?: Record<string, any>) => {
        children: any;
        ref: (node: HTMLElement) => void;
        onMouseEnter: (event: unknown) => void;
        onMouseLeave: (event: unknown) => void;
        onTransitionEnd: (event: unknown) => void;
        id: string;
        role: string;
        "aria-roledescription": string;
        "aria-atomic": boolean;
        "aria-live": string;
        style: any;
    };
    getSlideProps: (props?: Record<string, any>) => {
        role: string;
        "aria-roledescription": string;
        style: any;
    };
    getNextButtonProps: (props?: Record<string, any>) => {
        "aria-controls": string;
        "aria-label": string;
        onClick: (event: unknown) => void;
        hidden: boolean;
    };
    getPrevButton: (props?: Record<string, any>) => {
        "aria-controls": string;
        "aria-label": string;
        onClick: (event: unknown) => void;
        hidden: boolean;
    };
    getPauseButtonProps: (props?: Record<string, any>) => {
        "aria-label": string;
        onClick: (event: unknown) => void;
    };
    getPaginationProps: (props?: Record<string, any>) => {
        children: import("react").DetailedReactHTMLElement<{
            isSelected: boolean;
            index: number;
            onClick: () => void;
        }, HTMLElement>[];
        pages: number;
        style: {
            textAlign: string;
        };
    };
    getThumbnailGroupProps: (props?: Record<string, any>) => {
        children: any;
        tabIndex: number;
        onKeyDown: (event: unknown) => void;
    };
};
export declare type UseCarouselReturn = ReturnType<typeof useCarousel>;
