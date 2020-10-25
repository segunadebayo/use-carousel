import usePrevious from "@rooks/use-previous";
import { useId } from "@reach/auto-id";
import { useRect } from "@reach/rect";
import useWindowSize from "@rooks/use-window-size";
import {
  Children,
  cloneElement,
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import MultiRef from "react-multi-ref";
import { EventData, useSwipeable } from "react-swipeable";
import { document } from "ssr-window";
import {
  useUpdateEffect,
  useMountedEffect,
  callAllHandlers,
  mergeRefs,
  useControllable
} from "./utils";
import useEventListener from "@react-hook/event";
import useInterval from "@rooks/use-interval";
import useLatest from "use-latest";

type Dict = Record<string, any>;

type BreakpointProps = Pick<
  UseCarouselProps,
  "spacing" | "perView" | "autoPlay" | "offsetAfter" | "offsetBefore"
>;

interface UseBreakpointsProps extends Required<BreakpointProps> {
  breakpoints?: UseCarouselProps["breakpoints"];
}

/**
 * React hook to auto-calculate the slides per view, spacing,
 * and autoplay based on the window width.
 */
function useBreakpoints(props: UseBreakpointsProps) {
  const { breakpoints, ...initialProps } = props;

  const { innerWidth: windowWidth } = useWindowSize();

  const breakPointsRef = useRef<Required<BreakpointProps>>(initialProps);

  if (!breakpoints) {
    return breakPointsRef.current;
  }

  const sortedBreakpoints = Object.keys(breakpoints).sort();

  for (const bp of sortedBreakpoints) {
    if (windowWidth && windowWidth < Number(bp)) {
      breakPointsRef.current = {
        perView: breakpoints[bp].perView || initialProps.perView,
        spacing: breakpoints[bp].spacing ?? initialProps.spacing,
        autoPlay: breakpoints[bp].autoPlay ?? initialProps.autoPlay,
        offsetAfter: breakpoints[bp].offsetAfter ?? initialProps.offsetAfter,
        offsetBefore: breakpoints[bp].offsetBefore ?? initialProps.offsetBefore
      };
      break;
    }
    breakPointsRef.current = initialProps;
  }

  return breakPointsRef.current;
}

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
    [breakpoint: string]: Pick<
      UseCarouselProps,
      "spacing" | "perView" | "autoPlay" | "offsetAfter" | "offsetBefore"
    >;
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

enum AutoplayStatus {
  /**
   * The carousel is completely idle, and no tick is happening
   */
  IDLE = "idle",
  /**
   * The carousel has been changed, and `setInterval` clock is ticking
   */
  TICKING = "tiking",
  /**
   * The carousel is changing slides
   */
  MOVING = "moving",
  /**
   * The carousel was paused, and timeout was cleared
   */
  PAUSED = "paused"
}

/**
 * React hook that implements the Carousel design pattern
 *
 * @see WAI-ARIA https://www.w3.org/TR/wai-aria-practices-1.1/#carousel
 * @see W3.org https://www.w3.org/WAI/tutorials/carousels/
 */
export function useCarousel(props: UseCarouselProps = {}) {
  const {
    id: idProp,
    index: indexProp,
    defaultIndex,
    onChange,
    interval = 3000,
    autoPlay = false,
    onReachEnd,
    pauseOnHover,
    disableOnInteraction = false,
    loop = false,
    role = "region",
    perView: initialPerView = 1,
    spacing: initialSpacing = 0,
    breakpoints,
    thumbnail,
    offsetAfter = 0,
    offsetBefore = 0,
    onSwipe
  } = props;

  /**
   * The status of the carousel, particularly useful for the `auto-play`
   */
  const [status, setStatus] = useState<AutoplayStatus>(AutoplayStatus.IDLE);
  const isTicking = status === AutoplayStatus.TICKING;

  /**
   * When autoplay is active, we use this ref to keep record when we hover
   * on any slide or the slide group
   */
  const isHoveringRef = useRef(false);

  /**
   * Refs for the slides and slide group
   */
  const [slidesRef] = useState(() => new MultiRef<number, HTMLElement>());
  const groupRef = useRef<HTMLElement>();

  const [isFakeSlide, setFakeSlide] = useState(false);

  /**
   * Issue: When the component mounts and there is fake slides (perView === 1),
   * there's a quick transition to the slide 1 when the component mounts.
   *
   * We need to stop that transition from happening, just for the mount phase. Afterward,
   * we let the hook do it's thing.
   */
  const TRANSITION_DURATION = "300ms";

  const transitionDurationRef = useRef("0ms");
  useMountedEffect(() => {
    transitionDurationRef.current = TRANSITION_DURATION;
  });

  /**
   * Allow for controlled and uncontrolled usage of the carousel
   */
  const [index, setIndex] = useControllable({
    value: indexProp,
    defaultValue: defaultIndex || 0,
    onChange
  });

  /**
   * Compute the slides per view and spacing between the slides
   * based on the breakpoint
   */
  const {
    perView,
    spacing,
    autoPlay: autoPlayProp,
    offsetBefore: offsetBeforeProp,
    offsetAfter: offsetAfterProp
  } = useBreakpoints({
    perView: initialPerView,
    spacing: parseInt(initialSpacing.toString()),
    autoPlay,
    breakpoints,
    offsetAfter,
    offsetBefore
  });

  /**
   * Set number of pages and update it on slides number change
   */
  const [pages, setPages] = useState(
    Math.ceil(slidesRef.map.size / Math.floor(perView))
  );

  /**
   * Update `pages` local state when perView changes due to breakpoint
   */
  useUpdateEffect(() => {
    setPages(Math.ceil(slidesRef.map.size / Math.floor(perView)));
  }, [slidesRef.map.size]);

  /**
   * Keep a reference to the preview `perView` (slides per view)
   * so we can
   */
  const prevPerView = usePrevious(Math.floor(perView));

  useUpdateEffect(() => {
    const newPages = Math.ceil(slidesRef.map.size / Math.floor(perView));

    switch (index) {
      case 0:
        break;

      case pages - 1:
        setIndex(newPages - 1);
        break;

      default:
        const firstSlideIndex = index * prevPerView + 1;
        setIndex(Math.ceil(firstSlideIndex / perView) - 1);
    }
    setPages(newPages);
  }, [perView]);

  const hasFakeSlides = useMemo(() => loop && perView === 1, [loop, perView]);

  /**
   * This measures the rect of the slideGroup.
   *
   * We'll use it to dynamically add `width` to each slide
   * based on the `breakpoints` prop.
   *
   * By default we assume it's 1 slide per view, and spacing of `0`
   */
  const rect = useRect(groupRef, true);

  const slideWidth =
    ((rect?.width ?? 0) - (perView - 1) * parseFloat(spacing.toString())) /
    perView;

  /**
   * Compute the `translateX` value for the carousel. This is really the
   * carousel effect
   */
  const getTranslateX = () => {
    /**
     * In some scenarios, we want to show a partial slide so
     * users can know that it's a carousel.
     *
     * For this, you can pass decimal values for `perView` (e.g 2.25)
     * and we need to check this.
     */
    const hasPartialSlide = perView - Math.floor(perView);
    const spacingValue = parseFloat(spacing.toString());

    const rectWidth = hasPartialSlide
      ? Math.floor(perView) * (slideWidth + spacingValue) - spacingValue
      : rect?.width ?? 0;

    if (perView === 1) {
      if (hasFakeSlides) {
        return index * rectWidth + rectWidth;
      }
      return index * rectWidth;
    }

    if (index === pages - 1) {
      return (slidesRef.map.size - perView) * (spacingValue + slideWidth);
    }
    return index * (rectWidth + spacingValue);
  };

  const translateX = getTranslateX();

  /**
   * Think of this as a way to ensure the identity of
   * `onReachEnd` remains the same. It helps us avoid re-running
   * the `useEffect` below unnecessarily.
   */
  const savedOnReachEnd = useLatest(onReachEnd);

  useUpdateEffect(() => {
    if (index === slidesRef.map.size - 1) {
      savedOnReachEnd.current?.();
    }
  }, [savedOnReachEnd, index, slidesRef.map.size]);

  /**
   * Id generation for the carousel parts
   */
  const id = useId(idProp);
  const rootId = `carousel-${id}`;
  const labelId = `carousel-${id}-label`;
  const slideGroupId = `carousel-${id}-slide-group`;

  /**
   * The core fns for going to the next or prev slide
   */
  const increment = () => {
    const nextIndex = index + 1;

    // to avoid going to wrong index if we have fake slide
    if (nextIndex > pages) return;

    if (!hasFakeSlides && nextIndex === pages) {
      return;
    }
    setIndex(nextIndex);
  };

  const decrement = () => {
    const prevIndex = index - 1;

    if (!hasFakeSlides && prevIndex < 0) {
      return;
    }
    setIndex(prevIndex);
  };

  /**
   * The core fns for the `next` and `prev` buttons
   */
  const onNextClick = (event: MouseEvent) => {
    event.preventDefault();
    increment();

    // stop the autoplay
    if (autoPlayProp && disableOnInteraction) {
      stopAutoPlay();
    }
  };

  const onPrevClick = (event: MouseEvent) => {
    event.preventDefault();
    decrement();

    // stop the autoplay
    if (autoPlayProp && disableOnInteraction) {
      stopAutoPlay();
    }
  };

  const startAutoPlay = useCallback(() => {
    if (!autoPlayProp || status === AutoplayStatus.TICKING) {
      return;
    }
    setStatus(AutoplayStatus.TICKING);
  }, [autoPlayProp, status]);

  const stopAutoPlay = useCallback(() => {
    if (!autoPlayProp || status !== AutoplayStatus.TICKING) {
      return;
    }
    setStatus(AutoplayStatus.IDLE);
  }, [autoPlayProp, status]);

  const pauseAutoPlay = useCallback(() => {
    if (!autoPlayProp || status === AutoplayStatus.PAUSED) {
      return;
    }
    setStatus(AutoplayStatus.PAUSED);
  }, [autoPlayProp, status]);

  const onMouseEnter = () => {
    isHoveringRef.current = true;
    if (pauseOnHover && status === AutoplayStatus.TICKING) {
      pauseAutoPlay();
    }
  };

  const onMouseLeave = () => {
    isHoveringRef.current = false;
    if (pauseOnHover && status === AutoplayStatus.PAUSED) {
      startAutoPlay();
    }
  };

  useInterval(
    increment,
    interval,
    autoPlayProp ? status !== AutoplayStatus.TICKING : true
  );

  useEffect(() => {
    if (autoPlayProp) {
      startAutoPlay();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlayProp]);

  /**
   *
   * The core fns for swiping with mouse or finger on mobile
   */

  const [tempTranslateX, setTempTranslateX] = useState(0);

  const handleSwiping = (e: EventData) => {
    if (e.dir === "Left") {
      setTempTranslateX(translateX + e.absX);
    }
    if (e.dir === "Right") {
      setTempTranslateX(translateX - e.absX);
    }

    if (disableOnInteraction && status === AutoplayStatus.TICKING) {
      pauseAutoPlay();
    }
  };

  const swipeLeft = (e: EventData) => {
    setTempTranslateX(0);

    if (e.velocity > 1 || e.absX > slideWidth / 2) {
      increment();
    }
    if (status === AutoplayStatus.PAUSED) {
      startAutoPlay();
    }

    let toIndex = index + 1;
    if (toIndex > pages) toIndex = pages;

    onSwipe?.({
      direction: "left",
      fromIndex: index,
      toIndex,
      pageSize: pages
    });
  };

  const swipeRight = (e: EventData) => {
    setTempTranslateX(0);
    if (e.velocity > 1 || e.absX > slideWidth / 2) {
      decrement();
    }
    if (status === AutoplayStatus.PAUSED) {
      startAutoPlay();
    }

    let toIndex = index - 1;
    if (toIndex < 0) toIndex = index;

    onSwipe?.({
      direction: "right",
      fromIndex: index,
      toIndex,
      pageSize: pages
    });
  };

  const swipeableProps = useSwipeable({
    onSwiping: handleSwiping,
    onSwipedLeft: swipeLeft,
    onSwipedRight: swipeRight
  });

  /**
   * When the page this carousel component is rendered isn't active or is minimized,
   * we want to turn off the autoplay, to avoid unnecessary memory usage.
   *
   * @see API https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState
   */
  const onVisibilityChange = () => {
    if (
      document.visibilityState === "hidden" &&
      status === AutoplayStatus.TICKING
    ) {
      pauseAutoPlay();
    }

    if (
      document.visibilityState === "visible" &&
      status === AutoplayStatus.PAUSED
    ) {
      startAutoPlay();
      setStatus(AutoplayStatus.TICKING);
    }
  };

  useUpdateEffect(() => {
    const isFakeSlideIndex = index === 0 || index === pages - 1;
    if (isFakeSlide && isFakeSlideIndex) {
      transitionDurationRef.current = TRANSITION_DURATION;
      setFakeSlide(false);
    }
  }, [index, isFakeSlide]);

  useEventListener(window.document, "visibilitychange", onVisibilityChange);

  const onFakeSlideTransitionEnd = () => {
    if (!hasFakeSlides) return;

    if (index < 0) {
      setFakeSlide(true);
      transitionDurationRef.current = "0ms";
      setIndex(pages - 1);
    }

    if (index === pages) {
      setFakeSlide(true);
      transitionDurationRef.current = "0ms";
      setIndex(0);
    }
  };

  const thumbnailOptions = {
    interaction: "click",
    orientation: "horizontal",
    ...thumbnail
  };

  return {
    getRootProps: (props: Dict = {}) => ({
      ...props,
      onMouseDown: callAllHandlers(
        props.onMouseDown,
        swipeableProps.onMouseDown
      ),
      ref: mergeRefs(props.ref, swipeableProps.ref),
      id: rootId,
      role,
      "aria-roledescription": "carousel",
      "aria-labelledby": labelId,
      style: {
        ...props.style,
        position: "relative"
      }
    }),

    getLabelProps: (props: Dict = {}) => ({
      ...props,
      id: labelId
    }),

    getSlideGroupWrapperProps: (props: Dict = {}) => {
      return {
        ...props,
        style: {
          ...props.style,
          overflow: "hidden",
          paddingLeft: offsetBeforeProp,
          paddingRight: offsetAfterProp
        }
      };
    },

    getSlideGroupProps: (props: Dict = {}) => {
      /**
       * Map through each slide and attach refs, and `data-active` to them
       */
      const clones = Children.map(props.children, (child, idx) => {
        const isActive = idx >= index * perView && idx <= (index + 1) * perView;
        return cloneElement(child, {
          "data-active": isActive ? "" : undefined,
          ref: mergeRefs(child.ref, slidesRef.ref(idx)),
          "aria-label": `${idx + 1} of ${slidesRef.map.size}`
        });
      });

      if (hasFakeSlides) {
        /**
         * Push a copy of the first slide to the last. So looping works correctly
         */
        clones.push(cloneElement(props.children[0], { key: -1 }));
        /**
         * Push a copy of the last slide to the first. So looping works correctly
         */
        clones.unshift(
          cloneElement(props.children[props.children.length - 1], {
            key: props.children.length + 1
          })
        );
      }

      return {
        ...props,
        children: clones,
        ref: mergeRefs(props.ref, groupRef),
        onMouseEnter: callAllHandlers(props.onMouseEnter, onMouseEnter),
        onMouseLeave: callAllHandlers(props.onMouseLeave, onMouseLeave),
        onTransitionEnd: callAllHandlers(
          props.onTransitionEnd,
          onFakeSlideTransitionEnd
        ),
        id: slideGroupId,
        role: "group",
        "aria-roledescription": "slide",
        "aria-atomic": false,
        "aria-live": isTicking ? "off" : "polite",
        style: {
          position: "relative",
          width: "100%",
          height: "100%",
          ...props.style,
          display: "flex",
          transitionProperty: "transform, -webkit-transform",
          boxSizing: "content-box",
          transform: `translate3d(-${
            tempTranslateX || translateX
          }px, 0px, 0px)`,
          transitionDuration: !tempTranslateX && transitionDurationRef.current
        }
      };
    },

    getSlideProps: (props: Dict = {}) => ({
      ...props,
      role: "group",
      "aria-roledescription": "slide",
      style: {
        ...props.style,
        flexShrink: 0,
        /**
         * if we're able to measure the rect, set it's width to the width of the group,
         * else use `minWidth` of 100% to inherit width using CSS
         */
        ...(!!rect ? { width: slideWidth } : { minWidth: "100%" }),
        marginRight: spacing
      }
    }),

    getNextButtonProps: (props: Dict = {}) => {
      const hidden = loop ? false : index === pages - 1;

      return {
        ...props,
        "aria-controls": slideGroupId,
        "aria-label": "Next Slide",
        onClick: callAllHandlers(props.onClick, onNextClick),
        hidden
      };
    },

    getPrevButton: (props: Dict = {}) => {
      const hidden = loop ? false : index === 0;

      return {
        ...props,
        "aria-controls": slideGroupId,
        "aria-label": "Previous Slide",
        onClick: callAllHandlers(props.onClick, onPrevClick),
        hidden
      };
    },

    getPauseButtonProps: (props: Dict = {}) => ({
      "aria-label": isTicking
        ? "Stop automatic slide show"
        : "Start automatic slide show",
      onClick: callAllHandlers(props.onClick, pauseAutoPlay)
    }),

    getPaginationProps: (props: Dict = {}) => {
      const child = Children.only(props.children);

      const children = new Array(pages).fill("").map((_, idx) =>
        cloneElement(child, {
          isSelected: idx === index,
          index: idx,
          onClick: () => setIndex(idx)
        })
      );

      return {
        ...props,
        children,
        pages,
        style: {
          textAlign: "center"
        }
      };
    },

    getThumbnailGroupProps: (props: Dict = {}) => {
      const { children, ...rest } = props;

      const count = Children.count(children);

      if (pages > 0 && count !== pages) {
        console.warn(
          [
            `useCarousel: The number of thumnails doesn't match the number slides`,
            `You have ${pages} slides and ${count} thumbnails`
          ].join(" ")
        );
      }

      const _children = Children.map(children, (child, idx) => {
        const onTrigger =
          thumbnailOptions.interaction === "click" ? "onClick" : "onMouseEnter";

        return cloneElement(child, {
          isSelected: idx === index,
          index: idx,
          [onTrigger]: () => setIndex(idx)
        });
      });

      const onKeyDown = (event: React.KeyboardEvent) => {
        if (thumbnailOptions.interaction !== "click") return;

        const isHorizontal = thumbnailOptions.orientation === "horizontal";
        const isVertical = thumbnailOptions.orientation === "vertical";

        if (event.key === "ArrowRight" && isHorizontal) {
          event.preventDefault();
          increment();
        }

        if (event.key === "ArrowDown" && isVertical) {
          event.preventDefault();
          increment();
        }

        if (event.key === "ArrowLeft" && isHorizontal) {
          event.preventDefault();
          decrement();
        }

        if (event.key === "ArrowUp" && isVertical) {
          event.preventDefault();
          decrement();
        }
      };

      return {
        ...rest,
        children: _children,
        tabIndex: 0,
        onKeyDown: callAllHandlers(props.onKeyDown, onKeyDown)
      };
    }
  };
}

export type UseCarouselReturn = ReturnType<typeof useCarousel>;
