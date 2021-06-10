import React, { useEffect, useState } from "react";
import InventoryContract from "../../contracts/Inventory.json";
import TruffleContract from "@truffle/contract";
import TxnItem from "../txnItem/txnItem";
import FilterListIcon from "@material-ui/icons/FilterList";
import DoneIcon from "@material-ui/icons/Done";
import {
  FormControl,
  Grid,
  Select,
  InputLabel,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Chip,
  DialogContentText,
  Paper,
  // TextField,
} from "@material-ui/core";
import "./txnList.css";
import Loader from "../../loader.gif";
import keccak256 from "keccak256";
import Nav from "../nav/nav.js";

function TxnList(props) {
  const [txnList, setTxnList] = useState([]);
  const [filter, setFilter] = useState({
    initiator: [],
    fromEntity: {
      isSet: false,
      central: [],
      state: [],
      district: [],
      dstnPoint: [],
    },
    entityLevel: {
      Central: "",
      State: "",
      District: "",
      "Distn. Point": "",
    },
  });
  const [loading, setLoading] = useState(true);
  const [dialogView, setDialogView] = useState(false);
  const [ackTxnList, setAckTxnList] = useState({});

  // const [txnSearchKey, setTxnSearchKey] = useState("");

  // const searchTxnId = () => {
  //   let searchRes = [];
  //   for (let item of txnList)
  //     if (item.txnId === txnSearchKey) searchRes.push(item);
  //   setTxnList(searchRes);
  // };

  // const onSearchKeyChange = (e) => {
  //   setTxnSearchKey(e.target.value);
  //   searchTxnId();
  // };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const inventoryContract = TruffleContract(InventoryContract);
      inventoryContract.setProvider(props.web3.currentProvider);
      const inventoryContractInstance = await inventoryContract.deployed();

      const entityLevelFilters = [];
      Object.entries(filter.entityLevel).forEach((item) => {
        if (!(item[1] === "")) entityLevelFilters.push(item[1]);
      });

      let newTxnEvents = await inventoryContractInstance.getPastEvents(
        "newTxn",
        {
          topics: [
            null,
            filter.fromEntity.isSet
              ? [
                  filter.fromEntity.central[0] &&
                    "0x" +
                      keccak256(filter.fromEntity.central[0]).toString("hex"),
                  filter.fromEntity.state[0] &&
                    "0x" +
                      keccak256(filter.fromEntity.state[0]).toString("hex"),
                  filter.fromEntity.district[0] &&
                    "0x" +
                      keccak256(filter.fromEntity.district[0]).toString("hex"),
                  filter.fromEntity.dstnPoint[0] &&
                    "0x" +
                      keccak256(filter.fromEntity.dstnPoint[0]).toString("hex"),
                ]
              : null,
            entityLevelFilters.length > 0 ? entityLevelFilters : null,
          ],
          fromBlock: 0,
          toBlock: "latest",
        },
        (err, event) => console.log(event)
      );

      const ackTxnEvents = await inventoryContractInstance.getPastEvents(
        "AckTxn",
        {
          fromBlock: 0,
          toBlock: "latest",
        },
        (err, event) => console.log(event)
      );
      const ackTxnMap = {};
      console.log(ackTxnEvents);

      for (let i of ackTxnEvents) {
        ackTxnMap[i.args.txnId] = {
          timestamp: i.args.receivedTimestamp.toNumber(),
          receiver: i.args.receiver,
        };
      }

      setAckTxnList(ackTxnMap);
      setTxnList(newTxnEvents);
      setLoading(false);
    })();
  }, [props.web3, filter]);

  const levels = ["State", "District", "Distn. Point"];
  const entities = [props.states, props.districts, props.dstnPoints];
  const filters = ["state", "district", "dstnPoint"];

  const FilterDropDown = (entityName, entityValues, filterName) => {
    const options = [];

    entityValues.forEach((value, i) =>
      options.push(
        <option value={value.returnValues._name} key={i}>
          {value.returnValues._name}
        </option>
      )
    );

    const handleChange = (e) => {
      const val = e.target.value;
      setFilter((prevFilter) => {
        return {
          ...prevFilter,
          fromEntity: {
            ...prevFilter.fromEntity,
            isSet: true,
            [filterName]: !(val === "") ? [val] : [],
          },
        };
      });
    };

    let selectValue = filter.fromEntity[filterName];
    selectValue = selectValue.length > 0 ? selectValue[0] : "";
    return (
      <FormControl className="filterDropDown">
        <InputLabel htmlFor={entityName}>{entityName}</InputLabel>
        <Select
          native
          name={entityName}
          id={entityName}
          value={selectValue}
          onChange={(e) => handleChange(e)}
        >
          <option aria-label="None" value="" />
          {options}
        </Select>
      </FormControl>
    );
  };

  const EntityLevelOptions = () => {
    const options = [];
    const entityLevels = ["Central", ...levels];
    for (let level of entityLevels)
      options.push(
        <Chip
          className="filterChip"
          key={level}
          size="small"
          label={level}
          icon={filter.entityLevel[level] ? <DoneIcon /> : null}
          onClick={() =>
            setFilter((prevFilter) => {
              return {
                ...prevFilter,
                entityLevel: {
                  ...prevFilter.entityLevel,
                  [level]: prevFilter.entityLevel[level]
                    ? ""
                    : "0x" + keccak256(level).toString("hex"),
                },
              };
            })
          }
        />
      );
    return options;
  };
  const List = () => {
    if (txnList.length > 0)
      return txnList.map((txn) => {
        const val = txn.returnValues;
        console.log(val);
        return (
          <Paper className="txnItemContainer" key={val.txnId}>
            <TxnItem
              key={val.txnId}
              txnId={val.txnId}
              fromEntity={val.fromEntity}
              fromEntityId={val.fromEntityId}
              toEntity={val.toEntity}
              toEntityId={val.toEntityId}
              initiator={val.initiator}
              sent={val.sentTimestamp}
              recvd={
                ackTxnList[val.txnId]
                  ? ackTxnList[val.txnId].timestamp
                  : val.receivedTimestamp
              }
              statusCode={val.statusCode}
              level={val.entityLevel}
              receiver={
                ackTxnList[val.txnId] ? ackTxnList[val.txnId].receiver : ""
              }
            />
          </Paper>
        );
      });
    return (
      <Grid item className="noTxnsMsg">
        No txns found
      </Grid>
    );
  };
  return (
    <Grid container direction="column">
      <Grid item container direction="column" alignItems="center">
        <Grid item>
          <Nav setView={props.setView} />
        </Grid>
      </Grid>

      <Dialog
        open={dialogView}
        onClose={() => setDialogView(false)}
        className="dialog"
        PaperProps={{
          style: {
            backgroundColor: "#3f8f74",
          },
        }}
      >
        <DialogTitle>Filters</DialogTitle>
        <DialogContent>
          <DialogContentText> Transaction from entity:</DialogContentText>
          <DialogContent>
            <Chip
              className="filterChip"
              size="small"
              label="Central"
              icon={filter.fromEntity.central[0] ? <DoneIcon /> : null}
              onClick={() =>
                setFilter((prevFilter) => {
                  return {
                    ...prevFilter,
                    fromEntity: {
                      ...prevFilter.fromEntity,
                      isSet: true,
                      central: prevFilter.fromEntity.central[0]
                        ? []
                        : ["Central"],
                    },
                  };
                })
              }
            />
            {levels.map((v, i) => (
              <React.Fragment key={v}>
                <Grid item xs={12} sm={3} className="filterDropDownContainer">
                  {FilterDropDown(v, entities[i], filters[i])}
                </Grid>
              </React.Fragment>
            ))}
          </DialogContent>
        </DialogContent>

        <DialogContent>
          <DialogContentText>Level of governannce:</DialogContentText>
          <DialogContent>{EntityLevelOptions()}</DialogContent>
        </DialogContent>

        <DialogActions>
          <Button
            className="buttonPrimary"
            onClick={() => setDialogView(false)}
          >
            close
          </Button>
          <Button
            className="buttonSecondary"
            onClick={() => {
              setFilter({
                initiator: [],
                fromEntity: {
                  isSet: false,
                  central: [],
                  state: [],
                  district: [],
                  dstnPoint: [],
                },
                entityLevel: [],
              });
            }}
          >
            Reset
          </Button>
        </DialogActions>
      </Dialog>
      {loading ? (
        <Grid item className="txnListLoader">
          <img src={Loader} alt="loader" />
        </Grid>
      ) : (
        <Grid container className="txnListContainer" direction="column">
          {/* <Grid item>
            <TextField
              label="Search by txnId"
              value={txnSearchKey}
              onChange={(e) => onSearchKeyChange(e)}
            />
          </Grid> */}
          <Grid item>
            <Button
              className="buttonPrimary"
              startIcon={<FilterListIcon />}
              onClick={() => setDialogView(true)}
            >
              Filters
            </Button>
          </Grid>
          <Grid container direction="column-reverse">
            <List />
          </Grid>
        </Grid>
      )}
    </Grid>
  );
}

export default TxnList;
