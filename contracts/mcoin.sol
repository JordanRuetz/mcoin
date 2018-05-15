pragma solidity ^0.4.2;

contract mcoin {
	/* this is a state variable, which means
	that it is stored on the blockchain, and
	anytime we update it, we are writing to
	the blockchain */
	// public state variables have getters
	// total supply function required for erc20
	uint256 public totalSupply;

	// Constructor
	function mcoin() public {
		totalSupply = 1000000;
	}

	// Set the number of tokens
	// Read the number of tokens	
}