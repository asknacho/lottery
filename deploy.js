const HDWalletProvider = require('truffle-hdwallet-provider')
const Web3 = require('web3')
const { interface, bytecode } = require('./compile')

const provider = new HDWalletProvider(
  'super course taxi ostrich grain garbage inspire purity section flag trigger save',
  'https://rinkeby.infura.io/KOYtjmFJWQ6FqD4c3Npx'
)
const web3 = new Web3(provider)

const deploy = async () => {
  const accounts = await web3.eth.getAccounts()
  console.log('Attempting to deploy from account', accounts[0])

  const lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode})
    .send({ from: accounts[0], gas: '1000000' })

  console.log('Contract address', lottery.options.address)
}

deploy()
