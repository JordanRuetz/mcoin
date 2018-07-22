pragma solidity ^0.4.2;

/*
 * Do I really need a max tokens variable?
 * What does approveAndCall funciton do?
 * Need to check totalSupply is not misused according to new definition
 * 
 * Going to have a linear increase in price starting with 0.001 eth
 */

contract mcoin {
	string public name = 'mcoin';
	string public symbol = 'MCO';
	string public standard = 'mcoin v1.0';
	/* this is a state variable, which means
	that it is stored on the blockchain, and
	anytime we update it, we are writing to
	the blockchain */
	// public state variables have getters
	// total supply function required for erc20 - this will be the amount minted
	uint256 public totalSupply;

	// the amount of eth the contract has, this will be used for minting and paying out dividends
	uint256 public ethPool;
	// account that holds coins for use when bought, has reserve of 100, minting when hits 50 using ethPool ->
	// implies that the ethPool should be kept in this admin account instead
	// when coins are sold back they will go here
	address public admin;
	// how much it will cost for the next token purchase
	uint256 public tokenPrice;
	// these are coins not in reserve at the moment
	uint256 public totalWithdrawn;
	// how much my coins can be split
	uint256 public decimals = 0;
	// price of a token
	uint256 public price = 0;


	event Transfer(
		address indexed _from,
		address indexed _to,
		uint256 _value
	);

	event Approval(
		address indexed _owner,
		address indexed _spender,
		uint256 _value
	);

	event Sell (
		address _buyer,
		uint256 _amount
	);

	event Buy (
		address _seller,
		uint256 _amount
	);

	event Mint (
		uint256 _amount
	);

	mapping(address => uint256) public balanceOf;

	mapping(address => mapping(address => uint256)) public allowance;

	// Constructor
	// Leading underscore convention local variable
	constructor(address _admin, uint256 _initialSupply) public {
		admin = _admin;
		// msg is a global var in solidity
		balanceOf[msg.sender] = _initialSupply;

		totalSupply = _initialSupply;
		// allocate the initial supply

	}

	function mint() {
		require(balanceOf[admin] <= 50);
		// make the number of tokens in admin 100
		uint256 _curAmount = balanceOf[admin];
		balanceOf[admin] = 100;
		// update the totalSupply
		uint256 _amountMinted = 100 - _curAmount;

		totalSupply += _amountMinted;

		emit Mint(_amountMinted);
	}

	function requestFreeToken() public (bool success) {
		require(totalSupply < 500);
	}

	// Delegated transfers
	function approve(address _spender, uint256 _value) public returns (bool success) {
		allowance[msg.sender][_spender] = _value;

		emit Approval(msg.sender, _spender, _value);

		return true;
	}

	function approveAndCall() {
		// figure out what this is supposed to do
	}

	function increaseTokenPrice() {
		price += 0.001;
	}

	function decreaseTokenPrice() {
		require(price > 0);
		price -= 0.001;
	}

	function calcCost(uint _numOfTokens) public returns (uint256 cost) {
		uint256 cost = 0;
		for (int i = 0; i < _numOfTokens; i++) {
			cost += (i * 0.001) + price;
		}
		return cost;
	}

	function calcSale(uint _numOfTokens) public returns (uint256 value) {
		uint256 value;
		for (int i = 0; i < _numOfTokens; i++) {
			value += price - (i * 0.001);
		}
		return value;
	}

	function transfer(address _to, uint256 _value) public returns (bool success) {
		// if false, stop function execution
		require(balanceOf[msg.sender] >= _value);
		// this means that you are returning the tokens to admin
		require(_to != admin);

		balanceOf[msg.sender] -= _value;
		balanceOf[_to] += _value;

		emit Transfer(msg.sender, _to, _value);

		return true;
	}

	function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
		require(_value <= balanceOf[_from]);
		require(_value <= allowance[_from][msg.sender]);
		require(_to != admin);

		balanceOf[_from] -= _value;
		balanceOf[_to] += _value;

		allowance[_from][msg.sender] -= _value;

		emit Transfer(_from, _to, _value);

		return true;
	}

	function buy(uint _numOfTokens) public payable returns (bool success) {
		require(msg.value == calcCost(_numOfTokens));
		require(_numOfTokens <= 25);
		require(balanceOf[admin] >= _numOfTokens);
		require (transferFrom(admin, msg.sender, _numOfTokens));

		totalWithdrawn += _numOfTokens;

		if (balanceOf[admin] <= 50) {
			mint();
		}

		increaseTokenPrice();

		emit Sell(msg.sender, _numOfTokens);

		return true;
	}

	function sell(uint _numOfTokens) public payable returns (bool success) {
		require(ethPool >=  calcSale(_numOfTokens));
		require(balanceOf[msg.sender >= _numOfTokens]);
		require(transferFrom(msg.sender, admin, _numOfTokens));

		totalWithdrawn -= _numOfTokens;

		// need to pass in numOfTokens possibly
		decreaseTokenPrice();

		//transfer the appropriate amount of eth to msg.sender

		emit Buy(msg.sender, _numOfTokens);
	}
}