import * as React from "react";
export function callAllHandlers() {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    return function (event) {
        fns.some(function (fn) {
            var _a;
            (_a = fn) === null || _a === void 0 ? void 0 : _a(event);
            return event && event.defaultPrevented;
        });
    };
}
export function mergeRefs() {
    var refs = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        refs[_i] = arguments[_i];
    }
    return function (node) {
        refs.forEach(function (ref) {
            if (ref) {
                setRef(ref, node);
            }
        });
    };
}
function setRef(ref, node) {
    if (typeof ref === "function") {
        ref(node);
    }
    else if (Object(ref) === ref) {
        ref.current = node;
    }
}
export var useUpdateEffect = function (effect, deps) {
    if (deps === void 0) { deps = []; }
    var isInitialMount = React.useRef(true);
    React.useEffect(function () {
        if (isInitialMount.current) {
            isInitialMount.current = false;
        }
        else {
            effect();
        }
    }, deps);
};
export function useMountedEffect(fn) {
    var _a = React.useState(false), mounted = _a[0], setMounted = _a[1];
    React.useEffect(function () {
        setMounted(true);
    }, []);
    React.useEffect(function () {
        if (mounted)
            fn();
    }, [mounted, fn]);
}
export function useControllable(props) {
    var value = props.value, defaultValue = props.defaultValue, onChange = props.onChange;
    var isControlled = React.useRef(value !== undefined).current;
    var _a = React.useState(defaultValue), valueState = _a[0], setValue = _a[1];
    var finalValue = isControlled ? value : valueState;
    var update = React.useCallback(function (next) {
        var _a;
        if (!isControlled)
            setValue(next);
        (_a = onChange) === null || _a === void 0 ? void 0 : _a(next);
    }, [isControlled, onChange]);
    return [finalValue, update];
}
export function useLatest(val) {
    var saved = React.useRef();
    React.useEffect(function () {
        saved.current = val;
    }, [val]);
    return saved;
}