App = {
	web3Provider: null,
	contracts: {},
	account: '0x0',
	loading: false,
	tokenPrice: 1000000000000000,
	balance: 0,

	init: function() {
		console.log("App initialized...");
	},

	initWeb3: function() {
		if (typeof web3 !== 'undefined') {
			App.web3Provider = web3.currentProvider;
			web3 = new Web3(web3.currentProvider);
		} else {
			App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
			web3 = new Web3(App.web3Provider);
		}
		return App.initContracts();
	},

	initContracts: function() {
		$.getJSON('mcoinSale.json', function(mcoinSale) {
			App.contracts.mcoinSale = TruffleContract(mcoinSale);
			App.contracts.mcoinSale.setProvider(App.web3Provider);
			App.contracts.mcoinSale.deployed().then(function(mcoinSale) {
				console.log("mcoin address: ", mcoinSale.address);
			});
		}).done(function() {
			$.getJSON('mcoin.json', function(mcoin) {
				App.contracts.mcoin = TruffleContract(mcoin);
				App.contracts.mcoin.setProvider(App.web3Provider);
				App.contracts.mcoin.deployed().then(function(mcoin) {
					console.log("mcoin address: ", mcoin.address);
				});
				App.listenForEvents();
				return App.render();
			});
		});
	},

	listenForEvents: function() {
		App.contracts.mcoin.deployed().then(function(instance) {
			instance.Sell({}, {
				fromBlock: 0,
				toBlock: 'latest',
			}).watch(function(error, event) {
				console.log("event triggered ", event);
				App.render();
			});
		});
	},

	render: function() {
		if (App.loading) {
			return;
		}
		App.loading = true;

		var loader = $('#loader');
		var freeToken = $('#freeToken');
		var content = $('#content');

		loader.show();
		freeToken.hide();
		content.hide();

		web3.eth.getCoinbase(function(err, account) {
			if (err === null) {
				App.account = account;
			}
			$('#accountAddress').html("Your account: " + account);
		});


		var mcoinInstance;
		App.contracts.mcoin.deployed().then(function(mcoin) {
			mcoinInstance = mcoin;
			return mcoinInstance.balanceOf(App.account);
		}).then(function(balance) {
			App.balance = balance.toNumber();
			$('#mcoin-balance').html(App.balance);
			console.log(web3.fromWei(App.tokenPrice, "ether"));
			$('.token-price').html(web3.fromWei(App.tokenPrice, "ether"));
			return mcoinInstance.totalMinted();
		}).then(function(totalMinted) {
			$('.tokens-sold').html(totalMinted.toNumber());
			loader.hide();
			if (App.balance === 0 && totalMinted < 1000) {
				freeToken.hide();
				content.show();

				//content.hide();
				//freeToken.show();
			} else {
				freeToken.hide();
				content.show();
			}
		});

		console.log(App.account);

		App.loading = false;
	},

	buyTokens: function() {
		$('#content').hide();
		$('#loader').show();

		var numberOfTokens = $('#numberOfTokens').val();
		var mcoinInstance;
		App.contracts.mcoin.deployed().then(function(instance) {
			mcoinInstance = instance;
			return mcoinInstance.calcCost(numberOfTokens);
		}).then(function(cost) {
			console.log(cost.toNumber());
			return mcoinInstance.buy(numberOfTokens, {
				from: App.account,
				value: cost.toNumber(),
				gas: 500000
			});
		}).then(function(result) {
			console.log("Tokens bought...");
			$('form').trigger('reset');
		}).catch(function(err) {
			console.log(err);
			$('form').trigger('reset');
			$('#loader').hide();
			$('#content').show();
		});
	}
}

$(function() {
	$(window).on('load', function() {
		App.init();
		App.initWeb3();
	})
});