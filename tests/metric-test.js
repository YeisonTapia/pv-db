'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const agentFixtures = require('./fixtures/agent')
const metricFixtures = require('./fixtures/metric')

const config = {
  logging () {}
}

let MetricStub = null
let findByAgentUuidArgs = null
let findByTypeAgentUuidArgs = null
const id = 1
const uuid = 'yyy-yyy-yyy'
const type = "scanner"
let AgentStub = null
let db = null
let sandbox = null

const single = Object.assign({}, agentFixtures.single)

const connectedArgs = {
  where: { connected: true }
}

const usernameArgs = {
  where: { username: 'platzi', connected: true }
}

const uuidArgs = {
  where: { uuid }
}

const newAgent = {
  uuid: '123-123-123',
  name: 'test',
  username: 'test',
  hostname: 'test',
  pid: 0,
  connected: false
}

const newMetric = {
  type: 'type',
  value: 'fist',
}

test.beforeEach(async () => {
  sandbox = sinon.createSandbox()

  AgentStub = {
    hasMany: sandbox.spy()
  }

  MetricStub = {
    belongsTo: sandbox.spy()
  }

  findByAgentUuidArgs = {
    attributes: ['type'],
    group: ['type'],
    include: [{
      attributes: [],
      model: AgentStub,
      where: {
        uuid
      }
    }],
    raw: true
  }

  findByTypeAgentUuidArgs = {
    attributes: ['id', 'type', 'value', 'createdAt'],
    where: {
      type
    },
    limit: 20,
    order: [['createdAt', 'DESC']],
    include: [{
      attributes: [],
      model: AgentStub,
      where: {
        uuid
      }
    }],
    raw: true
  }

  // Model findAll 
  MetricStub.findAll = sandbox.stub()
  MetricStub.findAll.withArgs(findByAgentUuidArgs).returns(Promise.resolve(metricFixtures.findByAgentUuid(uuid)))
  MetricStub.findAll.withArgs(findByTypeAgentUuidArgs).returns(Promise.resolve(metricFixtures.findByTypeAgentUuid(type, uuid)))

  // Model Metric Create
  MetricStub.create = sandbox.stub()
  MetricStub.create.withArgs(newMetric).returns(Promise.resolve({
    toJSON () { return newMetric }
  }))

  // Model create Stub
  AgentStub.create = sandbox.stub()
  AgentStub.create.withArgs(newAgent).returns(Promise.resolve({
    toJSON () { return newAgent }
  }))

  // Model update Stub
  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  // Model findById Stub
  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)))

  // Model findOne Stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  // Model findAll Stub
  AgentStub.findAll = sandbox.stub()
  AgentStub.findAll.withArgs().returns(Promise.resolve(agentFixtures.all))
  AgentStub.findAll.withArgs(connectedArgs).returns(Promise.resolve(agentFixtures.connected))
  AgentStub.findAll.withArgs(usernameArgs).returns(Promise.resolve(agentFixtures.platzi))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })

  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sandbox.restore()
})

test.serial('Setup', t => {
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Metric#findByAgentUuid', async t => {
  const metric = await db.Metric.findByAgentUuid(uuid)
  t.true(MetricStub.findAll.called, 'findAll should be called on model')
  t.true(MetricStub.findAll.calledWith(findByAgentUuidArgs), 'findOne should be called with findByAgentUuidArgs as args')
  t.deepEqual(metric, metricFixtures.findByAgentUuid(uuid), 'should be the same')
})

test.serial('Metric#findByTypeAgentUuid', async t => {
  const metric = await db.Metric.findByTypeAgentUuid(type, uuid)
  t.true(MetricStub.findAll.called, 'findAll should be called on model')
  t.true(MetricStub.findAll.calledWith(findByTypeAgentUuidArgs), 'findOne should be called with findByTypeAgentUuidArgs as args')
  t.deepEqual(metric, metricFixtures.findByTypeAgentUuid(type, uuid), 'should be the same')
})

test.serial('Metric#create', async t => {
  const metric = await db.Metric.create(uuid, newMetric)
  t.true(MetricStub.create.called, 'create should be called on model')
  t.true(AgentStub.findOne.calledWith({ where : {uuid}}))
  t.true(MetricStub.create.calledWith(newMetric), 'findOne should be called with findByTypeAgentUuidArgs as args')
  t.deepEqual(metric, newMetric)
})