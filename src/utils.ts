import React, { Ref } from "react";

type Args<T extends Function> = T extends (...args: infer R) => any ? R : never;

export function callAllHandlers<T extends (event: any) => void>(
  ...fns: (T | undefined)[]
) {
  return function (event: Args<T>[0]) {
    fns.some((fn) => {
      fn?.(event);
      return event && event.defaultPrevented;
    });
  };
}

export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (ref) {
        setRef(ref, node);
      }
    });
  };
}

function setRef<T>(ref: Ref<T>, node: T) {
  if (typeof ref === "function") {
    ref(node);
  } else if (Object(ref) === ref) {
    (ref as React.MutableRefObject<T>).current = node;
  }
}

export const useUpdateEffect: typeof React.useEffect = (effect, deps = []) => {
  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      effect();
    }
  }, deps);
};

export function useMountedEffect(fn: () => void) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted) fn();
  }, [mounted, fn]);
}

import * as React from "react";

export interface UseControllableProps<T> {
  /**
   * The controlled value
   */
  value?: T;
  /**
   * The default value in uncontrolled mode
   */
  defaultValue?: T | (() => T);
  /**
   * Callback that's fired when value changes
   */
  onChange?: (next: T) => void;
}

export function useControllable<T>(props: UseControllableProps<T>) {
  const { value, defaultValue, onChange } = props;

  const { current: isControlled } = React.useRef(value !== undefined);
  const [valueState, setValue] = React.useState(defaultValue);
  const finalValue = isControlled ? value : valueState;

  const update = React.useCallback(
    (next: T) => {
      if (!isControlled) setValue(next);
      onChange?.(next);
    },
    [isControlled, onChange]
  );

  return [finalValue, update] as [T, (next: T) => void];
}
