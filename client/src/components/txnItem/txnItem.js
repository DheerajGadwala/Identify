import React from "react";
import QRCode from "qrcode.react";
import "./txnItem.css";
import { Grid, Chip } from "@material-ui/core";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";

function TxnItem(props) {
  const sentDate = new Date(parseInt(props.sent)).toLocaleString();
  const recvdDate =
    props.recvd === "0"
      ? "Not yet received"
      : new Date(parseInt(props.recvd)).toLocaleString();

  const QrData = {
    txnId: props.txnId,
    entityId:
      props.fromEntity.split("-")[0] === "Distn. Point"
        ? ""
        : props.toEntity.split("-")[1],
    level:
      props.fromEntity.split("-")[0] === "Distn. Point"
        ? ""
        : props.toEntity.split("-")[0],
  };
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
          {props.statusCode === "401" && (
            <Chip
              className="errorChip"
              size="small"
              label={"Unauthorized txn request"}
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
