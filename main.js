#!/usr/bin/env nodejs
const LinuxInputListener = require("linux-input-device");
const input = new LinuxInputListener("/dev/input/event0");

// Keycodes from https://github.com/spotify/linux/blob/master/include/linux/input.h
const KEY_WAKEUP = 143;
const KEY_PLAYCD = 200;
const KEY_AUX = 0x186;
const KEY_TUNER = 0x182;
const KEY_MODE = 0x175;
const KEY_PROGRAM = 0x16a;
const KEY_REDO = 0x182;
const KEY_SLEEP = 142;
const KEY_TEXT = 0x184;
const KEY_1 = 2;
const KEY_2 = 3;
const KEY_3 = 4;
const KEY_BASSBOOST = 209;
const KEY_INFO = 0x166;
const KEY_CYCLEWINDOWS = 154;
const KEY_STOP = 128;
const KEY_NEXT = 0x197;
const KEY_PREVIOUS = 0x19c;
const KEY_VOLUMEDOWN = 114;
const KEY_VOLUMEUP = 115;

function run(cmd) {
  const exec = require("child_process").exec;

  return new Promise(function(resolve, reject) {
    function trace(error, stdout, stderr) {
      if (error) {
        reject(error, stderr);
        return;
      }
      resolve(stdout, stderr);
    }
    exec(cmd, trace);
  });
}

input.on("state", function(value, key, kind) {
  console.log("State is now:", value, "for key", key, "of kind", kind);
  if (!value) {
    return;
  }

  switch (key) {
    case KEY_AUX:
      run("mpc toggle");
      break;
    case KEY_VOLUMEDOWN:
      run("mpc volume -15");
      break;
    case KEY_VOLUMEUP:
      run("mpc volume +15");
      break;
    case KEY_NEXT:
      run("mpc next");
      break;
    case KEY_PREVIOUS:
      run("mpc prev");
      break;
    case KEY_PROGRAM:
      run("mpc random");
      break;
    case KEY_STOP:
      run("mpc stop");
      break;
    case KEY_TEXT:
      run("mpc current").then(stdout => run('espeak "' + stdout + '" -a 900'));
      break;
  }
});

input.on("error", console.error);

//start by querying for the initial state.
input.on("open", () => input.query("EV_SW", 0));
