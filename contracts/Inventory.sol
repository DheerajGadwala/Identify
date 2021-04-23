// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <=0.8.3;
import "./CredentialManager.sol";

contract Inventory {

    struct resourceTransaction {
        bytes32 id;
        address initiator;
        address receiver;
        string beneficiary;
        string fromEntity; 
        string toEntity; 
        string entityLevel; 
        uint sentTimestamp; 
        uint receivedTimestamp;
        uint[] resourceQuantities; //array of quantities where index is id of the resource
        bool created;
    }

    mapping(bytes32=>resourceTransaction) public resourceTxns;
    
    event newTxn(
        uint statusCode,
        bytes32 txnId,
        address indexed initiator,
        string indexed fromEntityIndex, //stores keccak256 hash of the string. To filter, filter using hash(key)
        string fromEntity,
        string toEntity,
        string indexed entityLevel,
        uint sentTimestamp,
        uint receivedTimestamp,
        string beneficiary,
        uint[] resources
    );

    event AckTxn(
        bytes32 txnId,
        uint receivedTimestamp,
        address receiver
    );
    
    
    function sendTxn(string memory _beneficiary, string memory _fromEntity, uint _fromEntityId, string memory _toEntity, string memory _level, uint  _sentTimestamp, uint _receivedTimestamp, uint[] memory _resourceQuantities, address _credManagerAddress) public returns(uint){
        
        CredentialManager cm = CredentialManager(_credManagerAddress);
        uint statusCode;
        bytes32 txnId;
        if(!cm.authorizeSigner(_level, msg.sender, _fromEntityId)){
            statusCode = 401;
        }else{
            statusCode = 200;
        }
        require(bytes(_fromEntity).length>0, "Invalid fromEntity");
        txnId = keccak256(abi.encode(_fromEntity,_toEntity,_level,_sentTimestamp));
        resourceTransaction memory rtx;
        rtx.id = txnId;
        rtx.initiator = msg.sender;
        if(keccak256(bytes(_fromEntity)) == keccak256(bytes("distribution")))
        rtx.beneficiary = _beneficiary;
        rtx.fromEntity = _fromEntity;
        rtx.toEntity = _toEntity;
        rtx.entityLevel = _level;
        rtx.sentTimestamp = _sentTimestamp;
        if(keccak256(bytes(_fromEntity)) == keccak256(bytes("distribution")))
        rtx.receivedTimestamp = _receivedTimestamp;
        rtx.created = true;
        rtx.resourceQuantities = _resourceQuantities;
        resourceTxns[txnId] = rtx;
        string memory beneficiary = _beneficiary;
        emit newTxn(statusCode, rtx.id, msg.sender, rtx.fromEntity, rtx.fromEntity, rtx.toEntity, rtx.entityLevel, rtx.sentTimestamp, rtx.receivedTimestamp, beneficiary, rtx.resourceQuantities);
        return 0;
    }
    
    function acknowledgeTxn(bytes32 _txnId, uint _recvdTimestamp) public {
        assert(resourceTxns[_txnId].created);
        require(_recvdTimestamp>0, "Invalid timestamp");
        
        resourceTransaction storage txn = resourceTxns[_txnId];
        txn.receivedTimestamp = _recvdTimestamp;
        txn.receiver = msg.sender;

        emit AckTxn(_txnId, _recvdTimestamp, msg.sender);
    }
    
    function getTxnResources(bytes32 _txnId) public view returns(uint[] memory) {
        require(resourceTxns[_txnId].created==true, "Invalid txn id");
        return resourceTxns[_txnId].resourceQuantities;
    }
}