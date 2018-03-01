var AWS = require("aws-sdk");
var dynamo = require('dynamodb');
const Joi = require('joi');
const cors=require('cors');
var localStorage = require('localStorage');
var moment=require('moment');
bodyParser = require('body-parser');
const express= require('express');
const hbs=require('hbs');
const fs=require('fs');
const request=require('request');
var rec1={};
var port=3000;
var localjson=require('./local-config');


for(var i=0;i<localjson.length;i++){
    process.env[localjson[i].name] = localjson[i].value;
}
console.log("process:- ",process.env[ "accessKeyId"]);
var title=process.env["title"];
dynamo.AWS.config.update({accessKeyId: process.env["accessKeyId"], secretAccessKey: process.env["secretAccessKey"], region: process.env["region"]});
var docClient = new AWS.DynamoDB.DocumentClient();
var schemeData=()=>{
    var mySecondTable = dynamo.define(process.env["tabledevices"], {
        hashKey : 'IMEI',
        timestamps : true,
        schema : {
          IMEI :Joi.string(),
          deviceName:Joi.string(),
          deviceModel:Joi.string(),
          owner:Joi.string(),
          lastUpdatedOn:Joi.date(),
          Comment:Joi.string()
        }
      });
      mySecondTable.config({tableName: process.env["tabledevices"]});
    return mySecondTable;
}
var schemeLogin=()=>{
    var loginTable = dynamo.define(process.env["tablelogin"], {
        hashKey : 'userId',
        timestamps : true,
        schema : {
          userId :Joi.number(),
          username:Joi.string(),
          password:Joi.string()
        }
      });
      loginTable.config({tableName: process.env["tablelogin"]});
    return loginTable;
}

var devicelogsSchema=()=>{
    var logTable = dynamo.define(process.env["tablelogs"], {
        hashKey : 'lastUpdatedOn',
        timestamps : true,
        schema : {
          IMEI :Joi.number(),
          deviceName:Joi.string(),
          deviceModel:Joi.string(),
          owner:Joi.string(),
          lastUpdatedOn:Joi.date(),
          Comment:Joi.string()
        }
      });
      logTable.config({tableName: process.env["tablelogs"]});
    return logTable;
}
 
   
//////////////////////end///////////////////////



var app=express();
app.use(cors());
app.use(express.static(__dirname+process.env["publicpath"]));
hbs.registerPartials(__dirname+process.env["partialpath"]);
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

hbs.registerHelper('getFullYear',()=>{
 return new Date().getFullYear();
});
hbs.registerHelper('edit',()=>{
    console.log('edit');
    return true;
   });
   hbs.registerHelper('iscancel',()=>{
    return true;
   }); 
 


hbs.registerHelper('toUpperCase',(text)=>{
    return text.toUpperCase();
   });
   hbs.registerHelper('dateFormat',(date)=>{
       console.log("date:- ",date);
    return moment(date).format(process.env["dateformat"]);
   });  
   
app.set(process.env["viewengine"],process.env["hbs"]);

app.use((req,res,next)=>{
    var now=new Date().toString();
    var logs=`${now}, ${req.method}, ${req.url}`;
   console.log(logs);
   fs.appendFile('server.log',logs+'\n',function(err){
       if(err){
           console.log('Unable to do this');
       }
   });
    next();
})

