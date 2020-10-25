var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import usePrevious from "@rooks/use-previous";
import { useId } from "@reach/auto-id";
import { useRect } from "@reach/rect";
import useWindowSize from "@rooks/use-window-size";
import { Children, cloneElement, useCallback, useEffect, useMemo, useRef, useState, } from "react";
import MultiRef from "react-multi-ref";
import { useSwipeable } from "react-swipeable";
import { document } from "ssr-window";
import { useUpdateEffect, useMountedEffect, callAllHandlers, mergeRefs, useLatest, useControllable, } from "./utils";
import useEventListener from "@react-hook/event";
import useInterval from "@rooks/use-interval";
/**
 * React hook to auto-calculate the slides per view, spacing,
 * and autoplay based on the window width.
 */
function useBreakpoints(props) {
    var _a, _b, _c, _d;
    var breakpoints = props.breakpoints, initialProps = __rest(props, ["breakpoints"]);
    var windowWidth = useWindowSize().innerWidth;
    var breakPointsRef = useRef(initialProps);
    if (!breakpoints) {
        return breakPointsRef.current;
    }
    var sortedBreakpoints = Object.keys(breakpoints).sort();
    for (var _i = 0, sortedBreakpoints_1 = sortedBreakpoints; _i < sortedBreakpoints_1.length; _i++) {
        var bp = sortedBreakpoints_1[_i];
        if (windowWidth && windowWidth < Number(bp)) {
            breakPointsRef.current = {
                perView: breakpoints[bp].perView || initialProps.perView,
                spacing: (_a = breakpoints[bp].spacing, (_a !== null && _a !== void 0 ? _a : initialProps.spacing)),
                autoPlay: (_b = breakpoints[bp].autoPlay, (_b !== null && _b !== void 0 ? _b : initialProps.autoPlay)),
                offsetAfter: (_c = breakpoints[bp].offsetAfter, (_c !== null && _c !== void 0 ? _c : initialProps.offsetAfter)),
                offsetBefore: (_d = breakpoints[bp].offsetBefore, (_d !== null && _d !== void 0 ? _d : initialProps.offsetBefore)),
            };
            break;
        }
        breakPointsRef.current = initialProps;
    }
    return breakPointsRef.current;
}
var AutoplayStatus;
(function (AutoplayStatus) {
    /**
     * The carousel is completely idle, and no tick is happening
     */
    AutoplayStatus["IDLE"] = "idle";
    /**
     * The carousel has been changed, and `setInterval` clock is ticking
     */
    AutoplayStatus["TICKING"] = "tiking";
    /**
     * The carousel is changing slides
     */
    AutoplayStatus["MOVING"] = "moving";
    /**
     * The carousel was paused, and timeout was cleared
     */
    AutoplayStatus["PAUSED"] = "paused";
})(AutoplayStatus || (AutoplayStatus = {}));
/**
 * React hook that implements the Carousel design pattern
 *
 * @see WAI-ARIA https://www.w3.org/TR/wai-aria-practices-1.1/#carousel
 * @see W3.org https://www.w3.org/WAI/tutorials/carousels/
 */
