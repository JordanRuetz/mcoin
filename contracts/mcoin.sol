pragma solidity ^0.4.2;

contract mcoin {
	string public name = 'mcoin';
	string public symbol = 'MCO';
	string public standard = 'mcoin v1.0';
	/* this is a state variable, which means
	that it is stored on the blockchain, and
	anytime we update it, we are writing to
	the blockchain */
	// public state variables have getters
	// total supply function required for erc20
	uint256 public totalSupply;

	event Transfer(
		address indexed _from,
		address indexed _to,
		uint256 _value
	);

	mapping(address => uint256) public balanceOf;

	// Constructor
	// Leading underscore convention local variable
	constructor(uint256 _initialSupply) public {
		// msg is a global var in solidity
		balanceOf[msg.sender] = _initialSupply;

		totalSupply = _initialSupply;
		// allocate the initial supply

	}

	function transfer(address _to, uint256 _value) public returns (bool success) {
		// if false, stop function execution
		require(balanceOf[msg.sender] >= _value);

		balanceOf[msg.sender] -= _value;
		balanceOf[_to] += _value;

		emit Transfer(msg.sender, _to, _value);

		return true;
	}
}