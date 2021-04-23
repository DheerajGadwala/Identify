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
} from "@material-ui/core";
import "./txnList.css";
import Loader from "../../loader.gif";
import keccak256 from "keccak256";

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
      central: "",
      State: "",
      District: "",
      "Distn. Point": "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [dialogView, setDialogView] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const inventoryContract = TruffleContract(InventoryContract);
      inventoryContract.setProvider(props.web3.currentProvider);
      const inventoryContractInstance = await inventoryContract.deployed();

      const entityLevelFilters = [];
      Object.entries(filter.entityLevel).map((item) => {
        if (!(item[1] === "")) entityLevelFilters.push(item[1]);
        return null;
      });

      const events = await inventoryContractInstance.getPastEvents(
        "newTxn",
        {
          topics: [
            null,
            !(filter.initiator.length === 0) ? filter.initiator : null,
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
      setTxnList(events);
      setLoading(false);
    })();
  }, [props.web3, filter]);

  const levels = ["State", "District", "Distn. Point"];
  const entities = [props.states, props.districts, props.dstnPoints];
  const filters = ["state", "district", "dstnPoint"];

  const FilterDropDown = (entityName, entityValues, filterName) => {
    const options = [];
    for (let i = 0; i < entityValues.length; i++)
      options.push(
        <option
          value={`${entityName}-${i}`}
          key={i}
        >{`${entityName}-${i}`}</option>
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
    const entityLevels = ["central", ...levels];
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
    if (TxnList.length > 0)
      return txnList.map((txn) => {
        const val = txn.returnValues;
        return (
          <TxnItem
            txnId={val.txnId}
            key={val.txnId}
            fromEntity={val.fromEntity}
            toEntity={val.toEntity}
            initiator={val.initiator}
            sent={val.sentTimestamp}
          />
        );
      });
    return <h3>No txns found</h3>;
  };
  return (
    <Grid container className="txnList" direction="column">
      <Grid item>
        <Button
          className="buttonPrimary"
          startIcon={<FilterListIcon />}
          onClick={() => setDialogView(true)}
        >
          Filters
        </Button>
      </Grid>
      <Dialog
        open={dialogView}
        onClose={() => setDialogView(false)}
        className="dialog"
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
                        : ["central"],
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
        <List />
      )}
    </Grid>
  );
}

export default TxnList;
