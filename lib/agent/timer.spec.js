var Timer = require('./timer')
var expect = require('chai').expect

describe('Timer', function () {
  it('should be constructible without arguments', function () {
    var timer = new Timer()
    expect(timer.task).to.be.undefined
  })
  it('should be constructible with a task', function () {
    var task = function () {}
    var timer = new Timer(task)
    expect(timer.task).to.eql(task)
  })
  it('should be ticking with argument given the constructor', function () {
    var task = this.sandbox.spy()
    var timer = new Timer(task, 1)

    var clock = this.sandbox.useFakeTimers()
    timer.start()
    clock.tick(3)
    timer.end()
    clock.restore()
    expect(task).to.have.been.calledThrice
  })
  it('should be ticking with the argument given to the start method', function () {
    var task = this.sandbox.spy()
    var timer = new Timer(task)

    var clock = this.sandbox.useFakeTimers()
    timer.start(1)
    clock.tick(3)
    timer.end()
    clock.restore()
    expect(task).to.have.been.calledThrice
  })
  it('shouldn\'t be restartable with start', function () {
    var task = this.sandbox.spy()
    var anotherTask = this.sandbox.spy()
    var timer = new Timer()
    var clock = this.sandbox.useFakeTimers()
    timer.task = task
    timer.start(1)
    clock.tick(1)
    timer.task = anotherTask
    timer.start()
    clock.tick(1)
    clock.tick(1)
    timer.end()
    clock.restore()
    expect(task).to.have.been.calledThrice
    expect(anotherTask).to.not.have.been.called
  })
  it('should be restartable with restart', function () {
    var task = this.sandbox.spy()
    var anotherTask = this.sandbox.spy()
    var timer = new Timer()
    var clock = this.sandbox.useFakeTimers()
    timer.task = task
    timer.start(1)
    clock.tick(1)
    timer.task = anotherTask
    timer.restart()
    clock.tick(1)
    clock.tick(1)
    timer.end()
    clock.restore()
    expect(task).to.have.been.calledOnce
    expect(anotherTask).to.have.been.calledTwice
  })
  it('should be stoppable with end', function () {
    var task = this.sandbox.spy()
    var timer = new Timer()
    var clock = this.sandbox.useFakeTimers()
    timer.task = task
    timer.start(1)
    clock.tick(1)
    clock.tick(1)
    timer.end()
    clock.tick(1)
    clock.restore()
    expect(task).to.have.been.calledTwice
  })
})
