var express = require('express');
var router = express.Router();
const Speech = require('@google-cloud/speech');
var mysql      = require('mysql');
var sm      = require('../sm');

var dbInsert = function(order) {
  var connection = mysql.createConnection({
    host: sm.settings.host,
    port: sm.settings.port,
    user: sm.settings.user,
    password: sm.settings.password,
    database: sm.settings.database,
  });

  connection.connect();

  var query = connection.query('INSERT INTO orders SET ?', order, function (error, results, fields) {
    if (error) throw error;
    //console.log(error);
  });
  console.log(query.sql);

  connection.end();
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
    //byte-=128;  //проходит без нормализации и сдвига вниз
    bytes.push(byte);
    bytes.push(0);
  }
  return bytes;
}

router.post('/', function(req, res, next) {
  var date1=new Date();

  if (req.body["file"]!==undefined) {
    const speechClient = Speech({
      keyFilename: sm.settings.keyFilename
    });

    const source = {
      content: Buffer.from(hex8to16bin(req.body["file"]))
    };

    const options = {
      encoding: 'LINEAR16',
      sampleRate: 8000,
      languageCode: 'ru-RU'
    };

    speechClient.recognize(source, options)
      .then(
        (results) => {
          const transcription = results[0];
          console.log(`Transcription: ${transcription}`);
          console.log("2- "+(new Date()-date1)+" ms");

          var order  = {key: req.body["key"], message: transcription};
          //dbInsert(order);
  },
    (error ) => {
      console.log(error);
      console.log("2- "+(new Date()-date1)+" ms");
    });

    res.send('OK');
  }
  else {
    var err = new Error();
    err.status = 500;
    err.message = 'Payload is required';
    next(err);
  }
});

router.post('/16bit', function(req, res, next) {
  var date1=new Date();

  if (req.body["file"]!==undefined) {

      setImmediate(() => {

        const speechClient = Speech({
          keyFilename: sm.settings.keyFilename
        });

        const source = {
          content: new Buffer(req.body["file"], 'hex')
        };

        const options = {
            encoding: 'LINEAR16',
            sampleRate: 11025,
            languageCode: 'ru-RU'
        };

        speechClient.recognize(source, options)
            .then(
              (results) => {
                const transcription = results[0];
                console.log("Transcription: "+transcription);//["transcript"]+" q="+transcription["confidence"]
                console.log("2- "+(new Date()-date1)+" ms");

                var order  = {key: req.body["key"], message: transcription};
	              //dbInsert(order);
              },
              (error ) => {
                console.log(error);
                console.log("2- "+(new Date()-date1)+" ms");
              });
      });
      res.send('OK');
  }
  else {
    var err = new Error();
    err.status = 500;
    err.message = 'Payload is required';
    next(err);
  }
});


/*router.get('/', function(req, res, next) {
  res.send('GET OK');
  var date1 = new Date();

  const speech = Speech({
    keyFilename: "c:\\MyProjects\\_WebstormProjects\\SmartMagnetWebService\\Smart Magnet-d795ce3f0f1f.json", //SOK Project-9fba39f7c2ec.json"
  });
  const fileName = 'c:\\MyProjects\\Sound2.raw';
  const request = {
    encoding: 'LINEAR16',
    sampleRate: 11025,
    languageCode: 'ru-RU'
  };

  speech.startRecognition(fileName, request)
    .then((results) => {
      const operation = results[0];
      console.log("1- "+(new Date()-date1)+" ms");
      return operation.promise();
    })
    .then((transcription) => {
      console.log(`Transcription: ${transcription}`);

      console.log("2- "+(new Date()-date1)+" ms");
    });

  console.log('hop-hey-la-la-ley');
});*/

module.exports = router;
