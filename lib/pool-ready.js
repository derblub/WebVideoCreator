/**
 * Waits until a generic-pool pool holds its minimum of resources, or fails with the first create error.
 *
 * generic-pool's own ready() polls forever when a create fails: a failed create with no waiting client is only
 * emitted as `factoryCreateError`, and nothing creates a replacement. A warmup that awaited ready() therefore hung
 * for good after one slow Chrome start (above browserLaunchTimeout) or one failed first page, and every later
 * render waited behind it.
 *
 * @param {import("generic-pool").Pool} pool - started pool
 * @returns {Promise<void>} - resolves when `pool.available >= pool.min`, rejects with the first create error
 */
export default function poolReady(pool) {
    return new Promise((resolve, reject) => {
        let timer;
        const settle = err => {
            clearTimeout(timer);
            pool.removeListener("factoryCreateError", settle);
            err ? reject(err) : resolve();
        };
        const check = () => {
            if (pool.available >= pool.min)
                settle();
            else
                timer = setTimeout(check, 100);
        };
        pool.on("factoryCreateError", settle);
        check();
    });
}
