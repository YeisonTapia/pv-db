'use strict'

const test = require('ava')

const config = {
  logging: function () {

  }
}
let db = null

test.beforeEach(async () => {
  const setupDataBase = require('../')
  db = await setupDataBase(config)
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exist')
})
