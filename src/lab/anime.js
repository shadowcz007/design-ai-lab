


class Anime {
    constructor() {}
    init(){
        try{
            anime&&window.anime;
        }catch{
            console.log('-')
            window.anime=require('animejs');
        };
    }
}

module.exports = Anime;