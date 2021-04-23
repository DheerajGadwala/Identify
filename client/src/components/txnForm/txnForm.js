import React, { useEffect, useState } from "react";
import TruffleContract from "@truffle/contract";
import ResourcesContract from "../../contracts/Resources.json";
import InventoryContract from "../../contracts/Inventory.json";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import {
  Button,
  Checkbox,
  Grid,
  TextField,
  Snackbar,
  SnackbarContent,
} from "@material-ui/core";
import "./txnForm.css";
import Loader from "../../loader.gif";
import Nav from "../nav/nav.js";

export default function TxnForm(props) {
  const [resourceList, setResourceList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    entityLevel: "",
    fromEntity: "",
    toEntity: "",
    resourceQuantities: [],
    checkedList: [],
    checkedCount: 0,
  });
  const [successSnack, setSuccessSnack] = useState({
    view: false,
    msg: "",
  });
  const [errorSnack, setErrorSnack] = useState({
    view: false,
    msg: "",
  });
  const levels = ["Central", "State", "District", "Distn. Point"];
  const entities = [props.states, props.districts, props.dstnPoints];
  const storageListNames = ["_districtIds", "_dstnPointId", "_beneficiaries"];

  useEffect(() => {
    (async () => {
      const resourcesContract = TruffleContract(ResourcesContract);
      resourcesContract.setProvider(props.web3.currentProvider);
      const resourcesContractInstance = await resourcesContract.deployed();
      const _resourceList = await resourcesContractInstance.getResourceList();

      setResourceList(_resourceList);

      setForm((prevForm) => {
        const len = _resourceList.length;
        return {
          ...prevForm,
          resourceQuantities: new Array(len).fill(0),
          checkedList: new Array(len).fill(false),
        };
      });
    })();
  }, [props.web3]);

  const handleChainChange = () => {
    console.log("hi");
  };
  useEffect(() => {
    window.ethereum.addListener("chainChanged", handleChainChange);
    return () => {
      window.ethereum.removeListener("chainChanged", handleChainChange);
    };
  }, []);

  const handleCheckboxChange = (e, i) => {
    setForm((prevForm) => {
      let _checkList = prevForm.checkedList;
      _checkList[i] = !_checkList[i];
      if (_checkList[i]) prevForm.checkedCount += 1;
      else prevForm.checkedCount -= 1;
      return {
        ...prevForm,
        checkedList: _checkList,
      };
    });
  };

  const handleTransactionSubmit = () => {
    (async () => {
      setLoading(true);
      const inventoryContract = TruffleContract(InventoryContract);
      inventoryContract.setProvider(props.web3.currentProvider);
      const inventoryContractInstance = await inventoryContract.deployed();
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const fromEntity =
        form.entityLevel === "0"
          ? "Central"
          : `${levels[form.entityLevel]}-${form.fromEntity}`;

      const toEntity =
        form.entityLevel === "3"
          ? form.toEntity
          : `${levels[parseInt(form.entityLevel) + 1]}-${form.toEntity}`;

      const sentTimestamp = new Date().getTime();
      const recvdTimestamp = form.entityLevel === 3 ? sentTimestamp : 0;
      // console.log(
      //   "",
      //   fromEntity,
      //   toEntity,
      //   levels[form.entityLevel],
      //   new Date().getTime(),
      //   0,
      //   form.resourceQuantities,
      //   {
      //     from: accounts[0],
      //   }
      // );

      const txnResult = await inventoryContractInstance.sendTxn(
        fromEntity,
        parseInt(form.fromEntity),
        toEntity,
        levels[form.entityLevel],
        sentTimestamp,
        recvdTimestamp,
        form.resourceQuantities,
        props.credManagerInstance.address,
        {
          from: accounts[0],
        }
      );

      setLoading(false);

      const txnId = txnResult.logs[0].args.txnId;
      const _statusCode = txnResult.logs[0].args.statusCode;

      console.log(_statusCode);

      if (_statusCode.toNumber() === 200)
        setSuccessSnack({
          view: true,
          msg: {
            txnId: txnId,
            txt: "Txn successful!",
          },
        });
      else if (_statusCode.toNumber() === 401)
        setErrorSnack({
          view: true,
          msg: `Unauthorized txn request.`,
        });
    })();
  };

  const handleEntityLevelChange = (e) => {
    const len = resourceList.length;
    setForm({
      entityLevel: e.target.value,
      fromEntity: "",
      toEntity: "",
      resourceQuantities: new Array(len).fill(0),
      checkedList: new Array(len).fill(false),
      checkedCount: 0,
    });
  };

  const FromEntityOptions = () => {
    const level = form.entityLevel;
    return (
      <>
        <option aria-label="None" value="" />
        {level === "0" ? (
          <option value="0">Central</option>
        ) : (
          <>
            {entities[level - 1].map((entity, index) => (
              <option
                value={index}
                key={index}
              >{`${levels[level]}-${index}`}</option>
            ))}
          </>
        )}
      </>
    );
  };

  const ToEntityOptions = () => {
    const level = form.entityLevel;
    if (level === "0")
      return (
        <>
          {entities[level].map((entity, index) => (
            <option value={index} key={index}>{`${levels[1]}-${index}`}</option>
          ))}
        </>
      );

    return (
      form.fromEntity &&
      entities[level - 1][form.fromEntity].returnValues[
        storageListNames[level - 1]
      ].map((val, index) => {
        const label =
          level === "3" ? val : `${levels[parseInt(level) + 1]}-${val}`;
        return (
          <option value={val} key={index}>
            {label}
          </option>
        );
      })
    );
  };

  const FromEntityFormControl = () => (
    <FormControl variant="filled">
      <InputLabel htmlFor="fromEntity">From Entity</InputLabel>
      <Select
        native
        value={form.fromEntity}
        name="fromEntity"
        id="fromEntity"
        onChange={(e) => {
          setForm({ ...form, fromEntity: e.target.value });
        }}
        error={false}
      >
        <FromEntityOptions />
      </Select>
    </FormControl>
  );

  const ToEntityFormControl = () => (
    <FormControl variant="filled">
      <InputLabel htmlFor="toEntity">To Entity</InputLabel>
      <Select
        native
        value={form.toEntity}
        name="toEntity"
        id="toEntity"
        onChange={(e) => {
          setForm({ ...form, toEntity: e.target.value });
        }}
        error={false}
      >
        <option aria-label="None" value="" />;
        <ToEntityOptions />
      </Select>
    </FormControl>
  );

  const CheckBoxContainer = () =>
    resourceList.map((item, i) => (
      <Grid key={i} item container className="checkBoxItem">
        <Grid item xs={1} sm={3} />
        <Grid item container xs={4} sm={2}>
          <FormControlLabel
            control={
              <Checkbox
                value={item}
                checked={form.checkedList[i]}
                onChange={(e) => handleCheckboxChange(e, i)}
              />
            }
            label={item}
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          {form.checkedList[i] && (
            <TextField
              size="small"
              label={item === "money" ? "Rs" : "Kg"}
              type="number"
              value={form.resourceQuantities[i]}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prevForm) => {
                  let arr = prevForm.resourceQuantities;
                  arr[i] = prevForm.checkedList[i] ? val : 0;
                  return {
                    ...prevForm,
                    resourceQuantities: arr,
                  };
                });
              }}
            />
          )}
        </Grid>
        <Grid item xs={1} sm={3} />
      </Grid>
    ));

  const EntityLevelFormControl = () => (
    <FormControl variant="filled">
      <InputLabel htmlFor="toEntity">Level of Governance</InputLabel>
      <Select
        native
        value={form.entityLevel}
        name="entityLevel"
        onChange={(e) => {
          handleEntityLevelChange(e);
        }}
      >
        <option aria-label="None" value="" />
        {levels.map((level, index) => (
          <option value={index} key={index}>
            {level}
          </option>
        ))}
      </Select>
    </FormControl>
  );

  const copyToClipboard = async (data) => {
    await navigator.clipboard.writeText(data);
  };

  if (!loading)
    return (
      <>
        <Grid container direction="column" alignItems="center">
          <Grid item>
            <Nav setView={props.setView} />
          </Grid>
          <Grid
            item
            container
            className="txnFormContainer"
            direction="column"
            alignItems="center"
          >
            <Grid item>
              <EntityLevelFormControl /> <br /> <br />
            </Grid>
            {form.entityLevel && (
              <>
                <Grid item>
                  <FromEntityFormControl /> <br /> <br />
                </Grid>
                <Grid item>
                  <ToEntityFormControl /> <br /> <br />
                </Grid>
              </>
            )}
            {form.entityLevel && (
              <>
                <Grid item>
                  <br />
                  Select Resources
                </Grid>
                <Grid item container className="checkBoxContainer">
                  {CheckBoxContainer()}
                </Grid>
              </>
            )}
            <Grid item>
              <Button
                onClick={() => handleTransactionSubmit()}
                className="buttonPrimary"
              >
                send resources
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Snackbar
          open={successSnack.view}
          autoHideDuration={6000}
          onClose={() =>
            setSuccessSnack({
              view: false,
              msg: "",
            })
          }
        >
          <SnackbarContent
            className="success"
            message={
              successSnack.msg.txt && (
                <span>
                  {successSnack.msg.txt} <br />
                  Txnid:{" "}
                  {successSnack.msg.txnId.substring(0, 10) +
                    "..." +
                    successSnack.msg.txnId.substring(56)}
                  <Button
                    className="buttonPrimary"
                    onClick={() => copyToClipboard(successSnack.msg.txnId)}
                  >
                    copy txnId
                  </Button>
                </span>
              )
            }
          />
        </Snackbar>
        <Snackbar
          open={errorSnack.view}
          autoHideDuration={6000}
          onClose={() =>
            setErrorSnack({
              view: false,
              msg: "",
            })
          }
        >
          <SnackbarContent className="error" message={errorSnack.msg} />
        </Snackbar>
      </>
    );

  return <img src={Loader} alt="loader" className="loader" />;
}
