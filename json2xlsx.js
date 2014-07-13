#!/usr/bin/env node

if(exports)
  exports = {write: writeXLSX,read: readXLSX}

if(process.argv[2])
  readXLSX(process.argv[2]);

function readXLSX(filename){
  console.log(require('XLSX').readFile(filename).Sheets);
}

function writeXLSX(filename, sheetname, obj){

XLSX = require('xlsx');
FS = require('fs');

if(!obj){
  var indata = '';
  process.stdin.on('readable', function(){
    indata += process.stdin.read() || '';
  })
  process.stdin.on('end', processData);
} else {
  processData();
}
function processData(){

  var t = obj || JSON.parse(indata);
  if(!t || typeof t !== 'object')
    throw Error('json2xlsx - not an object');

  if(t.push && sheetname){
    var ob = {};
    ob[sheetname] = t;
    o = ob;
  } else {
    o = t;
  }
  var wb = FS.existsSync(filename) ? XLSX.readFile(filename) : new Workbook();

  for(ws_name in o){
    var sheetdispname = sheetname || ws_name;
    var twodarr = o[ws_name];
    if(!twodarr[0]) continue;
    
    wb.SheetNames.push(sheetdispname);
    if(!twodarr[0].push)
      twodarr = convertObjArray(twodarr);
    var ws = sheet_from_array_of_arrays(twodarr);
    wb.Sheets[sheetdispname] = ws;
    if(process.env.debug)
      console.log(filename, '/', sheetdispname);
  }
  XLSX.writeFile(wb, filename);
}

function convertObjArray(objarray){
  try{
  var arrarr = [Object.keys(objarray[0])];
  for(var n=0; n<objarray.length;n++){
    var row = [];
    for(var i in objarray[0])
      row.push(objarray[n][i]);
    arrarr.push(row);
  }
  if(process.env.debug)
    console.log(arrarr.length + ' records');
  return arrarr;
  } catch(e){
      console.log(objarray);
      return [[]];
  }
}

function datenum(v, date1904) {
  if(date1904) v+=1462;
  var epoch = Date.parse(v);
  return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
}
 
function sheet_from_array_of_arrays(data, opts) {
  var ws = {};
  var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
  for(var R = 0; R != data.length; ++R) {
    for(var C = 0; C != data[R].length; ++C) {
      if(range.s.r > R) range.s.r = R;
      if(range.s.c > C) range.s.c = C;
      if(range.e.r < R) range.e.r = R;
      if(range.e.c < C) range.e.c = C;
      var cell = {v: data[R][C] };
      if(cell.v == null) continue;
      var cell_ref = XLSX.utils.encode_cell({c:C,r:R});
      
      if(typeof cell.v === 'number') cell.t = 'n';
      else if(typeof cell.v === 'boolean') cell.t = 'b';
      else if(cell.v instanceof Date) {
        cell.t = 'n'; cell.z = XLSX.SSF._table[14];
        cell.v = datenum(cell.v);
      }
      else cell.t = 's';
      
      ws[cell_ref] = cell;
    }
  }
  if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
  return ws;
}

function Workbook() {
  if(!(this instanceof Workbook)) return new Workbook();
  this.SheetNames = [];
  this.Sheets = {};
}

}
