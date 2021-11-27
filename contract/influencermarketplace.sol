// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract influencerMarketplace {

    uint internal influencersLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;

    struct Influencer {
        address payable owner;
        string name;
        string image;
        string description;
        string email;
        uint price;
        bool payed;
    }

    mapping (uint => Influencer) internal influencers;
    
    
// function to add influencers to the cello block - chain
    function writeInfluencerinfo(
        string memory _name,
        string memory _image,
        string memory _description, 
        string memory _email, 
        uint _price
    ) public {
        
        influencers[influencersLength] = Influencer(
            payable(msg.sender),
            _name,
            _image,
            _description,
            _email,
            _price,
            false
        );
        
        influencersLength++;
    }
// function to read the information of the influencer from the cello block - chain
    function readInfluencerinfo(uint _index) public view returns (
        address payable,
        string memory, 
        string memory, 
        string memory, 
        string memory, 
        uint,
        bool
    ) {
        return (
            influencers[_index].owner,
            influencers[_index].name, 
            influencers[_index].image, 
            influencers[_index].description, 
            influencers[_index].email, 
            influencers[_index].price,
            influencers[_index].payed
        );
    }
    
    // function to pay an influencer for promotion 
    function payforInfluencer(uint _index) public payable  {
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            influencers[_index].owner,
            influencers[_index].price
          ),
          "Transfer failed."
        );
        influencers[_index].payed = true;
    }
    // function to return the length of influencers
    function getInflencersLength() public view returns (uint) {
        return (influencersLength);
    }
    
     // function to get the email of the influencer after transactio has been completed
    function getInfluencerEmail(uint _index)public view returns(string memory){
        if(influencers[_index].payed == true){
            return (influencers[_index].email);} else{return "Hire to view email";}
    }
   
}