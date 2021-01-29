// 渲染进程
const {ipcRenderer,remote}=require("electron");
const fs=require("fs");
const Knowledge = require("./knowledge");
const Editor=require("./editor");


(()=> {
    //

    //编辑器
    let previewWindow=null;

    const editor=new Editor(
        document.querySelector("#editor"),
        localStorage.getItem("code"),
        (code)=>{
            previewWindow=previewWindow||(remote.getGlobal("_WINS")).previewWindow;
            //const code=this.editor.getValue();
            previewWindow.webContents.executeJavaScript(`
                if(p5.instance){p5.instance.remove()};
                document.querySelector("#p5").innerHTML="";
                ${code.trim()};
                new p5(null,'p5');
                `, false)
            .then((result) => {
                //console.log("成功")
                // editorElement.classList.remove("ui-error");
                // editorElement.classList.add("ui-success");
            }).catch(err=>{
                // console.log(err)
                // console.log("失败")
                // editorElement.classList.add("ui-error");
                // editorElement.classList.remove("ui-success");
            });
        }
    );

    const knowledge=new Knowledge(
        document.querySelector("#readme"),
        document.querySelector("#course"),
        localStorage.getItem("knowledge"));

    //获得需要存储的数据
    function getSaveFileContent(){
        return {
            knowledge:knowledge.get(),
            code:editor.getCode()
        }
    }

    //GUI
    const newFile=document.querySelector("#new-file"),
        editFile=document.querySelector("#edit-file"),
        openFile=document.querySelector("#open-file"),
        saveFile=document.querySelector("#save-file");
    
    openFile.addEventListener("click",e=>{
        e.preventDefault();
        
        let filePath=remote.dialog.showOpenDialogSync( {
            title:"打开……",
            properties: ['openFile'],
            filters: [
                { name: 'Json', extensions: ['json'] }
              ]
        });
        if(filePath){
            // 
            let res=fs.readFileSync(filePath[0],'utf-8');
            res=JSON.parse(res);
            knowledge.set(res.knowledge);
            editor.setCode(res.code);
            saveFile.style.display="none";
            editFile.style.display="block";
            // openFile.style.display="none";
            newFile.style.display="block";
            knowledge.toggle(true);
        };
    });
    editFile.addEventListener("click",e=>{
        knowledge.toggle(false);
        saveFile.style.display="block";
        editFile.style.display="none";
        newFile.style.display="block";
    });
    newFile.addEventListener("click",e=>{
        e.preventDefault();
        saveFile.style.display="block";
        editFile.style.display="none";
        newFile.style.display="none";
        knowledge.toggle(false);
        knowledge.set({
            readme:"",
            course:""
        })
        editor.setCode("");
        localStorage.setItem("knowledge",JSON.stringify(knowledge.get()));
        localStorage.setItem("code",editor.getCode());
    });
    saveFile.addEventListener("click",e=>{
        e.preventDefault();
        
        localStorage.setItem("knowledge",JSON.stringify(knowledge.get()));
        let filePath=remote.dialog.showSaveDialogSync( {
            title:"另存为……",
            defaultPath:`AICODE_${(new Date()).getDay()}.json`
        });
        if(filePath){
            fs.writeFile(filePath,JSON.stringify(getSaveFileContent(),null,2),'utf8',function (err) {
                if(err) console.error(err);
                console.log("保存成功");
                knowledge.toggle(true);
                saveFile.style.display="none";
                editFile.style.display="block";
                newFile.style.display="block";
            });
        };
        // console.log(filePath)
    });


    document.querySelector("#course").addEventListener("input",e=>{
        e.preventDefault();
        localStorage.setItem("knowledge",JSON.stringify(knowledge.get()));
    });
    document.querySelector("#readme").addEventListener("input",e=>{
        e.preventDefault();
        localStorage.setItem("knowledge",JSON.stringify(knowledge.get()));
    });

    const practiceBtn=document.querySelector("#practice-btn");
    // console.log(saveBtn)
    practiceBtn.addEventListener("click",e=>{
        let t=editor.toggle();
        
        if(t===true){
            practiceBtn.innerHTML=`<i class="fas fa-play-circle"></i>`;
            localStorage.setItem("code",editor.getCode()); 
        }else{
            practiceBtn.innerHTML=`<i class="fas fa-pause-circle"></i>`; 
            previewWindow=previewWindow||(remote.getGlobal("_WINS")).previewWindow;
            previewWindow?previewWindow.show():null;
            editor.execute();
            // saveFile.style.display="block";
        }
    })

})();





// document.getElementById('run').addEventListener("click",()=>{
//     loadImage().then(image=>{
        
//         let canvas = document.createElement('canvas');
//         canvas.style.width="300px";
//         canvas.width = image.naturalWidth;			  			
//         canvas.height = image.naturalHeight;
//         let ctx=canvas.getContext('2d');
//         ctx.drawImage(image,0,0,canvas.width,canvas.height);
//         document.body.appendChild(canvas);
        
//         loadface(ctx);
//         loadtext(ctx);
//     })
// })