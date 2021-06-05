const ExcelJS = require('exceljs');


class Excel{
    constructor(){}
    
    async readFromFile(filename){
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filename); 
        return workbook
    }
}



module.exports =new Excel();