export function useCarousel(props) {
    if (props === void 0) { props = {}; }
    var _a, _b;
    var idProp = props.id, indexProp = props.index, defaultIndex = props.defaultIndex, onChange = props.onChange, _c = props.interval, interval = _c === void 0 ? 3000 : _c, _d = props.autoPlay, autoPlay = _d === void 0 ? false : _d, onReachEnd = props.onReachEnd, pauseOnHover = props.pauseOnHover, _e = props.disableOnInteraction, disableOnInteraction = _e === void 0 ? false : _e, _f = props.loop, loop = _f === void 0 ? false : _f, _g = props.role, role = _g === void 0 ? "region" : _g, _h = props.perView, initialPerView = _h === void 0 ? 1 : _h, _j = props.spacing, initialSpacing = _j === void 0 ? 0 : _j, breakpoints = props.breakpoints, thumbnail = props.thumbnail, _k = props.offsetAfter, offsetAfter = _k === void 0 ? 0 : _k, _l = props.offsetBefore, offsetBefore = _l === void 0 ? 0 : _l, onSwipe = props.onSwipe;
    /**
     * The status of the carousel, particularly useful for the `auto-play`
     */
    var _m = useState(AutoplayStatus.IDLE), status = _m[0], setStatus = _m[1];
    var isTicking = status === AutoplayStatus.TICKING;
    /**
     * When autoplay is active, we use this ref to keep record when we hover
     * on any slide or the slide group
     */
    var isHoveringRef = useRef(false);
    /**
     * Refs for the slides and slide group
     */
    var slidesRef = useState(function () { return new MultiRef(); })[0];
    var groupRef = useRef();
    var _o = useState(false), isFakeSlide = _o[0], setFakeSlide = _o[1];
    /**
     * Issue: When the component mounts and there is fake slides (perView === 1),
     * there's a quick transition to the slide 1 when the component mounts.
     *
     * We need to stop that transition from happening, just for the mount phase. Afterward,
     * we let the hook do it's thing.
     */
    var TRANSITION_DURATION = "300ms";
    var transitionDurationRef = useRef("0ms");
    useMountedEffect(function () {
        transitionDurationRef.current = TRANSITION_DURATION;
    });
    /**
     * Allow for controlled and uncontrolled usage of the carousel
     */
    var _p = useControllable({
        value: indexProp,
        defaultValue: defaultIndex || 0,
        onChange: onChange,
    }), index = _p[0], setIndex = _p[1];
    /**
     * Compute the slides per view and spacing between the slides
     * based on the breakpoint
     */
    var _q = useBreakpoints({
        perView: initialPerView,
        spacing: parseInt(initialSpacing.toString()),
        autoPlay: autoPlay,
        breakpoints: breakpoints,
        offsetAfter: offsetAfter,
        offsetBefore: offsetBefore,
    }), perView = _q.perView, spacing = _q.spacing, autoPlayProp = _q.autoPlay, offsetBeforeProp = _q.offsetBefore, offsetAfterProp = _q.offsetAfter;
    /**
     * Set number of pages and update it on slides number change
     */
    var _r = useState(Math.ceil(slidesRef.map.size / Math.floor(perView))), pages = _r[0], setPages = _r[1];
    /**
     * Update `pages` local state when perView changes due to breakpoint
     */
    useUpdateEffect(function () {
        setPages(Math.ceil(slidesRef.map.size / Math.floor(perView)));
    }, [slidesRef.map.size]);
    /**
     * Keep a reference to the preview `perView` (slides per view)
     * so we can
     */
    var prevPerView = usePrevious(Math.floor(perView));
    useUpdateEffect(function () {
        var newPages = Math.ceil(slidesRef.map.size / Math.floor(perView));
        switch (index) {
            case 0:
                break;
            case pages - 1:
                setIndex(newPages - 1);
                break;
            default:
                var firstSlideIndex = index * prevPerView + 1;
                setIndex(Math.ceil(firstSlideIndex / perView) - 1);
        }
        setPages(newPages);
    }, [perView]);
    var hasFakeSlides = useMemo(function () { return loop && perView === 1; }, [loop, perView]);
    /**
     * This measures the rect of the slideGroup.
     *
     * We'll use it to dynamically add `width` to each slide
     * based on the `breakpoints` prop.
     *
     * By default we assume it's 1 slide per view, and spacing of `0`
     */
    var rect = useRect(groupRef, true);
    var slideWidth = ((_b = (_a = rect) === null || _a === void 0 ? void 0 : _a.width, (_b !== null && _b !== void 0 ? _b : 0)) - (perView - 1) * parseFloat(spacing.toString())) /
        perView;
    /**
     * Compute the `translateX` value for the carousel. This is really the
     * carousel effect
     */
    var getTranslateX = function () {
        var _a, _b;
        /**
         * In some scenarios, we want to show a partial slide so
         * users can know that it's a carousel.
         *
         * For this, you can pass decimal values for `perView` (e.g 2.25)
         * and we need to check this.
         */
        var hasPartialSlide = perView - Math.floor(perView);
        var spacingValue = parseFloat(spacing.toString());
        var rectWidth = hasPartialSlide
            ? Math.floor(perView) * (slideWidth + spacingValue) - spacingValue
            : (_b = (_a = rect) === null || _a === void 0 ? void 0 : _a.width, (_b !== null && _b !== void 0 ? _b : 0));
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
    var translateX = getTranslateX();
    /**
     * Think of this as a way to ensure the identity of
     * `onReachEnd` remains the same. It helps us avoid re-running
     * the `useEffect` below unnecessarily.
     */
    var savedOnReachEnd = useLatest(onReachEnd);
    useUpdateEffect(function () {
        var _a, _b;
        if (index === slidesRef.map.size - 1) {
            (_b = (_a = savedOnReachEnd).current) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
    }, [savedOnReachEnd, index, slidesRef.map.size]);
    /**
     * Id generation for the carousel parts
     */
    var id = useId(idProp);
    var rootId = "carousel-" + id;
    var labelId = "carousel-" + id + "-label";
    var slideGroupId = "carousel-" + id + "-slide-group";
    /**
     * The core fns for going to the next or prev slide
     */
    var increment = function () {
        var nextIndex = index + 1;
        // to avoid going to wrong index if we have fake slide
        if (nextIndex > pages)
            return;
        if (!hasFakeSlides && nextIndex === pages) {
            return;
        }
        setIndex(nextIndex);
    };
    var decrement = function () {
        var prevIndex = index - 1;
        if (!hasFakeSlides && prevIndex < 0) {
            return;
        }
        setIndex(prevIndex);
    };
    /**
     * The core fns for the `next` and `prev` buttons
     */
    var onNextClick = function (event) {
        event.preventDefault();
        increment();
        // stop the autoplay
        if (autoPlayProp && disableOnInteraction) {
            stopAutoPlay();
        }
    };
    var onPrevClick = function (event) {
        event.preventDefault();
        decrement();
        // stop the autoplay
        if (autoPlayProp && disableOnInteraction) {
            stopAutoPlay();
        }
    };
    var startAutoPlay = useCallback(function () {
        if (!autoPlayProp || status === AutoplayStatus.TICKING) {
            return;
        }
        setStatus(AutoplayStatus.TICKING);
    }, [autoPlayProp, status]);
    var stopAutoPlay = useCallback(function () {
        if (!autoPlayProp || status !== AutoplayStatus.TICKING) {
            return;
        }
        setStatus(AutoplayStatus.IDLE);
    }, [autoPlayProp, status]);
    var pauseAutoPlay = useCallback(function () {
        if (!autoPlayProp || status === AutoplayStatus.PAUSED) {
            return;
        }
        setStatus(AutoplayStatus.PAUSED);
    }, [autoPlayProp, status]);
    var onMouseEnter = function () {
        isHoveringRef.current = true;
        if (pauseOnHover && status === AutoplayStatus.TICKING) {
            pauseAutoPlay();
        }
    };
    var onMouseLeave = function () {
        isHoveringRef.current = false;
        if (pauseOnHover && status === AutoplayStatus.PAUSED) {
            startAutoPlay();
        }
    };
    useInterval(increment, interval, autoPlayProp ? status !== AutoplayStatus.TICKING : true);
    useEffect(function () {
        if (autoPlayProp) {
            startAutoPlay();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoPlayProp]);
    /**
     *
     * The core fns for swiping with mouse or finger on mobile
     */
    var _s = useState(0), tempTranslateX = _s[0], setTempTranslateX = _s[1];
    var handleSwiping = function (e) {
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
    var swipeLeft = function (e) {
        var _a;
        setTempTranslateX(0);
        if (e.velocity > 1 || e.absX > slideWidth / 2) {
            increment();
        }
        if (status === AutoplayStatus.PAUSED) {
            startAutoPlay();
        }
        var toIndex = index + 1;
        if (toIndex > pages)
            toIndex = pages;
        (_a = onSwipe) === null || _a === void 0 ? void 0 : _a({
            direction: "left",
            fromIndex: index,
            toIndex: toIndex,
            pageSize: pages,
        });
    };
    var swipeRight = function (e) {
        var _a;
        setTempTranslateX(0);
        if (e.velocity > 1 || e.absX > slideWidth / 2) {
            decrement();
        }
        if (status === AutoplayStatus.PAUSED) {
            startAutoPlay();
        }
        var toIndex = index - 1;
        if (toIndex < 0)
            toIndex = index;
        (_a = onSwipe) === null || _a === void 0 ? void 0 : _a({
            direction: "right",
            fromIndex: index,
            toIndex: toIndex,
            pageSize: pages,
        });
    };
    var swipeableProps = useSwipeable({
        onSwiping: handleSwiping,
        onSwipedLeft: swipeLeft,
        onSwipedRight: swipeRight,
    });
    /**
     * When the page this carousel component is rendered isn't active or is minimized,
     * we want to turn off the autoplay, to avoid unnecessary memory usage.
     *
     * @see API https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState
     */
    var onVisibilityChange = function () {
        if (document.visibilityState === "hidden" &&
            status === AutoplayStatus.TICKING) {
            pauseAutoPlay();
        }
        if (document.visibilityState === "visible" &&
            status === AutoplayStatus.PAUSED) {
            startAutoPlay();
            setStatus(AutoplayStatus.TICKING);
        }
    };
    useUpdateEffect(function () {
        var isFakeSlideIndex = index === 0 || index === pages - 1;
        if (isFakeSlide && isFakeSlideIndex) {
            transitionDurationRef.current = TRANSITION_DURATION;
            setFakeSlide(false);
        }
    }, [index, isFakeSlide]);
    useEventListener(window.document, "visibilitychange", onVisibilityChange);
    var onFakeSlideTransitionEnd = function () {
        if (!hasFakeSlides)
            return;
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
    var thumbnailOptions = __assign({ interaction: "click", orientation: "horizontal" }, thumbnail);
    return {
        getRootProps: function (props) {
            if (props === void 0) { props = {}; }
            return (__assign(__assign({}, props), { onMouseDown: callAllHandlers(props.onMouseDown, swipeableProps.onMouseDown), ref: mergeRefs(props.ref, swipeableProps.ref), id: rootId, role: role, "aria-roledescription": "carousel", "aria-labelledby": labelId, style: __assign(__assign({}, props.style), { position: "relative" }) }));
        },
        getLabelProps: function (props) {
            if (props === void 0) { props = {}; }
            return (__assign(__assign({}, props), { id: labelId }));
        },
        getSlideGroupWrapperProps: function (props) {
            if (props === void 0) { props = {}; }
            return __assign(__assign({}, props), { style: __assign(__assign({}, props.style), { overflow: "hidden", paddingLeft: offsetBeforeProp, paddingRight: offsetAfterProp }) });
        },
        getSlideGroupProps: function (props) {
            if (props === void 0) { props = {}; }
            /**
             * Map through each slide and attach refs, and `data-active` to them
             */
            var clones = Children.map(props.children, function (child, idx) {
                var isActive = idx >= index * perView && idx <= (index + 1) * perView;
                return cloneElement(child, {
                    "data-active": isActive ? "" : undefined,
                    ref: mergeRefs(child.ref, slidesRef.ref(idx)),
                    "aria-label": idx + 1 + " of " + slidesRef.map.size,
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
                clones.unshift(cloneElement(props.children[props.children.length - 1], {
                    key: props.children.length + 1,
                }));
            }
            return __assign(__assign({}, props), { children: clones, ref: mergeRefs(props.ref, groupRef), onMouseEnter: callAllHandlers(props.onMouseEnter, onMouseEnter), onMouseLeave: callAllHandlers(props.onMouseLeave, onMouseLeave), onTransitionEnd: callAllHandlers(props.onTransitionEnd, onFakeSlideTransitionEnd), id: slideGroupId, role: "group", "aria-roledescription": "slide", "aria-atomic": false, "aria-live": isTicking ? "off" : "polite", style: __assign(__assign({ position: "relative", width: "100%", height: "100%" }, props.style), { display: "flex", transitionProperty: "transform, -webkit-transform", boxSizing: "content-box", transform: "translate3d(-" + (tempTranslateX || translateX) + "px, 0px, 0px)", transitionDuration: !tempTranslateX && transitionDurationRef.current }) });
        },
        getSlideProps: function (props) {
            if (props === void 0) { props = {}; }
            return (__assign(__assign({}, props), { role: "group", "aria-roledescription": "slide", style: __assign(__assign(__assign(__assign({}, props.style), { flexShrink: 0 }), (!!rect ? { width: slideWidth } : { minWidth: "100%" })), { marginRight: spacing }) }));
        },
        getNextButtonProps: function (props) {
            if (props === void 0) { props = {}; }
            var hidden = loop ? false : index === pages - 1;
            return __assign(__assign({}, props), { "aria-controls": slideGroupId, "aria-label": "Next Slide", onClick: callAllHandlers(props.onClick, onNextClick), hidden: hidden });
        },
        getPrevButton: function (props) {
            if (props === void 0) { props = {}; }
            var hidden = loop ? false : index === 0;
            return __assign(__assign({}, props), { "aria-controls": slideGroupId, "aria-label": "Previous Slide", onClick: callAllHandlers(props.onClick, onPrevClick), hidden: hidden });
        },
        getPauseButtonProps: function (props) {
            if (props === void 0) { props = {}; }
            return ({
                "aria-label": isTicking
                    ? "Stop automatic slide show"
                    : "Start automatic slide show",
                onClick: callAllHandlers(props.onClick, pauseAutoPlay),
            });
        },
        getPaginationProps: function (props) {
            if (props === void 0) { props = {}; }
            var child = Children.only(props.children);
            var children = new Array(pages).fill("").map(function (_, idx) {
                return cloneElement(child, {
                    isSelected: idx === index,
                    index: idx,
                    onClick: function () { return setIndex(idx); },
                });
            });
            return __assign(__assign({}, props), { children: children,
                pages: pages, style: {
                    textAlign: "center",
                } });
        },
        getThumbnailGroupProps: function (props) {
            if (props === void 0) { props = {}; }
            var children = props.children, rest = __rest(props, ["children"]);
            var count = Children.count(children);
            if (pages > 0 && count !== pages) {
                console.warn([
                    "useCarousel: The number of thumnails doesn't match the number slides",
                    "You have " + pages + " slides and " + count + " thumbnails",
                ].join(" "));
            }
            var _children = Children.map(children, function (child, idx) {
                var _a;
                var onTrigger = thumbnailOptions.interaction === "click" ? "onClick" : "onMouseEnter";
                return cloneElement(child, (_a = {
                        isSelected: idx === index,
                        index: idx
                    },
                    _a[onTrigger] = function () { return setIndex(idx); },
                    _a));
            });
            var onKeyDown = function (event) {
                if (thumbnailOptions.interaction !== "click")
                    return;
                var isHorizontal = thumbnailOptions.orientation === "horizontal";
                var isVertical = thumbnailOptions.orientation === "vertical";
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
            return __assign(__assign({}, rest), { children: _children, tabIndex: 0, onKeyDown: callAllHandlers(props.onKeyDown, onKeyDown) });
        },
    };
}
