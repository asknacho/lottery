const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')
const web3 = new Web3(ganache.provider())
const { interface, bytecode } = require('../compile')

let accounts, lottery

beforeEach(async () => {
  accounts = await web3.eth.getAccounts()

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: '1000000'})
}); 

describe('Lottery', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address)
  })

  it('has a manager', async () => {
    const manager = await lottery.methods.manager().call({
      from: accounts[0]
    })
    assert.notEqual(manager, 0x0)
  })


  it('allows one account to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    })
    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    })

    assert.equal(accounts[0], players[0])
    assert.equal(1, players.length)

  })

  it('requires a minimum amount of wei to enter', async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: web3.utils.toWei('0.0001', 'ether')
      })
      assert(false)
    } catch (err) {
      assert(err)
    }
  })


  it('allows multiple accounts to enter', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('0.02', 'ether')
    })
    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('0.02', 'ether')
    })

    const players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    })

    assert.equal(accounts[0], players[0])
    assert.equal(accounts[1], players[1])
    assert.equal(2, players.length)
  })



  it('allows only the manager to pick the winner', async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1]
      })
      assert(false)
    } catch (err) {
      assert(err)
    }
  })
  
  it('sends money to the winner when pickWinner is called', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('2', 'ether')
    })

    const initialBalance = await web3.eth.getBalance(accounts[0])
    await lottery.methods.pickWinner().send({ from: accounts[0] })
    const finalBalance = await web3.eth.getBalance(accounts[0])
    const difference = finalBalance - initialBalance

    assert(difference > web3.utils.toWei('1.8','ether'))
  })

  it('resets the players list when pickWinner is called', async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei('2', 'ether')
    })
    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei('2', 'ether')
    })
    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei('2', 'ether')
    })

    let players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    })
    assert.equal(3, players.length)
    await lottery.methods.pickWinner().send({ from: accounts[0] })
    players = await lottery.methods.getPlayers().call({
      from: accounts[0]
    })
    assert.equal(0, players.length)
  })
})
