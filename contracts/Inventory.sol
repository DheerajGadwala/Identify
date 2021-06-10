// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <=0.8.4;
import "./CredentialManager.sol";

contract Inventory {
    
    string private secret = "identify@capstone";

    struct resourceTransaction {
        bytes32 id;
        address initiator;
        address receiver;
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
        bytes32 txnId,
        address initiator,
        string indexed fromEntityIndex, //stores keccak256 hash of the string. To filter, filter using hash(key)
        string fromEntity,
        uint fromEntityId,
        string toEntity,
        uint toEntityId,
        string indexed entityLevel,
        uint sentTimestamp,
        uint receivedTimestamp,
        uint[] resources,
        uint statusCode
    );

    event AckTxn(
        bytes32 txnId,
        uint receivedTimestamp,
        address receiver,
        uint statusCode
    );

    event errorAckTxn (
        bytes32 txnId,
        uint receivedTimestamp,
        address receiver,
        uint statusCode
    );
    
    struct TempTxn {
        bytes32 txnId;
        string fromEntity;
        uint fromEntityId;
        string toEntity;
        uint toEntityId;
        string level;
        uint sentTimestamp;
        uint[] resourceQuantities;
        uint receivedTimestamp;
        bytes32 token;
        bool similar;
    }
    
    function sendTxn(
        bytes32 _token, 
        string memory _fromEntity,
        uint _fromEntityId, 
        string memory _toEntity, 
        uint _toEntityId, 
        string memory _level,
        uint  _sentTimestamp, 
        uint _receivedTimestamp, 
        uint[] memory _resourceQuantities, 
        address _credManagerAddress,
        bool _similar
    ) public {
        
        CredentialManager cm = CredentialManager(_credManagerAddress);
        require(bytes(_fromEntity).length>0, "Invalid fromEntity");
        
        TempTxn memory tempTxn = TempTxn(
            keccak256(abi.encode(_fromEntity,_toEntity,_level,_sentTimestamp)), 
            _fromEntity,
            _fromEntityId,
            _toEntity,
            _toEntityId,
            _level,
            _sentTimestamp,
            _resourceQuantities,
            _receivedTimestamp,
            _token,
            _similar
        );
        
        uint statusCode;
        bool isAuthorized = cm.authorizeSigner(tempTxn.level, msg.sender, tempTxn.fromEntityId);
        
        if(isAuthorized)
        {
            if(keccak256(bytes(_level)) == keccak256(bytes("Distn. Point"))){
                if(keccak256(
                abi.encodePacked(
                    tempTxn.fromEntity, 
                    tempTxn.fromEntityId, 
                    tempTxn.toEntity,
                    tempTxn.toEntityId,
                    tempTxn.level,
                    tempTxn.sentTimestamp,
                    tempTxn.receivedTimestamp,
                    tempTxn.resourceQuantities,
                    secret,
                    tempTxn.similar
                )) != tempTxn.token)
                    statusCode=403;
                else if(!tempTxn.similar)
                    statusCode=4010;
                else
                    statusCode=200;
                
            }    
            else
                statusCode=200;
        }else   
            statusCode = 401;
        
        if(statusCode==200)
            resourceTxns[tempTxn.txnId] = resourceTransaction(
                tempTxn.txnId, 
                msg.sender, 
                address(0), 
                tempTxn.fromEntity, 
                tempTxn.toEntity, 
                tempTxn.level, 
                tempTxn.sentTimestamp, 
                tempTxn.receivedTimestamp, 
                tempTxn.resourceQuantities, 
                true
            );
        
        emit newTxn(
            tempTxn.txnId, 
            msg.sender, 
            tempTxn.fromEntity, 
            tempTxn.fromEntity, 
            tempTxn.fromEntityId, 
            tempTxn.toEntity, 
            tempTxn.toEntityId, 
            tempTxn.level, 
            tempTxn.sentTimestamp, 
            tempTxn.receivedTimestamp, 
            tempTxn.resourceQuantities,
            statusCode
        );
    }
    
    function acknowledgeTxn(
        bytes32 _txnId, 
        uint _recvdTimestamp, 
        uint _entityId, 
        string memory _level, 
        address _credManagerAddress
    ) public {
        require(_recvdTimestamp>0, "Invalid timestamp");
        if(!resourceTxns[_txnId].created)
            emit errorAckTxn(_txnId, _recvdTimestamp, msg.sender,400);
        else {
            if(resourceTxns[_txnId].receivedTimestamp!=0) 
                emit errorAckTxn(_txnId, _recvdTimestamp, msg.sender, 4010);
            CredentialManager cm = CredentialManager(_credManagerAddress);
            if(!cm.authorizeSigner(_level, msg.sender, _entityId))
                emit errorAckTxn(_txnId, _recvdTimestamp, msg.sender, 4011);
            else
            {
                resourceTransaction storage txn = resourceTxns[_txnId];
                txn.receivedTimestamp = _recvdTimestamp;
                txn.receiver = msg.sender;
                emit AckTxn(_txnId, _recvdTimestamp, msg.sender, 200);
            }
        }             
    }
    
    function getTxnResources(bytes32 _txnId) public view returns(uint[] memory) {
        require(resourceTxns[_txnId].created==true, "Invalid txn id");
        return resourceTxns[_txnId].resourceQuantities;
    }
}