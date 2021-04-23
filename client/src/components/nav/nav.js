import React from "react";
import { Breadcrumbs, Link } from "@material-ui/core";
import "./nav.css";

function Nav(props) {
  return (
    <Breadcrumbs maxItems={2} aria-label="breadcrumb" className="navbar">
      <Link
        className="link"
        underline="none"
        onClick={() => {
          props.setView("home");
        }}
      >
        Home
      </Link>
      <Link
        className="link"
        underline="none"
        onClick={() => {
          props.setView("txnList");
        }}
      >
        TxnList
      </Link>
      <Link
        className="link"
        underline="none"
        onClick={() => {
          props.setView("txnForm");
        }}
      >
        SendResources
      </Link>
      <Link
        className="link"
        underline="none"
        onClick={() => {
          props.setView("ackRecpt");
        }}
      >
        Ack Receipt
      </Link>
    </Breadcrumbs>
  );
}

export default Nav;
