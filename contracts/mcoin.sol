pragma solidity ^0.4.2;

/*
 * The ERC-20 token MCoin, a token for use in the Chainz app.
 * Used as proof of stake in a curation market.  Some tokens
 * initially offered free, after which there is a linear increase
 * in price of 0.001 (this needs adjustment) eth per token sold.  When a user sells a 
 * token they get a proportionally amount of the eth pool.  First 1000 tokens free.
 * 1000000000000000 wei  = 0.001 eth
 */

contract mcoin {
	string public name = 'mcoin';
	string public symbol = 'MCO';
	string public standard = 'mcoin v1.0';

	// amount minted - amount destroyed
	uint256 public totalSupply;

	// the amount of eth the contract has, this will be used for minting and paying out dividends
	uint256 public ethPool;

	// implies that the ethPool should be kept in this admin account instead
	// when coins are sold back they will go here -> need to check if this is cost efficient
	address public admin;

	// how much it will cost for the next token purchase in wei
	uint256 public tokenPrice;

	// can only buy whole tokens
	uint256 public decimals = 0;

	// price of a single token
	uint256 public price = 0;

	// amount minted
	uint256 public totalMinted = 0;

	// price increase everytime token is bought
	uint256 public constant increase = 1000000000000000;


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

	/*
	 * Create the contract with an initial supply of tokens
	 */
	constructor(uint256 _initialSupply) public {
		balanceOf[msg.sender] = _initialSupply;
		totalSupply = _initialSupply;
	}

	/*
	 * A function that gives a user a free token if there
	 * is less than 1000 total minted. Will replace
	 * mcoinSale for initial token offering.
	 */
	function requestFreeToken() public returns (bool success) {
		require(totalMinted < 1000);
		balanceOf[msg.sender] += 1;
		totalSupply += 1;
		totalMinted += 1;

		return true;
	}

	// Delegated transfers
	function approve(address _spender, uint256 _value) public returns (bool success) {
		allowance[msg.sender][_spender] = _value;

		emit Approval(msg.sender, _spender, _value);

		return true;
	}

	function approveAndCall() internal pure {
		// figure out what this is supposed to do
	}

	/*
	 * Increase the price of a token by the set increase.
	 * To be done everytime a token is bought.
	 */
	function increaseTokenPrice() internal {
		price += increase;
	}

	/*
	 * Decrease the price of a token by the set decrease.
	 * To be done everytime a token is sold back.
	 */
	function decreaseTokenPrice() internal {
		require(price > 0);
		if (price - increase < 0) {
			price = 0;
		} else {
			price -= increase;
		}
	}

	/*
	 * Determine how much it cost to buy an amount of the tokens.
	 */
	function calcCost(uint _numOfTokens) public view returns (uint256 totalCost) {
		uint256 cost = 0;
		for (uint i = 0; i < _numOfTokens; i++) {
			cost =  cost + ((i + 1) * increase) + price;
		}
		return cost;
	}

	/*
	 * Determine how much a user gets for selling an amount of the tokens.
	 * Shouldn't this just be a proportion of the eth pool?
	 * Want to use safe math.
	 */
	function calcSale(uint _numOfTokens) public view returns (uint256 value) {
		return (ethPool/totalSupply) * _numOfTokens;
	}

	/*
	 * Transfer tokens from one account to another.
	 */
	function transfer(address _to, uint256 _value) public returns (bool success) {
		// need to own the amount you are transfering
		require(balanceOf[msg.sender] >= _value);
		// this means that you are returning the tokens to admin
		// this needs to be 0x0 or something
		// require(_to != admin);

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
		require(msg.value >= calcCost(_numOfTokens));
		require(_numOfTokens <= 25);

		balanceOf[msg.sender] += _numOfTokens;
		totalSupply += _numOfTokens;
		totalMinted += _numOfTokens;
		ethPool += msg.value;

		for(uint i = 0; i < _numOfTokens; i++) {
			increaseTokenPrice();
		}

		emit Sell(msg.sender, _numOfTokens);

		return true;
	}

	function sell(uint _numOfTokens) public returns (bool success) {
		require(ethPool >=  calcSale(_numOfTokens));
		require(balanceOf[msg.sender] >= _numOfTokens);

		totalSupply -= _numOfTokens;

		for (uint i = 0; i < _numOfTokens; i++) {
			decreaseTokenPrice();
		}

		msg.sender.transfer(calcSale(_numOfTokens));

		emit Buy(msg.sender, _numOfTokens);

		return true;
	}
}