import * as React from "react";
declare type Args<T extends Function> = T extends (...args: infer R) => any ? R : never;
export declare function callAllHandlers<T extends (event: any) => void>(...fns: (T | undefined)[]): (event: Args<T>[0]) => void;
export declare function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): (node: T) => void;
export declare const useUpdateEffect: typeof React.useEffect;
export declare function useMountedEffect(fn: () => void): void;
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
export declare function useControllable<T>(props: UseControllableProps<T>): [T, (next: T) => void];
export declare function useLatest<T>(val: T): React.MutableRefObject<T>;
export {};
