class DataGenerator {
    constructor(framerate = 10, cb) {
        if (typeof cb !== "function") {
            console.error("generator requires a callback");
            return;
        }
        this.framerate = framerate;
        this.interval = null;
        this.frameWaitTime = 0;
        this.lastTime = Date.now();
        let wrapperFn = () => {
            if (this.interval === null) return;
            this.frameWaitTime = Date.now() - this.lastTime;
            this.lastTime = Date.now();
            console.log(this)
            cb(this.frameWaitTime);
            if (this.framerate === 0) {
                window.requestAnimationFrame(wrapperFn);
            } else {
                setTimeout(() => {
                    window.requestAnimationFrame(wrapperFn);
                }, (1 / framerate) * (1000 - this.frameWaitTime));
            }
        };
        this.interval = window.requestAnimationFrame(wrapperFn);
    }

    stop() {
        window.cancelAnimationFrame(this.interval);
        this.interval = null;
    }
}

module.exports = DataGenerator;