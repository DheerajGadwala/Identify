import React from "react";
import QRCode from "qrcode.react";
import "./txnItem.css";
import { Grid, Chip } from "@material-ui/core";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";
import keccak256 from "keccak256";

function TxnItem(props) {
  const sentDate = new Date(parseInt(props.sent)).toLocaleString();
  const recvdDate =
    props.recvd === "0"
      ? "Not yet received"
      : new Date(parseInt(props.recvd)).toLocaleString();

  const entityLevel = {
    [keccak256("Central").toString("hex")]: "Central",
    [keccak256("State").toString("hex")]: "State",
    [keccak256("District").toString("hex")]: "District",
    [keccak256("Distn. Point").toString("hex")]: "Distn. Point",
  }[props.level.slice(2)];

  console.log(entityLevel);

  const toEntityLevel = {
    Central: "State",
    State: "District",
    District: "Distn.Point",
    "Distn. Point": "Beneficiary",
  }[entityLevel];

  const QrData = {
    txnId: props.txnId,
    entityId: entityLevel === "Distn. Point" ? "" : props.toEntityId,
    level: toEntityLevel,
  };
  console.log(QrData);
  return (
    <Grid container alignItems="center" className="txnItem">
      <Grid container item direction="column" xs={12} sm={12} md={12} lg={10}>
        <Grid item>From Entity: {props.fromEntity}</Grid>
        <Grid item>To Entity: {props.toEntity}</Grid>
        {props.statusCode === "401" ? (
          <Grid item>
            Txn-initiator: <br />
            <span title={props.initiator}>
              {props.initiator.substring(0, 10) +
                "..." +
                props.initiator.substring(23)}
            </span>{" "}
            <br />
            Txn timestamp: {sentDate}
          </Grid>
        ) : (
          <Grid item>
            Txn-initiator: <br />
            <span title={props.initiator}>
              {props.initiator.substring(0, 10) +
                "..." +
                props.initiator.substring(23)}
            </span>
            <br /> Sent timestamp: {sentDate}
            <br /> Received timestamp: {recvdDate}
            <br />{" "}
            {props.receiver ? (
              <>
                Txn-Receiver: <br />
                <span title={props.initiator}>
                  {props.receiver.substring(0, 10) +
                    "..." +
                    props.receiver.substring(23)}
                </span>
              </>
            ) : null}
          </Grid>
        )}

        <Grid item>
          {(props.statusCode === "401" || props.statusCode === "4010") && (
            <Chip
              className="errorChip"
              size="small"
              label={
                props.statusCode === "401"
                  ? "Unauthorized txn request"
                  : "Beneficiary Authentication Failed."
              }
              icon={<ErrorOutlineIcon className="errorIcon" />}
            />
          )}
        </Grid>
      </Grid>

      <Grid item xs={12} sm={12} md={12} lg={2} className="identiconContainer">
        <QRCode className="identicon" value={JSON.stringify(QrData)} />
      </Grid>
    </Grid>
  );
}

export default TxnItem;
