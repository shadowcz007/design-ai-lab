class DataGenerator {
    constructor(framerate = 0, cb) {
        if (typeof cb !== "function") {
            console.error("generator requires a callback");
            return;
        }
        this.framerate = framerate;
        this.interval = null;
        this.frameWaitTime = 0;
        this.lastTime = Date.now();
        let wrapperFn = () => {
            this.frameWaitTime = Date.now() - this.lastTime;
            this.lastTime = Date.now();
            cb(this.frameWaitTime);
            if (this.framerate === 0) {
                requestAnimationFrame(wrapperFn);
            } else {
                setTimeout(() => {
                    requestAnimationFrame(wrapperFn);
                }, (1 / framerate) * (1000 - this.frameWaitTime));
            }
        };
        this.interval = requestAnimationFrame(wrapperFn);
    }

    stop() {
        cancelAnimationFrame(this.interval);
    }
}

module.exports = DataGenerator;