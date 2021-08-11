var Gibber = require('gibber.audio.lib/dist/gibber.audio.js');
const path = require('path');

var Gibber = require('gibber.core.lib'),
    Audio = require('gibber.audio.lib/dist/gibber.audio'),
    Graphics = require('gibber.graphics.lib')

class Music {
    constructor() {
        this.workletPath = path.join(__dirname, '../../node_modules/gibber.audio.lib/dist/gibberish_worklet.js');
        this.Gibber = Gibber;
        Gibber.init({
            workletPath: this.workletPath
        }, Gibber).then(res => {
            console.log('init')
            const syn = Synth()
            syn.note.seq([0, 1], 1 / 4)
        });
    }

}

module.exports = Music;