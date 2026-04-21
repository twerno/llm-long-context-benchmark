/**
 * Utility functions for random generation and selection.
 */
export default {
    /**
     * Generates a random integer between min and max (inclusive).
     * 
     * @param min - The minimum value.
     * @param max - The maximum value.
     * @returns A random integer.
     */
    randomInt(min: number, max: number) {
        const _max = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, max))
        const _min = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, min), max);
        return Math.floor(Math.random() * (_max - _min)) + _min
    },

    /**
     * Generates a random integer between 1 and max (inclusive).
     * 
     * @param max - The maximum value.
     * @returns A random integer.
     */
    randomFrom1(max: number) {
        return this.randomInt(1, max)
    },

    /**
     * Picks a single random element from an array diffrent from given element.
     * 
     * @param arr - The array to pick from.
     * @param notThat - Element we don't want to get.
     * @returns A randomly selected element from the array.
     */
    pickOneBut<T>(arr: T[], notThat: T) {
        const result = this
            .pickSome<T>({ min: 1, max: 2 })
            .from(arr)
            .filter(v => v != notThat)[0];
        if (result === null) {
            throw new Error(`there is not enough elements in array ${JSON.stringify(arr)} diffrent than ${JSON.stringify(notThat)}`)
        }
        return result;
    },

    /**
     * Picks a single random element from an array.
     * 
     * @param arr - The array to pick from.
     * @returns A randomly selected element from the array.
     */
    pickOne<T>(arr: T[]) {
        return this
            .pickSome<T>({ min: 1, max: 1 })
            .from(arr)[0];
    },

    /**
     * Selects a random subset of elements from an array based on provided range.
     * 
     * @param min - The minimum number of elements to pick.
     * @param max - The maximum number of elements to pick.
     * @returns An object containing the `from` method to perform selection from an array.
     */
    pickSome<T>({ min, max }: { min: number, max: number }) {
        const from = <T>(arr: T[]) => {
            const _max = Math.min(max, arr.length);
            const length = this.randomInt(min, _max);
            const result = Array
                .from({ length })
                .map((_) => this.randomInt(0, arr.length))
                .map(idx => arr[idx])

            return [...new Set(result)];
        }
        return {
            from
        }
    },

    /**
     * Builds an array of elements by repeatedly calling a builder function.
     * 
     * @param min - The minimum number of elements to build.
     * @param max - The maximum number of elements to build.
     * @returns An object containing the `builder` method to create elements.
     */
    buildSome({ min, max }: { min: number, max: number }) {
        const fn = <T>(builder: (idx: number) => T): T[] => {
            const length = this.randomInt(min, max);
            return Array.from({ length })
                .map((_, idx) => builder(idx))
        }
        return {
            builder: fn
        }
    },

    joinList: (list: string[]) => {
        if (list.length <= 2)
            return list.join(" and ")

        return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
    }
}