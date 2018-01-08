const test = require('ava')
const path = require('path');
const Tracker = require('./tracker')
const dummyConfig = {
  trackerPath: path.join(__dirname, ),
}

const tracker = Tracker(dummyConfig)

test('exports an object', t => {
  t.is(typeof tracker, 'object')
})

test('has setActive and clearActive functions for tracking the active project', t => {
  t.is(typeof tracker.getActive, 'function')
  t.is(typeof tracker.setActive, 'function')
})

test('has resetSync and incrementSync for tracking unsynced changes', t => {
  t.is(typeof tracker.resetSync, 'function')
  t.is(typeof tracker.incrementSync, 'function')
})

test('has unsyncedChanges and lastSync functions for getting info about sync state', t => {
  t.is(typeof tracker.unsynced, 'function')
  t.is(typeof tracker.lastSync, 'function')
})

test('has getActive, hasActive and isActive for checking the state of the active project', t => {
  t.is(typeof tracker.getActive, 'function')
  t.is(typeof tracker.hasActive, 'function')
  t.is(typeof tracker.isActive, 'function')
})