app.use(express.static(__dirname+'..'+process.env["publicpath"]));
app.get('/isInsert',(req,res)=>{
    if(req.query.i==1){
        res.render(process.env["alldevice"],{
            title:title,
        }); 
    }
});
app.post('/isSuccess',(req,res)=>{
    params = {
        TableName : process.env["tablelogin"],
        FilterExpression : process.env["FilterExpression"],
         ExpressionAttributeNames :  {"#username" : "username","#password" : "password"},
        ExpressionAttributeValues : {':username' : req.body.username,':password' : req.body.password}
    };
    
    docClient.scan(params, function(err, data) {
        if (err) {
            console.error("Unable to read item. Error JSON:", JSON.stringify(err,null, 2));
        } else {
            console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
            if(data.Items.length>0){
                localStorage.setItem('myKey', JSON.stringify(data.Items[0].userId));
                localStorage.setItem('data',{});
                var params1 = { TableName: process.env["tabledevices"]};
                docClient.scan(params1, onScan);
                var count = 0;
                function onScan(err, data) {
                    console.log(data);
                    for(var i=0;i<data.Items.length;i++){
                        data.Items[i].isEdit=process.env["none"]; 
                        data.Items[i].isEditS=process.env["block"]; 
                        data.Items[i].nodata=process.env["none"]; 
                        data.Items[i].record='';

                      }
                      localStorage.setItem('data',JSON.stringify(data.Items));
                     
                        res.render(process.env["alldevice"],{
                            title:title,
                            items:data.Items
                        });
                    }
           
            }
            else{
                res.status(400).send({status:'failed'});
                res.render(process.env["login"],{
                    title:process.env["logintitle"]
                });
            }
           // 
           
        }
    });

    
});
app.get('/login',(req,res)=>{
    res.render(process.env["login"],{
        title:process.env["logintitle"]
    });
});
app.post('/insertData',(req,res)=>{
    console.log("insertData:- ",req.body);
   if(localStorage.getItem('myKey')==undefined ||localStorage.getItem('myKey')==null || localStorage.getItem('myKey')==''){
    res.render(process.env["login"],{
        title:process.env["logintitle"]
    });
   }
   else{
 console.log("requested data:- ",req.query.fromEdit);
    var mySecondTable=schemeData();
    var logTable=devicelogsSchema();
    var itemLog={IMEI:req.body.imei,deviceName: req.body.deviceName
    ,deviceModel:req.body.deviceModal,owner:req.body.owner,lastUpdatedOn:new Date().getTime()
    ,Comment:req.body.comment};
  

    var item={IMEI:req.body.imei,deviceName: req.body.deviceName
        ,deviceModel:req.body.deviceModal,owner:req.body.owner,lastUpdatedOn:moment().format()
        ,Comment:req.body.comment};
     mySecondTable.create(item, function (err, rec) {
      if(err){
          console.log('Error:- ',err);
       }
      else{
        console.log('created account in DynamoDB',rec.get('IMEI'));
        logTable.create(itemLog, function (err, rec) {   
        });
        var params = { TableName: process.env["tabledevices"]};
        docClient.scan(params, onScan);
        var count = 0;
        function onScan(err, data) {
            localStorage.setItem("search",undefined);
            localStorage.setItem("data",JSON.stringify(data.Items));
            for(var i=0;i<data.Items.length;i++){
                data.Items[i].isEdit=process.env["none"]; 
                data.Items[i].isEditS=process.env["block"]; 
                data.Items[i].nodata=process.env["none"]; 
                data.Items[i].record='';
              }
                res.render(process.env["alldevice"],{
                    title:title,
                    items:data.Items
                });
            }
        }
      
        });
    }
});
var port = process.env.PORT || 3000;
var server = app.listen(port,()=> {
    console.log('Server running at http://127.0.0.1:' + port + '/login');
});


