// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <=0.8.4;

contract Resources {
    string[] public resourceList;
    
    constructor() {
        resourceList.push("dal"); 
        resourceList.push("rice");
        resourceList.push("sugar");
        resourceList.push("money");
    }
    
    function getResourceCount() public view returns(uint) {
        return resourceList.length;
    }
    function addResourceToStock(string memory _resource) public{
        require(bytes(_resource).length>0,"Invalid resource");
        resourceList.push(_resource);
    }
    
    function getResourceInStock(uint _id) public view returns(string memory) {
        require(_id>=0 && _id<resourceList.length, "Invalid resource id");
        return resourceList[_id];
    }

    function getResourceList() public view returns(string[] memory) {
        return resourceList;
    } 
}