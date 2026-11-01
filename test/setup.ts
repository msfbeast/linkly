import '@testing-library/jest-dom';

// jsdom has no IntersectionObserver; components use it for lazy loading and
// in-view animations. This stub never reports an intersection.
if (typeof globalThis.IntersectionObserver === 'undefined') {
    class IntersectionObserverStub {
        readonly root = null;
        readonly rootMargin = '0px';
        readonly thresholds: ReadonlyArray<number> = [0];
        observe() {}
        unobserve() {}
        disconnect() {}
        takeRecords() { return []; }
    }
    globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}
