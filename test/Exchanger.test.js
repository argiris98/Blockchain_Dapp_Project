const Token = artifacts.require('AdamToken')
const Exchanger = artifacts.require('Exchanger')

require('chai')
  .use(require('chai-as-promised'))
  .should()

function tokens(n) {
  return web3.utils.toWei(n, 'ether'); // Convert tokens to Wei to use 1 million insted of 18 decimals
}

contract('Exchanger', ([deployer, investor]) => {
  let token, exchanger

  before(async () => {
    token = await Token.new()
    exchanger = await Exchanger.new(token.address)
    // Transfer all tokens to Exchanger (1 million)
    await token.transfer(exchanger.address, tokens('1000000'))
  })

  describe('Token deployment', async () => {
    it('contract has a name', async () => {
      const name = await token.name()
      assert.equal(name, 'AdamToken')
    })
  })

  describe('Exchanger deployment', async () => {
    it('contract has a name', async () => {
      const name = await exchanger.name()
      assert.equal(name, 'Exchange Ether with AdamToken')
    })

    it('contract has tokens', async () => {
      let balance = await token.balanceOf(exchanger.address)
      assert.equal(balance.toString(), tokens('1000000'))
    })
  })

  describe('buyTokens()', async () => {
    let result

    before(async () => {
      // Purchase tokens before each example
      result = await exchanger.buyTokens({ from: investor, value: web3.utils.toWei('1', 'ether')})
    })

    it('Allows user to instantly purchase tokens from exchanger for a fixed price', async () => {
      // Check investor token balance after purchase
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('100'))

      // Check exchanger balance after purchase
      let exchangerBalance
      exchangerBalance = await token.balanceOf(exchanger.address)
      assert.equal(exchangerBalance.toString(), tokens('999900'))
      exchangerBalance = await web3.eth.getBalance(exchanger.address)
      assert.equal(exchangerBalance.toString(), web3.utils.toWei('1', 'Ether'))

      // Check logs to ensure event was emitted with correct data
      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('100').toString())
      assert.equal(event.rate.toString(), '100')
    })
  })

  describe('sellTokens()', async () => {
    let result

    before(async () => {
      // Investor must approve tokens before the purchase
      await token.approve(exchanger.address, tokens('100'), { from: investor })
      // Investor sells tokens
      result = await exchanger.sellTokens(tokens('100'), { from: investor })
    })

    it('Allows user to instantly sell tokens to exchanger for a fixed price', async () => {
      // Check investor token balance after purchase
      let investorBalance = await token.balanceOf(investor)
      assert.equal(investorBalance.toString(), tokens('0'))

      // Check exchanger balance after purchase
      let exchangerBalance
      exchangerBalance = await token.balanceOf(exchanger.address)
      assert.equal(exchangerBalance.toString(), tokens('1000000'))
      exchangerBalance = await web3.eth.getBalance(exchanger.address)
      assert.equal(exchangerBalance.toString(), web3.utils.toWei('0', 'Ether'))

      // Check logs to ensure event was emitted with correct data
      const event = result.logs[0].args
      assert.equal(event.account, investor)
      assert.equal(event.token, token.address)
      assert.equal(event.amount.toString(), tokens('100').toString())
      assert.equal(event.rate.toString(), '100')

      // FAILURE: investor can't sell more tokens than they have
      await exchanger.sellTokens(tokens('500'), { from: investor }).should.be.rejected;
    })
  })

})
