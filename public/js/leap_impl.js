var paused = false;
window.onkeypress = function(e) {
  if (e.charCode == 32) {
    if (paused == false) {
      paused = true;
    } else {
      paused = false;
    }
  }
};
var controller = new Leap.Controller({enableGestures: true});
controller.loop(function(frame) {
  latestFrame = frame;
  for (var i in frame.handsMap) {
    var hand = frame.handsMap[i];
    camera.rotation.set(hand.pitch(), -hand.yaw(), hand.roll());
  }
});
controller.on('ready', function() {
    console.log("ready");
});
controller.on('connect', function() {
    console.log("connect");
});
controller.on('disconnect', function() {
    console.log("disconnect");
});
controller.on('focus', function() {
    console.log("focus");
});
controller.on('blur', function() {
    console.log("blur");
});
controller.on('deviceConnected', function() {
    console.log("deviceConnected");
});
controller.on('deviceDisconnected', function() {
    console.log("deviceDisconnected");
});