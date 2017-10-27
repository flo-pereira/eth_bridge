pragma solidity ^0.4.18;

contract ERC20 {

    mapping(address => uint) balances;

    //approved[owner][spender]
    mapping(address => mapping(address => uint)) approved;

    uint supply;
    
    modifier transferFromModifier(uint _value) { // Modifier
        require(_value > 0);
        _;
    }

    function totalSupply() public constant returns (uint total) {
        return supply;
    }

    function balanceOf(address _owner) public constant returns (uint) {
        return balances[_owner];
    }

    function transfer(address _to, uint _value) public returns (bool) {
        require(_value > 0);

        if (balances[msg.sender] < _value) {
            return false;
        }

        balances[msg.sender] -=_value;
        balances[_to] +=_value;

        Transfer(msg.sender, _to, _value);

        return true;
    }

    function transferFrom(address _from, address _to, uint _value) public transferFromModifier(_value) returns (bool) {


        var allowedAmount = approved[_from][msg.sender];

        if (
        balances[_from] < _value ||
        allowedAmount > 0 && allowedAmount < _value) {
            return false;
        }


        balances[_from] -=_value;
        approved[_from][msg.sender] -=_value;
        balances[_to] += _value;

        Transfer(_from, _to, _value);

        return true;

    }

    function approve(address _spender, uint _value) public returns (bool)  {
        if (balances[msg.sender] < _value) {
            return false;
        }

        approved[msg.sender][_spender] = _value;

        Approval(msg.sender, _spender, _value);

        return true;
    }

    function allowance(address _owner, address _spender) public constant returns (uint) {
        return approved[_owner][_spender];
    }

    event Transfer(address indexed _from, address indexed _to, uint _value);

    event Approval(address indexed _owner, address indexed _spender, uint _value);
}