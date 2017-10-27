pragma solidity ^0.4.18;

import './ERC20.sol';

contract FloCoin is ERC20 {

    address owner;
    string public constant name = "FloCoin";
    string public constant symbol = "FC";
    uint256 public constant decimals = 8;

    modifier isOwner() {
        require(msg.sender == owner);
        _;
    }

    function FloCoin() public {
        owner = msg.sender;
    }
    
    function() public payable {
        
    }
}