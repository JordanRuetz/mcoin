App = {
	web3Provider: null,
	contracts: {},
	account: '0x0',
	loading: false,
	tokenPrice: 1000000000000000,
	balance: 0,
	loggedIn: false,

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
		$.getJSON('mcoin.json', function(mcoin) {
			App.contracts.mcoin = TruffleContract(mcoin);
			App.contracts.mcoin.setProvider(App.web3Provider);
			App.contracts.mcoin.deployed().then(function(mcoin) {
				console.log("mcoin address: ", mcoin.address);
			});
			App.listenForEvents();
			return App.render();
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

		var freeToken = $('#bottom');
		var loggedInPane = $('#account-logged-pane');

		freeToken.hide();
		loggedInPane.hide();

		App.setTotalCost();
		App.updateCost();
		App.updateSale();


		web3.eth.getCoinbase(function(err, account) {
			if (err === null) {
				App.account = account;
				console.log("Successfully got eth account.");
			} else {
				console.log("Error getting eth account.");
			}
			$('#ethAccount').html(account);
		});


		var mcoinInstance;
		App.contracts.mcoin.deployed().then(function(mcoin) {
			mcoinInstance = mcoin;
			return mcoinInstance.balanceOf(App.account);
		}).then(function(balance) {
			App.balance = balance.toNumber();
			$('.numOfMCoin').html(App.balance);
			return mcoinInstance.tokenPrice();
		}).then(function(tokenPrice) {
			App.tokenPrice = tokenPrice;
			$('.token-price').html(web3.fromWei(App.tokenPrice, "ether"));

			return mcoinInstance.totalMinted();
		}).then(function(totalMinted) {
			if (App.balance === 0 && totalMinted < 1000) {
				freeToken.show();
			}
			return mcoinInstance.totalSupply();
		}).then(function(supply) {
			$('#total-supply').html(supply.toNumber());
			return mcoinInstance.calcSale(1);
		}).then(function(value) {
			$('#selling-price').html(value.toNumber());
		});

		App.setupDatabase();

		App.loading = false;
	},

	updateCost: function() {
		$('#buy-number').on('input', function() { 
    		var input = $(this).val();
    		var regex = new RegExp("^[0-9]+$");

    		if(regex.test(parseInt(input))) {
    			App.setTotalCost();
    		} else {
    			console.log("failed");
    		}
		});
	},

	updateSale: function() {
			$('#sell-number').on('input', function() { 
    		var input = $(this).val();
    		var regex = new RegExp("^[0-9]+$");

    		if(regex.test(parseInt(input))) {
    			App.setTotalSale();
    		} else {
    			console.log("failed");
    		}
		});
	},

	setupDatabase: function() {
		firebase.initializeApp({
			apiKey: "AIzaSyARDgUtugsr_r9DWGIzzSGVh4dX4HWtoN0",
		    authDomain: "chainz-f0c4d.firebaseapp.com",
		    databaseURL: "https://chainz-f0c4d.firebaseio.com",
		    projectId: "chainz-f0c4d",
		    storageBucket: "chainz-f0c4d.appspot.com",
		    messagingSenderId: "581713434921"
		});

		// Initialize Cloud Firestore through Firebase
		var db = firebase.firestore();
		const settings = {/* your settings... */ timestampsInSnapshots: true};
  		db.settings(settings);

		var users = db.collection("users");
		
		$('#create-account-btn').on('click', function() {
			var username = $('#user-input').val();
			var pass = $('#pass-input').val();

			users.where('email', '==', username).get().then(function(querySnapshot) {
				if (querySnapshot.size == 1) {
					alert("This email is already taken.");
				} else if (querySnapshot.size > 1) {
					console.log("ERROR: multiple users with this email");
				} else {
					console.log("No Matches.");
					if (pass == '') {
						alert("password cannot be empty");
					} else {
						var acc = null;
						if (App.account != '0x0') {
							acc = App.account;
						}

						console.log(username);
						console.log(acc);
						console.log(pass);
						console.log(App.tokens);

						users.add({email: username,
							ethKey: acc,
							password: pass,
							tokens: App.balance}).then(function(docRef) {
								console.log("Document written with ID: ", docRef.id);
							}).catch(function(error) {
							    console.error("Error adding document: ", error);
							});
					}
				}
			})
		});

		$('#login-btn').on('click', function() {
			var username = $('#user-input').val();
			var pass = $('#pass-input').val();

			users.where('email', '==', username).where('password', '==', pass)
				.get().then(function(querySnapshot) {
					if (querySnapshot.size == 1) {
						// this is what we want
						console.log("found");
						$('#pass-input').value= "";
						$('#user-input').value = "";
					} else if (querySnapshot.size > 1) {
						console.log("ERROR: multiple users with this email");
					} else {
						console.log("No Matches.");
					}
			})
		});

	},

	buyTokens: function() {
		$('#content').hide();
		$('#loader').show();

		var numberOfTokens = $('#buy-number').val();
		var mcoinInstance;
		App.contracts.mcoin.deployed().then(function(instance) {
			mcoinInstance = instance;
			return mcoinInstance.calcCost(numberOfTokens);
		}).then(function(cost) {
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
	},

	sellTokens: function() {
		$('.warning').css({"display": "none"});

		var numberOfTokens = $('#sell-number').val();
console.log("hello");
		$('#sale-warning').css({"display": "inline"});

		/*var mcoinInstance;
		App.contracts.mcoin.deployed().then(function(instance) {
			mcoinInstance = instance;
			return mcoinInstance.calcSale(numberOfTokens);
		}).then(function(sale) {
			return mcoinInstance.sell(numberOfTokens, {
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
		});*/
	},

	setTotalCost: function() {
		var totalCost = $('#total-cost');
		var numOfTokens = $('#buy-number');

		var mcoinInstance;
		App.contracts.mcoin.deployed().then(function(instance) {
			mcoinInstance = instance;
			return mcoinInstance.calcCost(document.getElementById('buy-number').value);
		}).then(function(cost) {
			totalCost.html(web3.fromWei(cost.toNumber(), "ether"));
		});
	},

	setTotalSale: function() {
		var mcoinInstance;
		App.contracts.mcoin.deployed().then(function(instance) {
			mcoinInstance = instance;
			return mcoinInstance.calcSale(document.getElementById('sale-number').value);
		}).then(function(sale) {
			totalCost.html(web3.fromWei(sale.toNumber(), "ether"));
		});
	}
}

function setClickListeners() {
	$("#header-left").on("click", function() {
		$('html, body').animate({scrollTop: 0}, 500);
	});

	$("#buy-link").on("click", function() {
		$('html, body').animate({scrollTop: $("#buy-view").offset().top - 50}, 500);
	});

	$("#sell-link").on("click", function() {
		$('html, body').animate({scrollTop: $("#sell-view").offset().top - 50}, 500);
	});

	$("#login-link").on("click", function() {
		$('html, body').animate({scrollTop: $("#account-view").offset().top - 50}, 500);
	});

	$("#btn").on("click", function() {
		$('html, body').animate({scrollTop: $("#account-view").offset().top - 50}, 500);
	});
}

$(function() {
	$(window).on('load', function() {
		setClickListeners();
		App.init();
		App.initWeb3();
	})
});