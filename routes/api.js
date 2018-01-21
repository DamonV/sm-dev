var express = require('express');
var router = express.Router();
const Speech = require('@google-cloud/speech');
var mysql      = require('mysql');
var sm      = require('../sm');
var wav = require('../wavmaker');
var fs = require('fs');

var dbInsert = function(record) {
  var connection = mysql.createConnection({
    host: sm.settings.host,
    port: sm.settings.port,
    user: sm.settings.user,
    password: sm.settings.password,
    database: sm.settings.database
  });

  connection.connect();
  var query = connection.query('INSERT INTO orders SET ?', record, function (error, results, fields) {
    if (error) console.log(error);
  });
  connection.end();
  return query.sql;
}

var wavCreate = function(buffer, sampleRate, bytes, filename) {
    const path = sm.settings.localPathWav+filename;

    var wm = new wav.wavMaker({sampleRate: sampleRate, channels: 1, bytes: bytes});
    var buffer2=wm.makeWav(buffer);

    fs.open(path, 'w', function(err, fd) {
        if (err) {
            console.log('error opening file '+filename+' : ' + err);
        } else fs.write(fd, buffer2, 0, buffer2.length, null, function(err) {
            if (err) console.log('error writing file '+filename+' : ' + err);
            else fs.close(fd, function() {
            })
        });
    });
}

router.post('/', function(req, res, next) {
  var date1=new Date();

  if (req.body["file"]!==undefined && req.body["id"]!==undefined && req.body["file"] && req.body["id"]) {
    const speechClient = Speech({
      keyFilename: sm.settings.keyFilename
    });

    const audio = {
      content: Buffer.from(hex8to16bin(req.body["file"]))
    };

    const config = {
      encoding: Speech.v1.types.RecognitionConfig.AudioEncoding.LINEAR16,
      sampleRateHertz: 8000,
      languageCode: 'ru-RU'
    };

    const request = {
      config: config,
      audio: audio
    };

    speechClient.recognize(request)
      .then(
        (results) => {
          var recPeriod=(new Date()-date1);
          var transcription;
          try{
              transcription = results[0].results[0].alternatives[0].transcript;
          }catch(e){
              transcription='?';
          };
          const filename = 'v'+req.body["id"]+(new Date()).getTime()+'.wav';
          var order  = {
            uid_device: req.body["id"],
            message: transcription,
            ref_wav: sm.settings.urlPathWav+filename
          };
          if (req.body["key"]!==undefined) order.key=req.body["key"];
          try{
            order.confidence=results[0].results[0].alternatives[0].confidence;
          }catch(e){};
          var querySql=dbInsert(order);
          console.log(curDateStr()+" | recognize "+recPeriod+" ms | overall "+(new Date()-date1)+" ms | "+querySql);

          wavCreate(audio.content, config.sampleRateHertz, 2, filename);

        },
        (error ) => {
          console.log(error);
        });

    res.send('OK');
  }
  else {
    var err = new Error();
    err.status = 500;
    err.message = 'Request is incorrect';
    next(err);
  }
});

router.post('/16bit', function(req, res, next) {
  var date1=new Date();

  if (req.body["file"]!==undefined && req.body["id"]!==undefined && req.body["file"] && req.body["id"]) {

      setImmediate(() => {

        const speechClient = Speech({
          keyFilename: sm.settings.keyFilename
        });

        const audio = {
          content: new Buffer(req.body["file"], 'hex')
        };

        const config = {
            encoding: Speech.v1.types.RecognitionConfig.AudioEncoding.LINEAR16,
            sampleRateHertz: 8000,
            languageCode: 'ru-RU'
        };

        const request = {
            config: config,
            audio: audio
        };

        speechClient.recognize(request)
        .then(
          (results) => {
            var recPeriod=(new Date()-date1);
            var transcription;
            try{
                transcription = results[0].results[0].alternatives[0].transcript;
            }catch(e){
                transcription='?';
            };
            const filename = 'w'+req.body["id"]+(new Date()).getTime()+'.wav';
            var order  = {
              uid_device: req.body["id"],
              message: transcription,
              ref_wav: sm.settings.urlPathWav+filename
            };
            if (req.body["key"]!==undefined) order.key=req.body["key"];
            try{
              order.confidence=results[0].results[0].alternatives[0].confidence;
            }catch(e){};
            var querySql=dbInsert(order);
            console.log(curDateStr()+" | recognize "+recPeriod+" ms | overall "+(new Date()-date1)+" ms | "+querySql);

            wavCreate(audio.content, config.sampleRateHertz, 2, filename);
          },
          (error ) => {
            console.log(error);
            //console.log("2- "+(new Date()-date1)+" ms");
          });
      });
      res.send('OK');
  }
  else {
    var err = new Error();
    err.status = 500;
    err.message = 'Request is incorrect';
    next(err);
  }
});


var curDateStr = function(){
  var date = new Date();
  var options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timezone: 'UTC+3',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  };
  return date.toLocaleString("ru", options);
}

var hex8to16bin = function(hexStr){
  var bytes = [];
  if (typeof hexStr != "string") return bytes;

  var n0="0".charCodeAt(0);
  var n9="9".charCodeAt(0);
  var A="A".charCodeAt(0);
  var F="F".charCodeAt(0);
  var a="a".charCodeAt(0);
  var f="f".charCodeAt(0);
  var byte;

  for(var i=0; i<hexStr.length; i+=2){
    byte=0;
    for(var j=0; j<2 && (i+j)<hexStr.length; ++j) {
      var symb=hexStr.charCodeAt(i + j);
      if (symb >= n0 && symb <= n9) {
        byte += (symb - n0) * (j == 0 ? 16 : 1);
      }
      else if (symb >= a && symb <= f) {
        byte += (symb - a + 10) * (j == 0 ? 16 : 1);
      }
      else if (symb >= A && symb <= F) {
        byte += (symb - A + 10) * (j == 0 ? 16 : 1);
      }
    }
    byte-=128;
    bytes.push(0);  //*256
    bytes.push(byte & 0x000000ff);
  }
  return bytes;
}

module.exports = router;
