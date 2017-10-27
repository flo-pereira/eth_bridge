const fs = require('fs');
const path = require('path');
const prompt = require('prompt');
const solc = require('solc');
const Web3 = require('web3');
const colors = require('colors');

const isSolidityRegEx = /\.sol$/i;
const isSolidityFile = (filename) => isSolidityRegEx.test(filename);

const promptMainContractName = () => new Promise((resolve, reject) => {
  prompt.start();
  prompt.get({
    name: 'name',
    description: 'Main contract name',
  }, (err, result) => {
    if (err) {
      reject(err);
    }

    resolve(result.name);
  });
});

const promptCoinbasePassword = (coinbase) => new Promise((resolve, reject) => {
  prompt.start();
  prompt.get([{
    name: 'From',
    default: coinbase
  }, {
    name: 'password',
    description: 'Password',
    hidden: true,
  }], (err, result) => {
    if (err) {
      reject(err);
    }

    resolve(result.password);
  });
});

const filesToArray = (contractDir) => (sources, filename) => {
  sources[filename] = fs.readFileSync(path.join(contractDir, filename)).toString();
  return sources;
};

const getSources = (contractDir) => new Promise((resolve) => fs.readdir(contractDir, (error, files) => {
  const solidityFiles = files.filter(isSolidityFile);
  const sources = solidityFiles.reduce(filesToArray(contractDir), {});

  resolve(sources);
}));

class Builder {
  constructor(dir, name = null, output = null, ...options) {
    this.dir = dir;
    this.name = name;
    this.output = output;
    this.abi = null;
    this.bytecode = null;
    this.options = options;
  }

  async build() {
    let contractDir;

    try {
      contractDir = path.resolve(this.dir);
    } catch (err) {
      console.log('Please specify contracts directory'.red);
      return 1;
    }

    if (!fs.existsSync(contractDir)) {
      console.log(`Directory "${contractDir}" does not exist`.red);
      return 1;
    }

    try {
      console.log('Let\'s build contracts'.grey);
      const mainContractName = this.name || await promptMainContractName();
      const sources = await getSources(contractDir);
      const output = solc.compile({ sources }, 1);
      this.bytecode = `0x${output.contracts[`${mainContractName}.sol:${mainContractName}`].bytecode}`;
      this.abi = JSON.parse(output.contracts[`${mainContractName}.sol:${mainContractName}`].interface);

      if (this.output) {
        const buildPath = path.resolve(`${this.output}/${mainContractName}.json`);
        fs.writeFileSync(buildPath, JSON.stringify({
          abi: this.abi,
          bytecode: this.bytecode
        }, null, 2));
        console.log(`Contract builded: ${buildPath}`.green);
      }
    } catch (err) {
      console.log(err.message ? err.message.red : err.red);
    }
  };

  async deploy() {
    try {
      if (!this.bytecode || !this.abi) {
        await this.build();
      }

      const web3 = new Web3(new Web3.providers.HttpProvider(this.options.node || 'http://localhost:8545'));
      const contract = new web3.eth.Contract(this.abi);
      const coinbase = await web3.eth.getCoinbase();

      console.log(`Deploy contract (from:${coinbase})`.green);

      const password = await promptCoinbasePassword(coinbase);

      await web3.eth.personal.unlockAccount(coinbase, password, 15000);

      const transaction = await contract.deploy({
        data: this.bytecode,
      }).send({
        from: coinbase,
        gas: 1000000,
      });


      // Log the tx, you can explore status with eth.getTransaction()
      console.log(transaction);

      /*
            // If we have an address property, the contract was deployed
            if (response.address) {
              console.log('Contract address: ' + response.address);
              // Let's test the deployed contract
              testContract(response.address);
            }

            // Quick test the contract
            function testContract(address) {
              // Reference to the deployed contract
              const token = contract.at(address);
              // Destination account for test
              const dest_account = '0x002D61B362ead60A632c0e6B43fCff4A7a259285';

              // Assert initial account balance, should be 100000
              const balance1 = token.balances.call(web3.eth.coinbase);
              console.log(balance1 == 1000000);

              // Call the transfer function
              token.transfer(dest_account, 100, {from: web3.eth.coinbase}, (err, res) => {
                // Log transaction, in case you want to explore
                console.log('tx: ' + res);
                // Assert destination account balance, should be 100
                const balance2 = token.balances.call(dest_account);
                console.log(balance2 == 100);
              });
              */














    } catch (err) {
      console.log(err);
      console.log(err.message ? err.message.red : err.red);
    }
  };
};

module.exports = Builder;
