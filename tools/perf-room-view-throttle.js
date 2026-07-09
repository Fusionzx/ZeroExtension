'use strict';

const assert = require('assert');

function makeRoom(size) {
  const teams = [{ ba: 0 }, { ba: 1 }, { ba: 2 }];
  return {
    M: null,
    Ga: 3,
    kb: 3,
    Ac: false,
    K: Array.from({ length: size }, (_, i) => ({
      Z: i + 1,
      fb: i % 7 === 0,
      zb: 'player-' + i,
      country: i % 2 ? 'br' : 'ar',
      D: i % 3,
      fa: teams[i % teams.length],
    })),
  };
}

function fullSig(room, localPlayer) {
  let players = room.K;
  let sig = (room.M ? '1' : '0') + ':' +
    (localPlayer ? localPlayer.Z + ',' + (localPlayer.fb ? '1' : '0') : 'n') + ':' +
    room.Ga + ':' + room.kb + ':' + (room.Ac ? '1' : '0') + ':' + players.length;
  for (let i = 0; i < players.length;) {
    let p = players[i++];
    let team = p.fa.ba === 1 ? 1 : p.fa.ba === 2 ? 2 : 0;
    sig += '|' + p.Z + ',' + team + ',' + (p.fb ? 1 : 0) + ',' + p.zb + ',' + (p.country || '') + ',' + p.D;
  }
  return sig;
}

function fastSig(room, localPlayer) {
  return (room.M ? '1' : '0') + ':' +
    (localPlayer ? localPlayer.Z + ',' + (localPlayer.fb ? '1' : '0') : 'n') + ':' +
    room.Ga + ':' + room.kb + ':' + (room.Ac ? '1' : '0') + ':' + room.K.length;
}

function makeOptimizedUpdater(clock) {
  return {
    hxdRoomViewLastCheck: 0,
    hxdRoomViewLastFastSig: '',
    hxdRoomViewLastSig: '',
    updates: 0,
    fullChecks: 0,
    hxdRoomViewFastSig: fastSig,
    hxdRoomViewSig(room, localPlayer) {
      this.fullChecks++;
      return fullSig(room, localPlayer);
    },
    update(room, localPlayer) {
      let now = clock.now;
      let quick = this.hxdRoomViewFastSig(room, localPlayer);
      let lastCheck = this.hxdRoomViewLastCheck || 0;
      if (quick === this.hxdRoomViewLastFastSig && 220 > now - lastCheck) return;
      this.hxdRoomViewLastFastSig = quick;
      this.hxdRoomViewLastCheck = now;
      let sig = this.hxdRoomViewSig(room, localPlayer);
      if (sig === this.hxdRoomViewLastSig) return;
      this.hxdRoomViewLastSig = sig;
      this.updates++;
    },
  };
}

function makeOldUpdater(clock) {
  return {
    hxdRoomViewLastUpdate: 0,
    hxdRoomViewLastSig: '',
    updates: 0,
    fullChecks: 0,
    update(room, localPlayer) {
      let now = clock.now;
      let sig = fullSig(room, localPlayer);
      this.fullChecks++;
      if (sig === this.hxdRoomViewLastSig && 180 > now - this.hxdRoomViewLastUpdate) return;
      this.hxdRoomViewLastSig = sig;
      this.hxdRoomViewLastUpdate = now;
      this.updates++;
    },
  };
}

function run(updaterFactory, frames, roomSize) {
  const clock = { now: 0 };
  const room = makeRoom(roomSize);
  const localPlayer = room.K[0];
  const updater = updaterFactory(clock);
  for (let i = 0; i < frames; i++) {
    updater.update(room, localPlayer);
    clock.now += 1000 / 60;
  }
  return updater;
}

const frames = 600;
const oldResult = run(makeOldUpdater, frames, 120);
const optimizedResult = run(makeOptimizedUpdater, frames, 120);

assert.strictEqual(oldResult.fullChecks, frames, 'old path should check full signature every frame');
assert(optimizedResult.fullChecks < frames / 6, 'optimized path should avoid full signature per frame');
assert.strictEqual(optimizedResult.updates, 1, 'unchanged room should update DOM once');

console.log(JSON.stringify({
  ok: true,
  frames,
  oldFullChecks: oldResult.fullChecks,
  optimizedFullChecks: optimizedResult.fullChecks,
  oldUpdates: oldResult.updates,
  optimizedUpdates: optimizedResult.updates,
  avoidedFullChecks: oldResult.fullChecks - optimizedResult.fullChecks,
}, null, 2));
