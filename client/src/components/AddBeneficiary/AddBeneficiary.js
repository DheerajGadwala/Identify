import React, { useState, useRef, useEffect } from "react";
import exifr from "exifr";
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
  Link,
} from "@material-ui/core";
import Loader from "../../loader.gif";
import ErrorIcon from "@material-ui/icons/Error";
import "./AddBeneficiary.css";
import Nav from "../nav/nav";
import EXIF from "exif-js";
import AuthRequests from "./ListBeneficiaryAuthRequests/AuthRequests";

const AddBeneficiary = ({ web3, dstnPoints, credManagerInst, setView }) => {
  const [formdata, setFormdata] = useState({
    id: "",
    credentials: {
      image: "",
    },
  });

  const [distnId, setdistnId] = useState("");

  const [errors, setErrors] = useState({
    id: "",
    distnId: "",
    credentials: {
      image: "",
    },
  });
  const [videoView, setVideoView] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successSnack, setSuccessSnack] = useState({
    view: false,
    msg: "",
  });
  const [errorSnack, setErrorSnack] = useState({
    view: false,
    msg: "",
  });

  const [sectionView, setSectionView] = useState("addBeneficiary");
  const [activeAuthority, setActiveAuthority] = useState(""); //logged in authority id

  const player = useRef(),
    canvas = useRef();

  const startStream = () => {
    setFormdata({
      ...formdata,
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
      const track = stream.getVideoTracks()[0];
      let imageCapture = new ImageCapture(track);
      imageCapture.takePhoto().then((blob) => {
        exifr.gps(blob).then((data) => console.log(data));
      });
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
    setFormdata({
      ...formdata,
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

  const addBeneficiary = async () => {
    try {
      if (
        formdata.id.toString().length !== 12 ||
        !distnId ||
        !formdata.credentials.image
      ) {
        console.log("errors");
        let idError = "",
          distnError = "",
          imageError = "";
        if (formdata.id.toString().length !== 12)
          idError = "Beneficiary id must be 12 characters long";

        if (!distnId) distnError = "Please select a distribution point";

        if (!formdata.credentials.image)
          imageError = "Beneficiary image is needed";

        setErrors({
          id: idError,
          distnId: distnError,
          credentials: {
            image: imageError,
          },
        });
        return;
      }
      setLoading(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const response = await fetch("http://127.0.0.1:5000/addBeneficiary", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ...formdata,
          distnId: distnId,
          approvalStatus: 1,
        }),
      });
      console.log(response);
      if (response.status === 200) {
        const responseData = await response.json();
        const txnResult = await credManagerInst.initiateBeneficiaryRegistration(
          responseData.id,
          responseData.credentials,
          responseData.distnId,
          responseData.approvalStatus,
          responseData.token,
          {
            from: accounts[0],
          }
        );
        console.log(txnResult);
        const _statusCode = parseInt(txnResult.logs[0].args._statusCode);
        const _finalStatus = parseInt(txnResult.logs[0].args._finalStatus);
        console.log(_finalStatus);
        if (_statusCode === 200) {
          setSuccessSnack({
            view: true,
            msg: "Beneficiary registration initated successfully",
          });
          console.log(200);
        } else if (_statusCode === 409) {
          setErrorSnack({
            view: true,
            msg: {
              1: "Beneficiary alredy registered to the scheme",
              2: "Beneficiary has already been rejected!",
              3: "Beneficiary registration already in process",
            }[_finalStatus],
          });
          console.log(409);
        } else if (_statusCode === 401) {
          setErrorSnack({
            view: true,
            msg: "You are unauthorized for this action",
          });
          console.log(401);
        } else if (_statusCode === 403)
          setErrorSnack({ view: true, msg: "Malicious txn request!" });
        console.log(responseData);
      } else if (response.status === 400) {
        setErrorSnack({ view: true, msg: "Invalid Beneficiary Data" });
      }
    } catch (err) {
      console.log(err);
    }
    setFormdata({
      id: "",
      distnId: "",
      credentials: {
        image: "",
      },
    });
    setLoading(false);
  };

  const DpointFormControl = () => {
    return (
      <FormControl variant="filled">
        <InputLabel htmlFor="dpointsList">Distribution Point Id*</InputLabel>
        <Select
          error={!errors.distnId === ""}
          value={distnId}
          native
          onChange={(e) => {
            setdistnId(e.target.value);
            setErrors((prevErrors) => {
              return {
                ...prevErrors,
                distnId: "",
              };
            });
          }}
        >
          <option aria-label="None" value="" />
          {dstnPoints.map((dp, i) => (
            <option value={dp.returnValues._id} key={i}>
              {dp.returnValues._name}
            </option>
          ))}
        </Select>
        <FormHelperText className="errorText">
          {errors.distnId === "" ? (
            ""
          ) : (
            <>
              <ErrorIcon fontSize="small" />
              &nbsp; {errors.distnId}
            </>
          )}
        </FormHelperText>
      </FormControl>
    );
  };

  const [loginStatus, setLoginStatus] = useState(0);

  const authorizeAuthority = async () => {
    if (!distnId) {
      setErrors({ ...errors, distnId: "Please select a distribution point!" });
      return;
    }
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const isAuthorized =
      distnId &&
      (await credManagerInst.authorizeSigner(
        "Distn. Point",
        accounts[0],
        parseInt(distnId)
      ));
    setLoginStatus(isAuthorized ? 1 : 2);
    setActiveAuthority(isAuthorized ? accounts[0] : "");
  };

  useEffect(() => {
    window.ethereum.addListener("accountsChanged", authorizeAuthority);
    return () => {
      window.ethereum.removeListener("accountsChanged", authorizeAuthority);
    };
  }, [authorizeAuthority]);

  return loading ? (
    <img src={Loader} alt="loader" className="loader" />
  ) : (
    <>
      <Grid
        container
        justify="space-evenly"
        alignItems="center"
        direction="column"
        className="addBeneficiary-container"
      >
        <Nav setView={setView} />
        <Grid
          container
          item
          direction="column"
          alignItems="center"
          className="form-container"
        >
          {loginStatus === 1 ? (
            <>
              <Grid item className="subNav">
                <Link
                  className="link"
                  underline="none"
                  onClick={() => {
                    setSectionView("addBeneficiary");
                  }}
                >
                  New Beneficiary
                </Link>{" "}
                /{" "}
                <Link
                  className="link"
                  underline="none"
                  onClick={() => {
                    setSectionView("registrationRequests");
                  }}
                >
                  Registration Requests
                </Link>
              </Grid>

              {sectionView === "addBeneficiary" ? (
                <>
                  <Grid item>
                    <FormControl variant="filled">
                      <TextField
                        label="Beneficiary Id*"
                        size="small"
                        value={formdata.id}
                        error={!errors.msg === ""}
                        onChange={(e) => {
                          setFormdata({ ...formdata, id: e.target.value });
                          setErrors((prevErrors) => {
                            return {
                              ...prevErrors,
                              id: "",
                            };
                          });
                        }}
                      />
                      <FormHelperText className="errorText">
                        {errors.id === "" ? (
                          ""
                        ) : (
                          <>
                            <ErrorIcon fontSize="small" />
                            &nbsp; {errors.id}
                          </>
                        )}
                      </FormHelperText>
                    </FormControl>
                    <br />
                    <br />
                  </Grid>
                  {/* <Grid item>
                    <DpointFormControl />
                    <br />
                    <br />
                  </Grid> */}

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
                      !formdata.credentials.image
                        ? "display-none"
                        : "center-align"
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
                        setFormdata({
                          ...formdata,
                          credentials: { image: "" },
                        });
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
                  </Grid>
                  <Grid item>
                    <Button
                      onClick={() => addBeneficiary()}
                      className="buttonPrimary"
                    >
                      Add Beneficiary
                    </Button>
                  </Grid>
                </>
              ) : (
                <AuthRequests
                  activeAuthority={activeAuthority}
                  web3={web3}
                  credManagerInst={credManagerInst}
                  distnId={distnId}
                />
              )}
            </>
          ) : (
            <>
              <DpointFormControl />
              <Grid item>
                <Button
                  className="buttonSecondary"
                  onClick={() => authorizeAuthority()}
                >
                  Sign In
                </Button>
              </Grid>
              <Snackbar
                open={loginStatus === 2}
                autoHideDuration={6000}
                onClose={() => setLoginStatus(0)}
              >
                <SnackbarContent
                  className="error"
                  message={<span>You're Not Authorized</span>}
                />
              </Snackbar>
            </>
          )}
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

export default AddBeneficiary;
