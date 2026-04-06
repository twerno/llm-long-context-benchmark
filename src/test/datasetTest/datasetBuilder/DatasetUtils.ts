export default {
    randomInt(min: number, max: number) {
        const _max = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, max))
        const _min = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, min), max);

        return Math.floor(Math.random() * (_max - _min)) + _min
    },

    randomFrom1(max: number) {
        return this.randomInt(1, max)
    },

    pickOne<T>(arr: T[]) {
        return this
            .pickSome<T>({ min: 1, max: 1 })
            .from(arr)[0];
    },

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

    buildSome({ min, max }: { min: number, max: number }) {
        const fn = <T>(builder: (idx: number) => T): T[] => {
            const length = this.randomInt(min, max);
            return Array.from({ length })
                .map((_, idx) => builder(idx))
        }
        return {
            builder: fn
        }
    }
}