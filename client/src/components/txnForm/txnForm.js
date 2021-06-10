import React, { useEffect, useState, useRef } from "react";
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
  FormHelperText,
} from "@material-ui/core";
import ErrorIcon from "@material-ui/icons/Error";
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
    credentials: {
      image: "",
    },
  });
  const [successSnack, setSuccessSnack] = useState({
    view: false,
    msg: "",
  });
  const [errorSnack, setErrorSnack] = useState({
    view: false,
    msg: "",
  });
  const [beneficiaries, setBeneficiaries] = useState([]);

  const [errors, setErrors] = useState({
    entityLevel: "",
    fromEntity: "",
    toEntity: "",
    resources: "",
    resourceItems: [],
    credentials: {
      image: "",
    },
  });

  const levels = ["Central", "State", "District", "Distn. Point"];
  const entities = [props.states, props.districts, props.dstnPoints];
  const [videoView, setVideoView] = useState(false);

  useEffect(() => {
    (async () => {
      const resourcesContract = TruffleContract(ResourcesContract);
      resourcesContract.setProvider(props.web3.currentProvider);
      const resourcesContractInstance = await resourcesContract.deployed();
      const _resourceList = await resourcesContractInstance.getResourceList();
      setResourceList(_resourceList);
      const len = _resourceList.length;
      setForm((prevForm) => {
        return {
          ...prevForm,
          resourceQuantities: new Array(len).fill(0),
          checkedList: new Array(len).fill(false),
        };
      });
      setErrors((prevErrors) => {
        return {
          ...prevErrors,
          resourceItems: new Array(len).fill(""),
        };
      });
    })();
  }, [props.web3, props.credManagerInstance]);

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
    setErrors({ ...errors, resources: "" });
  };
  // level === "Distn. Point"
  // ? responseData.token
  // : props.web3.utils.soliditySha3({
  //     type: "bytes32",
  //     value: "0x0",
  //   }),

  const sendTxn = async (
    _ethAccount,
    _token,
    _fromEntity,
    _fromEntityId,
    _toEntity,
    _toEntityId,
    _entityLevel,
    _sentTimestamp,
    _receivedTimestamp,
    _resourceQuantities,
    _beneficiaryAuthResult
  ) => {
    const inventoryContract = TruffleContract(InventoryContract);
    inventoryContract.setProvider(props.web3.currentProvider);
    const inventoryContractInstance = await inventoryContract.deployed();
    const txnResult = await inventoryContractInstance.sendTxn(
      _token,
      _fromEntity,
      _fromEntityId,
      _toEntity,
      _toEntityId,
      _entityLevel,
      _sentTimestamp,
      _receivedTimestamp,
      _resourceQuantities,
      props.credManagerInstance.address,
      _beneficiaryAuthResult,
      {
        from: _ethAccount,
      }
    );
    setLoading(false);
    console.log(txnResult);
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
    else if (_statusCode.toNumber() === 4010)
      setErrorSnack({
        view: true,
        msg: `Beneficiary Authentication failed.`,
      });
  };

  const handleTransactionSubmit = () => {
    (async () => {
      const areResourcesValid = (() => {
        for (let i of errors.resourceItems) if (i !== "") return false;
        return true;
      })();

      let fromEntityError = "",
        toEntityError = "",
        credentialImageError = "",
        resourcesError = "";

      if (form.entityLevel) {
        if (
          !form.fromEntity ||
          !form.toEntity ||
          (form.entityLevel === "3" && !form.credentials.image) ||
          !areResourcesValid
        ) {
          if (form.fromEntity === "")
            fromEntityError = "From-entity Must be selected";
          if (form.toEntity === "")
            toEntityError = "To-entity Must be selected";
          if (form.level === "3" && !form.credentials.image)
            credentialImageError = "Beneficiary image must be given";
          if (!form.checkedCount > 0)
            resourcesError = "Atleast one resource must be selected";
          if (parseInt(form.entityLevel) === 3 && !form.credentials.image)
            credentialImageError = "Beneficiary Image must be provided";

          setErrors({
            ...errors,
            fromEntity: fromEntityError,
            toEntity: toEntityError,
            resources: resourcesError,
            credentials: {
              image: credentialImageError,
            },
          });
        } else {
          console.log("Safe");
          setLoading(true);

          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });

          const level = levels[form.entityLevel];
          const fromEntityObject = JSON.parse(form.fromEntity);
          const fromEntityId =
            level === "Central" ? 0 : parseInt(fromEntityObject._id);
          const toEntityObject = JSON.parse(form.toEntity);
          const sentTimestamp = new Date().getTime();

          if (level === "Distn. Point") {
            const requestData = {
              entityLevel: level,
              fromEntity: fromEntityObject._name,
              fromEntityId: parseInt(fromEntityObject._id),
              toEntity: toEntityObject._name,
              toEntityId: parseInt(toEntityObject._id),
              resourceQuantities: form.resourceQuantities,
              sentTimestamp: sentTimestamp,
              recvdTimestamp: sentTimestamp,
              credentials: {
                image: form.credentials.image,
              },
            };
            console.log(requestData);
            const response = await fetch(
              "http://127.0.0.1:5000/authBeneficiary",
              {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify(requestData),
              }
            );
            if (response.status === 200) {
              const responseData = await response.json();
              console.log(responseData);

              sendTxn(
                accounts[0],
                responseData.token,
                fromEntityObject._name,
                fromEntityId,
                toEntityObject._name,
                parseInt(toEntityObject._id),
                level,
                sentTimestamp,
                sentTimestamp,
                form.resourceQuantities,
                responseData.similar
              );
            } else
              setErrorSnack({
                view: true,
                msg: `Error sending txn. Please try again later.`,
              });
          } else {
            sendTxn(
              accounts[0],
              props.web3.utils.soliditySha3({
                type: "bytes32",
                value: "0x0",
              }),
              fromEntityObject._name,
              fromEntityId,
              toEntityObject._name,
              parseInt(toEntityObject._id),
              level,
              sentTimestamp,
              0,
              form.resourceQuantities,
              false
            );
          }
        }
      } else {
        console.log("level error");
        setErrors((prevErrors) => {
          return {
            ...prevErrors,
            entityLevel: "Entity-level must be selected",
          };
        });
      }
    })();
  };

  const handleEntityLevelChange = (e) => {
    const len = resourceList.length;
    setForm({
      ...form,
      entityLevel: e.target.value,
      fromEntity: "",
      toEntity: "",
      resourceQuantities: new Array(len).fill(0),
      checkedList: new Array(len).fill(false),
      checkedCount: 0,
    });
    setErrors({
      entityLevel: "",
      fromEntity: "",
      toEntity: "",
      resources: "",
      resourceItems: new Array(resourceList.length).fill(""),
      credentials: {
        image: "",
      },
    });
  };

  const FromEntityOptions = () => {
    const level = form.entityLevel;
    return (
      <>
        <option aria-label="None" value="" />
        {level === "0" ? (
          <option value={JSON.stringify({ _id: 0, _name: "Central" })}>
            Central
          </option>
        ) : (
          <>
            {entities[level - 1].map((entity, index) => {
              const id = entity.returnValues._id;
              const name = entity.returnValues._name;
              return (
                <option value={JSON.stringify(entity.returnValues)} key={id}>
                  {name}
                </option>
              );
            })}
          </>
        )}
      </>
    );
  };
  const ToEntityOptions = () => {
    const level = parseInt(form.entityLevel);
    if (level === 0)
      return (
        <>
          {entities[level].map((entity, index) => {
            const id = entity.returnValues._id;
            const name = entity.returnValues._name;
            return (
              <option value={JSON.stringify({ _id: id, _name: name })} key={id}>
                {name}
              </option>
            );
          })}
        </>
      );

    const fromEntity = form.fromEntity && JSON.parse(form.fromEntity);
    form.fromEntity &&
      level === 3 &&
      props.credManagerInstance
        .getBeneficiaries(parseInt(fromEntity._id))
        .then((res) => {
          if (JSON.stringify(beneficiaries) !== JSON.stringify(res))
            setBeneficiaries(res);
        });
    if (level === 3) {
      return (
        form.fromEntity &&
        beneficiaries &&
        beneficiaries.map((val, i) => (
          <option
            value={JSON.stringify({ _id: 0, _name: val.toString() })}
            key={i}
          >
            {val.toString()}
          </option>
        ))
      );
    }
    return (
      form.fromEntity &&
      entities[level].map((val, index) => {
        if (val.returnValues[2] === fromEntity._id) {
          const name = val.returnValues._name;
          const id = val.returnValues._id;
          return (
            <option value={JSON.stringify({ _id: id, _name: name })} key={id}>
              {name}
            </option>
          );
        } else return null;
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
          setForm({
            ...form,
            fromEntity: e.target.value,
          });
          setErrors({
            ...errors,
            fromEntity: "",
          });
        }}
        error={false}
      >
        <FromEntityOptions />
      </Select>
      <FormHelperText className="errorText">
        {errors.fromEntity === "" ? (
          ""
        ) : (
          <>
            <ErrorIcon fontSize="small" />
            &nbsp; {errors.fromEntity}
          </>
        )}
      </FormHelperText>
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
          setErrors({ ...errors, toEntity: "" });
        }}
        error={false}
      >
        <option aria-label="None" value="" />;
        <ToEntityOptions />
      </Select>
      <FormHelperText className="errorText">
        {errors.toEntity === "" ? (
          ""
        ) : (
          <>
            <ErrorIcon fontSize="small" />
            &nbsp; {errors.toEntity}
          </>
        )}
      </FormHelperText>
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
          <br />
        </Grid>
        <Grid item xs={6} sm={4}>
          {form.checkedList[i] && (
            <>
              <TextField
                size="small"
                label={item === "money" ? "Rs" : "Kg"}
                type="number"
                InputProps={{ inputProps: { min: 0 } }}
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
                  setErrors((prevErrors) => {
                    let arr = prevErrors.resourceItems;
                    arr[i] =
                      form.checkedList[i] && parseInt(val) <= 0
                        ? "Invalid resource quantity"
                        : "";
                    return {
                      ...errors,
                      resourceItems: arr,
                    };
                  });
                }}
              />
              <FormHelperText className="errorText">
                {errors.resourceItems[i] === "" ? (
                  ""
                ) : (
                  <>
                    <ErrorIcon fontSize="small" />
                    &nbsp; {errors.resourceItems[i]}
                  </>
                )}
              </FormHelperText>
            </>
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
      <FormHelperText className="errorText">
        {errors.entityLevel === "" ? (
          ""
        ) : (
          <>
            <ErrorIcon fontSize="small" />
            &nbsp; {errors.entityLevel}
          </>
        )}
      </FormHelperText>
    </FormControl>
  );

  const copyToClipboard = async (data) => {
    await navigator.clipboard.writeText(data);
  };

  const player = useRef(),
    canvas = useRef();
  const startStream = () => {
    setForm({
      ...form,
      credentials: {
        image: "",
      },
    });
    setVideoView(true);
    const constraints = {
      video: true,
      audio: false,
    };
    // Attach the video stream to the video element and autoplay.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      player.current.srcObject = stream;
    });
  };

  const captureImage = () => {
    const context = canvas.current.getContext("2d");
    // Draw the video frame to the canvas.
    context.drawImage(
      player.current,
      0,
      0,
      canvas.current.width,
      canvas.current.height
    );
    setVideoView(false);
    setForm({
      ...form,
      credentials: {
        image: canvas.current.toDataURL(),
      },
    });
    setErrors({
      ...errors,
      credentials: {
        image: "",
      },
    });
    player.current.srcObject &&
      player.current.srcObject.getTracks().forEach((track) => track.stop());
    player.current.srcObject = null;
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
            {form.entityLevel && form.entityLevel === "3" && (
              <>
                <Grid
                  item
                  className={!videoView ? "display-none" : "center-align"}
                >
                  <div className="mediaContainer">
                    <video
                      ref={player}
                      autoPlay
                      width="240"
                      height="180"
                      className="media"
                    />
                  </div>

                  <br />
                  <Button
                    onClick={() => captureImage()}
                    className="buttonSecondary"
                  >
                    Capture
                  </Button>
                </Grid>
                <Grid
                  item
                  className={
                    !form.credentials.image ? "display-none" : "center-align"
                  }
                >
                  <div className="mediaContainer">
                    <canvas
                      ref={canvas}
                      width="240"
                      height="180"
                      className="media"
                    />
                  </div>
                  <br />
                  <Button
                    onClick={() => {
                      setForm({ ...form, credentials: { image: "" } });
                      startStream();
                    }}
                    className="buttonSecondary"
                  >
                    Retake
                  </Button>
                </Grid>
                <Grid item>
                  <FormHelperText className="errorText">
                    {errors.credentials.image === "" ? (
                      ""
                    ) : (
                      <>
                        <ErrorIcon fontSize="small" />
                        &nbsp; {errors.credentials.image}
                      </>
                    )}
                  </FormHelperText>
                </Grid>
                <Grid item>
                  <Button
                    onClick={() => startStream()}
                    className="buttonSecondary"
                  >
                    Add Beneficiary Image
                  </Button>
                </Grid>{" "}
              </>
            )}
            {form.entityLevel && (
              <>
                <Grid item>
                  <br />
                  Select Resources
                </Grid>
                <Grid item>
                  <FormHelperText className="errorText">
                    {errors.resources === "" ? (
                      ""
                    ) : (
                      <>
                        <ErrorIcon fontSize="small" />
                        &nbsp; {errors.resources}
                      </>
                    )}
                  </FormHelperText>
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
