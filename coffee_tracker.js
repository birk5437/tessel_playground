var Keen = require('keen.io');

console.log("creating new Keen");

var client = Keen.configure({
  projectId: "54caabbf90e4bd37a16075cf",   // String (required)
  writeKey: "3190335c242e1f3609348d9f7502f86e53fb0f5630745b63baa4a2b864d4aa526ea91cd8363a555224a013a3b909347eb2733e6a549b0e467757b49a15a8f9b47c94f914e84a43285a34ab0b25adbfbc636f4553e487105399fdccf9b5c05afa3060fe6dbf75b03f6b8351d03dd02b81",     // String (required for sending data)
  readKey: "62aca05d71beaf6738ed65957b23b788a49997539a847375e2d252d3753b1de2338da2a66e9089eda241f5eb0c15b018da90ecd1024cefd3386630df114fe9ba635dc4689e6be97c65f22a702483609181156ecf4d090a4a17e5e995efa0c0f1903868a9f1a918c1a964c90d4d1618a2",       // String (required for querying data)
  protocol: "https",              // String (optional: https | http | auto)
  host: "api.keen.io/3.0",        // String (optional)
  requestType: "jsonp"            // String (optional: jsonp, xhr, beacon)
});

console.log("done");

var tessel = require('tessel');
var ambientlib = require('ambient-attx4');

var ambient = ambientlib.use(tessel.port['B']);
var soundKeenData = {};

ambient.on('ready', function () {
  console.log("ambient ready");
 // Get points of light and sound data.
  setInterval( function () {
    ambient.getLightLevel( function(err, ldata) {
      if (err) throw err;
      ambient.getSoundLevel( function(err, sdata) {
        if (err) throw err;

        soundKeenData = {
          sound_level: sdata.toFixed(8),
          keen: {
            timestamp: new Date().toISOString()
          }
        };

        client.addEvent("sound_levels", soundKeenData);
        console.log("Light level:", ldata.toFixed(8), " ", "Sound Level:", sdata.toFixed(8));
    });
  })}, 500); // The readings will happen every .5 seconds unless the trigger is hit

  ambient.setLightTrigger(0.5);

  // Set a light level trigger
  // The trigger is a float between 0 and 1
  ambient.on('light-trigger', function(data) {
    console.log("Our light trigger was hit:", data);

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

    // Clear it
    ambient.clearSoundTrigger();

    //After 1.5 seconds reset sound trigger
    setTimeout(function () {

        ambient.setSoundTrigger(0.1);

    },1500);

  });
});

ambient.on('error', function (err) {
  console.log(err)
});