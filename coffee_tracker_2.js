 
var Keen = require('keen.io');
var wifi = require('wifi-cc3000');
 
var keen = Keen.configure({
    projectId: "54caabbf90e4bd37a16075cf",
    writeKey: "3190335c242e1f3609348d9f7502f86e53fb0f5630745b63baa4a2b864d4aa526ea91cd8363a555224a013a3b909347eb2733e6a549b0e467757b49a15a8f9b47c94f914e84a43285a34ab0b25adbfbc636f4553e487105399fdccf9b5c05afa3060fe6dbf75b03f6b8351d03dd02b81",
    readKey: "62aca05d71beaf6738ed65957b23b788a49997539a847375e2d252d3753b1de2338da2a66e9089eda241f5eb0c15b018da90ecd1024cefd3386630df114fe9ba635dc4689e6be97c65f22a702483609181156ecf4d090a4a17e5e995efa0c0f1903868a9f1a918c1a964c90d4d1618a2"
});
 
// src colony modules tls.js
 
var tessel = require('tessel');

var climatelib = require('climate-si7020');
var ambientlib = require('ambient-attx4');
 
var climate = climatelib.use(tessel.port['A']);
var ambient = ambientlib.use(tessel.port['B']);

 
//------------------------------------------------
// Climate Temp and Humidity
//------------------------------------------------

climate.on('ready', function () {
  console.log('Connected to si7020');
  ambient.on('ready', function () {
 
    // Loop forever
    setInterval(function () {
      climate.readTemperature('f', function (err, temp) {
        climate.readHumidity(function (err, humid) {
          ambient.getLightLevel( function (err, light) {
            ambient.getSoundLevel( function (err, sound) {
        
              console.log('Degrees:', temp.toFixed(4) + 'F', 'Humidity:', humid.toFixed(4) + '%RH');
              console.log("Light level:", light.toFixed(8), " ", "Sound Level:", sound.toFixed(8));
              if (wifi.isConnected()) {
                sendToCloud(temp, humid, light, sound, function(){
                  setTimeout(loop, 10000);
                });

              } else {
                console.log("nope not connected");
                setTimeout(loop, 10000);
              }
            });
          });
        });
      });
    }, 500);
    ambient.setLightTrigger(0.5);

    // Set a light level trigger
    // The trigger is a float between 0 and 1
    ambient.on('light-trigger', function(data) {
      console.log("Our light trigger was hit:", data);
      if (wifi.isConnected()) {
        sendLightTrigger(data);
      } else {
        console.log("nope not connected");
      }
      // Clear the trigger so it stops firing
      ambient.clearLightTrigger();
      //After 1.5 seconds reset light trigger
      setTimeout(function () {

          ambient.setLightTrigger(0.5);

      },1500);
    });

    // Set a sound level trigger
    // The trigger is a float between 0 and 1
    ambient.setSoundTrigger(0.1);

    ambient.on('sound-trigger', function(data) {
      console.log("Something happened with sound: ", data);
      if (wifi.isConnected()) {
        sendSoundTrigger(data);

      } else {
        console.log("nope not connected");
      }
      // Clear it
      ambient.clearSoundTrigger();

      //After 1.5 seconds reset sound trigger
      setTimeout(function () {

          ambient.setSoundTrigger(0.1);

      },1500);

    });
  });
});
 
climate.on('error', function(err) {
  console.log('error connecting module', err);
});

ambient.on('error', function (err) {
  console.log(err);
});

function sendToCloud(tdata, hdata, ldata, sdata, cb){
  keen.addEvent("climate", {
   "temp": tdata,
   "humidity": hdata,
   "light": ldata,
   "sound": sdata
  }, function(){
    console.log("added event");
    cb();
  });
}

function sendLightTrigger(data){
  keen.addEvent("climate", {
   "light-trigger": data
  }, function(){
    console.log("added event");
  });
}

function sendSoundTrigger(data){
  keen.addEvent("climate", {
   "sound-trigger": data
  }, function(){
    console.log("added event");
  });
}
 
wifi.on('disconnect', function(){
  console.log("disconnected, trying to reconnect");
  wifi.connect({
    ssid: 'MOBI',
    password: //insert pw here!
  });
});

