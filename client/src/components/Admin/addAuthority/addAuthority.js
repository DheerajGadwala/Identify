import React, { useState } from "react";
import {
  Grid,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  TextField,
  Button,
  Snackbar,
  SnackbarContent,
} from "@material-ui/core";
import Loader from "../../../loader.gif";
import "./addAuthority.css";
import CredManager from "../../../contracts/CredentialManager.json";
import ErrorIcon from "@material-ui/icons/Error";

const AddAuthority = ({
  web3,
  states,
  districts,
  dstnPoints,
  credManagerInst,
  adminId,
}) => {
  const [entity, setEntity] = useState({
    level: "",
    id: "",
    authorityId: "",
  });
  const [error, setError] = useState({
    entityLevelSelect: false,
    entitySelect: false,
    authorityId: {
      isValid: true,
      errorMsg: "",
    },
  });
  const [loading, setLoading] = useState(false);
  const [successSnack, setSuccessSnack] = useState({
    view: false,
    msg: "",
  });
  const [errorSnack, setErrorSnack] = useState({
    view: false,
    msg: "",
  });

  const entities = {
    State: states,
    District: districts,
    "Distn. Point": dstnPoints,
  }[entity.level];

  const isValidId = (id) => {
    try {
      const address = web3.utils.toChecksumAddress("0x" + id.trim());
      setError({
        ...error,
        authorityId: {
          isValid: true,
          errorMsg: "",
        },
      });
    } catch (e) {
      setError({
        ...error,
        authorityId: {
          isValid: false,
          errorMsg: "Invalid Authority Id",
        },
      });
    }
  };

  const addAuthority = async () => {
    setLoading(true);
    try {
      if (
        !error.entityLevelSelect &&
        !error.entitySelect &&
        error.authorityId.isValid
      ) {
        let txnResult = await credManagerInst.addAuthority(
          {
            State: 1,
            District: 2,
            "Distn. Point": 3,
          }[entity.level],
          parseInt(entity.id),
          "0x" + entity.authorityId,
          {
            from: adminId,
          }
        );

        console.log(
          {
            State: 1,
            District: 2,
            "Distn. Point": 3,
          }[entity.level],
          parseInt(entity.id),
          "0x" + entity.authorityId
        );
        setEntity({
          level: "",
          id: "",
          authorityId: "",
          password: "",
        });
        setSuccessSnack({
          view: true,
          msg: "Authority added succesfully",
        });
      }
    } catch (e) {
      setErrorSnack({
        view: true,
        msg: "Error adding authority! Please try again later",
      });
    }
    setLoading(false);
  };

  const checkAuthority = async () => {
    let txnResult;
    txnResult = await credManagerInst.authorizeSigner(
      entity.level,
      "0x" + entity.authorityId,
      parseInt(entity.id)
    );
    txnResult
      ? setSuccessSnack({
          view: true,
          msg: "Authority Verfied",
        })
      : setErrorSnack({
          view: true,
          msg: "Unauthorized authority",
        });
  };

  return (
    <>
      {loading ? (
        <img src={Loader} alt="loading" />
      ) : (
        <Grid
          container
          direction="column"
          alignItems="center"
          className="formContainer"
          justify="center"
        >
          <Grid container direction="column" alignItems="center">
            <Grid item>
              <FormControl variant="filled">
                <InputLabel htmlFor="entityLevel">Entity Level*</InputLabel>
                <Select
                  native
                  value={entity.level}
                  name="entityLevel"
                  id="entityLevel"
                  onChange={(e) => {
                    setEntity({
                      ...entity,
                      id: "",
                      level: e.target.value,
                    });
                    setError({
                      ...error,
                      entityLevelSelect: e.target.value === "",
                    });
                  }}
                  error={error.entityLevelSelect}
                >
                  <option aria-label="None" value="" />
                  <option value="State">State</option>
                  <option value="District">District</option>
                  <option value="Distn. Point">Distn. Point</option>
                </Select>
                <FormHelperText className="errorText">
                  {error.entityLevelSelect ? (
                    <>
                      <ErrorIcon fontSize="small" /> &nbsp; Valid Entity level
                      must be selected
                    </>
                  ) : (
                    ""
                  )}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item>
              <br />
              <FormControl variant="filled">
                <InputLabel htmlFor="entityId">
                  Select {entity.level ? entity.level : "Entity"}*
                </InputLabel>
                <Select
                  native
                  value={entity.id}
                  name="entityId"
                  id="entityId"
                  onChange={(e) => {
                    setEntity({
                      ...entity,
                      id: e.target.value,
                    });
                    setError({
                      ...error,
                      entitySelect: e.target.value === "",
                    });
                  }}
                  error={error.entitySelect}
                >
                  <option aria-label="None" value="" />
                  {entity.level &&
                    entities.map((e, i) => (
                      <option value={e.returnValues._id} key={i}>
                        {e.returnValues._name}
                      </option>
                    ))}
                </Select>
                <FormHelperText className="errorText">
                  {error.entitySelect ? (
                    <>
                      <ErrorIcon fontSize="small" /> &nbsp; Valid {entity.level}{" "}
                      must be selected
                    </>
                  ) : (
                    ""
                  )}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid item>
              <br />
              <FormControl>
                <TextField
                  size="small"
                  label="Authority Id*"
                  value={entity.authorityId}
                  error={!error.authorityId.isValid}
                  onChange={(e) => {
                    setEntity({ ...entity, authorityId: e.target.value });
                    isValidId(e.target.value);
                  }}
                />
                <FormHelperText className="errorText">
                  {error.authorityId.errorMsg ? (
                    <>
                      <ErrorIcon fontSize="small" /> &nbsp;{" "}
                      {error.authorityId.errorMsg}
                    </>
                  ) : (
                    ""
                  )}
                </FormHelperText>
              </FormControl>
            </Grid>
            <Grid
              container
              item
              direction="column"
              alignItems="center"
              className="buttonGroup"
            >
              <Grid item>
                <Button
                  className="buttonPrimary"
                  onClick={() => addAuthority()}
                >
                  Add
                </Button>
              </Grid>
              <Grid item>
                <Button
                  className="buttonSecondary"
                  onClick={() => checkAuthority()}
                >
                  Verify Authorization
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      )}

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
        <SnackbarContent className="successSnack" message={successSnack.msg} />
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
        <SnackbarContent className="errorSnack" message={errorSnack.msg} />
      </Snackbar>
    </>
  );
};

export default AddAuthority;