app.get('/allDevice',(req,res)=>{
    if(localStorage.getItem('myKey')==undefined ||localStorage.getItem('myKey')==null || localStorage.getItem('myKey')==''){
        res.render(process.env["login"],{
            title:process.env["logintitle"]
        });
       }
      else{
       
    if(req.query.search!=undefined && req.query.search!=null && req.query.search!=''){
        localStorage.setItem('search','undefined');  
        var data=[];
        var filterArray=[];
     localStorage.setItem('search',req.query.search);
        var jsondata=JSON.parse(localStorage.getItem('data'));
        console.log("Record",jsondata,undefined,2);
        data.Items=jsondata;
       
        if(data.Items.length>0){
          for(var i=0;i<data.Items.length;i++){
             if(req.query.index==i){
                data.Items[i].isEdit=process.env["block"]; 
                data.Items[i].isEditS=process.env["none"]; 
                data.Items[i].nodata=process.env["none"];
                data.Items[i].record='';
             }
             else{
                data.Items[i].isEdit=process.env["none"]; 
                data.Items[i].isEditS=process.env["block"]; 
                data.Items[i].nodata=process.env["none"];
                data.Items[i].record='';
             }
            
          }

        }
            filterArray.push(req.query.search);  //data come from query string
          var filtered = data.Items.filter(function(item) {
            return filterArray.indexOf(item.IMEI) !== -1;
        });
          if(filtered.length<=0){
            filtered.push({nodata:'',record:process.env["none"]});
          }
            res.render(process.env["alldevice"],{
                title:title,
                items:filtered
            });
    }
    else if(req.query.edit==process.env["true"]){
        var filterArray=[];
        var data=[];
        console.log(req.query.edit+"--"+req.query.index);
        console.log("search:- ",localStorage.getItem('search'));
       var filtered=[];
            var jsondata=JSON.parse(localStorage.getItem('data'));
            console.log("Record",jsondata,undefined,2);
            data.Items=jsondata;
            if(localStorage.getItem('search')!='undefined' && localStorage.getItem('search')!=undefined && localStorage.getItem('search')!=null){
                filterArray[0] =parseInt(localStorage.getItem('search'));  //data come from query string
                    filtered = data.Items.filter(function(item) {
                    return filterArray.indexOf(item.IMEI) !== -1;
                    });
                    if(filtered.length>0){
                        filtered[0].isEdit=process.env["block"]; 
                        filtered[0].isEditS=process.env["none"]; 
                        filtered[0].nodata=process.env["none"];
                        filtered[0].record='';
                      }
                res.render(process.env["alldevice"],{
                        title:title,
                        items:filtered
                    });    
            }
            else{
               
                if(data.Items.length>0){
                    for(var i=0;i<data.Items.length;i++){
                       if(req.query.index==i){
                          data.Items[i].isEdit=process.env["block"]; 
                          data.Items[i].isEditS=process.env["none"]; 
                          data.Items[i].nodata=process.env["none"];
                          data.Items[i].record='';
                       }
                       else{
                          data.Items[i].isEdit=process.env["none"]; 
                          data.Items[i].isEditS=process.env["block"]; 
                          data.Items[i].nodata=process.env["none"];
                          data.Items[i].record='';
                       }
                      
                    }
      
                  }
              res.render(process.env["alldevice"],{
                    title:title,
                    items:data.Items
                });
            }
    }
    else{
    var params = { TableName:process.env["tabledevices"]};
    docClient.scan(params, onScan);
    var count = 0;
    function onScan(err, data) {
        console.log(data);
        if(data.Items.length>0){
            console.log("this is else");
            localStorage.setItem('search','undefined');  
          for(var i=0;i<data.Items.length;i++){
            data.Items[i].isEdit=process.env["none"]; 
            data.Items[i].isEditS=process.env["block"]; 
            data.Items[i].nodata=process.env["none"];
            data.Items[i].record='';
          }
        }
        else{
            data.Items.push({nodata:'',record:process.env["none"]});
         }
            res.render(process.env["alldevice"],{
                title:title,
                items:data.Items
            });
     }
    }
 }
});

  app.get('/createTable', (req,res)=>{
    var mySecondTable=schemeData();
    dynamo.createTables((err)=> {
        if (err) {
          console.log('Error creating tables: ', err);
        } else {
          console.log('Tables has been created');
            res.status(200).send("Table Created");
        }
      });
 });      
 app.get('/createLogTable', (req,res)=>{
    var mylogtable=devicelogsSchema();
    dynamo.createTables((err)=> {
        if (err) {
          console.log('Error creating tables: ', err);
        } else {
          console.log('Tables has been created');
          res.status(200).send("Log Table has been created");
           
        }
      });
 });      