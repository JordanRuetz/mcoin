App = {
	web3Provider: null,
	contracts: {},
	account: null,

	init: function() {
		console.log("App initialized...");
		console.log(web3);
	},

	initWeb3: function() {
		if (typeof web3 !== 'undefined') {
			App.web3Provider = web3.currentProvider;
			web3 = new Web3(web3.currentProvider);
			console.log('ere');
		} else {
			App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
			web3 = new Web3(App.web3Provider);
			consoler.log('here2');
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
				return App.render();
			});
		});
	},

	render: function() {
		web3.eth.getCoinbase(function(err, account) {
			if (err === null) {
				App.account = account;
				$('#accountAddress').html('Your account: ' + account);
			}

		})
	}
}

$(function() {
	$(window).on('load', function() {
		App.init();
		App.initWeb3();
	})
});