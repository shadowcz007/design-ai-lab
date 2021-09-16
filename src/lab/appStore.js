
const base = require('./base');
const Store=require('./store');

class AppStore{
    constructor(){
        this.db=new Store();
    }
    save(json){
        if(json){
            let appId= base.getAppId();
            if(appId&&appId.id) this.db.set(appId.id,{
                id:appId.id,name:appId.name,data:json
            });
        }
    }
    async getIds(){
        let values=await this.db.getValues();
        return Array.from(values,k=>{
            return {id:k.id,name:k.name}
        });
    }
    async load(id){
        let values=await this.db.getValues();
        let vs=values.filter(v=>v.id===id);
        if(vs&&vs[0]) return vs[0];
        return null
    }
}

module.exports = AppStore;