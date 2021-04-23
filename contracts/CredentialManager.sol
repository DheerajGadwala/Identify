// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.5.0 <=0.8.3; 

contract CredentialManager {

    constructor() {
        addBeneficiary(988200735669,"2wTcWdsR5o");
        addBeneficiary(557284942059,"xIwza35UbW");
        addBeneficiary(682810563520,"1MJk4JemUn");
        addBeneficiary(769816380811,"4GXZHSKxx5");
        addBeneficiary(888277646897,"s20F4tZgZg");
        addBeneficiary(859079831141,"Voq9d2qnoO");
        addBeneficiary(754084584111,"Mf3isL3ScI");
        addBeneficiary(890910200564,"kQK8gaerT7");
        addBeneficiary(861300230164,"GIzIcMzv5d");
        addBeneficiary(888194596202,"ofE4zUTwL5");
    }
    struct State {
        uint id;
        uint[] districtIds;
        address authorityId;
    }
    
    struct District {
        uint id;
        uint[] dstnIds;
        address authorityId;
    }
    
    struct DistributionPoint {
        uint id;
        uint[] beneficiaryIds;
        address authorityId;
    }
    
    struct Beneficiary {
        uint id;
        string credentials;
    }
    
    Beneficiary[] public beneficiaries;
    DistributionPoint[] public dstnPoints;
    District[] public districts;
    State[] public states;
    
    event NewState(uint _id, uint[] _districtIds, address _authorityId);
    event NewDistrict(uint _id, uint[] _dstnPointId, address _authorityId);
    event NewDstnPoint(uint _id, uint[] _beneficiaries, address _authorityId);
    
    function addState(uint[] memory _districtIds, address _authorityId) public{
        uint id = states.length;
        states.push(State(id,_districtIds,_authorityId));
        emit NewState(id, _districtIds, _authorityId);
    }
    
    function addDistrict(uint[] memory _dstnIds, address _authorityId) public {
        uint id = districts.length;
        districts.push(District(id, _dstnIds, _authorityId));   
        emit NewDistrict(id, _dstnIds, _authorityId);
    }
    
    function addDstnPoint(uint[] memory _beneficiaries, address _authorityId) public {
        uint id = dstnPoints.length;
        dstnPoints.push(DistributionPoint(id, _beneficiaries, _authorityId));
        emit NewDstnPoint(id, _beneficiaries, _authorityId);
    }
    
    function addBeneficiary(uint _id, string memory _credentials) public{
        beneficiaries.push(Beneficiary(_id, _credentials));
    }
    
    function getDistricts(uint _stateId) public view returns(uint[] memory) {
        require(states.length>0, "No district registered");
        require(_stateId>=0 && _stateId<states.length, "Invalid state id");
        return states[_stateId].districtIds;
        //returns list of district ids in a state
    }
    
    function getDstnPoints(uint _districtId) public view returns(uint[] memory) {
        require(dstnPoints.length>0, "No distribution point registered");
        require(_districtId>=0 && _districtId<districts.length, "Invalid district Id");
        return districts[_districtId].dstnIds;
        //returns the list of dstn point ids in a district
    }
    
    function getBeneficiaries(uint _dstnPointId) public view returns(uint[] memory) {
        require(beneficiaries.length>0, "No Beneficiary registered");
        require(_dstnPointId>=0 && _dstnPointId<dstnPoints.length, "Invalid DistributionPoint id");
        return dstnPoints[_dstnPointId].beneficiaryIds;
        //returns beneficiary Ids of a dstn point
    }
    
    function getBeneficiaryList() public view returns(Beneficiary[] memory) {
        return beneficiaries;
    }
    
    function authorizeSigner(string memory _type, address signer, uint _entityId) public view returns(bool){
        
        bool isAuthorized;
        
        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("State")))
        isAuthorized = states[_entityId].authorityId == signer;
        
        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("District")))
        isAuthorized = districts[_entityId].authorityId == signer;
        
        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("Distn. Point")))
        isAuthorized = dstnPoints[_entityId].authorityId == signer;
       
        return isAuthorized;
        
    }
}