import React, { useState, useEffect } from "react";
import "./Admin.css";
import { Grid, Button, Snackbar, SnackbarContent } from "@material-ui/core";
import AddAuthority from "./addAuthority/addAuthority";
import Nav from "../nav/nav";

const Admin = (props) => {
  const [loginStatus, setLoginStatus] = useState(0); // 0: Didn't Sign in, 1: success, 2: unAuthorized
  const [adminAccount, setAdminAccount] = useState("");
  const authenticate = async () => {
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAdminAccount(accounts[0]);
    setLoginStatus(
      accounts[0] === "0xf17f52151ebef6c7334fad080c5704d77216b732" ? 1 : 2
    );
  };

  useEffect(() => {
    window.ethereum.addListener("accountsChanged", authenticate);
    return () => {
      window.ethereum.removeListener("accountsChanged", authenticate);
    };
  }, []);
  return (
    <>
      <Grid
        container
        className="Admin"
        alignItems="center"
        justify="center"
        direction="column"
      >
        <Nav setView={props.setView} />
        {loginStatus === 1 ? (
          <AddAuthority
            web3={props.web3}
            states={props.states}
            districts={props.districts}
            dstnPoints={props.dstnPoints}
            credManagerInst={props.credManagerInst}
            adminId={adminAccount}
          />
        ) : (
          <Grid item>
            <Button className="buttonSecondary" onClick={() => authenticate()}>
              Sign In
            </Button>
          </Grid>
        )}
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
  );
};

export default Admin;
