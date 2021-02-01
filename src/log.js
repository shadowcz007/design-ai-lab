//Log GUI

//executeJavaScriptResult
function add(info) {
    //console.log('executeJavaScriptResult----1', typeof(info), info.toString())
    if (typeof(info) === 'object') {
        info = info.toString()
    };
    console.log('executeJavaScriptResult----2', info)
    if (info !== 'success') {
        create(info);
    } else {
        clear();
    };
    sort();
}


function create(text) {
    let className = "log_" + md5(text);
    let findLog = document.querySelector("#log").querySelector("." + className);
    if (findLog) {
        if (findLog.getAttribute("data-count") != "99+" && parseInt(findLog.getAttribute("data-count")) + 1 >= 99) {
            findLog.setAttribute("data-count", "99+");
        } else if (findLog.getAttribute("data-count") != "99+") {
            findLog.setAttribute("data-count", parseInt(findLog.getAttribute("data-count")) + 1);
        }

        findLog.setAttribute("data-time", (new Date()).getTime());

    } else {
        let div = document.createElement("div");
        div.innerText = text;
        div.className = className;
        div.setAttribute("data-count", 1);
        div.setAttribute("data-time", (new Date()).getTime());
        document.querySelector("#log").appendChild(div);
    };

    
}

function sort(){
    let findLogs = document.querySelector("#log").children;
    findLogs =Array.from(findLogs,l=>{
        return {
            div:l,
            time:parseInt(l.getAttribute("data-time"))
        }
    }).sort((b,a)=>a.time-b.time);
    document.querySelector("#log").innerHTML="";
    findLogs.forEach(g=>{
        document.querySelector("#log").appendChild(g.div);
    })
}

function clear() {
    document.querySelector("#log").innerHTML = "";
}


module.exports={
    add,create,clear,sort
}