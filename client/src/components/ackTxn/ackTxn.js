import React, { useState } from "react";
import QrScan from "react-qr-reader";
import { Button, Grid, Snackbar, SnackbarContent } from "@material-ui/core";
import ScannerIcon from "@material-ui/icons/CropFree";
import "./ackTxn.css";
import Nav from "../nav/nav.js";
import InventoryContract from "../../contracts/Inventory.json";
import Loader from "../../loader.gif";
import TruffleContract from "@truffle/contract";

function AckTxn(props) {
  console.log(props.credManagerInstance.address);
  const [scanner, setScanner] = useState(false);
  const [successSnack, setSuccessSnack] = useState({
    view: false,
    msg: "",
  });
  const [errorSnack, setErrorSnack] = useState({
    view: false,
    msg: "",
  });
  const [loading, setLoading] = useState(false);

  const handleError = () => {
    alert("error");
  };

  const handleScan = async (data) => {
    if (data) {
      console.log(data);
      setLoading(true);
      const inventoryContract = TruffleContract(InventoryContract);
      inventoryContract.setProvider(props.web3.currentProvider);
      const inventoryContractInstance = await inventoryContract.deployed();
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const QrData = JSON.parse(data);
      if (QrData.level === "Beneficiary") {
        setErrorSnack({
          view: true,
          msg: "You can't acknowledge the current txn!",
        });
      } else {
        const txnId = QrData.txnId;
        const timeStamp = new Date().getTime();
        const entityId = parseInt(QrData.entityId);
        const level = QrData.level;
        const txnResult = await inventoryContractInstance.acknowledgeTxn(
          txnId,
          timeStamp,
          entityId,
          level,
          props.credManagerInstance.address,
          {
            from: accounts[0],
          }
        );
        const statusCode = txnResult.logs[0].args.statusCode.toNumber();
        if (statusCode === 200)
          setSuccessSnack({
            view: true,
            msg: "Acknowledgement Succesful",
          });
        else if (statusCode === 4010)
          setErrorSnack({
            view: true,
            msg: "Txn already acknowledged!",
          });
        else if (statusCode === 4011)
          setErrorSnack({
            view: true,
            msg: "You're unauthorized!",
          });
        else if (statusCode === 400)
          setErrorSnack({
            view: true,
            msg: "txnId invalid!",
          });
      }

      setScanner(false);
      setLoading(false);
    }
  };
  return (
    <Grid container direction="column" alignItems="center">
      <Grid item>
        <Nav setView={props.setView} />
      </Grid>
      <Grid
        container
        item
        className="ackTxnContainer"
        alignItems="center"
        direction="column"
      >
        {loading ? (
          <Grid item>
            <img src={Loader} alt="loader" className="loader" />
          </Grid>
        ) : (
          <>
            <Grid item>
              <Button
                className="buttonPrimary"
                startIcon={<ScannerIcon color="secondary" />}
                onClick={() => {
                  setScanner(true);
                }}
              >
                Scan
              </Button>
            </Grid>
            <Grid item>
              {scanner && (
                <QrScan
                  delay={300}
                  onError={handleError}
                  onScan={handleScan}
                  style={{ height: 240, width: 320 }}
                />
              )}
            </Grid>
          </>
        )}
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
        <SnackbarContent className="success" message={successSnack.msg} />
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
    </Grid>
  );
}

export default AckTxn;
