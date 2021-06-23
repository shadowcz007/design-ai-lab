const ExcelJS = require('exceljs');


class Excel {
    constructor() { }

    async readFromFile(filename) {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filename);
        return workbook
    }

    /*
    {
        'xxx':{
            columns:['title','name'],
            rows:[
            {
                title:'x',
                name:'x'
            }
        ]
        }
    }
    */
    createFile(data={}) {
        const workbook = new ExcelJS.Workbook();
        // workbook.creator = 'Me';
        // workbook.lastModifiedBy = 'Her';
        // workbook.created = new Date(1985, 8, 30);
        // workbook.modified = new Date();
        // workbook.lastPrinted = new Date(2016, 9, 27);
        for (const sheetName in data) {
            const worksheet = workbook.addWorksheet(sheetName);
            let d=data[sheetName];
            worksheet.columns = Array.from(d.columns,c=>{
                return {
                    header:c,key:c
                }
            });
            Array.from(d.rows,r=>{
                worksheet.addRow(r);
            })
        }
       
        return workbook
    }
}



module.exports = new Excel();