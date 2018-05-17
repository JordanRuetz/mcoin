var mcoin = artifacts.require("./mcoin.sol");

contract("mcoin", function(accounts) {
	var tokenInstance;

	it('initializes the contract with the correct values', function() {
		return mcoin.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.name();
		}).then(function(name) {
			assert.equal(name, 'mcoin', 'token has the correct name');
			return tokenInstance.symbol();
		}).then(function(symbol) {
			assert.equal(symbol, 'MCO', 'token has the correct symbol');
			return tokenInstance.standard();
		}).then(function(standard) {
			assert.equal(standard, 'mcoin v1.0', 'has the correct standard');
		});
	});

	it('allocates the intial supply upon deployment', function() {
		return mcoin.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.totalSupply();
		}).then(function(totalSupply) {
			assert.equal(totalSupply.toNumber(), 1000000, 'sets total supply to 1,000,000');
			return tokenInstance.balanceOf(accounts[0]);
		}).then(function(adminBalance) {
			assert.equal(adminBalance.toNumber(), 1000000, 'allocates initial supply to admin account')
		});
	});

	it('transfers token ownership', function() {
		return mcoin.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.transfer.call(accounts[1], 99999999999);
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
			return tokenInstance.transfer.call(accounts[1], 250000, {from: accounts[0]});
		}).then(function(success) {
			assert.equal(success, true, 'returns true')
			return tokenInstance.transfer(accounts[1], 250000, {from: accounts[0]});
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Transfer', 'the transfer event');
			assert.equal(receipt.logs[0].args._from, accounts[0], 'where tokens are transferred from');
			assert.equal(receipt.logs[0].args._to, accounts[1], 'where the tokens are going');
			assert.equal(receipt.logs[0].args._value, 250000, 'logs transfer amount');
			return tokenInstance.balanceOf(accounts[1]);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 250000, 'adds the amount to the receiving account');
			return tokenInstance.balanceOf(accounts[0]);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 750000, 'deducts the ammount from the sending account');
		});
	});

	it('approves tokens for delegated transfer', function() {
		return mcoin.deployed().then(function(instance) {
			tokenInstance = instance;
			return tokenInstance.approve.call(accounts[1], 100);
		}).then(function(success) {
			assert.equal(success, true, 'it returns true');
			return tokenInstance.approve(accounts[1], 100);
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Approval', 'the approval event');
			assert.equal(receipt.logs[0].args._owner, accounts[0], 'who owns the tokens');
			assert.equal(receipt.logs[0].args._spender, accounts[1], 'who can spend the tokens');
			assert.equal(receipt.logs[0].args._value, 100, 'logs transfer amount');
			return tokenInstance.allowance(accounts[0], accounts[1]);
		}).then(function(allowance) {
			assert.equal(allowance, 100, 'stores the allowance for delegated transfer')
		});
	});

	it('handles delegated transfer', function() {
		return mcoin.deployed().then(function(instance) {
			tokenInstance = instance;
			fromAccount = accounts[2];
			toAccount = accounts[3];
			spendingAccount = accounts[4];
			return tokenInstance.transfer(fromAccount, 100, {from: accounts[0]});
		}).then(function(receipt) {
			return tokenInstance.approve(spendingAccount, 10, {from: fromAccount});
		}).then(function(receipt) {
			//try sending larger amount than sender's balance
			return tokenInstance.transferFrom(fromAccount, toAccount, 9999, {from: spendingAccount});
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
			return tokenInstance.transferFrom(fromAccount, toAccount, 20, {from: spendingAccount});
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, 'cannot transfer larger than approved amount');
			return tokenInstance.transferFrom.call(fromAccount, toAccount, 10, {from: spendingAccount});
		}).then(function(success) {
			assert.equal(success, true, 'it returns true');
			return tokenInstance.transferFrom(fromAccount, toAccount, 10, {from: spendingAccount});
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, 'triggers one event');
			assert.equal(receipt.logs[0].event, 'Transfer', 'the transfer event');
			assert.equal(receipt.logs[0].args._from, fromAccount, 'who owns the tokens');
			assert.equal(receipt.logs[0].args._to, toAccount, 'who can spend the tokens');
			assert.equal(receipt.logs[0].args._value, 10, 'logs transfer amount');
			return tokenInstance.balanceOf(fromAccount);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 90, 'deducts amount from the sending account');
			return tokenInstance.balanceOf(toAccount);
		}).then(function(balance) {
			assert.equal(balance.toNumber(), 10, 'adds amount to receiving account');
			return tokenInstance.allowance(fromAccount, spendingAccount);
		}).then(function(allowance) {
			assert.equal(allowance, 0, 'deducts amount from allowance');
		});
	});
})